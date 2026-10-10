import { httpError } from '../lib/httpError.js';
import { User } from '../models/User.js';

export async function requireAuth(req, _res, next) {
  try {
    if (!req.session.userId) {
      return next(httpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.'));
    }
    const user = await User.findById(req.session.userId).select('_id status');
    if (!user || user.status !== 'active') {
      await new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
      return next(httpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.'));
    }
    req.authenticatedUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
