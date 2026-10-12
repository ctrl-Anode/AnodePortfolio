import 'dotenv/config';
import { z } from 'zod';

const booleanish = z
  .preprocess((value) => (typeof value === 'string' ? value.trim().toLowerCase() : value), z.enum(['true', 'false']))
  .transform((value) => value === 'true');

// Enum values are normalized (trim + lowercase) and blank strings fall back to
// the default, so stray whitespace/casing or an empty env var cannot crash boot.
const enumish = (values, fallback) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.enum(values).optional().default(fallback)
  );

const schema = z.object({
  NODE_ENV: enumish(['development', 'test', 'production'], 'development'),
  PORT: z.coerce.number().int().positive().default(5000),

  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:5000'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  MFA_TOKEN_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800),

  MEILI_ENABLED: booleanish.default('true'),
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_API_KEY: z.string().optional(),

  WORKER_MODE: enumish(['inline', 'standalone', 'off'], 'inline'),

  MAIL_DRIVER: enumish(['log', 'smtp', 'resend', 'sendgrid', 'mailgun', 'ses'], 'log'),
  MAIL_FROM: z.string().default('Acme <no-reply@example.com>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: booleanish.default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_BASE_URL: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  STORAGE_DRIVER: enumish(['local', 'gcs', 'r2'], 'local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  // Path to the built SPA served by the API in single-container deployments.
  // Unset by default so local development keeps using the Vite dev server.
  CLIENT_DIST_PATH: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  FCM_ENABLED: booleanish.default('false'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  PROD_CSP: booleanish.default('false'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  CONTACT_NOTIFY_EMAIL: z.string().email().optional(),

  GITHUB_USERNAME: z.string().optional(),
  GITHUB_TOKEN: z.string().optional()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '(root)';
    const received = process.env[key] !== undefined ? JSON.stringify(process.env[key]) : 'unset';
    console.error(`  ${key}: ${issue.message}`);
    console.error(`    received: ${received}`);
  }
  console.error('Compare your .env with the provided .env.example.');
  process.exit(1);
}

const raw = parsed.data;

export const config = {
  ...raw,
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  isProd: raw.NODE_ENV === 'production',
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};

export default config;
