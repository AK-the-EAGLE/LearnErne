import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { timingSafeEqual } from 'node:crypto';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ sessionStore } = {}) {
  const app = express();
  if (env.isProduction) app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // Restrictive CORS configuration
  const allowedOrigins = env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or same-origin server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        const error = new Error(`Origin ${origin} not allowed by CORS`);
        error.status = 403;
        error.code = 'CORS_ORIGIN_DENIED';
        return callback(error);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    })
  );

  // Request logging (omit health check logging to keep logs clean)
  if (!env.isTest) {
    app.use(
      morgan('short', {
        skip: (req) => req.url.includes('/health'),
      })
    );
  }

  // Request body parsing with safe payload limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use(session({
    name: 'learnerne.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore ?? MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7,
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  app.use('/api/v1', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.get('origin');
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        error: { code: 'CSRF_ORIGIN_DENIED', message: 'Request origin is not allowed.' },
      });
    }

    const expected = req.session.csrfToken;
    const provided = req.get('x-csrf-token');
    if (
      typeof expected !== 'string'
      || typeof provided !== 'string'
      || Buffer.byteLength(expected) !== Buffer.byteLength(provided)
      || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'CSRF_TOKEN_INVALID', message: 'Refresh the page and try again.' },
      });
    }

    return next();
  });

  // API Router mounted at /api/v1
  app.use('/api/v1', apiRouter);

  // Centralized 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
