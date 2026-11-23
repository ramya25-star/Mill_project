// Which company (tenant) the current piece of work belongs to.
//
// Mill Mate is multi-company: every company has its own SQLite database file.
// Instead of passing the company through every function, each HTTP request,
// webhook message and scheduled job runs inside runWithTenant(code, fn), and
// db.js picks that company's database through AsyncLocalStorage (the context
// follows the request through every await).
//
// No context = the default company (Alagiri Duplex, the original single-company
// install). That keeps scripts, old tokens and old app versions working exactly
// as before.
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();

export const DEFAULT_TENANT_CODE = normalizeTenantCode(process.env.DEFAULT_TENANT_CODE || 'ALAGIRI');

// Company codes: 3-20 letters/digits, stored upper-case ("alagiri" == "ALAGIRI").
export function normalizeTenantCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

export const TENANT_CODE_REGEX = /^[A-Z][A-Z0-9]{2,19}$/;
export const isValidTenantCode = (code) => TENANT_CODE_REGEX.test(normalizeTenantCode(code));

export const runWithTenant = (code, fn) => storage.run({ tenantCode: normalizeTenantCode(code) }, fn);

// The company for the work in progress, or null outside any context.
export const currentTenantCodeOrNull = () => storage.getStore()?.tenantCode || null;

// The company for the work in progress (default company outside any context).
export const currentTenantCode = () => currentTenantCodeOrNull() || DEFAULT_TENANT_CODE;

export const isDefaultTenant = (code = currentTenantCode()) => normalizeTenantCode(code) === DEFAULT_TENANT_CODE;
