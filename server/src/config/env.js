import dotenv from 'dotenv';

dotenv.config();

function getRequiredEnv(key, fallback = undefined) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Environment validation failed: Missing required environment variable "${key}"`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: Number.parseInt(process.env.PORT || '5000', 10),
  SESSION_SECRET: process.env.SESSION_SECRET || (nodeEnv === 'test' ? 'test-only-session-secret-at-least-32-characters' : ''),
  MONGODB_URI: getRequiredEnv(
    'MONGODB_URI',
    nodeEnv === 'test'
      ? 'mongodb://127.0.0.1:27017/learnerne_test'
      : (nodeEnv === 'development'
        ? 'mongodb://127.0.0.1:27017/learnerne_dev'
        : undefined)
  ),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
});

export function validateEnv() {
  if (Number.isNaN(env.PORT) || env.PORT <= 0 || env.PORT > 65535) {
    throw new Error(`Environment validation failed: Invalid PORT value "${process.env.PORT}"`);
  }

  if (!env.MONGODB_URI.startsWith('mongodb://') && !env.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('Environment validation failed: MONGODB_URI must begin with "mongodb://" or "mongodb+srv://"');
  }

  if (env.SESSION_SECRET.length < 32) {
    throw new Error('Environment validation failed: SESSION_SECRET must contain at least 32 characters.');
  }

  if (env.isProduction && !process.env.SESSION_SECRET) {
    throw new Error('Environment validation failed: SESSION_SECRET must be configured in production.');
  }

  return env;
}
