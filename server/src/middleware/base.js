import { randomBytes } from 'node:crypto';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import express from 'express';
import { config } from '../config/env.js';

/**
 * Strict, tuned Content-Security-Policy for the SPA + API.
 *
 *  * The built SPA ships zero inline scripts (the theme bootstrap lives in the
 *    bundled main.js), so `script-src 'self'` is safe.
 *  * Inline styles are allowed (`style-src 'unsafe-inline'`) because Vue and
 *    Swagger UI both rely on style attributes / <style> blocks.
 *  * Google Fonts: stylesheet + preconnect from fonts.googleapis.com, fonts
 *    from fonts.gstatic.com.
 *  * Images/videos: `https:` accepted (portfolio media, project screenshots and
 *    R2-backed uploads may be on any host); `data:`/`blob:` for inline SVG and
 *    object URLs.
 *  * `connect-src` stays same-origin plus Google Fonts preconnect and the R2
 *    public origin (when configured) so uploads/thumbnails keep working.
 *  * Swagger UI (`/api/docs`) is handled separately with a per-request nonce
 *    (see allowInlineScriptWithNonce) so its generated page stays compliant.
 */
function r2Origins() {
  if (!config.R2_PUBLIC_URL) return [];
  try {
    return [new URL(config.R2_PUBLIC_URL).origin];
  } catch {
    return [];
  }
}

function buildCspDirectives(extraScriptSrc = []) {
  return {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
    scriptSrc: ["'self'", ...extraScriptSrc],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:', ...r2Origins()],
    mediaSrc: ["'self'", 'https:'],
    connectSrc: ["'self'", 'https://fonts.googleapis.com', ...r2Origins()]
  };
}

function toKebab(part) {
  return part.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function serializeCsp(directives) {
  return Object.entries(directives)
    .map(([key, values]) => `${toKebab(key)} ${values.join(' ')}`.trimEnd())
    .join('; ');
}

/**
 * Swagger UI's HTML page can carry inline <script> blocks (depending on the
 * swagger-ui-express version / customJsStr options) that `script-src 'self'`
 * would block. For /api/docs only, mint a per-request nonce, stamp it on the
 * inline scripts, and re-serialize the policy with that nonce. The rest of the
 * app keeps the strict, nonce-less policy.
 */
function allowInlineScriptWithNonce(app) {
  app.use('/api/docs', (req, res, next) => {
    const nonce = randomBytes(16).toString('base64');
    res.setHeader(
      'Content-Security-Policy',
      serializeCsp(buildCspDirectives([`'nonce-${nonce}'`]))
    );

    const send = res.send.bind(res);
    res.send = (body) => {
      if (typeof body === 'string' && body.includes('<script')) {
        body = body.replace(/<script\b([^>]*)>/gi, (tag, attrs) => {
          if (/\bsrc\s*=|\bnonce\s*=|\bsrcset\s*=/i.test(attrs)) return tag;
          return tag.replace(/\s*>$/i, ` nonce="${nonce}">`);
        });
      }
      return send(body);
    };
    next();
  });
}

export function applyBaseMiddleware(app) {
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  const cspEnabled = config.isProd && config.PROD_CSP;

  app.use(
    helmet({
      contentSecurityPolicy: cspEnabled ? { directives: buildCspDirectives() } : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  if (cspEnabled) {
    allowInlineScriptWithNonce(app);
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id']
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}