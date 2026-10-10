import { Router } from 'express';
import { User } from '../models/User.js';
import { UserPreference } from '../models/UserPreference.js';
import { asyncRoute, httpError } from '../lib/httpError.js';
import { publicUser } from '../lib/users.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const preferenceFields = ['darkMode', 'courseReminders', 'weeklyDigest', 'progressHighlights'];

router.use(requireAuth);

router.get('/me', asyncRoute(async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user || user.status !== 'active') throw httpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  res.json({ success: true, data: { user: publicUser(user) } });
}));

router.patch('/me', asyncRoute(async (req, res) => {
  const { displayName, bio = '', location = '', interest = '' } = req.body ?? {};
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 80) {
    throw httpError(400, 'VALIDATION_ERROR', 'Name must be between 1 and 80 characters.');
  }
  for (const [key, value, max] of [['bio', bio, 500], ['location', location, 80], ['interest', interest, 80]]) {
    if (typeof value !== 'string' || value.length > max) {
      throw httpError(400, 'VALIDATION_ERROR', `${key} must be text with at most ${max} characters.`);
    }
  }
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { displayName: displayName.trim(), profile: { bio: bio.trim(), location: location.trim(), interest: interest.trim() } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw httpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  res.json({ success: true, data: { user: publicUser(user) } });
}));

router.get('/me/preferences', asyncRoute(async (req, res) => {
  const preferences = await UserPreference.findOneAndUpdate(
    { userId: req.session.userId },
    { $setOnInsert: { userId: req.session.userId } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  res.json({ success: true, data: { preferences: Object.fromEntries(preferenceFields.map((key) => [key, preferences[key]])) } });
}));

router.put('/me/preferences', asyncRoute(async (req, res) => {
  const input = req.body?.preferences;
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || !preferenceFields.every((key) => typeof input[key] === 'boolean')) {
    throw httpError(400, 'VALIDATION_ERROR', 'Provide boolean values for all preference options.');
  }
  const preferences = await UserPreference.findOneAndUpdate(
    { userId: req.session.userId },
    { $set: Object.fromEntries(preferenceFields.map((key) => [key, input[key]])), $setOnInsert: { userId: req.session.userId } },
    { returnDocument: 'after', upsert: true, runValidators: true },
  );
  res.json({ success: true, data: { preferences: Object.fromEntries(preferenceFields.map((key) => [key, preferences[key]])) } });
}));

export default router;
