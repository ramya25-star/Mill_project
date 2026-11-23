// A company's own details, kept in its database (settings key "companyProfile"):
// the addresses printed on POs (Bill To / Ship To), the PO signatory and extra
// daily-summary numbers.
//
// The default company has no stored profile until someone saves one, and then
// falls back to the built-in Alagiri addresses (shared/companyAddresses.js),
// so nothing changes for it.
import { db } from './db.js';

const KEY = 'companyProfile';

const text = (value, max = 200) => String(value ?? '').trim().slice(0, max);

export const getCompanyProfile = () => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(KEY);
  let stored = {};
  try { stored = row ? JSON.parse(row.value) || {} : {}; } catch { stored = {}; }
  return {
    addresses: Array.isArray(stored.addresses) && stored.addresses.length ? stored.addresses : null,
    poSignatory: stored.poSignatory || '',
    gstin: stored.gstin || '',
    phone: stored.phone || '',
    email: stored.email || '',
    summaryRecipients: Array.isArray(stored.summaryRecipients) ? stored.summaryRecipients : []
  };
};

// Validates and cleans a profile sent by the app or the Console.
// Returns { profile } or { error }.
export const cleanCompanyProfile = (input = {}) => {
  const out = {};
  if (input.addresses !== undefined) {
    if (input.addresses !== null && !Array.isArray(input.addresses)) return { error: 'Addresses must be a list.' };
    const list = [];
    const seen = new Set();
    for (const a of input.addresses || []) {
      const name = text(a?.name, 80);
      if (!name) return { error: 'Every address needs a name (e.g. "Factory").' };
      if (seen.has(name.toLowerCase())) return { error: `Address name "${name}" is used twice.` };
      seen.add(name.toLowerCase());
      const lines = (Array.isArray(a.lines) ? a.lines : String(a.lines || '').split(/\r?\n/))
        .map(l => text(l, 120)).filter(Boolean).slice(0, 8);
      if (!lines.length) return { error: `Address "${name}" has no address lines.` };
      list.push({ name, group: text(a.group, 80) || name, lines });
    }
    if (list.length > 20) return { error: 'At most 20 addresses.' };
    out.addresses = list;
  }
  if (input.poSignatory !== undefined) out.poSignatory = text(input.poSignatory, 80);
  if (input.gstin !== undefined) {
    const g = text(input.gstin, 15).toUpperCase();
    if (g && !/^[0-9]{2}[A-Z0-9]{13}$/.test(g)) return { error: 'GSTIN should be 15 characters (e.g. 33ABCDE1234F1Z5).' };
    out.gstin = g;
  }
  if (input.phone !== undefined) out.phone = text(input.phone, 20);
  if (input.email !== undefined) out.email = text(input.email, 120);
  if (input.summaryRecipients !== undefined) {
    const list = (Array.isArray(input.summaryRecipients) ? input.summaryRecipients : String(input.summaryRecipients || '').split(','))
      .map(p => String(p).replace(/\D/g, ''))
      .filter(Boolean)
      .map(d => (d.length === 10 ? `91${d}` : d));
    if (list.some(d => !/^91[6-9]\d{9}$/.test(d))) return { error: 'Summary numbers must be Indian mobile numbers.' };
    out.summaryRecipients = [...new Set(list)].slice(0, 10);
  }
  return { profile: out };
};

export const saveCompanyProfile = (changes) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(KEY);
  let stored = {};
  try { stored = row ? JSON.parse(row.value) || {} : {}; } catch { stored = {}; }
  const merged = { ...stored, ...changes };
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(KEY, JSON.stringify(merged));
  return getCompanyProfile();
};
