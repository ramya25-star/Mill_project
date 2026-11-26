// Mill Mate platform (the Console's own database, platform.db).
//
// Holds everything that is about companies rather than inside one company:
// the company list, plans, subscriptions/payments, Console users, the audit
// trail, platform announcements and the WhatsApp routing index (one shared
// WhatsApp number serves every company, so replies must be matched back to the
// right company).
//
// The default company (Alagiri Duplex) is registered automatically on first
// start as an internal company: it never expires and can't be suspended from
// the Console by mistake.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { DATA_ROOT, getTenantDb, tenantDbExists, tenantDbPath, closeTenantDb } from './db.js';
import { DEFAULT_TENANT_CODE, normalizeTenantCode, isValidTenantCode, currentTenantCode } from './tenantContext.js';

const platformDbPath = process.env.PLATFORM_DB_PATH || path.join(DATA_ROOT, 'platform.db');
fs.mkdirSync(path.dirname(platformDbPath), { recursive: true });
export const platformDb = new DatabaseSync(platformDbPath);
platformDb.exec('PRAGMA journal_mode = WAL');
platformDb.exec('PRAGMA foreign_keys = ON');
export const PLATFORM_DB_PATH = platformDbPath;

platformDb.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly REAL,
    price_yearly REAL,
    currency TEXT NOT NULL DEFAULT 'INR',
    limits TEXT NOT NULL DEFAULT '{}',
    features TEXT NOT NULL DEFAULT '{}',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tenants (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_internal INTEGER NOT NULL DEFAULT 0,
    plan_id TEXT REFERENCES plans(id),
    trial_ends_at TEXT,
    paid_until TEXT,
    grace_days INTEGER NOT NULL DEFAULT 7,
    contact TEXT NOT NULL DEFAULT '{}',
    notes TEXT,
    status_reason TEXT,
    support_access_until TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_code TEXT NOT NULL REFERENCES tenants(code),
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    method TEXT,
    reference TEXT,
    paid_on TEXT NOT NULL,
    period_from TEXT,
    period_to TEXT,
    notes TEXT,
    recorded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platform_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platform_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL DEFAULT (datetime('now')),
    actor TEXT,
    action TEXT NOT NULL,
    tenant_code TEXT,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    tenant_code TEXT,
    starts_at TEXT,
    ends_at TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wa_message_index (
    wamid TEXT PRIMARY KEY,
    tenant_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wa_phone_index (
    phone TEXT NOT NULL,
    tenant_code TEXT NOT NULL,
    last_outbound_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (phone, tenant_code)
  );
`);

// Columns added after the first version of platform.db.
const ensurePlatformColumn = (table, column, definition) => {
  const exists = platformDb.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
  if (!exists) platformDb.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};
ensurePlatformColumn('platform_users', 'totp_last_step', 'INTEGER');

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const parseJson = (text, fallback) => {
  try { return text ? JSON.parse(text) : fallback; } catch { return fallback; }
};

export const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Today in India (subscriptions run on Indian calendar days).
export const todayIst = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export const isDateOnly = (value) => typeof value === 'string' && DATE_ONLY.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

export const addMonths = (dateStr, months) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(months || 0));
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
};

const daysBetween = (fromStr, toStr) =>
  Math.round((Date.parse(`${toStr}T00:00:00Z`) - Date.parse(`${fromStr}T00:00:00Z`)) / 86400000);

// -----------------------------------------------------------------------------
// Plans
// -----------------------------------------------------------------------------
export const serializePlan = (row) => row && ({
  id: row.id,
  name: row.name,
  priceMonthly: row.price_monthly,
  priceYearly: row.price_yearly,
  currency: row.currency,
  limits: parseJson(row.limits, {}),
  features: parseJson(row.features, {}),
  active: !!row.active,
  createdAt: row.created_at
});

export const getPlan = (id) => serializePlan(platformDb.prepare('SELECT * FROM plans WHERE id = ?').get(id));
export const listPlans = () => platformDb.prepare('SELECT * FROM plans ORDER BY created_at ASC').all().map(serializePlan);

// Feature switches a plan can turn off. Missing = on, so a plan saved before a
// feature existed keeps it.
export const FEATURE_KEYS = ['whatsapp', 'dailySummary', 'supplierReminders'];
// Limits a plan can set. Missing/0/null = unlimited.
export const LIMIT_KEYS = ['maxUsers', 'maxOrdersPerMonth'];

// -----------------------------------------------------------------------------
// Companies (tenants)
// -----------------------------------------------------------------------------
export const TENANT_STATUSES = ['active', 'suspended', 'cancelled'];

export const serializeTenant = (row) => row && ({
  code: row.code,
  name: row.name,
  status: row.status,
  isInternal: !!row.is_internal,
  planId: row.plan_id,
  trialEndsAt: row.trial_ends_at,
  paidUntil: row.paid_until,
  graceDays: row.grace_days,
  contact: parseJson(row.contact, {}),
  notes: row.notes || '',
  statusReason: row.status_reason || '',
  supportAccessUntil: row.support_access_until,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const getTenantRow = (code) => platformDb.prepare('SELECT * FROM tenants WHERE code = ?').get(normalizeTenantCode(code));
export const getTenant = (code) => serializeTenant(getTenantRow(code));
export const listTenants = () => platformDb.prepare('SELECT * FROM tenants ORDER BY created_at ASC').all().map(serializeTenant);

/**
 * What a company may do right now.
 *   state: internal | trial | active | due | expired | suspended | cancelled | unknown
 *   canLogin: false only for suspended/cancelled/unknown
 *   canWrite: false once the subscription (plus grace days) has run out
 *   automation: morning reminders / daily summary run only while canWrite
 */
export function tenantAccess(tenant, now = new Date()) {
  if (!tenant) return { state: 'unknown', canLogin: false, canWrite: false, automation: false, message: 'Unknown company code.' };
  const t = tenant.code ? tenant : serializeTenant(tenant);
  if (t.status === 'cancelled') {
    return { state: 'cancelled', canLogin: false, canWrite: false, automation: false, message: 'This company\'s Mill Mate subscription has been cancelled. Please contact Mill Mate support.' };
  }
  if (t.status === 'suspended') {
    return { state: 'suspended', canLogin: false, canWrite: false, automation: false, message: 'Mill Mate access for this company is paused. Please contact Mill Mate support.' };
  }
  if (t.isInternal) return { state: 'internal', canLogin: true, canWrite: true, automation: true, message: '' };

  const today = todayIst(now);
  if (t.paidUntil && today <= t.paidUntil) {
    const daysLeft = daysBetween(today, t.paidUntil);
    return {
      state: 'active', canLogin: true, canWrite: true, automation: true, daysLeft, endsOn: t.paidUntil,
      message: daysLeft <= 7 ? `Your Mill Mate subscription is active until ${t.paidUntil}. Your company administrator can contact Mill Mate about it.` : ''
    };
  }
  if (t.trialEndsAt && today <= t.trialEndsAt) {
    const daysLeft = daysBetween(today, t.trialEndsAt);
    return {
      state: 'trial', canLogin: true, canWrite: true, automation: true, daysLeft, endsOn: t.trialEndsAt,
      message: `Free trial: ${daysLeft === 0 ? 'last day today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`} (until ${t.trialEndsAt}).`
    };
  }
  const endedOn = [t.paidUntil, t.trialEndsAt].filter(Boolean).sort().pop();
  if (endedOn) {
    const lockOn = addDays(endedOn, Number(t.graceDays) || 0);
    if (today <= lockOn) {
      return {
        state: 'due', canLogin: true, canWrite: true, automation: true, endsOn: lockOn,
        message: `Your Mill Mate subscription ended on ${endedOn}. The app becomes view-only after ${lockOn}; your company administrator can contact Mill Mate.`
      };
    }
  }
  return {
    state: 'expired', canLogin: true, canWrite: false, automation: false,
    message: 'Your Mill Mate subscription has ended, so the app is view-only. Your company administrator can contact Mill Mate.'
  };
}

