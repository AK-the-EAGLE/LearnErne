import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { User } from '../models/User.js';
import { asyncRoute, httpError } from '../lib/httpError.js';
import { publicUser } from '../lib/users.js';
import { env } from '../config/env.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'AUTH_RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
  },
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body, registration = false) {
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (registration && (!displayName || displayName.length > 80)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Enter a name of 1 to 80 characters.');
  }
  if (!emailPattern.test(email) || email.length > 254) {
    throw httpError(400, 'VALIDATION_ERROR', 'Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'VALIDATION_ERROR', 'Password must be between 8 and 128 characters.');
  }

  return { displayName, email, password };
}

router.get('/csrf', (req, res) => {
  req.session.csrfToken ??= randomBytes(32).toString('hex');
  res.json({ success: true, data: { csrfToken: req.session.csrfToken } });
});

router.get('/me', asyncRoute(async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: true, data: { user: null } });
  }
  const user = await User.findById(req.session.userId);
  if (!user || user.status !== 'active') {
    req.session.destroy(() => {});
    res.clearCookie('learnerne.sid', { httpOnly: true, sameSite: 'lax', secure: req.secure });
    return res.json({ success: true, data: { user: null } });
  }
  return res.json({ success: true, data: { user: publicUser(user) } });
}));

router.post('/register', authLimiter, asyncRoute(async (req, res) => {
  const { displayName, email, password } = validateCredentials(req.body, true);
  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await User.create({ displayName, email, passwordHash });
  } catch (error) {
    if (error.code === 11000) {
      throw httpError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists. Try signing in.');
    }
    throw error;
  }

  await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.userId = user.id;
  req.session.csrfToken = randomBytes(32).toString('hex');
  await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  res.status(201).json({ success: true, data: { user: publicUser(user), csrfToken: req.session.csrfToken } });
}));

router.post('/login', authLimiter, asyncRoute(async (req, res) => {
  const { email, password } = validateCredentials(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches || user.status !== 'active') {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.userId = user.id;
  req.session.csrfToken = randomBytes(32).toString('hex');
  await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  return res.json({ success: true, data: { user: publicUser(user), csrfToken: req.session.csrfToken } });
}));

router.post('/logout', asyncRoute(async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
  res.clearCookie('learnerne.sid', { httpOnly: true, sameSite: 'lax', secure: req.secure });
  return res.json({ success: true, data: { loggedOut: true } });
}));

export default router;
