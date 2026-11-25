// Mill Mate Console API (/api/platform). Used only by the Console website.
// Every change is written to the audit trail.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  platformDb, listTenants, getTenant, getTenantRow, tenantAccess, createTenant, recordPayment, listPayments,
  listPlans, getPlan, serializePlan, audit, listAudit, newId, PlatformError, cleanContact, isDateOnly,
  FEATURE_KEYS, LIMIT_KEYS, TENANT_STATUSES, todayIst, addDays, userLimitError
} from '../platform.js';
import { getTenantDb, tenantDbPath } from '../db.js';
import { runWithTenant, normalizeTenantCode, isDefaultTenant } from '../tenantContext.js';
import { getCompanyProfile, cleanCompanyProfile, saveCompanyProfile } from '../companyProfile.js';
import { signSupportToken } from '../middleware/auth.js';
import {
  requirePlatformAuth, requirePermission, signPlatformToken, signSetupToken, verifySetupToken,
  actorOf, PLATFORM_ROLES, permissionsFor
} from '../middleware/platformAuth.js';
import { generateTotpSecret, verifyTotp, otpauthUrl } from '../totp.js';
import { validatePassword } from '../validation.js';

const router = Router();

const fail = (res, err) => {
  if (err instanceof PlatformError) return res.status(err.status).json({ error: err.message });
  throw err;
};

// -----------------------------------------------------------------------------
// Sign-in: password, then a 6-digit authenticator code (always required).
// -----------------------------------------------------------------------------
const FAIL_WINDOW_MS = 15 * 60 * 1000;
// 5 wrong tries lock one username; a whole network (shared office IP) only
// after 30, so one person's typos do not lock everybody else out.
const MAX_FAILS = 5;
const MAX_FAILS_PER_IP = 30;
const failures = new Map();
const tooMany = (key) => {
  const e = failures.get(key);
  if (!e || Date.now() - e.first > FAIL_WINDOW_MS) { failures.delete(key); return false; }
  return e.count >= (key.startsWith('ip:') ? MAX_FAILS_PER_IP : MAX_FAILS);
};
const noteFailure = (key) => {
  const e = failures.get(key);
  if (!e || Date.now() - e.first > FAIL_WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else e.count += 1;
};
setInterval(() => {
  for (const [k, e] of failures) if (Date.now() - e.first > FAIL_WINDOW_MS) failures.delete(k);
}, FAIL_WINDOW_MS).unref();

const consoleUserView = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name || '',
  role: row.role,
  enabled: !!row.enabled,
  twoFactor: !!row.totp_enabled,
  lastLoginAt: row.last_login_at,
  createdAt: row.created_at,
  permissions: permissionsFor(row.role)
});

const finishLogin = (res, row) => {
  platformDb.prepare("UPDATE platform_users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  audit(`console:${row.username}`, 'console.login');
  res.json({ token: signPlatformToken(row), user: consoleUserView(row) });
};

router.post('/auth/login', asyncHandler(async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const code = String(req.body?.code || '').trim();
  const key = `${req.ip}:${username.toLowerCase()}`;
  if (tooMany(key) || tooMany(`ip:${req.ip}`)) {
    return res.status(429).json({ error: 'Too many wrong attempts. Please wait 15 minutes.' });
  }
  const row = username ? platformDb.prepare('SELECT * FROM platform_users WHERE username = ? COLLATE NOCASE').get(username) : null;
  const ok = row && row.enabled && await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    noteFailure(key); noteFailure(`ip:${req.ip}`);
    return res.status(401).json({ error: 'Wrong username or password.' });
  }

  if (!row.totp_enabled) {
    // First sign-in: set up the authenticator app before anything else.
    const secret = row.totp_secret || generateTotpSecret();
    if (!row.totp_secret) platformDb.prepare('UPDATE platform_users SET totp_secret = ? WHERE id = ?').run(secret, row.id);
    return res.json({ setupRequired: true, setupToken: signSetupToken(row), secret, otpauthUrl: otpauthUrl(secret, row.username) });
  }
  if (!code) return res.json({ codeRequired: true });
  const step = verifyTotp(row.totp_secret, code, { lastStep: row.totp_last_step });
  if (step == null) {
    noteFailure(key); noteFailure(`ip:${req.ip}`);
    return res.status(401).json({ error: 'Wrong or expired 6-digit code.' });
  }
  platformDb.prepare('UPDATE platform_users SET totp_last_step = ? WHERE id = ?').run(step, row.id);
  failures.delete(key);
  finishLogin(res, row);
}));

