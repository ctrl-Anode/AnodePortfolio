# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Single-image deployment: build the Vue SPA, then have the Express API serve
# it from the same origin. Runs client + server (+ inline queue workers) in one
# container - suitable for a single Render web service.
#
# Build context is the repository root:
#   docker build -t anod-portfolio .
#   docker run --env-file server/.env -p 5000:5000 anod-portfolio
# ---------------------------------------------------------------------------

# --- Client build -----------------------------------------------------------
FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# VITE_API_BASE_URL stays empty so the SPA talks to the same origin at /api/v1.
RUN npm run build

# --- Server build -----------------------------------------------------------
FROM node:20-alpine AS server-build
WORKDIR /app
COPY server/package*.json ./
COPY server/prisma ./prisma
COPY server/prisma.config.mjs ./
RUN npm ci
COPY server/src ./src
RUN npx prisma generate

# --- Runtime ----------------------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
RUN apk add --no-cache curl
WORKDIR /app

COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/prisma ./prisma
COPY --from=server-build /app/prisma.config.mjs ./
COPY --from=server-build /app/src ./src
COPY server/package*.json ./
COPY server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

COPY --from=client-build /client/dist ./client-dist

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/storage \
  && chown -R node:node /app/storage /app/client-dist

# Sane single-container defaults (override in Render/dashboard as needed).
ENV CLIENT_DIST_PATH=/app/client-dist \
    STORAGE_LOCAL_PATH=/app/storage \
    WORKER_MODE=inline

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT:-5000}/healthz" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
