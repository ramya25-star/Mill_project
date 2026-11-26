// Multi-company (SaaS) behaviour: separate data per company, company-code
// login, subscription states, Console sign-in with 2FA, PO links, WhatsApp
// routing, support access and plan limits.
//
// Runs the real server in-process against throw-away databases.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'millmate-tenancy-'));
Object.assign(process.env, {
  DB_PATH: path.join(dir, 'alagiri.db'),
  PLATFORM_DB_PATH: path.join(dir, 'platform.db'),
  JWT_SECRET: 'tenancy-test-secret',
  PORT: '4177',
  WHATSAPP_DRY_RUN: '1',
  NODE_ENV: 'test',
  META_PO_TEMPLATE_NAME: 'po_dispatch_request_v2',
  META_DISPATCH_DAY_TEMPLATE_NAME: 'dispatchday_booking',
  META_OVERDUE_TEMPLATE_NAME: 'dispatch_overdue_reschedule',
  META_PENDING_TEMPLATE_NAME: 'dispatchdate_pending',
  META_SUMMARY_TEMPLATE_NAME: 'daily_summary',
  META_AVAILABILITY_TEMPLATE_NAME: 'availability_check',
  META_TEMPLATE_LANGUAGE: 'en'
});
delete process.env.META_APP_SECRET;
delete process.env.PLATFORM_JWT_SECRET;
delete process.env.S3_BUCKET;

const base = `http://localhost:${process.env.PORT}/api`;
let server;
let platform;
let totp;
let tenantContext;
let whatsapp;
let whatsappRoutes;
let storage;
let morning;

const call = async (pathName, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${base}${pathName}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
};

let consoleToken;
let supportConsoleToken;

before(async () => {
  ({ server } = await import('../index.js'));
  await new Promise(resolve => (server.listening ? resolve() : server.once('listening', resolve)));
  platform = await import('../platform.js');
  totp = await import('../totp.js');
  tenantContext = await import('../tenantContext.js');
  whatsapp = await import('../whatsapp.js');
  whatsappRoutes = await import('../routes/whatsapp.js');
  storage = await import('../storage.js');
  morning = await import('../jobs/morning.js');

  // Console users made the way the server script does it.
  const bcrypt = (await import('bcryptjs')).default;
  platform.platformDb.prepare('INSERT INTO platform_users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('pu-owner', 'owner1', bcrypt.hashSync('OwnerPass#1', 10), 'owner');
  platform.platformDb.prepare('INSERT INTO platform_users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('pu-support', 'dev1', bcrypt.hashSync('DevPass#123', 10), 'support');
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  platform.platformDb.close();
  (await import('../db.js')).closeAllTenantDbs();
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* files still open on Windows */ }
});

const consoleLogin = async (username, password) => {
  const first = await call('/platform/auth/login', { method: 'POST', body: { username, password } });
  assert.equal(first.status, 200);
  assert.equal(first.json.setupRequired, true, 'first sign-in must set up the authenticator');
  const code = totp.totpCode(first.json.secret);
  const done = await call('/platform/auth/setup-2fa', { method: 'POST', body: { setupToken: first.json.setupToken, code } });
  assert.equal(done.status, 200, JSON.stringify(done.json));
  return done.json.token;
};

test('original company: login without a company code still works', async () => {
  const res = await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'Password123!' } });
  assert.equal(res.status, 200);
  assert.equal(res.json.company.code, 'ALAGIRI');
  const me = await call('/tenant', { token: res.json.token });
  assert.equal(me.status, 200);
  assert.equal(me.json.access.state, 'internal');
});

test('Console sign-in needs password + authenticator code; wrong code refused', async () => {
  consoleToken = await consoleLogin('owner1', 'OwnerPass#1');
  supportConsoleToken = await consoleLogin('dev1', 'DevPass#123');

  const needCode = await call('/platform/auth/login', { method: 'POST', body: { username: 'owner1', password: 'OwnerPass#1' } });
  assert.equal(needCode.json.codeRequired, true);
  const wrong = await call('/platform/auth/login', { method: 'POST', body: { username: 'owner1', password: 'OwnerPass#1', code: '000000' } });
  assert.equal(wrong.status, 401);

  // App tokens are not Console tokens and the other way round.
  const app = await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'Password123!' } });
  assert.equal((await call('/platform/tenants', { token: app.json.token })).status, 401);
  assert.equal((await call('/requests', { token: consoleToken })).status, 401);
});