router.post('/auth/setup-2fa', (req, res) => {
  const payload = verifySetupToken(req.body?.setupToken);
  if (!payload) return res.status(401).json({ error: 'Setup expired. Please sign in again.' });
  const key = `setup:${payload.sub}`;
  if (tooMany(key) || tooMany(`ip:${req.ip}`)) {
    return res.status(429).json({ error: 'Too many wrong codes. Please wait 15 minutes.' });
  }
  const row = platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(payload.sub);
  if (!row || !row.enabled || row.totp_enabled || !row.totp_secret) return res.status(400).json({ error: 'Please sign in again.' });
  const step = verifyTotp(row.totp_secret, req.body?.code);
  if (step == null) {
    noteFailure(key); noteFailure(`ip:${req.ip}`);
    return res.status(401).json({ error: 'That code did not match. Check the phone clock and try the newest code.' });
  }
  failures.delete(key);
  platformDb.prepare('UPDATE platform_users SET totp_enabled = 1, totp_last_step = ? WHERE id = ?').run(step, row.id);
  audit(`console:${row.username}`, 'console.2fa_enabled');
  finishLogin(res, { ...row, totp_enabled: 1 });
});

router.use(requirePlatformAuth);

router.get('/auth/me', (req, res) => res.json(consoleUserView(req.platformUser)));

router.post('/auth/change-password', asyncHandler(async (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (!await bcrypt.compare(current, req.platformUser.password_hash)) return res.status(400).json({ error: 'Current password is wrong.' });
  const pwError = validatePassword(next);
  if (pwError) return res.status(400).json({ error: pwError });
  platformDb.prepare('UPDATE platform_users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(next, 10), req.platformUser.id);
  audit(actorOf(req), 'console.password_changed');
  // Other open sessions end; this one carries on with a fresh token.
  res.json({ success: true, token: signPlatformToken(platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(req.platformUser.id)) });
}));

// -----------------------------------------------------------------------------
// Companies
// -----------------------------------------------------------------------------
const fileSize = (file) => {
  let total = 0;
  for (const suffix of ['', '-wal']) {
    try { total += fs.statSync(`${file}${suffix}`).size; } catch { /* missing */ }
  }
  return total;
};

// Numbers from inside one company's database.
const usageOf = (code) => {
  try {
    const tdb = getTenantDb(code);
    const one = (sql, ...args) => tdb.prepare(sql).get(...args);
    return {
      activeUsers: one('SELECT COUNT(*) AS n FROM users WHERE enabled = 1').n,
      ordersTotal: one('SELECT COUNT(*) AS n FROM requests').n,
      ordersThisMonth: one("SELECT COUNT(*) AS n FROM requests WHERE created_at >= datetime('now', 'start of month')").n,
      openOrders: one("SELECT COUNT(*) AS n FROM requests WHERE COALESCE(status, '') NOT IN ('Completed', 'Cancelled', 'Rejected', 'Received', 'Delivered', 'Closed')").n,
      whatsappThisMonth: one("SELECT COUNT(*) AS n FROM whatsapp_messages WHERE direction = 'outbound' AND created_at >= datetime('now', 'start of month')").n,
      suppliers: one('SELECT COUNT(*) AS n FROM suppliers').n,
      lastActivity: one('SELECT MAX(updated_at) AS t FROM requests').t || null,
      lastMorningRun: one("SELECT run_date, status, finished_at FROM job_runs WHERE job_name = 'morning_jobs' ORDER BY run_date DESC LIMIT 1") || null,
      databaseBytes: fileSize(tenantDbPath(code))
    };
  } catch (err) {
    return { error: err.message };
  }
};

const tenantSummary = (t) => ({ ...t, isDefault: isDefaultTenant(t.code), access: tenantAccess(t), usage: usageOf(t.code) });

router.get('/overview', requirePermission('tenants.read'), (req, res) => {
  const tenants = listTenants().map(tenantSummary);
  const byState = {};
  for (const t of tenants) byState[t.access.state] = (byState[t.access.state] || 0) + 1;
  const soon = addDays(todayIst(), 14);
  const canSeeMoney = ['owner', 'admin'].includes(req.platformUser.role);
  res.json({
    totals: {
      companies: tenants.length,
      byState,
      activeUsers: tenants.reduce((a, t) => a + (t.usage.activeUsers || 0), 0),
      ordersThisMonth: tenants.reduce((a, t) => a + (t.usage.ordersThisMonth || 0), 0),
      whatsappThisMonth: tenants.reduce((a, t) => a + (t.usage.whatsappThisMonth || 0), 0)
    },
    renewalsSoon: tenants
      .filter(t => !t.isInternal && t.access.endsOn && t.access.endsOn <= soon && ['active', 'trial', 'due'].includes(t.access.state))
      .map(t => ({ code: t.code, name: t.name, state: t.access.state, endsOn: t.access.endsOn })),
    recentPayments: canSeeMoney
      ? platformDb.prepare('SELECT p.*, t.name FROM payments p JOIN tenants t ON t.code = p.tenant_code ORDER BY p.created_at DESC LIMIT 10').all()
        .map(p => ({ id: p.id, code: p.tenant_code, name: p.name, amount: p.amount, method: p.method, paidOn: p.paid_on, periodTo: p.period_to }))
      : [],
    tenants
  });
});

router.get('/tenants', requirePermission('tenants.read'), (req, res) => {
  res.json(listTenants().map(tenantSummary));
});

router.post('/tenants', requirePermission('tenants.write'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const pwError = validatePassword(String(body.admin?.password || ''));
  if (pwError) return res.status(400).json({ error: `Admin password: ${pwError}` });
  try {
    const tenant = await createTenant({
      code: body.code,
      name: body.name,
      contact: body.contact,
      planId: body.planId,
      trialDays: body.trialDays ?? 14,
      noBilling: !!body.noBilling,
      graceDays: body.graceDays ?? 7,
      notes: body.notes,
      admin: body.admin || {}
    }, actorOf(req));
    if (body.profile) {
      const { profile, error } = cleanCompanyProfile(body.profile);
      if (!error) runWithTenant(tenant.code, () => saveCompanyProfile(profile));
    }
    res.status(201).json(tenantSummary(tenant));
  } catch (err) {
    fail(res, err);
  }
}));