export const tenantLimits = (code = currentTenantCode()) => {
  const t = getTenant(code);
  const plan = t?.planId ? getPlan(t.planId) : null;
  const features = {};
  for (const key of FEATURE_KEYS) features[key] = plan?.features?.[key] !== false;
  const limits = {};
  for (const key of LIMIT_KEYS) {
    const n = Number(plan?.limits?.[key]);
    limits[key] = Number.isFinite(n) && n > 0 ? n : null;
  }
  return { plan, features, limits };
};

export const hasFeature = (feature, code = currentTenantCode()) => tenantLimits(code).features[feature] !== false;

// Error text when one more active user would go past the plan's user limit, else null.
export const userLimitError = (code = currentTenantCode(), tdb = getTenantDb(code)) => {
  const { limits } = tenantLimits(code);
  if (!limits.maxUsers) return null;
  const active = tdb.prepare('SELECT COUNT(*) AS n FROM users WHERE enabled = 1').get().n;
  return active >= limits.maxUsers
    ? `Your Mill Mate plan allows ${limits.maxUsers} active users. Disable a user or contact Mill Mate to upgrade.`
    : null;
};

// -----------------------------------------------------------------------------
// Bootstrap: plans + the default company
// -----------------------------------------------------------------------------
const seedPlan = platformDb.prepare(`
  INSERT OR IGNORE INTO plans (id, name, price_monthly, price_yearly, limits, features) VALUES (?, ?, ?, ?, ?, ?)
`);
seedPlan.run('internal', 'Internal (no billing)', null, null, '{}', '{}');
seedPlan.run('standard', 'Standard', null, null, '{}', '{}');

