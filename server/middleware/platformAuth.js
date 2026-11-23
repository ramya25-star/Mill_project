// Sign-in for the Mill Mate Console (platform owner / admin / support).
// Console tokens use their own secret and audience, so an app token can never
// be used on the Console and a Console token never works in the app.
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { platformDb } from '../platform.js';
import { getJwtSecret } from './auth.js';

export const PLATFORM_AUDIENCE = 'millmate-console';
const SETUP_AUDIENCE = 'millmate-console-2fa-setup';

const platformSecret = () => process.env.PLATFORM_JWT_SECRET
  || crypto.createHmac('sha256', getJwtSecret()).update('mill-mate-console-v1').digest('hex');

export const PLATFORM_ROLES = ['owner', 'admin', 'support'];

// What each Console role may do. Owner = Alagiri Duplex (master control),
// admin = their staff, support = the developers (help only, no money).
const PERMISSIONS = {
  'tenants.read': ['owner', 'admin', 'support'],
  'tenants.write': ['owner', 'admin'],
  'payments.read': ['owner', 'admin'],
  'payments.write': ['owner', 'admin'],
  'plans.write': ['owner'],
  'users.support': ['owner', 'admin', 'support'],
  'support.login': ['owner', 'admin', 'support'],
  'announcements.write': ['owner', 'admin'],
  'console.users': ['owner'],
  'audit.read': ['owner', 'admin', 'support'],
  'backup.download': ['owner']
};

export const can = (role, permission) => (PERMISSIONS[permission] || []).includes(role);
export const permissionsFor = (role) => Object.keys(PERMISSIONS).filter(p => can(role, p));

export const signPlatformToken = (user) => jwt.sign(
  { sub: user.id, username: user.username, role: user.role },
  platformSecret(),
  { expiresIn: '12h', audience: PLATFORM_AUDIENCE }
);

// Issued after the password when the authenticator still has to be set up.
export const signSetupToken = (user) => jwt.sign({ sub: user.id }, platformSecret(), { expiresIn: '15m', audience: SETUP_AUDIENCE });

export const verifySetupToken = (token) => {
  try {
    return jwt.verify(String(token || ''), platformSecret(), { audience: SETUP_AUDIENCE });
  } catch {
    return null;
  }
};

export const requirePlatformAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in to the Console.' });
  let payload;
  try {
    payload = jwt.verify(token, platformSecret(), { audience: PLATFORM_AUDIENCE });
  } catch {
    return res.status(401).json({ error: 'Console session expired. Please sign in again.' });
  }
  const row = platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(payload.sub);
  if (!row || !row.enabled || !row.totp_enabled) {
    return res.status(401).json({ error: 'Console account not found or disabled.' });
  }
  req.platformUser = row;
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.platformUser || !can(req.platformUser.role, permission)) {
    return res.status(403).json({ error: 'Your Console role does not allow this.' });
  }
  next();
};

export const actorOf = (req) => `console:${req.platformUser?.username || 'unknown'}`;
