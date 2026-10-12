import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config/env.js';
import { requestContext } from './middleware/requestContext.js';
import { applyBaseMiddleware } from './middleware/base.js';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';
import { mountSwagger } from './docs/swagger.js';
import v1Router from './routes/index.js';
import healthRouter from './modules/health/health.routes.js';

export function createApp() {
  const app = express();

  applyBaseMiddleware(app);
  app.use(requestContext);
  app.use(metricsMiddleware);

  const storagePath = path.resolve(config.STORAGE_LOCAL_PATH);
  app.use('/uploads', express.static(storagePath, { maxAge: '365d', immutable: true, fallthrough: false }));

  app.get('/metrics', metricsHandler);
  app.use('/', healthRouter);

  mountSwagger(app);

  app.use('/api/v1', apiLimiter, v1Router);

  // Single-container deployments serve the built SPA from the same origin.
  // In local development the Vite dev server owns the client and this directory
  // does not exist, so nothing is mounted.
  const clientDist = config.CLIENT_DIST_PATH ? path.resolve(config.CLIENT_DIST_PATH) : null;
  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(
      express.static(clientDist, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (/\.(?:js|css|svg|woff2?|png|jpe?g|gif|webp|ico)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        }
      })
    );

    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      // Never let the SPA fallback shadow API, upload or probe routes.
      if (/^\/(?:api|uploads|metrics|healthz|readyz)(?:\/|$)/.test(req.path)) return next();
      res.sendFile(path.join(clientDist, 'index.html'), (err) => (err ? next(err) : undefined));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
