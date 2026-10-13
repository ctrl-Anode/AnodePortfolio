import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePagination } from '../../utils/pagination.js';
import { queueEmail } from '../../queues/jobs.js';

export const RESOURCES = {
  profile: { model: 'profile', sortable: ['createdAt', 'updatedAt', 'name'] },
  hero: { model: 'hero', sortable: ['createdAt', 'updatedAt', 'sortOrder'], orderFirst: true },
  experience: {
    model: 'experience',
    sortable: ['createdAt', 'updatedAt', 'sortOrder', 'startDate'],
    orderFirst: true,
    searchable: ['role', 'company']
  },
  project: {
    model: 'project',
    sortable: ['createdAt', 'updatedAt', 'sortOrder', 'title'],
    orderFirst: true,
    searchable: ['title', 'description']
  },
  skill: {
    model: 'skill',
    sortable: ['createdAt', 'updatedAt', 'sortOrder', 'name'],
    orderFirst: true,
    searchable: ['name']
  },
  certificate: {
    model: 'certificate',
    sortable: ['createdAt', 'updatedAt', 'sortOrder', 'issuedAt'],
    orderFirst: true,
    searchable: ['title', 'issuer']
  },
  github: {
    model: 'githubRepo',
    sortable: ['createdAt', 'updatedAt', 'sortOrder', 'stars', 'name'],
    orderFirst: true,
    searchable: ['name', 'description']
  },
  testimonial: {
    model: 'testimonial',
    sortable: ['createdAt', 'updatedAt', 'sortOrder'],
    orderFirst: true,
    searchable: ['author']
  },
  contact: {
    model: 'contactMessage',
    sortable: ['createdAt', 'status'],
    searchable: ['name', 'email', 'subject']
  }
};

export function ensureResource(resource) {
  const meta = RESOURCES[resource];
  if (!meta) throw ApiError.badRequest(`Unknown portfolio resource "${resource}"`);
  return meta;
}

function orderBy(meta, query) {
  const parsed = parsePagination(query, { sortable: meta.sortable });
  if (!query.sort && meta.orderFirst) {
    return [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
  }
  return parsed.orderBy;
}

export async function listResource(resource, query, { publicOnly = false } = {}) {
  const meta = ensureResource(resource);
  const { page, limit, offset } = parsePagination(query, { sortable: meta.sortable });

  const where = {};
  if (meta.searchable && query.q) {
    where.OR = meta.searchable.map((field) => ({ [field]: { contains: query.q } }));
  }
  if (resource === 'project') {
    if (publicOnly) where.published = true;
    else if (query.published) where.published = query.published === 'true';
    if (query.featured) where.featured = query.featured === 'true';
  }
  if (resource === 'skill') {
    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;
  }
  if (resource === 'contact' && query.status) where.status = query.status;

  const delegate = prisma[meta.model];
  const [rows, total] = await Promise.all([
    delegate.findMany({ where, orderBy: orderBy(meta, query), skip: offset, take: limit }),
    delegate.count({ where })
  ]);

  return { rows, total, page, limit };
}

export async function getResource(resource, id) {
  const meta = ensureResource(resource);
  const row = await prisma[meta.model].findUnique({ where: { id } });
  if (!row) throw ApiError.notFound(`${resource} not found`);
  return row;
}

export function countResource(resource) {
  const meta = ensureResource(resource);
  return prisma[meta.model].count({ where: {} });
}

export function listProfile() {
  return prisma.profile.findFirst({ orderBy: { createdAt: 'desc' } });
}

export async function createResource(resource, data) {
  const meta = ensureResource(resource);
  const payload = { ...data };
  if (resource === 'skill') {
    if (payload.category == null) payload.category = 'Other';
    if (payload.type == null) payload.type = 'hard';
  }
  return prisma[meta.model].create({ data: payload });
}

export async function updateResource(resource, id, data) {
  const meta = ensureResource(resource);
  await getResource(resource, id);
  return prisma[meta.model].update({ where: { id }, data });
}

export async function deleteResource(resource, id) {
  const meta = ensureResource(resource);
  await getResource(resource, id);
  await prisma[meta.model].delete({ where: { id } });
  return { deleted: true };
}

export async function createContactMessage(input) {
  const row = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject ?? null,
      message: input.message
    }
  });

  const to = config.CONTACT_NOTIFY_EMAIL || config.ADMIN_EMAIL;
  if (to) {
    queueEmail('contact_message', to, {
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message
    });
  }
  return row;
}