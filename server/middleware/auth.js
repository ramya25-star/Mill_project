import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { getTenant, tenantAccess, platformDb } from '../platform.js';
import { runWithTenant, normalizeTenantCode, DEFAULT_TENANT_CODE, currentTenantCode } from '../tenantContext.js';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. Set it in server/.env');
  }
  return secret;
};

// App tokens carry the company (tid). Tokens issued before multi-company
// support have no tid and belong to the default company, so phones that are
// already logged in stay logged in.
export const signToken = (user, tenantCode = currentTenantCode()) => {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, tid: normalizeTenantCode(tenantCode) },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};

// Short-lived token for Mill Mate support to open a company's app, only while
// that company's Main Admin has allowed support access (see routes/tenant.js).
export const signSupportToken = (tenantCode, platformUser) => jwt.sign(
  { sub: `support-${platformUser.id}`, username: 'millmate-support', role: 'Main Admin', tid: normalizeTenantCode(tenantCode), support: platformUser.id },
  getJwtSecret(),
  { expiresIn: '30m' }
);

export const tokenTenantCode = (payload) => normalizeTenantCode(payload?.tid || DEFAULT_TENANT_CODE);

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Still allowed when a subscription has run out (view-only): signing in and
// managing one's own password.
const allowedWhenReadOnly = (req) => (req.originalUrl || '').startsWith('/api/auth/');

const supportUserRow = (payload, tenant) => {
  const until = tenant?.supportAccessUntil ? Date.parse(tenant.supportAccessUntil) : 0;
  if (!until || until < Date.now()) return null;
  const pu = platformDb.prepare('SELECT id, enabled FROM platform_users WHERE id = ?').get(payload.support);
  if (!pu || !pu.enabled) return null;
  return {
    id: payload.sub,
    username: 'millmate-support',
    password_hash: '',
    role: 'Main Admin',
    enabled: 1,
    must_change_password: 0,
    profile: JSON.stringify({ name: 'Mill Mate Support', department: 'Executive Office', avatarType: 'initials', avatarSeed: 'Support' }),
    created_at: new Date().toISOString(),
    isSupport: true
  };
};

// Verifies the bearer token and loads the current user fresh from the DB on
// every request, so a disabled/deleted account or a role change takes effect
// immediately instead of only once the old token expires. Everything after
// this middleware runs against the token's company database.
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const code = tokenTenantCode(payload);
  const tenant = getTenant(code);
  const access = tenantAccess(tenant);
  if (!access.canLogin) {
    return res.status(401).json({ error: access.message, code: 'TENANT_BLOCKED' });
  }

  runWithTenant(code, () => {
    const row = payload.support
      ? supportUserRow(payload, tenant)
      : db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!row || !row.enabled) {
      return res.status(401).json({ error: payload.support ? 'Support access has ended.' : 'Account not found or disabled' });
    }
    req.user = row;
    req.tenant = tenant;
    req.tenantAccess = access;
    if (!access.canWrite && !READ_METHODS.has(req.method) && !allowedWhenReadOnly(req)) {
      return res.status(402).json({ error: access.message, code: 'READ_ONLY' });
    }
    next();
  });
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }
  next();
};

// Runs the rest of a public route (login screen, signed links) for the company
// named in the request; unknown codes get a 404.
export const withRequestTenant = (getCode) => (req, res, next) => {
  const code = normalizeTenantCode(getCode(req) || DEFAULT_TENANT_CODE);
  const tenant = getTenant(code);
  if (!tenant) return res.status(404).json({ error: 'Unknown company code. Please check it with your administrator.', code: 'TENANT_NOT_FOUND' });
  req.tenant = tenant;
  runWithTenant(code, () => next());
};

// The company of a valid bearer token, or null (for public routes that also
// serve logged-in users, e.g. branding).
export const tenantCodeFromBearer = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return tokenTenantCode(jwt.verify(header.slice(7), getJwtSecret()));
  } catch {
    return null;
  }
};