let xyzToken;

test('Console creates a company; its admin signs in with the company code', async () => {
  const created = await call('/platform/tenants', {
    method: 'POST',
    token: consoleToken,
    body: {
      code: 'xyzmills', name: 'XYZ Paper Mills', trialDays: 14,
      admin: { username: 'admin', password: 'XyzAdmin#1', name: 'Kumar' },
      profile: { poSignatory: 'Kumar', addresses: [{ name: 'XYZ Factory', group: 'XYZ', lines: ['XYZ PAPER MILLS', 'SIVAKASI'] }] }
    }
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  assert.equal(created.json.code, 'XYZMILLS');
  assert.equal(created.json.access.state, 'trial');

  const dup = await call('/platform/tenants', { method: 'POST', token: consoleToken, body: { code: 'XYZMILLS', name: 'Again', admin: { username: 'a1b', password: 'Password#12' } } });
  assert.equal(dup.status, 409);

  const login = await call('/auth/login', { method: 'POST', body: { companyCode: 'xyzmills', username: 'admin', password: 'XyzAdmin#1' } });
  assert.equal(login.status, 200, JSON.stringify(login.json));
  assert.equal(login.json.user.mustChangePassword, true);
  xyzToken = login.json.token;

  // Same username, other company's password: refused.
  const wrongCompany = await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'XyzAdmin#1' } });
  assert.equal(wrongCompany.status, 401);

  const unknown = await call('/auth/login', { method: 'POST', body: { companyCode: 'NOSUCH', username: 'admin', password: 'x' } });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.json.code, 'TENANT_NOT_FOUND');

  const branding = await call('/settings/branding?company=XYZMILLS');
  assert.equal(branding.json.companyName, 'XYZ Paper Mills');
  const defaultBranding = await call('/settings/branding');
  assert.equal(defaultBranding.json.companyName, 'Alagiri Duplex Paper Mills');
});

test('companies never see each other\'s data', async () => {
  const alagiri = (await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'Password123!' } })).json.token;

  const made = await call('/requests', { method: 'POST', token: xyzToken, body: { id: 'REQ-1001', status: 'Requested', productName: 'XYZ Pulp' } });
  assert.equal(made.status, 201);
  // Same order id in the other company is a different order.
  const madeA = await call('/requests', { method: 'POST', token: alagiri, body: { id: 'REQ-1001', status: 'Requested', productName: 'Alagiri Board' } });
  assert.equal(madeA.status, 201);

  const xyzOrders = (await call('/requests', { token: xyzToken })).json;
  const aOrders = (await call('/requests', { token: alagiri })).json;
  assert.deepEqual(xyzOrders.map(o => o.productName), ['XYZ Pulp']);
  assert.ok(aOrders.every(o => o.productName !== 'XYZ Pulp'));

  const xyzUsers = (await call('/users', { token: xyzToken })).json;
  assert.deepEqual(xyzUsers.map(u => u.username), ['admin']);
  assert.equal((await call('/suppliers', { token: xyzToken })).json.length, 0, 'new companies get no demo suppliers');
});