const loadTenant = (req, res, next) => {
  const t = getTenant(req.params.code);
  if (!t) return res.status(404).json({ error: 'Company not found.' });
  req.target = t;
  next();
};

const tenantUserView = (row) => {
  let p = {};
  try { p = JSON.parse(row.profile || '{}'); } catch { p = {}; }
  return {
    id: row.id, username: row.username, role: row.role, enabled: !!row.enabled,
    mustChangePassword: !!row.must_change_password, name: p.name || '', department: p.department || '',
    phone: p.phone || '', email: p.email || '', createdAt: row.created_at
  };
};

router.get('/tenants/:code', requirePermission('tenants.read'), loadTenant, (req, res) => {
  const t = req.target;
  const canSeeMoney = ['owner', 'admin'].includes(req.platformUser.role);
  const detail = runWithTenant(t.code, () => {
    const tdb = getTenantDb(t.code);
    return {
      users: tdb.prepare('SELECT * FROM users ORDER BY created_at ASC').all().map(tenantUserView),
      profile: getCompanyProfile(),
      branding: (() => { try { return JSON.parse(tdb.prepare("SELECT value FROM settings WHERE key = 'branding'").get()?.value || '{}'); } catch { return {}; } })(),
      jobRuns: tdb.prepare("SELECT run_date, status, started_at, finished_at FROM job_runs WHERE job_name = 'morning_jobs' ORDER BY run_date DESC LIMIT 7").all()
    };
  });
  res.json({
    ...tenantSummary(t),
    ...detail,
    payments: canSeeMoney ? listPayments(t.code) : [],
    audit: listAudit({ tenantCode: t.code, limit: 50 })
  });
});

