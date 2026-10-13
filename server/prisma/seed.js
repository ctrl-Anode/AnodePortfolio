import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import argon2 from 'argon2';
import 'dotenv/config';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });

const PERMISSIONS = [
  { key: 'users:read', description: 'View any user profile' },
  { key: 'users:create', description: 'Create users' },
  { key: 'users:update', description: 'Update any user' },
  { key: 'users:delete', description: 'Soft-delete users' },
  { key: 'roles:read', description: 'View roles and permissions' },
  { key: 'roles:manage', description: 'Create/update roles and their permissions' },
  { key: 'uploads:create', description: 'Upload files' },
  { key: 'uploads:delete', description: 'Delete any uploaded file' },
  { key: 'notifications:read', description: 'Read own notifications' },
  { key: 'notifications:send', description: 'Send push notifications to users' },
  { key: 'stats:read', description: 'View platform statistics' },
  { key: 'portfolio:manage', description: 'Manage portfolio content (CRUD on all portfolio modules)' }
];

const WILDCARD = { key: '*', description: 'All permissions (superadmin)' };

const ROLES = [
  {
    name: 'admin',
    description: 'Full platform access',
    isSystem: true,
    permissions: [WILDCARD.key]
  },
  {
    name: 'manager',
    description: 'Team management access',
    isSystem: false,
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'uploads:create',
      'notifications:send',
      'stats:read'
    ]
  },
  {
    name: 'user',
    description: 'Default end-user role',
    isSystem: true,
    permissions: ['uploads:create', 'notifications:read']
  }
];

async function seedPermissions() {
  const all = [...PERMISSIONS, WILDCARD];
  for (const permission of all) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission
    });
  }
}

async function seedRoles() {
  const permissionRows = await prisma.permission.findMany();
  const permissionMap = new Map(permissionRows.map((row) => [row.key, row.id]));

  for (const role of ROLES) {
    const roleRow = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description, isSystem: role.isSystem }
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: roleRow.id } });
    await prisma.rolePermission.createMany({
      data: role.permissions.map((key) => ({
        roleId: roleRow.id,
        permissionId: permissionMap.get(key)
      }))
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  // Reconcile (not just create): a naive "skip if exists" seed leaves a deployed
  // admin stuck with whatever credentials were set the FIRST time it ran, so
  // changing ADMIN_EMAIL/ADMIN_PASSWORD in the dashboard and redeploying had no
  // effect and login kept returning 401. Every seed run now syncs the admin user
  // (password, active status, admin role) with the current env.
  const passwordHash = await argon2.hash(password);
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date()
      }
    });
    const alreadyAdmin = await prisma.userRole.findFirst({
      where: { userId: existing.id, roleId: adminRole.id }
    });
    if (!alreadyAdmin) {
      await prisma.userRole.create({ data: { userId: existing.id, roleId: adminRole.id } });
    }
    console.log(`Admin ${email} synced (email/password from ADMIN_EMAIL/ADMIN_PASSWORD or defaults).`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: adminRole.id }] }
    }
  });
  console.log(`Created admin user ${email} (email/password from ADMIN_EMAIL/ADMIN_PASSWORD or defaults).`);
}

async function seedPortfolio() {
  const existing = await prisma.profile.count();
  if (existing === 0) {
    await prisma.profile.create({
      data: {
        name: 'Your Name',
        headline: 'Software Engineer & Creator',
        bio: 'Replace this bio with a short intro about yourself.',
        status: 'Open to opportunities',
        myLocation: 'Your Location',
        myDegree: 'Your Degree',
        myDegreeDetails: 'Add more details about your degree here',
        socials: {
          github: 'https://github.com/',
          linkedin: 'https://linkedin.com/',
          email: 'you@example.com'
        },
        meta: { title: 'Portfolio', description: 'Personal portfolio' }
      }
    });
    console.log('Created default portfolio profile.');
  }

  const heroCount = await prisma.hero.count();
  if (heroCount === 0) {
    await prisma.hero.create({
      data: {
        heroBio: 'Full stack developer building useful, playful things.',
        primaryButtonText: 'View work',
        primaryButtonUrl: 'projects',
        secondaryButtonText: 'Contact me',
        secondaryButtonUrl: 'contact',
        published: true,
        sortOrder: 0
      }
    });
    console.log('Created default hero.');
  }

  const skillCount = await prisma.skill.count();
  if (skillCount === 0) {
    await prisma.skill.createMany({
      data: [
        { name: 'JavaScript', type: 'hard', category: 'Languages', icon: 'javascript', level: 92, sortOrder: 0 },
        { name: 'TypeScript', type: 'hard', category: 'Languages', icon: 'typescript', level: 88, sortOrder: 1 },
        { name: 'Python', type: 'hard', category: 'Languages', icon: 'python', level: 80, sortOrder: 2 },
        { name: 'Vue.js', type: 'hard', category: 'Frameworks', icon: 'vuedotjs', level: 90, sortOrder: 3 },
        { name: 'Node.js', type: 'hard', category: 'Frameworks', icon: 'nodedotjs', level: 85, sortOrder: 4 },
        { name: 'PostgreSQL', type: 'hard', category: 'Databases', icon: 'postgresql', level: 78, sortOrder: 5 },
        { name: 'Docker', type: 'hard', category: 'DevOps', icon: 'docker', level: 75, sortOrder: 6 },
        { name: 'OpenAI API', type: 'hard', category: 'AI tools', icon: 'openai', level: 82, sortOrder: 7 },
        { name: 'Figma', type: 'hard', category: 'AI tools', icon: 'figma', level: 70, sortOrder: 8 },
        { name: 'Communication', type: 'soft', category: 'Interpersonal', sortOrder: 9 },
        { name: 'Teamwork', type: 'soft', category: 'Interpersonal', sortOrder: 10 },
        { name: 'Problem solving', type: 'soft', category: 'Interpersonal', sortOrder: 11 },
        { name: 'Adaptability', type: 'soft', category: 'Personal', sortOrder: 12 },
        { name: 'Time management', type: 'soft', category: 'Personal', sortOrder: 13 }
      ]
    });
    console.log('Created default skills (hard + soft).');
  }
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedAdmin();
  await seedPortfolio();
  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