if (!getTenantRow(DEFAULT_TENANT_CODE)) {
  platformDb.prepare(`
    INSERT INTO tenants (code, name, status, is_internal, plan_id, contact, notes)
    VALUES (?, ?, 'active', 1, 'internal', ?, ?)
  `).run(
    DEFAULT_TENANT_CODE,
    process.env.DEFAULT_TENANT_NAME || 'Alagiri Duplex',
    JSON.stringify({}),
    'Original company - its data stays in the original database file.'
  );
}

// -----------------------------------------------------------------------------
// Audit trail (every Console action)
// -----------------------------------------------------------------------------
export const audit = (actor, action, tenantCode = null, details = null) => {
  try {
    platformDb.prepare('INSERT INTO platform_audit (actor, action, tenant_code, details) VALUES (?, ?, ?, ?)')
      .run(actor || null, action, tenantCode || null, details == null ? null : JSON.stringify(details));
  } catch (err) {
    console.error('[platform] audit write failed:', err?.message || err);
  }
};

export const listAudit = ({ tenantCode, limit = 200 } = {}) => {
  const n = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  const rows = tenantCode
    ? platformDb.prepare('SELECT * FROM platform_audit WHERE tenant_code = ? ORDER BY id DESC LIMIT ?').all(normalizeTenantCode(tenantCode), n)
    : platformDb.prepare('SELECT * FROM platform_audit ORDER BY id DESC LIMIT ?').all(n);
  return rows.map(r => ({ id: r.id, at: r.at, actor: r.actor, action: r.action, tenantCode: r.tenant_code, details: parseJson(r.details, null) }));
};

// -----------------------------------------------------------------------------
// Provisioning a new company
// -----------------------------------------------------------------------------
export class PlatformError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Creates a company: its own database, its first Main Admin and its Console row.
 * The admin must change the password on first login.
 */
