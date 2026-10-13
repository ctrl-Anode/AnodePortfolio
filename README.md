# Anod Portfolio

Personal portfolio website **and** self-hosted content studio for **Arnold Adeva**.

The public site is a fast, accessible Vue 3 single-page portfolio; the admin panel is a full CMS built on an Express + Prisma API with JWT auth, MFA, RBAC, and background queues. Every word, project, skill, certificate, repository, testimonial, and hero button on the public site is editable from the admin panel.

---

## Table of contents

1. [Feature highlights](#1-feature-highlights)
2. [Tech stack](#2-tech-stack)
3. [Repository layout](#3-repository-layout)
4. [Quick start](#4-quick-start)
5. [Environment variables](#5-environment-variables)
6. [Database](#6-database)
7. [API reference](#7-api-reference)
8. [Public site architecture](#8-public-site-architecture)
9. [Admin panel](#9-admin-panel)
10. [Scripts reference](#10-scripts-reference)
11. [Testing](#11-testing)
12. [Production notes](#12-production-notes)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Feature highlights

### Public portfolio site

- **Centered hero** with profile-driven identity (name, headline, avatar, socials, résumé) plus hero-owned content: hero bio, primary/secondary buttons, publish flag, sort order
- **Profile and Hero are separate resources** - the About section owns name, headline, bio, status, location, degree, and links; the Hero owns only what is specific to the landing view
- **Section order**: Experience, Projects, About, Skills, Certificates, GitHub, Testimonials, Contact
- **Divider system** - a single `SectionDivider` component renders matching hairline rules between sections
- **Icon rail navigation** - desktop rail with hover/focus tooltips, mobile floating rail with a visible arrow tab, scroll-close, and smooth scroll-to-section with URL deep links
- **Skills showcase** - skills grouped into compact per-category cards (each with a fitting icon); click a card to open a pop-up listing every skill in that category with its branded logo (uploaded image or Simple Icons slug). Hard and soft skills are shown separately
- **Pull-cord theme switch** - a hanging ceiling bulb in the header center; click the bulb or pull the string to toggle light/dark; it hides while scrolling
- **Transparent header** - no blur, no borders; a thin scroll progress bar stays on top
- **GitHub integration** - optionally sync repositories from the GitHub API into the site
- **Contact form** - queues an email notification to the configured inbox
- **Dedicated listing pages** - `/projects` and `/certificates` with pagination

### Admin panel

- CRUD for every portfolio resource: Hero, Experience, Project, Skill, Certificate, GitHub repo, Testimonial, Profile, Contact inbox
- Hero button targets are dropdowns of section keys - no hash syntax anywhere in the editor
- Contact inbox with status workflow (NEW / REPLIED / ARCHIVED)
- Live GitHub sync button when `GITHUB_USERNAME` is configured
- Dashboard with users, roles, profile & security pages
- MFA (TOTP) setup, password change, active session sign-out, avatar upload

### Platform

- JWT access/refresh tokens, refresh-token rotation, per-session revocation
- Role-based access control with wildcard and granular permissions
- BullMQ queues with inline workers in development: email, image, push, search
- Redis caching and rate limiting; Meilisearch search index (optional)
- Storage drivers: local filesystem, Google Cloud Storage / Firebase, or Cloudflare R2 (S3-compatible)
- Avatar and résumé uploads straight from the admin Profile tab (files stored in the configured driver, URLs saved on the profile)
- Email drivers: SMTP, Resend, SendGrid, Mailgun, AWS SESv2
- Push notifications via Firebase Cloud Messaging (optional)
- Sentry error tracking, Prometheus metrics, Grafana dashboards
- Audit logging, soft deletes, request IDs, structured logging with pino

---

## 2. Tech stack

| Layer | Technologies |
| --- | --- |
| Client | Vue 3.5, Vite 5, Pinia, Vue Router 4, Tailwind CSS 3.4 |
| Client UI | Headless UI, Heroicons, Lucide, TanStack Table, ApexCharts, VeeValidate + Yup, FilePond, Motion |
| Server | Node.js ≥ 20, Express 4, Prisma 6, MySQL 8 |
| Server infra | Redis 7, BullMQ, Meilisearch 1.10, Mailpit (dev), Prometheus, Grafana |
| Auth | JWT, argon2, otplib (TOTP), RBAC |
| Quality | ESLint (flat config, both packages), Vitest, Playwright |
| Docs | Swagger UI at `/api/docs`, OpenAPI annotations in routes |

---

## 3. Repository layout

```
.
├── client/                     # Vue 3 SPA
│   ├── src/
│   │   ├── api/                # Axios clients (auth, portfolio, users, uploads...)
│   │   ├── assets/styles/      # Tailwind entry + design tokens
│   │   ├── components/
│   │   │   ├── admin/          # ResourceModal (generic CRUD form)
│   │   │   ├── layout/         # Admin shell: AppSidebar, AppHeader, AppLayout
│   │   │   ├── portfolio/      # Public site: sections, header, rail, footer
│   │   │   │   └── ui/         # SectionHeading, ProjectCard, ThemeSwitch, AvatarCircle...
│   │   │   └── ui/             # Base design system (buttons, inputs, cards, alerts)
│   │   ├── composables/        # useProfile, useHero
│   │   ├── config/             # portfolioResources (admin schema per resource)
│   │   ├── router/             # Public + dashboard + admin routes with guards
│   │   ├── stores/             # auth, ui, toast (Pinia)
│   │   ├── utils/              # format, sectionScroll
│   │   └── views/              # portfolio, admin, dashboard, auth, errors, settings
│   ├── dist/                   # Production build output
│   └── package.json
├── server/                     # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Data model
│   │   ├── migrations/         # Versioned SQL migrations
│   │   └── seed.js             # Permissions, roles, admin user, profile, hero
│   ├── docker-entrypoint.sh    # Container boot: migrate deploy (+ optional seed)
│   ├── src/
│   │   ├── config/             # env parsing, logger
│   │   ├── middleware/         # auth, authorize, validate, rate limit, errors
│   │   ├── modules/            # auth, users, roles, portfolio, uploads, notifications...
│   │   ├── queues/             # BullMQ queues, jobs, worker
│   │   ├── routes/             # v1 router aggregation
│   │   ├── services/           # github sync, mailer, storage, search
│   │   └── app.js              # App factory (/api/v1, swagger, metrics, health)
│   └── package.json
├── e2e/                        # Playwright specs (auth, portfolio)
├── monitoring/                 # Prometheus + Grafana provisioning
├── Dockerfile                  # Single-container build: SPA + API + inline workers
├── render.yaml                 # Render Blueprint (single web service)
├── docker-compose.yml          # mysql, redis, meili, mailpit, prometheus, grafana,
│                               # redis-exporter, migrate, api, worker, web
├── SETUP.md                    # Detailed environment + setup walkthrough
└── README.md
```

---

## 4. Quick start

### Option A - full stack with Docker

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env   # optional, sensible defaults

docker compose --profile app up --build
```

The app services (`migrate`, `api`, `worker`, `web`) live behind the `app` Compose profile; plain `docker compose up` starts infrastructure only.

Services once healthy:

| Service | URL |
| --- | --- |
| Portfolio site (nginx build) | http://localhost (`APP_PORT`, default 80) |
| API (manual dev) | http://localhost:5000 |
| Swagger docs (manual dev) | http://localhost:5000/api/docs |
| Mailpit (caught emails) | http://localhost:8025 |
| Meilisearch | http://localhost:7700 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

### Option B - manual development (hot reload)

Prerequisites: Node ≥ 20, Docker (for MySQL/Redis/Meilisearch), or local equivalents.

```bash
# 1. Infrastructure only
docker compose up -d mysql redis meili mailpit

# 2. Server
cd server
npm install
cp .env.example .env            # adjust secrets/values
npx prisma migrate deploy
npx prisma generate
npm run db:seed                 # permissions, roles, admin, default profile + hero
npm run dev                     # http://localhost:5000

# 3. Client (new terminal)
cd client
npm install
npm run dev                     # http://localhost:5173
```

Default admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` (seed output confirms). Change the password after first login.

Full environment reference (every variable, where to obtain it): see **[SETUP.md](SETUP.md)**.

---

## 5. Environment variables

Three env files, all gitignored, each with a committed `.example`:

| File | Used by |
| --- | --- |
| `.env` | `docker-compose.yml` substitutions |
| `server/.env` | Express API (host and container) |
| `client/.env` | Vite (`VITE_` prefix; optional for default proxy) |

Key server groups:

| Group | Variables |
| --- | --- |
| Core | `NODE_ENV`, `PORT`, `APP_URL`, `API_URL`, `CLIENT_URL`, `CORS_ORIGIN` |
| Database / cache | `DATABASE_URL`, `REDIS_URL` |
| Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MFA_TOKEN_SECRET`, TTLs |
| Search | `MEILI_ENABLED`, `MEILI_HOST`, `MEILI_API_KEY` |
| Mail | `MAIL_DRIVER`, `MAIL_FROM` + driver keys (SMTP, Resend, SendGrid, Mailgun, SES) |
| Storage | `STORAGE_DRIVER` (`local`, `gcs`, or `r2`), `STORAGE_LOCAL_PATH`, Firebase/GCS keys, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |
| Push | `FCM_ENABLED`, `FIREBASE_*` |
| Observability | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `PROD_CSP` |
| Limits | `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX` |
| Seeding / content | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CONTACT_NOTIFY_EMAIL`, `GITHUB_USERNAME`, `GITHUB_TOKEN` |

Client variables: `VITE_API_BASE_URL`, `VITE_PROXY_TARGET`.

---

## 6. Database

MySQL 8 via Prisma. Migrations live in `server/prisma/migrations`.

### Portfolio models

| Model | Purpose | Notable fields |
| --- | --- | --- |
| `Profile` | About/identity source of truth | `name`, `headline`, `bio`, `avatarUrl`, `resumeUrl`, `status`, `myLocation`, `myDegree`, `myDegreeDetails`, `socials`, `meta` |
| `Hero` | Landing content | `heroBio`, `primaryButtonText/Url`, `secondaryButtonText/Url`, `published`, `sortOrder` |
| `Experience` | Work history | `role`, `company`, `location`, `startDate`, `endDate`, `current`, `description`, `sortOrder` |
| `Project` | Portfolio projects | `title`, `slug`, `description`, `techStack`, `repoUrl`, `demoUrl`, `imageUrl`, `featured`, `published` |
| `Skill` | Hard & soft skills | `name`, `type` (hard/soft), `category`, `icon`, `logoUrl` |
| `Certificate` | Credentials | `title`, `issuer`, `issuedAt`, `credentialUrl` (uploaded PDF/image), `imageUrl` |
| `GithubRepo` | Synced repositories | `name`, `url`, `language`, `stars`, `topics` |
| `Testimonial` | Quotes | `author`, `role`, `quote`, `avatarUrl` |
| `ContactMessage` | Contact inbox | `name`, `email`, `subject`, `message`, `status` |

### Platform models

`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `PasswordResetToken`, `Device`, `Notification`, `File`, `AuditLog`.

### Common commands

```bash
cd server
npm run db:migrate     # create + apply a migration in development (interactive)
npm run db:deploy      # apply committed migrations (CI/production)
npm run db:push        # prototype schema without a migration
npm run db:seed        # idempotent seed
npm run db:studio      # Prisma Studio
```

Seed behavior: creates permissions and roles (`admin`, `manager`, `user`), the admin user from env, and - only when missing - a default `Profile` and `Hero`.

---

## 7. API reference

Base URL: `/api/v1`. Swagger UI: `/api/docs`.

### Public portfolio endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/portfolio/profile` | Profile (identity, status, location, degree) |
| GET | `/portfolio/heroes` | Published heroes (first entry drives the landing) |
| GET | `/portfolio/experiences` | Work history |
| GET | `/portfolio/projects` | Published projects (`featured`, pagination) |
| GET | `/portfolio/skills` | Skills (`category` filter) |
| GET | `/portfolio/certificates` | Certificates |
| GET | `/portfolio/github` | GitHub repositories (auto-seeds once if configured) |
| GET | `/portfolio/testimonials` | Testimonials |
| GET | `/portfolio/github/config` | Whether GitHub sync is configured (no secrets) |
| POST | `/portfolio/contact` | Submit contact message (rate limited) |

### Admin endpoints

All require `Authorization: Bearer <access token>` and the `portfolio:manage` permission.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/portfolio/admin/:resource` | Paginated list |
| GET | `/portfolio/admin/:resource/:id` | Single row |
| POST | `/portfolio/admin/:resource` | Create |
| PATCH | `/portfolio/admin/:resource/:id` | Update (partial) |
| DELETE | `/portfolio/admin/:resource/:id` | Delete |
| POST | `/portfolio/admin/github/sync` | Force GitHub repository sync |

Resources: `profile`, `hero`, `experience`, `project`, `skill`, `certificate`, `github`, `testimonial`, `contact`.

Hero button URLs accept absolute URLs, `/paths`, `#anchors`, `mailto:`/`tel:`, or a plain section key (e.g. `projects`).

### Auth and platform

- `/auth/*` - register, login, refresh, logout, password reset, MFA setup/confirm/disable
- `/users/*`, `/roles/*` - user and role management (permission-gated)
- `/uploads/*` - avatar and document uploads (e.g. résumé PDF/DOC/DOCX)
- `/notifications/*` - in-app notifications
- `/stats/*` - dashboard statistics
- `/healthz`, `/readyz`, `/metrics` - liveness/readiness probes and Prometheus metrics

---

## 8. Public site architecture

### Content ownership

| Content | Source |
| --- | --- |
| Name, headline, bio, avatar, résumé, socials | `Profile` |
| Status ("Currently"), location, degree + details | `Profile` |
| Hero bio, buttons, publish flag | `Hero` |

`HeroSection` composes both: identity from `useProfile()`, hero-specific fields from `useHero()`, falling back to sensible defaults.

### Section navigation

- Sections expose stable ids: `home`, `about`, `experience`, `projects`, `skills`, `certificates`, `github`, `testimonials`, `contact`
- `client/src/utils/sectionScroll.js` is the single scroll implementation: strips hash syntax, smooth-scrolls via `scrollIntoView`, and keeps the URL deep-linkable with `pushState`
- Nav rail, mobile arrow panel, and hero buttons all call the same helper; admin dropdowns store plain keys, never `#`
- An `IntersectionObserver` in `PortfolioView` highlights the active section

### Layout behavior

| Breakpoint | Navigation |
| --- | --- |
| `< lg` | Floating icon rail, toggled by the accent arrow tab; closes on scroll or selection (250 ms before scrolling) |
| `lg` - `xl` | Horizontal header nav |
| `xl +` | Permanent icon rail with tooltip labels |

### Theme

Light/dark is stored in the `ui` Pinia store, applied as a `dark` class on `<html>`, and persisted to `localStorage`. The header hosts the pull-cord bulb switch (`ThemeSwitch.vue`).

---

## 9. Admin panel

| Route | Purpose |
| --- | --- |
| `/dashboard` | Overview, users, roles, profile & security |
| `/admin` | Portfolio admin home - resource cards with live counts |
| `/admin/:resource` | Generic CRUD table + modal for a resource |

The admin form schema per resource lives in `client/src/config/portfolioResources.js` (columns, fields, types, hints, permissions like `canCreate` / `canDelete` / `readOnlyFields`). Resource order in that array drives the admin overview card order: Hero, Experience, Project, Profile, Skill, Certificate, GitHub, Testimonial, Contact.

Input types supported by the generic `ResourceModal`: text, textarea, url, date, number, checkbox, select, list (one item per line), JSON.

---

## 10. Scripts reference

### Root

| Script | Description |
| --- | --- |
| `npm run e2e` | Run Playwright specs |
| `npm run e2e:ui` | Playwright interactive UI |

### Client (`client/`)

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` / `test:watch` | Vitest |

### Server (`server/`)

| Script | Description |
| --- | --- |
| `npm run dev` | Node watch mode |
| `npm run start` | Production start |
| `npm run worker` | Standalone BullMQ worker |
| `npm run lint` | ESLint |
| `npm run test` / `test:watch` | Vitest |
| `npm run db:migrate` / `db:deploy` / `db:push` / `db:seed` / `db:studio` | Prisma workflows |

---

## 11. Testing

- **Unit / integration**: Vitest in both packages (`npm run test`). Supertest is available for API tests.
- **End-to-end**: Playwright specs in `e2e/` (`auth.spec.js`, `portfolio.spec.js`) driven by `playwright.config.js` at the repo root.

```bash
npm run e2e
npm run e2e:ui
```

---

## 12. Production notes

1. Build the client: `cd client && npm run build`
2. Apply migrations: `cd server && npm run db:deploy` (never `db:migrate` in production)
3. Start the API and a worker process (`npm run start`, `npm run worker`) or use the Docker `api` / `worker` services
4. Set strong unique secrets for the three JWT/MFA keys; set `NODE_ENV=production`
5. Configure `SENTRY_DSN`, `PROD_CSP`, and rate limits; point `CORS_ORIGIN` at the real site origin
6. For media on object storage set `STORAGE_DRIVER=r2` (Cloudflare R2) or `gcs` and provide the matching credentials. On ephemeral hosts (Render, Fly, Heroku) never use `local`: the container filesystem is wiped on redeploy, so uploaded images/files vanish and their stored URLs 404
7. Monitoring stack (Prometheus, Grafana, redis-exporter) is included in `docker-compose.yml` and provisioned via `monitoring/`

### 12.1 Render - single container (client + server)

The root `Dockerfile` builds the Vue SPA and has the Express API serve it from the same
origin, so the whole app runs as **one** container. `render.yaml` is the matching Blueprint.

```bash
docker build -t anod-portfolio .
docker run --env-file server/.env -p 5000:5000 anod-portfolio
```

Requirements & notes for Render:

- Render does **not** run `docker-compose.yml`; use the root `Dockerfile` / `render.yaml` instead.
- Render has **no managed MySQL** - point `DATABASE_URL` at an external MySQL instance
  (Aiven, Railway, Cloud SQL, RDS...). Redis can be a Render Key Value instance.
- `PORT` is injected by Render; the API binds `0.0.0.0:$PORT` already.
- `WORKER_MODE=inline` runs the BullMQ workers inside the same process - no separate worker.
- Set `MEILI_ENABLED=false` (no Meilisearch on Render) - falls back to SQL LIKE search.
- Render's filesystem is ephemeral - keep `STORAGE_DRIVER=r2` (or attach a paid disk) so
  uploads survive restarts.
- The image entrypoint (`server/docker-entrypoint.sh`) applies `prisma migrate deploy` on
  boot and runs `prisma db seed` only when `RUN_SEED=true` (idempotent). Turn `RUN_SEED`
  off once your content is in place.
- Client env is baked at build time - leave `VITE_API_BASE_URL` empty (same-origin `/api/v1`).

### 12.2 Render free-tier cold starts

A free Render web service **spins down after ~15 minutes without traffic**. The next
visit has to boot the container again (~30-60s), and during that window Render serves
its own **"Application loading"** page from the edge proxy - *before* the container can
respond. This is Render behaviour, not an application bug: `/healthz` returns 200 and
the app boots normally once the instance is up.

Options:

| Option | Effect | Notes |
| --- | --- | --- |
| Upgrade the instance type (Starter+) | Never spins down | The proper fix for production |
| Keep it warm with an external uptime monitor | Prevents spin-down | Free UptimeRobot / cron-job.org HTTP monitor hitting `/healthz` every 5 minutes - see steps below |
| Accept the cold start | Nothing to do | Fine for a personal site; only the first visit is slow |

**Keep-alive with an external monitor (free):**

1. Create an account at [UptimeRobot](https://uptimerobot.com) (or [cron-job.org](https://cron-job.org)).
2. Add an **HTTP(S)** monitor with URL `https://<your-service>.onrender.com/healthz`.
3. Set the check interval to **5 minutes** and save.

`/healthz` is a static `200` that does **not** query the database, so pings are
effectively free. One always-awake free service uses ~720 instance-hours/month, within
Render's 750 free hours.

---

## 13. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` during `prisma generate` / `migrate` | A running Node process holds the Prisma engine on Windows. Stop `node` processes, then re-run the command |
| Port 5000 already in use (Windows) | `wslrelay.exe` or another service squats on it; change `PORT` in `server/.env` or free the port |
| `prisma migrate dev` refuses to run non-interactively | Create the migration file manually with `prisma migrate diff` + `migrate deploy`, or run it from an interactive terminal |
| 422 on hero save | Button target must be a URL, path, `#anchor`, or plain section key - the admin dropdown already enforces valid keys |
| Client can't reach the API | Check `VITE_API_BASE_URL` / `VITE_PROXY_TARGET`; the default proxy targets `http://localhost:5000` |
| Render URL shows "Application loading" for 30-60s then works | Free instance spun down after 15 min idle (cold start). Keep it warm with an external `/healthz` monitor or upgrade the instance type - see [12.2](#122-render-free-tier-cold-starts) |
| Images/files 404 or show as broken after a Render redeploy | Render's filesystem is **ephemeral**, so uploads are lost whenever the container is replaced. Cause is usually `STORAGE_DRIVER` falling back to `local` (unset) or a missing/wrong `R2_*` env var. Set `STORAGE_DRIVER=r2` plus all five `R2_*` vars and make the bucket publicly readable (r2.dev or a custom domain); the server logs the active driver and warns at boot - see [12.1 Render](#121-render---single-container-client--server). Re-upload media saved while `local` was active, since those files are gone |

Further setup details: **[SETUP.md](SETUP.md)**.

---

## License

MIT © Arnold Adeva