test('signed PO link carries the company and cannot be pointed at another company', async () => {
  const url = tenantContext.runWithTenant('XYZMILLS', () => whatsapp.generateSignedPoUrl('REQ-1001'));
  assert.match(url, /&t=XYZMILLS$/);
  const pathPart = url.slice(url.indexOf('/api') + 4);
  const ok = await fetch(`${base}${pathPart}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('content-type'), 'application/pdf');

  const tampered = await fetch(`${base}${pathPart.replace('t=XYZMILLS', 't=ALAGIRI')}`);
  assert.equal(tampered.status, 401);

  // The original company's links keep the old format.
  const legacy = whatsapp.generateSignedPoUrl('REQ-1001');
  assert.doesNotMatch(legacy, /&t=/);
});

test('WhatsApp replies on the shared number go back to the right company', async () => {
  const wamid = 'wamid.TEST_XYZ_1';
  tenantContext.runWithTenant('XYZMILLS', () => whatsapp.logMessage({ direction: 'outbound', toNumber: '919876500001', wamid, type: 'template' }));
  assert.equal(whatsappRoutes.resolveInboundTenant({ from: '919999999999', context: { id: wamid } }), 'XYZMILLS');
  // Flow answer token "CODE:orderId"
  assert.equal(whatsappRoutes.resolveInboundTenant({
    from: '919999999999',
    interactive: { type: 'nfm_reply', nfm_reply: { flow_token: tenantContext.runWithTenant('XYZMILLS', () => whatsapp.flowTokenFor('REQ-1001')), response_json: '{}' } }
  }), 'XYZMILLS');
  assert.deepEqual(whatsapp.parseFlowToken('XYZMILLS:REQ-1001'), { tenantCode: 'XYZMILLS', token: 'REQ-1001' });
  assert.deepEqual(whatsapp.parseFlowToken('REQ-1001'), { tenantCode: null, token: 'REQ-1001' });
  // Plain message from a supplier only this company messaged
  assert.equal(whatsappRoutes.resolveInboundTenant({ from: '919876500001' }), 'XYZMILLS');
  // Unknown supplier: original company, as before
  assert.equal(whatsappRoutes.resolveInboundTenant({ from: '911111111111' }), 'ALAGIRI');
});

test('stored files are separated per company', () => {
  const ref = 's3:uploads/t/xyzmills/2026/11/0f8fad5b-d9cb-469f-a165-70867728950e.jpg';
  const legacyRef = 's3:uploads/2026/11/0f8fad5b-d9cb-469f-a165-70867728950e.jpg';
  assert.equal(storage.refBelongsToTenant(ref, 'XYZMILLS'), true);
  assert.equal(storage.refBelongsToTenant(ref, 'ALAGIRI'), false);
  assert.equal(storage.refBelongsToTenant(legacyRef, 'ALAGIRI'), true);
  assert.equal(storage.refBelongsToTenant(legacyRef, 'XYZMILLS'), false);
});

test('subscription ends -> view-only; payment -> full access again', async () => {
  platform.platformDb.prepare("UPDATE tenants SET trial_ends_at = '2020-01-01', grace_days = 0 WHERE code = 'XYZMILLS'").run();
  const view = await call('/requests', { token: xyzToken });
  assert.equal(view.status, 200, 'reading still works');
  const write = await call('/requests', { method: 'POST', token: xyzToken, body: { id: 'REQ-1002', status: 'Requested' } });
  assert.equal(write.status, 402);
  assert.equal(write.json.code, 'READ_ONLY');
  assert.equal((await call('/tenant', { token: xyzToken })).json.access.state, 'expired');

  // Support (developers) cannot record payments.
  const denied = await call('/platform/tenants/XYZMILLS/payments', { method: 'POST', token: supportConsoleToken, body: { amount: 1000, months: 1 } });
  assert.equal(denied.status, 403);

  const paid = await call('/platform/tenants/XYZMILLS/payments', { method: 'POST', token: consoleToken, body: { amount: 5000, method: 'UPI', reference: 'UTR123', months: 1 } });
  assert.equal(paid.status, 201, JSON.stringify(paid.json));
  assert.equal(paid.json.tenant.access.state, 'active');
  const again = await call('/requests', { method: 'POST', token: xyzToken, body: { id: 'REQ-1002', status: 'Requested' } });
  assert.equal(again.status, 201);
});

test('pause blocks the company at once; the original company cannot be paused', async () => {
  const paused = await call('/platform/tenants/XYZMILLS/status', { method: 'POST', token: consoleToken, body: { status: 'suspended', reason: 'test' } });
  assert.equal(paused.status, 200);
  const blocked = await call('/requests', { token: xyzToken });
  assert.equal(blocked.status, 401);
  assert.equal(blocked.json.code, 'TENANT_BLOCKED');
  const login = await call('/auth/login', { method: 'POST', body: { companyCode: 'XYZMILLS', username: 'admin', password: 'XyzAdmin#1' } });
  assert.equal(login.status, 403);

  const jobs = await morning.runMorningJobs({ force: true });
  assert.equal(jobs.tenants.XYZMILLS.skipped, true, 'no reminders for a paused company');
  assert.ok(jobs.tenants.ALAGIRI && !jobs.tenants.ALAGIRI.skipped);

  const resumed = await call('/platform/tenants/XYZMILLS/status', { method: 'POST', token: consoleToken, body: { status: 'active' } });
  assert.equal(resumed.status, 200);
  assert.equal((await call('/requests', { token: xyzToken })).status, 200);

  const original = await call('/platform/tenants/ALAGIRI/status', { method: 'POST', token: consoleToken, body: { status: 'suspended' } });
  assert.equal(original.status, 400);
});

test('support can open a company only after its Main Admin allows it', async () => {
  const refused = await call('/platform/tenants/XYZMILLS/support-session', { method: 'POST', token: supportConsoleToken });
  assert.equal(refused.status, 403);

  const allow = await call('/tenant/support-access', { method: 'PUT', token: xyzToken, body: { hours: 2 } });
  assert.equal(allow.status, 200);
  const session = await call('/platform/tenants/XYZMILLS/support-session', { method: 'POST', token: supportConsoleToken });
  assert.equal(session.status, 200);
  assert.match(session.json.url, /#support-login\?token=/);

  const asSupport = await call('/tenant', { token: session.json.token });
  assert.equal(asSupport.json.isSupportSession, true);
  assert.equal(asSupport.json.code, 'XYZMILLS');
  // Support cannot extend its own access.
  assert.equal((await call('/tenant/support-access', { method: 'PUT', token: session.json.token, body: { hours: 72 } })).status, 403);

  await call('/tenant/support-access', { method: 'PUT', token: xyzToken, body: { hours: 0 } });
  assert.equal((await call('/tenant', { token: session.json.token })).status, 401, 'revoking ends the support session');
});

test('plan limits: max users', async () => {
  const plan = await call('/platform/plans', { method: 'POST', token: consoleToken, body: { name: 'Small', limits: { maxUsers: 1 } } });
  assert.equal(plan.status, 201, JSON.stringify(plan.json));
  assert.equal((await call('/platform/tenants/XYZMILLS', { method: 'PUT', token: consoleToken, body: { planId: plan.json.id } })).status, 200);
  const add = await call('/users', {
    method: 'POST', token: xyzToken,
    body: { username: 'store1', name: 'Store Keeper', email: 'store@xyz.test', phone: '9876543210', role: 'Employee', department: 'Logistics', password: 'Store#1234' }
  });
  assert.equal(add.status, 403, JSON.stringify(add.json));
  assert.equal(add.json.code, 'PLAN_LIMIT');
  // Only the owner may change plans.
  assert.equal((await call('/platform/plans', { method: 'POST', token: supportConsoleToken, body: { name: 'X' } })).status, 403);
});

test('Console overview and audit trail', async () => {
  const overview = await call('/platform/overview', { token: consoleToken });
  assert.equal(overview.status, 200);
  assert.equal(overview.json.totals.companies, 2);
  const supportView = await call('/platform/overview', { token: supportConsoleToken });
  assert.deepEqual(supportView.json.recentPayments, [], 'support does not see payments');
  const auditLog = await call('/platform/audit?tenant=XYZMILLS', { token: consoleToken });
  const actions = auditLog.json.map(a => a.action);
  for (const a of ['tenant.create', 'payment.record', 'tenant.status.suspended', 'support.allow', 'support.session']) {
    assert.ok(actions.includes(a), `audit has ${a}`);
  }
});

// ---------------------------------------------------------------------------
// Bugs found in QA (2026-11-24) - kept as tests so they stay fixed.
// ---------------------------------------------------------------------------
test('switching a user back on (or resetting a disabled user) cannot pass the plan user limit', async () => {
  const plan = await call('/platform/plans', { method: 'POST', token: consoleToken, body: { name: 'Two users', limits: { maxUsers: 2 } } });
  assert.equal((await call('/platform/tenants/XYZMILLS', { method: 'PUT', token: consoleToken, body: { planId: plan.json.id } })).status, 200);
  const mk = (username, email) => call('/users', {
    method: 'POST', token: xyzToken,
    body: { username, name: 'Store Keeper', email, phone: '9876543210', role: 'Employee', department: 'Logistics', password: 'Store#1234' }
  });
  assert.equal((await mk('store1', 'store1@xyz.test')).status, 201);
  const store1 = (await call('/users', { token: xyzToken })).json.find(u => u.username === 'store1');
  assert.equal((await call(`/users/${store1.id}`, { method: 'PUT', token: xyzToken, body: { disabled: true } })).status, 200);
  assert.equal((await mk('store2', 'store2@xyz.test')).status, 201, 'a free slot after switching one off');

  const reEnable = await call(`/users/${store1.id}`, { method: 'PUT', token: xyzToken, body: { disabled: false } });
  assert.equal(reEnable.status, 403);
  assert.equal(reEnable.json.code, 'PLAN_LIMIT');
  assert.equal((await call(`/users/${store1.id}/reset-password`, { method: 'POST', token: xyzToken, body: {} })).status, 403);
  assert.equal((await call(`/platform/tenants/XYZMILLS/users/${store1.id}/enabled`, { method: 'POST', token: consoleToken, body: { enabled: true } })).status, 403);
  const consoleReset = await call(`/platform/tenants/XYZMILLS/users/${store1.id}/reset-password`, { method: 'POST', token: consoleToken });
  assert.equal(consoleReset.status, 200);
  const active = (await call('/users', { token: xyzToken })).json.filter(u => u.enabled !== false && !u.disabled).length;
  assert.equal(active, 2, 'Console password reset does not switch the user back on');
  await call('/platform/tenants/XYZMILLS', { method: 'PUT', token: consoleToken, body: { planId: 'standard' } });
});

test('paying during a free trial starts the paid period after the trial', async () => {
  const created = await call('/platform/tenants', {
    method: 'POST', token: consoleToken,
    body: { code: 'TRIALCO', name: 'Trial Co', trialDays: 10, admin: { username: 'admin', password: 'TrialAdm#1', name: 'Admin' } }
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const pay = await call('/platform/tenants/TRIALCO/payments', { method: 'POST', token: consoleToken, body: { amount: 100, months: 1 } });
  assert.equal(pay.status, 201);
  assert.equal(pay.json.periodFrom, platform.addDays(created.json.trialEndsAt, 1));
});

test('the Internal plan cannot be limited (the original company runs on it)', async () => {
  const r = await call('/platform/plans/internal', { method: 'PUT', token: consoleToken, body: { features: { whatsapp: false } } });
  assert.equal(r.status, 400);
  assert.equal((await call('/platform/plans/internal', { method: 'PUT', token: consoleToken, body: { name: 'Internal' } })).status, 200);
  const ann = await call('/platform/announcements', { method: 'POST', token: consoleToken, body: { message: 'x', startsAt: '2026-12-10', endsAt: '2026-12-01' } });
  assert.equal(ann.status, 400, 'announcement cannot end before it starts');
});

test('Console: password reset ends open sessions; a refused update changes nothing', async () => {
  const made = await call('/platform/console-users', { method: 'POST', token: consoleToken, body: { username: 'helper1', role: 'support', password: 'Helper#123' } });
  assert.equal(made.status, 201);
  const helperToken = await consoleLogin('helper1', 'Helper#123');
  assert.equal((await call('/platform/auth/me', { token: helperToken })).status, 200);

  const refused = await call(`/platform/console-users/${made.json.id}`, { method: 'PUT', token: consoleToken, body: { role: 'admin', newPassword: 'x' } });
  assert.equal(refused.status, 400);
  assert.equal((await call('/platform/auth/me', { token: helperToken })).json.role, 'support', 'role unchanged after a refused update');

  assert.equal((await call(`/platform/console-users/${made.json.id}`, { method: 'PUT', token: consoleToken, body: { newPassword: 'Helper#456' } })).status, 200);
  assert.equal((await call('/platform/auth/me', { token: helperToken })).status, 401, 'old session ended');
});

test('a company without saved addresses never gets the built-in Alagiri addresses on a PO', async () => {
  const { getCompanyAddress } = await import('../../shared/companyAddresses.js');
  const { poDataFromOrder } = await import('../../shared/poData.js');
  assert.deepEqual(getCompanyAddress('XYZ PAPER MILL', 'billTo', []), ['XYZ PAPER MILL']);
  assert.ok(getCompanyAddress('Alagiri Duplex Factory', 'billTo', null).length > 1, 'original company keeps its built-in addresses');
  const po = poDataFromOrder({ id: 'R1', billTo: 'XYZ PAPER MILL' }, {}, 'Ravi', []);
  assert.ok(!JSON.stringify(po).toUpperCase().includes('ALAGIRI'), JSON.stringify(po.billTo));
});

test('an edited dispatch date stays after the next save of the order', async () => {
  const token = (await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'Password123!' } })).json.token;
  const id = `REQ-DATE-${Date.now()}`;
  const created = await call('/requests', { method: 'POST', token, body: { id, productName: 'Bolt', status: 'No Response', poNumber: 'PO-DATE-1', expectedDispatchDate: '2026-12-01' } });
  assert.equal(created.status, 201);
  const loaded = (await call('/requests', { token })).json.find(r => r.id === id);
  assert.equal(loaded.dispatch_date, '2026-12-01');
  // Edit the date: the app sends its loaded copy (old dispatch_date echo) with the new expectedDispatchDate.
  const edited = await call(`/requests/${id}`, { method: 'PUT', token, body: { ...loaded, expectedDispatchDate: '2026-12-10' } });
  assert.equal(edited.json.expectedDispatchDate, '2026-12-10');
  // A later save (status change) from a copy that still carries the old echo must not undo the edit.
  const later = await call(`/requests/${id}`, { method: 'PUT', token, body: { ...loaded, expectedDispatchDate: '2026-12-10', status: 'Acknowledged' } });
  assert.equal(later.json.expectedDispatchDate, '2026-12-10');
  assert.equal(later.json.dispatch_date, '2026-12-10');
  // Saves that don't mention the date keep it.
  const noDate = await call(`/requests/${id}`, { method: 'PUT', token, body: { status: 'Booked' } });
  assert.equal(noDate.json.expectedDispatchDate, '2026-12-10');
});

test('a user can delete their own account; the last Main Admin cannot', async () => {
  const admin = (await call('/auth/login', { method: 'POST', body: { username: 'admin', password: 'Password123!' } })).json.token;
  const add = await call('/users', {
    method: 'POST', token: admin,
    body: { username: 'leaver1', name: 'Leaving Employee', email: 'leaver@alagiri.test', phone: '9876500099', role: 'Employee', department: 'Logistics', password: 'Leaver#1234' }
  });
  assert.equal(add.status, 201, JSON.stringify(add.json));
  const token = (await call('/auth/login', { method: 'POST', body: { username: 'leaver1', password: 'Leaver#1234' } })).json.token;

  const wrong = await call('/auth/delete-account', { method: 'POST', token, body: { password: 'nope' } });
  assert.equal(wrong.status, 400);
  const done = await call('/auth/delete-account', { method: 'POST', token, body: { password: 'Leaver#1234' } });
  assert.equal(done.status, 204);
  assert.equal((await call('/auth/me', { token })).status, 401, 'the old session stops working');
  assert.equal((await call('/auth/login', { method: 'POST', body: { username: 'leaver1', password: 'Leaver#1234' } })).status, 401);
  assert.ok(!(await call('/users', { token: admin })).json.some(u => u.username === 'leaver1'), 'profile is gone');

  // A company's only Main Admin is refused, so the company is never left without one.
  const created = await call('/platform/tenants', {
    method: 'POST', token: consoleToken,
    body: { code: 'delco', name: 'Delete Co', trialDays: 14, admin: { username: 'boss', password: 'DelBoss#12', name: 'Boss' } }
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const boss = (await call('/auth/login', { method: 'POST', body: { companyCode: 'DELCO', username: 'boss', password: 'DelBoss#12' } })).json.token;
  const refused = await call('/auth/delete-account', { method: 'POST', token: boss, body: { password: 'DelBoss#12' } });
  assert.equal(refused.status, 400);
  assert.equal(refused.json.code, 'LAST_MAIN_ADMIN');
  assert.equal((await call('/auth/me', { token: boss })).status, 200);
});