export async function createTenant({ code, name, contact = {}, planId = 'standard', trialDays = 14, noBilling = false, graceDays = 7, notes = '', admin = {} }, actor) {
  const clean = normalizeTenantCode(code);
  if (!isValidTenantCode(clean)) throw new PlatformError('Company code must be 3-20 letters/digits and start with a letter (e.g. XYZMILLS).');
  if (!String(name || '').trim()) throw new PlatformError('Company name is required.');
  if (getTenantRow(clean) || tenantDbExists(clean)) throw new PlatformError(`Company code ${clean} is already used.`, 409);
  if (planId && !getPlan(planId)) throw new PlatformError('Unknown plan.');
  const username = String(admin.username || '').trim();
  const password = String(admin.password || '');
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) throw new PlatformError('Admin username: 3-40 letters, digits, dot, dash or underscore.');
  if (password.length < 8) throw new PlatformError('Admin password must be at least 8 characters.');
  const days = Math.max(0, Math.min(Number(trialDays) || 0, 365));
  const grace = Math.max(0, Math.min(Number(graceDays) || 0, 60));

  const passwordHash = await bcrypt.hash(password, 10);
  // Check again after the wait: two people may have pressed "Create" with the same code.
  if (getTenantRow(clean) || tenantDbExists(clean)) throw new PlatformError(`Company code ${clean} is already used.`, 409);
  let tenantDb;
  try {
    tenantDb = getTenantDb(clean, { create: true, companyName: String(name).trim() });
    tenantDb.prepare(`
      INSERT INTO users (id, username, password_hash, role, enabled, must_change_password, profile)
      VALUES (?, ?, ?, 'Main Admin', 1, 1, ?)
    `).run(
      'usr-admin',
      username,
      passwordHash,
      JSON.stringify({
        name: String(admin.name || 'Admin').trim(),
        department: 'Executive Office',
        email: String(admin.email || '').trim(),
        phone: String(admin.phone || '').trim(),
        avatarType: 'initials',
        avatarSeed: String(admin.name || 'Admin').trim()
      })
    );
    platformDb.prepare(`
      INSERT INTO tenants (code, name, status, is_internal, plan_id, trial_ends_at, grace_days, contact, notes)
      VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `).run(
      clean,
      String(name).trim(),
      noBilling ? 1 : 0,
      noBilling ? 'internal' : (planId || 'standard'),
      noBilling || days === 0 ? null : addDays(todayIst(), days),
      grace,
      JSON.stringify(cleanContact(contact)),
      String(notes || '')
    );
  } catch (err) {
    // Roll back a half-made company so the code can be used again.
    closeTenantDb(clean);
    if (!getTenantRow(clean)) {
      for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${tenantDbPath(clean)}${suffix}`, { force: true });
    }
    throw err;
  }
  audit(actor, 'tenant.create', clean, { name, planId, trialDays: days, noBilling: !!noBilling, adminUsername: username });
  return getTenant(clean);
}

const CONTACT_FIELDS = ['person', 'phone', 'email', 'gstin', 'address', 'city', 'state'];
export const cleanContact = (contact = {}) => {
  const out = {};
  for (const key of CONTACT_FIELDS) {
    if (contact[key] != null) out[key] = String(contact[key]).trim().slice(0, 300);
  }
  return out;
};

/** Records a payment and extends paid_until by `months` (or to an explicit date). */
export function recordPayment(code, { amount, method, reference, paidOn, months, periodTo, notes }, actor) {
  const t = getTenant(code);
  if (!t) throw new PlatformError('Company not found.', 404);
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 0) throw new PlatformError('Amount must be a number (0 or more).');
  const paidDate = paidOn ? String(paidOn) : todayIst();
  if (!isDateOnly(paidDate)) throw new PlatformError('Paid-on date must be YYYY-MM-DD.');

  // New period starts the day after the current paid period ends; paying
  // during a free trial starts it after the trial, so no trial days are lost;
  // otherwise (lapsed) it starts today.
  const today = todayIst();
  const runningUntil = [t.paidUntil, t.trialEndsAt].filter(d => d && d >= today).sort().pop();
  const from = runningUntil ? addDays(runningUntil, 1) : today;
  let to;
  if (periodTo) {
    if (!isDateOnly(periodTo)) throw new PlatformError('Valid-until date must be YYYY-MM-DD.');
    to = periodTo;
  } else {
    const m = Number(months);
    if (!Number.isInteger(m) || m < 1 || m > 36) throw new PlatformError('Months must be a whole number from 1 to 36.');
    to = addDays(addMonths(from, m), -1);
  }
  if (to < from) throw new PlatformError('Valid-until date must be after the current paid period.');

  const id = newId('pay');
  platformDb.prepare(`
    INSERT INTO payments (id, tenant_code, amount, method, reference, paid_on, period_from, period_to, notes, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, t.code, amt, String(method || '').slice(0, 40), String(reference || '').slice(0, 120), paidDate, from, to, String(notes || '').slice(0, 500), actor || null);
  platformDb.prepare("UPDATE tenants SET paid_until = ?, updated_at = datetime('now') WHERE code = ?").run(to, t.code);
  audit(actor, 'payment.record', t.code, { id, amount: amt, method, reference, periodFrom: from, periodTo: to });
  return { id, periodFrom: from, periodTo: to };
}

export const listPayments = (code) => platformDb.prepare('SELECT * FROM payments WHERE tenant_code = ? ORDER BY paid_on DESC, created_at DESC')
  .all(normalizeTenantCode(code))
  .map(p => ({
    id: p.id, amount: p.amount, currency: p.currency, method: p.method, reference: p.reference,
    paidOn: p.paid_on, periodFrom: p.period_from, periodTo: p.period_to, notes: p.notes,
    recordedBy: p.recorded_by, createdAt: p.created_at
  }));

// -----------------------------------------------------------------------------
// Announcements (banner in the app)
// -----------------------------------------------------------------------------
export const activeAnnouncements = (code = currentTenantCode(), now = new Date()) => {
  const iso = now.toISOString();
  return platformDb.prepare(`
    SELECT * FROM announcements
    WHERE active = 1
      AND (tenant_code IS NULL OR tenant_code = ?)
      AND (starts_at IS NULL OR starts_at <= ?)
      AND (ends_at IS NULL OR ends_at >= ?)
    ORDER BY created_at DESC
  `).all(normalizeTenantCode(code), iso, iso).map(a => ({ id: a.id, message: a.message, level: a.level }));
};

// -----------------------------------------------------------------------------
// WhatsApp routing (one shared number, many companies)
// -----------------------------------------------------------------------------
// Every message we send is remembered with its company, so a supplier's reply
// (which quotes our message id) or a delivery receipt goes to the right one.
export const indexOutboundMessage = ({ wamid, phone }, code = currentTenantCode()) => {
  try {
    if (wamid) {
      platformDb.prepare('INSERT OR IGNORE INTO wa_message_index (wamid, tenant_code) VALUES (?, ?)').run(String(wamid), normalizeTenantCode(code));
    }
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits) {
      platformDb.prepare(`
        INSERT INTO wa_phone_index (phone, tenant_code, last_outbound_at) VALUES (?, ?, datetime('now'))
        ON CONFLICT(phone, tenant_code) DO UPDATE SET last_outbound_at = datetime('now')
      `).run(digits, normalizeTenantCode(code));
    }
  } catch (err) {
    console.error('[platform] WhatsApp index write failed:', err?.message || err);
  }
};

export const tenantForWamid = (wamid) => {
  if (!wamid) return null;
  return platformDb.prepare('SELECT tenant_code FROM wa_message_index WHERE wamid = ?').get(String(wamid))?.tenant_code || null;
};

// Companies that messaged this phone, most recent first.
export const tenantsForPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return [];
  return platformDb.prepare('SELECT tenant_code FROM wa_phone_index WHERE phone = ? ORDER BY last_outbound_at DESC').all(digits).map(r => r.tenant_code);
};

// Companies whose data can be used right now (for jobs).
export const activeTenantCodes = () => listTenants()
  .filter(t => tenantAccess(t).canLogin)
  .map(t => t.code);
