import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';

const uuidSchema = z.string().uuid();

const emptyToNull = (schema) =>
  schema.or(z.literal('')).transform((value) => (value === '' ? null : value));

const optString = (max) => emptyToNull(z.string().trim().max(max)).nullish();
const optUrl = emptyToNull(z.string().url().max(500)).nullish();
const optExternalUrl = emptyToNull(
  z.string().trim().max(500)
    .transform((value) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`))
    .pipe(z.string().url('Enter a valid URL'))
).nullish();
const optLink = emptyToNull(
  z.string().trim().max(500).refine(
    (value) => /^(https?:\/\/|mailto:|tel:|\/|#)/.test(value) || /^[a-z0-9-]+$/.test(value),
    'Enter a URL, path, #anchor or section key'
  )
).nullish();
const optSlug = emptyToNull(
  z.string().trim().max(160)
    .transform((value) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''))
    .pipe(z.string().min(1).max(160))
).nullish();
const optDate = z.coerce.date().nullish();
const jsonField = z.record(z.any()).or(z.array(z.any())).nullish();
const intField = z.coerce.number().int().nullish();

export const RESOURCE_NAMES = [
  'profile',
  'hero',
  'experience',
  'project',
  'skill',
  'certificate',
  'github',
  'testimonial',
  'contact'
];

export const CONTACT_STATUSES = ['NEW', 'REPLIED', 'ARCHIVED'];

export const SKILL_TYPES = ['hard', 'soft'];

// Accepts an empty select value (new rows) and drops it so the service can
// apply its default instead of failing enum validation.
const skillType = z
  .enum(SKILL_TYPES)
  .or(z.literal(''))
  .transform((value) => (value === '' ? undefined : value))
  .optional();

export const resourceParamSchema = z.object({
  resource: z.enum(RESOURCE_NAMES)
});

export const resourceIdParamSchema = z.object({
  resource: z.enum(RESOURCE_NAMES),
  id: uuidSchema
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().trim().max(30).optional(),
  q: z.string().trim().max(100).optional(),
  featured: z.enum(['true', 'false']).optional(),
  published: z.enum(['true', 'false']).optional(),
  category: z.string().trim().max(50).optional(),
  type: skillType,
  status: z.enum(CONTACT_STATUSES).optional()
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().toLowerCase().email().max(255),
  subject: optString(200),
  message: z.string().trim().min(1)
});

export const createSchemas = {
  profile: z.object({
    name: z.string().trim().min(1).max(150),
    headline: z.string().trim().min(1).max(200),
    bio: z.string().trim().min(1),
    avatarUrl: optString(5000),
    resumeUrl: optUrl,
    status: optString(150),
    myLocation: optString(150),
    myDegree: optString(200),
    myDegreeDetails: optString(5000),
    socials: jsonField,
    meta: jsonField
  }),
  experience: z.object({
    role: z.string().trim().min(1).max(150),
    company: z.string().trim().min(1).max(150),
    location: optString(150),
    startDate: z.coerce.date(),
    endDate: optDate,
    current: z.boolean().optional(),
    description: optString(5000),
    sortOrder: intField
  }),
  project: z.object({
    title: z.string().trim().min(1).max(150),
    slug: optSlug,
    description: z.string().trim().min(1),
    techStack: jsonField,
    repoUrl: optExternalUrl,
    demoUrl: optExternalUrl,
    imageUrl: optString(5000),
    videoUrl: optLink,
    featured: z.boolean().optional(),
    published: z.boolean().optional(),
    sortOrder: intField
  }),
  skill: z.object({
    name: z.string().trim().min(1).max(100),
    type: skillType,
    category: optString(50),
    level: z.coerce.number().int().min(0).max(100).nullish(),
    icon: optString(80),
    logoUrl: optString(5000),
    keywords: jsonField,
    sortOrder: intField
  }),
  certificate: z.object({
    title: z.string().trim().min(1).max(200),
    issuer: z.string().trim().min(1).max(150),
    issuedAt: z.coerce.date(),
    credentialUrl: optUrl,
    imageUrl: optString(5000),
    sortOrder: intField
  }),
  github: z.object({
    name: z.string().trim().min(1).max(150),
    description: optString(5000),
    url: z.string().url().max(500),
    language: optString(50),
    stars: z.coerce.number().int().min(0).optional(),
    topics: jsonField,
    sortOrder: intField
  }),
  hero: z.object({
    heroBio: optString(5000),
    primaryButtonText: optString(100),
    primaryButtonUrl: optLink,
    secondaryButtonText: optString(100),
    secondaryButtonUrl: optLink,
    published: z.boolean().optional(),
    sortOrder: intField
  }),
  testimonial: z.object({
    author: z.string().trim().min(1).max(150),
    role: optString(150),
    quote: z.string().trim().min(1),
    avatarUrl: optString(5000),
    sortOrder: intField
  }),
  contact: contactSchema
};

export const updateSchemas = Object.fromEntries(
  Object.entries(createSchemas).map(([name, schema]) => {
    const partial = schema.partial();
    if (name === 'contact') {
      return [
        name,
        partial.extend({
          status: z.enum(CONTACT_STATUSES).optional(),
          repliedAt: optDate
        })
      ];
    }
    return [name, partial];
  })
);

export function parseInput(resource, body, { partial = false } = {}) {
  const schema = (partial ? updateSchemas : createSchemas)[resource];
  if (!schema) throw ApiError.badRequest(`No validation schema for "${resource}"`);
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    throw ApiError.unprocessable('Validation failed', fields);
  }
  return result.data;
}