// Edit company details, plan and dates.
router.put('/tenants/:code', requirePermission('tenants.write'), loadTenant, (req, res) => {
  const t = req.target;
  const b = req.body || {};
  const sets = [];
  const args = [];
  const changes = {};
  const put = (col, value, label) => { sets.push(`${col} = ?`); args.push(value); changes[label] = value; };

  if (b.name !== undefined) {
    const name = String(b.name).trim();
    if (!name) return res.status(400).json({ error: 'Company name is required.' });
    put('name', name.slice(0, 120), 'name');
  }
  if (b.contact !== undefined) put('contact', JSON.stringify(cleanContact(b.contact || {})), 'contact');
  if (b.notes !== undefined) put('notes', String(b.notes || '').slice(0, 2000), 'notes');
  if (b.planId !== undefined) {
    if (!getPlan(b.planId)) return res.status(400).json({ error: 'Unknown plan.' });
    put('plan_id', b.planId, 'planId');
  }
  if (b.graceDays !== undefined) {
    const g = Number(b.graceDays);
    if (!Number.isInteger(g) || g < 0 || g > 60) return res.status(400).json({ error: 'Grace days must be 0-60.' });
    put('grace_days', g, 'graceDays');
  }
  for (const [field, col] of [['trialEndsAt', 'trial_ends_at'], ['paidUntil', 'paid_until']]) {
    if (b[field] !== undefined) {
      if (b[field] !== null && b[field] !== '' && !isDateOnly(b[field])) return res.status(400).json({ error: `${field} must be YYYY-MM-DD.` });
      put(col, b[field] || null, field);
    }
  }
  if (b.noBilling !== undefined) {
    if (isDefaultTenant(t.code) && !b.noBilling) return res.status(400).json({ error: 'The original company always stays internal (no billing).' });
    put('is_internal', b.noBilling ? 1 : 0, 'noBilling');
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to change.' });
  platformDb.prepare(`UPDATE tenants SET ${sets.join(', ')}, updated_at = datetime('now') WHERE code = ?`).run(...args, t.code);
  if (b.name !== undefined) {
    // Keep the app's company name in step.
    runWithTenant(t.code, () => {
      const tdb = getTenantDb(t.code);
      const row = tdb.prepare("SELECT value FROM settings WHERE key = 'branding'").get();
      let branding = {};
      try { branding = JSON.parse(row?.value || '{}'); } catch { branding = {}; }
      if (!isDefaultTenant(t.code)) {
        branding.companyName = changes.name;
        tdb.prepare("INSERT INTO settings (key, value) VALUES ('branding', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(branding));
      }
    });
  }
  audit(actorOf(req), 'tenant.update', t.code, changes);
  res.json(tenantSummary(getTenant(t.code)));
});

// Pause / resume / cancel access. Data is never deleted.
router.post('/tenants/:code/status', requirePermission('tenants.write'), loadTenant, (req, res) => {
  const status = String(req.body?.status || '');
  const reason = String(req.body?.reason || '').slice(0, 300);
  if (!TENANT_STATUSES.includes(status)) return res.status(400).json({ error: `Status must be one of ${TENANT_STATUSES.join(', ')}.` });
  if (isDefaultTenant(req.target.code) && status !== 'active') {
    return res.status(400).json({ error: 'The original company cannot be paused or cancelled from the Console.' });
  }
  platformDb.prepare("UPDATE tenants SET status = ?, status_reason = ?, updated_at = datetime('now') WHERE code = ?").run(status, reason, req.target.code);
  audit(actorOf(req), `tenant.status.${status}`, req.target.code, { reason });
  res.json(tenantSummary(getTenant(req.target.code)));
});

router.get('/tenants/:code/payments', requirePermission('payments.read'), loadTenant, (req, res) => {
  res.json(listPayments(req.target.code));
});

router.post('/tenants/:code/payments', requirePermission('payments.write'), loadTenant, (req, res) => {
  try {
    const result = recordPayment(req.target.code, req.body || {}, actorOf(req));
    res.status(201).json({ ...result, tenant: tenantSummary(getTenant(req.target.code)) });
  } catch (err) {
    fail(res, err);
  }
});

router.put('/tenants/:code/profile', requirePermission('tenants.write'), loadTenant, (req, res) => {
  const { profile, error } = cleanCompanyProfile(req.body || {});
  if (error) return res.status(400).json({ error });
  const saved = runWithTenant(req.target.code, () => saveCompanyProfile(profile));
  audit(actorOf(req), 'tenant.profile', req.target.code, { fields: Object.keys(profile) });
  res.json(saved);
});

// Basic support: reset a company user's password or switch the user on/off.
router.post('/tenants/:code/users/:id/reset-password', requirePermission('users.support'), loadTenant, asyncHandler(async (req, res) => {
  const tdb = getTenantDb(req.target.code);
  const row = tdb.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const temp = `Mm${Array.from(crypto.randomBytes(10), b => charset[b % charset.length]).join('')}9!`;
  // A reset does not switch a disabled user back on (that is a separate step, which checks the plan's user limit).
  tdb.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(await bcrypt.hash(temp, 10), row.id);
  audit(actorOf(req), 'tenant.user.reset_password', req.target.code, { userId: row.id, username: row.username });
  res.json({ tempPassword: temp });
}));

router.post('/tenants/:code/users/:id/enabled', requirePermission('users.support'), loadTenant, (req, res) => {
  const tdb = getTenantDb(req.target.code);
  const row = tdb.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  const enabled = !!req.body?.enabled;
  if (!enabled && row.role === 'Main Admin') {
    const others = tdb.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'Main Admin' AND enabled = 1 AND id != ?").get(row.id).n;
    if (others === 0) return res.status(400).json({ error: 'This is the only Main Admin - it cannot be switched off.' });
  }
  if (enabled && !row.enabled) {
    const limitError = userLimitError(req.target.code, tdb);
    if (limitError) return res.status(403).json({ error: limitError, code: 'PLAN_LIMIT' });
  }
  tdb.prepare('UPDATE users SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, row.id);
  audit(actorOf(req), enabled ? 'tenant.user.enable' : 'tenant.user.disable', req.target.code, { userId: row.id, username: row.username });
  res.json(tenantUserView({ ...row, enabled: enabled ? 1 : 0 }));
});

// Open the company's app as "Mill Mate Support" - only while its Main Admin
// has switched on support access (Settings > Company). 30-minute session.
router.post('/tenants/:code/support-session', requirePermission('support.login'), loadTenant, (req, res) => {
  const until = req.target.supportAccessUntil ? Date.parse(req.target.supportAccessUntil) : 0;
  if (!until || until < Date.now()) {
    return res.status(403).json({ error: 'This company has not allowed support access. Ask their Main Admin to switch it on in Settings > Company.' });
  }
  if (!tenantAccess(req.target).canLogin) return res.status(400).json({ error: 'This company is paused or cancelled.' });
  const token = signSupportToken(req.target.code, req.platformUser);
  const appUrl = (process.env.APP_PUBLIC_URL || 'https://alagiri-mill.vercel.app').replace(/\/$/, '');
  audit(actorOf(req), 'support.session', req.target.code, { minutes: 30 });
  res.json({ token, url: `${appUrl}/#support-login?token=${encodeURIComponent(token)}` });
});

// Full copy of the company's database (owner only) - for handing data over.
router.get('/tenants/:code/backup', requirePermission('backup.download'), loadTenant, (req, res) => {
  const tmp = path.join(os.tmpdir(), `millmate-${req.target.code.toLowerCase()}-${Date.now()}.db`);
  try {
    getTenantDb(req.target.code).exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
  audit(actorOf(req), 'tenant.backup_download', req.target.code);
  res.download(tmp, `millmate-${req.target.code.toLowerCase()}-${todayIst()}.db`, () => fs.rmSync(tmp, { force: true }));
});

// -----------------------------------------------------------------------------
// Plans
// -----------------------------------------------------------------------------
const cleanPlanBody = (b) => {
  const out = {};
  if (b.name !== undefined) {
    out.name = String(b.name || '').trim().slice(0, 60);
    if (!out.name) throw new PlatformError('Plan name is required.');
  }
  for (const [field, col] of [['priceMonthly', 'price_monthly'], ['priceYearly', 'price_yearly']]) {
    if (b[field] !== undefined) {
      const n = b[field] === null || b[field] === '' ? null : Number(b[field]);
      if (n !== null && (!Number.isFinite(n) || n < 0)) throw new PlatformError('Prices must be numbers.');
      out[col] = n;
    }
  }
  if (b.limits !== undefined) {
    const limits = {};
    for (const k of LIMIT_KEYS) {
      const n = Number(b.limits?.[k]);
      if (b.limits?.[k] != null && b.limits[k] !== '' && (!Number.isInteger(n) || n < 0)) throw new PlatformError(`${k} must be a whole number (0 = unlimited).`);
      if (n > 0) limits[k] = n;
    }
    out.limits = JSON.stringify(limits);
  }
  if (b.features !== undefined) {
    const features = {};
    for (const k of FEATURE_KEYS) features[k] = b.features?.[k] !== false;
    out.features = JSON.stringify(features);
  }
  if (b.active !== undefined) out.active = b.active ? 1 : 0;
  return out;
};

router.get('/plans', requirePermission('tenants.read'), (req, res) => {
  const counts = Object.fromEntries(platformDb.prepare('SELECT plan_id, COUNT(*) AS n FROM tenants GROUP BY plan_id').all().map(r => [r.plan_id, r.n]));
  res.json(listPlans().map(p => ({ ...p, companies: counts[p.id] || 0 })));
});

router.post('/plans', requirePermission('plans.write'), (req, res) => {
  try {
    const fields = cleanPlanBody({ limits: {}, features: {}, ...req.body });
    if (!fields.name) throw new PlatformError('Plan name is required.');
    const id = newId('plan');
    platformDb.prepare('INSERT INTO plans (id, name, price_monthly, price_yearly, limits, features, active) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, fields.name, fields.price_monthly ?? null, fields.price_yearly ?? null, fields.limits, fields.features, fields.active ?? 1);
    audit(actorOf(req), 'plan.create', null, { id, name: fields.name });
    res.status(201).json(getPlan(id));
  } catch (err) {
    fail(res, err);
  }
});

router.put('/plans/:id', requirePermission('plans.write'), (req, res) => {
  if (!getPlan(req.params.id)) return res.status(404).json({ error: 'Plan not found.' });
  try {
    const fields = cleanPlanBody(req.body || {});
    if (req.params.id === 'internal' && (fields.limits !== undefined || fields.features !== undefined || fields.active === 0)) {
      // Alagiri Duplex runs on this plan: limits or switched-off features would stop its WhatsApp or users.
      throw new PlatformError('The Internal plan always has every feature and no limits. Only its name can be changed.');
    }
    const cols = Object.keys(fields);
    if (!cols.length) throw new PlatformError('Nothing to change.');
    platformDb.prepare(`UPDATE plans SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`).run(...cols.map(c => fields[c]), req.params.id);
    audit(actorOf(req), 'plan.update', null, { id: req.params.id, fields: cols });
    res.json(serializePlan(platformDb.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)));
  } catch (err) {
    fail(res, err);
  }
});

// -----------------------------------------------------------------------------
// Announcements (banner shown in the app)
// -----------------------------------------------------------------------------
const announcementView = (a) => ({
  id: a.id, message: a.message, level: a.level, tenantCode: a.tenant_code, startsAt: a.starts_at,
  endsAt: a.ends_at, active: !!a.active, createdBy: a.created_by, createdAt: a.created_at
});

router.get('/announcements', requirePermission('tenants.read'), (req, res) => {
  res.json(platformDb.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100').all().map(announcementView));
});

const cleanAnnouncement = (b) => {
  const message = String(b.message || '').trim().slice(0, 300);
  if (!message) throw new PlatformError('Message is required.');
  const level = ['info', 'warning'].includes(b.level) ? b.level : 'info';
  const tenantCode = b.tenantCode ? normalizeTenantCode(b.tenantCode) : null;
  if (tenantCode && !getTenantRow(tenantCode)) throw new PlatformError('Unknown company code.');
  const toIso = (v, label) => {
    if (!v) return null;
    const t = Date.parse(v);
    if (Number.isNaN(t)) throw new PlatformError(`${label} is not a valid date/time.`);
    return new Date(t).toISOString();
  };
  const startsAt = toIso(b.startsAt, 'Start');
  const endsAt = toIso(b.endsAt, 'End');
  if (startsAt && endsAt && endsAt <= startsAt) throw new PlatformError('End must be after the start.');
  return { message, level, tenantCode, startsAt, endsAt };
};

router.post('/announcements', requirePermission('announcements.write'), (req, res) => {
  try {
    const a = cleanAnnouncement(req.body || {});
    const id = newId('ann');
    platformDb.prepare('INSERT INTO announcements (id, message, level, tenant_code, starts_at, ends_at, active, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
      .run(id, a.message, a.level, a.tenantCode, a.startsAt, a.endsAt, req.platformUser.username);
    audit(actorOf(req), 'announcement.create', a.tenantCode, { id, message: a.message });
    res.status(201).json(announcementView(platformDb.prepare('SELECT * FROM announcements WHERE id = ?').get(id)));
  } catch (err) {
    fail(res, err);
  }
});

router.post('/announcements/:id/active', requirePermission('announcements.write'), (req, res) => {
  const row = platformDb.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Announcement not found.' });
  const active = req.body?.active ? 1 : 0;
  platformDb.prepare('UPDATE announcements SET active = ? WHERE id = ?').run(active, row.id);
  audit(actorOf(req), active ? 'announcement.show' : 'announcement.hide', row.tenant_code, { id: row.id });
  res.json(announcementView({ ...row, active }));
});

// -----------------------------------------------------------------------------
// Audit trail
// -----------------------------------------------------------------------------
router.get('/audit', requirePermission('audit.read'), (req, res) => {
  res.json(listAudit({ tenantCode: req.query.tenant || null, limit: req.query.limit }));
});

// -----------------------------------------------------------------------------
// Console users (owner only)
// -----------------------------------------------------------------------------
router.get('/console-users', requirePermission('console.users'), (req, res) => {
  res.json(platformDb.prepare('SELECT * FROM platform_users ORDER BY created_at ASC').all().map(consoleUserView));
});

router.post('/console-users', requirePermission('console.users'), asyncHandler(async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const role = String(req.body?.role || '');
  const password = String(req.body?.password || '');
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) return res.status(400).json({ error: 'Username: 3-40 letters, digits, dot, dash or underscore.' });
  if (!PLATFORM_ROLES.includes(role)) return res.status(400).json({ error: `Role must be one of ${PLATFORM_ROLES.join(', ')}.` });
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });
  if (platformDb.prepare('SELECT 1 FROM platform_users WHERE username = ? COLLATE NOCASE').get(username)) {
    return res.status(409).json({ error: 'That username is already used.' });
  }
  const id = newId('pu');
  platformDb.prepare('INSERT INTO platform_users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)')
    .run(id, username, await bcrypt.hash(password, 10), role, String(req.body?.name || '').trim().slice(0, 80));
  audit(actorOf(req), 'console_user.create', null, { username, role });
  res.status(201).json(consoleUserView(platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(id)));
}));

router.put('/console-users/:id', requirePermission('console.users'), asyncHandler(async (req, res) => {
  const row = platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Console user not found.' });
  const b = req.body || {};
  const owners = platformDb.prepare("SELECT COUNT(*) AS n FROM platform_users WHERE role = 'owner' AND enabled = 1 AND id != ?").get(row.id).n;
  const losingOwner = row.role === 'owner' && ((b.role && b.role !== 'owner') || b.enabled === false);
  if (losingOwner && owners === 0) return res.status(400).json({ error: 'There must always be at least one active owner.' });
  if (b.role !== undefined && !PLATFORM_ROLES.includes(b.role)) return res.status(400).json({ error: 'Unknown role.' });
  // Check everything before writing anything, so a refused request changes nothing.
  if (b.newPassword) {
    const pwError = validatePassword(String(b.newPassword));
    if (pwError) return res.status(400).json({ error: pwError });
  }
  const changes = {};
  if (b.role !== undefined) { platformDb.prepare('UPDATE platform_users SET role = ? WHERE id = ?').run(b.role, row.id); changes.role = b.role; }
  if (b.enabled !== undefined) { platformDb.prepare('UPDATE platform_users SET enabled = ? WHERE id = ?').run(b.enabled ? 1 : 0, row.id); changes.enabled = !!b.enabled; }
  if (b.name !== undefined) { platformDb.prepare('UPDATE platform_users SET name = ? WHERE id = ?').run(String(b.name).trim().slice(0, 80), row.id); changes.name = b.name; }
  if (b.resetTwoFactor) { platformDb.prepare('UPDATE platform_users SET totp_enabled = 0, totp_secret = NULL, totp_last_step = NULL WHERE id = ?').run(row.id); changes.resetTwoFactor = true; }
  if (b.newPassword) {
    platformDb.prepare('UPDATE platform_users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(String(b.newPassword), 10), row.id);
    changes.passwordReset = true;
  }
  audit(actorOf(req), 'console_user.update', null, { username: row.username, ...changes });
  res.json(consoleUserView(platformDb.prepare('SELECT * FROM platform_users WHERE id = ?').get(row.id)));
}));

export default router;
