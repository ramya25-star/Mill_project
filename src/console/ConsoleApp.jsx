// Mill Mate Console: the platform owner's control panel. Lists every company
// using Mill Mate, their plan and subscription, payments, users, support
// access, announcements and the audit trail.
import React, { useCallback, useEffect, useState } from 'react';
import { api, download, getToken, setToken, onSessionExpired } from './api.js';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const STATE_BADGE = {
  internal: ['ok', 'Internal'],
  trial: ['info', 'Trial'],
  active: ['ok', 'Active'],
  due: ['warn', 'Payment due'],
  expired: ['bad', 'View-only'],
  suspended: ['bad', 'Paused'],
  cancelled: ['bad', 'Cancelled'],
  unknown: ['bad', 'Unknown']
};

const StateBadge = ({ state }) => {
  const [tone, label] = STATE_BADGE[state] || ['info', state];
  return <span className={`c-badge ${tone}`}>{label}</span>;
};

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : `${String(v).replace(' ', 'T')}${/Z|[+-]\d\d:?\d\d$/.test(v) || v.length === 10 ? '' : 'Z'}`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(`${String(v).replace(' ', 'T')}${/Z|[+-]\d\d:?\d\d$/.test(v) ? '' : 'Z'}`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
const fmtMoney = (n) => (n == null || n === '' ? '-' : `₹${Number(n).toLocaleString('en-IN')}`);
const fmtBytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

// Label tied to its input (screen readers, and tapping the label focuses it).
const Field = ({ label, hint, children }) => {
  const id = React.useId();
  const single = React.isValidElement(children) && ['input', 'select', 'textarea'].includes(children.type);
  return (
    <div className="c-field">
      <label htmlFor={single ? (children.props.id || id) : undefined}>{label}</label>
      {single && !children.props.id ? React.cloneElement(children, { id }) : children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
};

const Alert = ({ tone = 'bad', children }) => (children ? <div className={`c-alert ${tone}`} role="alert">{children}</div> : null);

// Runs an async action, keeping busy/error/success state for a form.
const useAction = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const run = useCallback(async (fn, successText = '') => {
    setBusy(true); setError(''); setDone('');
    try {
      const out = await fn();
      if (successText) setDone(successText);
      return out;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, done, run, setError, setDone };
};

const can = (me, permission) => (me?.permissions || []).includes(permission);

// QR code for the authenticator app. Drawn in the browser, so the secret is
// never sent to any QR service. Typing the key stays available as a fallback.
function SetupQr({ url }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then(QR => QR.toDataURL(url, { width: 200, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }))
      .then(data => { if (alive) setSrc(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [url]);
  if (!src) return null;
  return <img className="c-qr" src={src} width="200" height="200" alt="QR code to add Mill Mate Console to your authenticator app" />;
}

// ---------------------------------------------------------------------------
// Sign in (password, then authenticator code; first time: set it up)
// ---------------------------------------------------------------------------
function Login({ onSignedIn, notice }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('password'); // password | code | setup
  const [setup, setSetup] = useState(null);
  const { busy, error, run } = useAction();

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (step === 'setup') {
        const res = await api('/auth/setup-2fa', { method: 'POST', body: { setupToken: setup.setupToken, code } });
        setToken(res.token);
        onSignedIn(res.user);
        return;
      }
      const res = await api('/auth/login', { method: 'POST', body: { username, password, code: step === 'code' ? code : undefined } });
      if (res.setupRequired) { setSetup(res); setStep('setup'); setCode(''); return; }
      if (res.codeRequired) { setStep('code'); setCode(''); return; }
      setToken(res.token);
      onSignedIn(res.user);
    });
  };

  return (
    <div className="c-login">
      <form className="c-card c-form" onSubmit={submit}>
        <div>
          <img src="/millmate-icon.png" alt="" width="40" height="40" style={{ borderRadius: 10 }} />
          <h1>Mill Mate Console</h1>
          <div className="c-muted c-small">For the Mill Mate owner and support team only.</div>
        </div>
        <Alert tone="info">{notice}</Alert>
        <Alert>{error}</Alert>

        {step === 'password' && (
          <>
            <Field label="Username"><input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required autoFocus /></Field>
            <Field label="Password"><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
          </>
        )}

        {step === 'setup' && setup && (
          <>
            <div className="c-small">
              <strong>Set up the authenticator (one time).</strong> Open Google Authenticator or Microsoft Authenticator on your phone,
              tap <em>+ → Scan a QR code</em>, and scan this:
            </div>
            {setup.otpauthUrl && <SetupQr url={setup.otpauthUrl} />}
            <div className="c-small c-muted">
              Can't scan? Choose <em>Enter a setup key</em> instead and type this key (time-based):
            </div>
            <div className="c-secret">{setup.secret.match(/.{1,4}/g).join(' ')}</div>
            <div className="c-small c-muted">Account name: Mill Mate Console ({username}). Then enter the 6-digit code it shows.</div>
          </>
        )}

        {(step === 'code' || step === 'setup') && (
          <Field label="6-digit code from the authenticator app">
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required autoFocus />
          </Field>
        )}

        <button className="c-btn primary" disabled={busy}>{busy ? 'Checking...' : step === 'password' ? 'Continue' : 'Sign in'}</button>
        {step !== 'password' && (
          <button type="button" className="c-btn" onClick={() => { setStep('password'); setCode(''); setSetup(null); }}>Back</button>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function Overview({ me, go }) {
  const [data, setData] = useState(null);
  const { error, run } = useAction();
  useEffect(() => { run(async () => setData(await api('/overview'))); }, [run]);

  if (!data) return <><Alert>{error}</Alert><div className="c-muted">Loading...</div></>;
  const t = data.totals;
  const paying = (t.byState.active || 0) + (t.byState.due || 0);
  return (
    <>
      <div className="c-page-head"><div><h1>Overview</h1><p>All companies using Mill Mate.</p></div>
        {can(me, 'tenants.write') && <button className="c-btn primary" onClick={() => go('new-company')}>+ New company</button>}
      </div>
      <div className="c-grid">
        <div className="c-stat"><div className="label">Companies</div><div className="value">{t.companies}</div></div>
        <div className="c-stat"><div className="label">Paying</div><div className="value">{paying}</div></div>
        <div className="c-stat"><div className="label">On trial</div><div className="value">{t.byState.trial || 0}</div></div>
        <div className="c-stat"><div className="label">View-only / paused</div><div className="value">{(t.byState.expired || 0) + (t.byState.suspended || 0)}</div></div>
        <div className="c-stat"><div className="label">Active users</div><div className="value">{t.activeUsers}</div></div>
        <div className="c-stat"><div className="label">Requests this month</div><div className="value">{t.ordersThisMonth}</div></div>
        <div className="c-stat"><div className="label">WhatsApp sent this month</div><div className="value">{t.whatsappThisMonth}</div></div>
      </div>
      <div className="c-two">
        <div className="c-card">
          <h2>Renewals in the next 14 days</h2>
          {data.renewalsSoon.length === 0 ? <div className="c-muted">None.</div> : (
            <table className="c-table"><tbody>
              {data.renewalsSoon.map(r => (
                <tr key={r.code} className="clickable" onClick={() => go('company', r.code)}>
                  <td><strong>{r.name}</strong><div className="c-muted c-small">{r.code}</div></td>
                  <td><StateBadge state={r.state} /></td>
                  <td className="num">{fmtDate(r.endsOn)}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
        {can(me, 'payments.read') && (
          <div className="c-card">
            <h2>Recent payments</h2>
            {data.recentPayments.length === 0 ? <div className="c-muted">No payments recorded yet.</div> : (
              <table className="c-table"><tbody>
                {data.recentPayments.map(p => (
                  <tr key={p.id} className="clickable" onClick={() => go('company', p.code)}>
                    <td><strong>{p.name}</strong><div className="c-muted c-small">{fmtDate(p.paidOn)} · {p.method || '-'}</div></td>
                    <td className="num">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}
      </div>
      <CompaniesTable tenants={data.tenants} go={go} />
    </>
  );
}

function CompaniesTable({ tenants, go }) {
  return (
    <div className="c-card">
      <h2>Companies <small>{tenants.length}</small></h2>
      <div className="c-table-wrap">
        <table className="c-table">
          <thead><tr>
            <th>Company</th><th>Status</th><th>Until</th><th className="num">Users</th><th className="num">Requests (month)</th><th className="num">WhatsApp (month)</th><th>Last activity</th>
          </tr></thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.code} className="clickable" onClick={() => go('company', t.code)}>
                <td><strong>{t.name}</strong><div className="c-muted c-small c-mono">{t.code}</div></td>
                <td><StateBadge state={t.access.state} /></td>
                <td>{t.isInternal ? '-' : fmtDate(t.access.endsOn || t.paidUntil || t.trialEndsAt)}</td>
                <td className="num">{t.usage.activeUsers ?? '-'}</td>
                <td className="num">{t.usage.ordersThisMonth ?? '-'}</td>
                <td className="num">{t.usage.whatsappThisMonth ?? '-'}</td>
                <td>{fmtDateTime(t.usage.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Companies({ me, go }) {
  const [tenants, setTenants] = useState(null);
  const [q, setQ] = useState('');
  const { error, run } = useAction();
  useEffect(() => { run(async () => setTenants(await api('/tenants'))); }, [run]);
  const shown = (tenants || []).filter(t => !q || `${t.name} ${t.code}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="c-page-head"><div><h1>Companies</h1><p>Open a company to manage its plan, payments, users and support.</p></div>
        <div className="c-row">
          <div className="c-field"><input placeholder="Search name or code" value={q} onChange={e => setQ(e.target.value)} /></div>
          {can(me, 'tenants.write') && <button className="c-btn primary" onClick={() => go('new-company')}>+ New company</button>}
        </div>
      </div>
      <Alert>{error}</Alert>
      {tenants ? <CompaniesTable tenants={shown} go={go} /> : <div className="c-muted">Loading...</div>}
    </>
  );
}

// ---------------------------------------------------------------------------
// New company
// ---------------------------------------------------------------------------
function NewCompany({ go }) {
  const [plans, setPlans] = useState([]);
  const [f, setF] = useState({
    code: '', name: '', planId: 'standard', trialDays: 14, graceDays: 7, noBilling: false, notes: '',
    person: '', phone: '', email: '', gstin: '', address: '',
    adminUsername: 'admin', adminPassword: '', adminName: '', adminPhone: '',
    addressName: 'Factory', addressLines: '', signatory: ''
  });
  const { busy, error, run } = useAction();
  useEffect(() => { api('/plans').then(setPlans).catch(() => {}); }, []);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const created = await api('/tenants', {
        method: 'POST',
        body: {
          code: f.code, name: f.name, planId: f.planId, trialDays: Number(f.trialDays), graceDays: Number(f.graceDays), noBilling: f.noBilling, notes: f.notes,
          contact: { person: f.person, phone: f.phone, email: f.email, gstin: f.gstin, address: f.address },
          admin: { username: f.adminUsername, password: f.adminPassword, name: f.adminName, phone: f.adminPhone },
          profile: {
            poSignatory: f.signatory,
            addresses: f.addressLines.trim() ? [{ name: f.addressName || 'Factory', group: f.name, lines: f.addressLines.split('\n') }] : []
          }
        }
      });
      go('company', created.code);
    });
  };

  return (
    <>
      <div className="c-page-head"><div><h1>New company</h1><p>Creates the company's own separate space in Mill Mate and its first Main Admin.</p></div></div>
      <form className="c-form" onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="c-card">
          <h2>Company</h2>
          <div className="c-fields">
            <Field label="Company code" hint="3-20 letters/digits, starts with a letter. Users type this on the login screen. Cannot be changed later.">
              <input value={f.code} onChange={e => setF(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) }))} required placeholder="XYZMILLS" />
            </Field>
            <Field label="Company name"><input value={f.name} onChange={set('name')} required placeholder="XYZ Paper Mills" /></Field>
            <Field label="Contact person"><input value={f.person} onChange={set('person')} /></Field>
            <Field label="Contact phone"><input value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Contact email"><input type="email" value={f.email} onChange={set('email')} /></Field>
            <Field label="GSTIN"><input value={f.gstin} onChange={e => setF(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} maxLength={15} /></Field>
          </div>
          <div className="c-fields" style={{ marginTop: 12 }}>
            <Field label="Billing address"><textarea rows={3} value={f.address} onChange={set('address')} /></Field>
            <Field label="Notes (only visible in the Console)"><textarea rows={3} value={f.notes} onChange={set('notes')} /></Field>
          </div>
        </div>

        <div className="c-card">
          <h2>Plan and subscription</h2>
          <div className="c-fields">
            <Field label="Plan">
              <select value={f.planId} onChange={set('planId')} disabled={f.noBilling}>
                {plans.filter(p => p.active && p.id !== 'internal').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Free trial (days)" hint="0 = no trial; record a payment to start."><input type="number" min="0" max="365" value={f.trialDays} onChange={set('trialDays')} disabled={f.noBilling} /></Field>
            <Field label="Grace days after expiry" hint="Full access continues this long before view-only."><input type="number" min="0" max="60" value={f.graceDays} onChange={set('graceDays')} /></Field>
          </div>
          <label className="c-check" style={{ marginTop: 12 }}><input type="checkbox" checked={f.noBilling} onChange={set('noBilling')} /> Internal / free company (never expires)</label>
        </div>

        <div className="c-card">
          <h2>First Main Admin</h2>
          <div className="c-fields">
            <Field label="Username"><input value={f.adminUsername} onChange={set('adminUsername')} required /></Field>
            <Field label="Temporary password" hint="They must change it at first login."><input value={f.adminPassword} onChange={set('adminPassword')} required minLength={8} /></Field>
            <Field label="Name"><input value={f.adminName} onChange={set('adminName')} required /></Field>
            <Field label="Mobile (for the daily summary)"><input value={f.adminPhone} onChange={set('adminPhone')} placeholder="9876543210" /></Field>
          </div>
        </div>

        <div className="c-card">
          <h2>Purchase order details</h2>
          <div className="c-muted c-small" style={{ marginBottom: 10 }}>The first Bill To / Ship To address. The company can add more in Settings › Company & Subscription.</div>
          <div className="c-fields">
            <Field label="Address name"><input value={f.addressName} onChange={set('addressName')} /></Field>
            <Field label="Authorized signatory on POs"><input value={f.signatory} onChange={set('signatory')} /></Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Address lines (one per line)"><textarea rows={4} value={f.addressLines} onChange={set('addressLines')} placeholder={'XYZ PAPER MILLS\n12, INDUSTRIAL ESTATE\nSIVAKASI - 626123'} /></Field>
          </div>
        </div>

        <div className="c-row">
          <button className="c-btn primary" disabled={busy}>{busy ? 'Creating...' : 'Create company'}</button>
          <button type="button" className="c-btn" onClick={() => go('companies')}>Cancel</button>
        </div>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// One company
// ---------------------------------------------------------------------------
function CompanyDetail({ me, code, go }) {
  const [t, setT] = useState(null);
  const [plans, setPlans] = useState([]);
  const { error, run } = useAction();
  const load = useCallback(() => run(async () => setT(await api(`/tenants/${encodeURIComponent(code)}`))), [code, run]);
  useEffect(() => { load(); api('/plans').then(setPlans).catch(() => {}); }, [load]);

  if (!t) return <><Alert>{error}</Alert><div className="c-muted">Loading...</div></>;
  const writable = can(me, 'tenants.write');
  return (
    <>
      <div className="c-page-head">
        <div>
          <button className="c-btn small" onClick={() => go('companies')}>← Companies</button>
          <h1 style={{ marginTop: 8 }}>{t.name} <StateBadge state={t.access.state} /></h1>
          <p>Company code <span className="c-mono">{t.code}</span> · created {fmtDate(t.createdAt)}</p>
        </div>
      </div>
      <Alert>{error}</Alert>
      {t.access.message && <Alert tone={['expired', 'suspended', 'cancelled'].includes(t.access.state) ? 'bad' : 'info'}>{t.access.message}</Alert>}

      <div className="c-grid">
        <div className="c-stat"><div className="label">Active users</div><div className="value">{t.usage.activeUsers ?? '-'}</div></div>
        <div className="c-stat"><div className="label">Open requests</div><div className="value">{t.usage.openOrders ?? '-'}</div></div>
        <div className="c-stat"><div className="label">Requests this month</div><div className="value">{t.usage.ordersThisMonth ?? '-'}</div></div>
        <div className="c-stat"><div className="label">WhatsApp this month</div><div className="value">{t.usage.whatsappThisMonth ?? '-'}</div></div>
        <div className="c-stat"><div className="label">Suppliers</div><div className="value">{t.usage.suppliers ?? '-'}</div></div>
        <div className="c-stat"><div className="label">Data size</div><div className="value" style={{ fontSize: 18 }}>{fmtBytes(t.usage.databaseBytes)}</div></div>
      </div>

      <div className="c-two">
        <Subscription t={t} plans={plans} writable={writable} reload={load} />
        <StatusCard t={t} writable={writable} reload={load} />
        {can(me, 'payments.read') && <Payments t={t} canWrite={can(me, 'payments.write')} reload={load} />}
        <Support t={t} me={me} />
        <Users t={t} canAct={can(me, 'users.support')} reload={load} />
        <Details t={t} writable={writable} reload={load} />
        <ProfileCard t={t} writable={writable} reload={load} />
        <div className="c-card">
          <h2>Morning jobs <small>last 7 runs</small></h2>
          {t.jobRuns.length === 0 ? <div className="c-muted">Not run yet.</div> : (
            <table className="c-table"><tbody>
              {t.jobRuns.map(j => <tr key={j.run_date}><td>{fmtDate(j.run_date)}</td><td>{j.status}</td><td className="c-muted">{fmtDateTime(j.finished_at)}</td></tr>)}
            </tbody></table>
          )}
          {can(me, 'backup.download') && (
            <div style={{ marginTop: 14 }}>
              <BackupButton code={t.code} />
            </div>
          )}
        </div>
      </div>

      <div className="c-card">
        <h2>Audit trail for this company</h2>
        <AuditTable rows={t.audit} />
      </div>
    </>
  );
}

function Subscription({ t, plans, writable, reload }) {
  const [planId, setPlanId] = useState(t.planId || '');
  const [trialEndsAt, setTrialEndsAt] = useState(t.trialEndsAt || '');
  const [paidUntil, setPaidUntil] = useState(t.paidUntil || '');
  const [graceDays, setGraceDays] = useState(t.graceDays);
  const [noBilling, setNoBilling] = useState(t.isInternal);
  // Follow the saved values when the company reloads (e.g. a payment just
  // moved "Paid until"); otherwise Save would write the old dates back.
  useEffect(() => {
    setPlanId(t.planId || '');
    setTrialEndsAt(t.trialEndsAt || '');
    setPaidUntil(t.paidUntil || '');
    setGraceDays(t.graceDays);
    setNoBilling(t.isInternal);
  }, [t.planId, t.trialEndsAt, t.paidUntil, t.graceDays, t.isInternal]);
  const { busy, error, done, run } = useAction();
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await api(`/tenants/${t.code}`, { method: 'PUT', body: { planId, trialEndsAt: trialEndsAt || null, paidUntil: paidUntil || null, graceDays: Number(graceDays), noBilling } });
      await reload();
    }, 'Saved.');
  };
  return (
    <form className="c-card c-form" onSubmit={save}>
      <h2>Plan and subscription</h2>
      <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
      <div className="c-fields">
        <Field label="Plan">
          <select value={planId} onChange={e => setPlanId(e.target.value)} disabled={!writable}>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}{p.active ? '' : ' (inactive)'}</option>)}
          </select>
        </Field>
        <Field label="Trial ends"><input type="date" value={trialEndsAt || ''} onChange={e => setTrialEndsAt(e.target.value)} disabled={!writable} /></Field>
        <Field label="Paid until" hint="Normally set by recording a payment."><input type="date" value={paidUntil || ''} onChange={e => setPaidUntil(e.target.value)} disabled={!writable} /></Field>
        <Field label="Grace days"><input type="number" min="0" max="60" value={graceDays} onChange={e => setGraceDays(e.target.value)} disabled={!writable} /></Field>
      </div>
      <label className="c-check"><input type="checkbox" checked={noBilling} onChange={e => setNoBilling(e.target.checked)} disabled={!writable} /> Internal / free (never expires)</label>
      {writable && <div><button className="c-btn primary" disabled={busy}>Save</button></div>}
    </form>
  );
}

function StatusCard({ t, writable, reload }) {
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction();
  const setStatus = (status) => {
    const words = { suspended: 'Pause access for', cancelled: 'Cancel', active: 'Resume access for' }[status];
    if (!window.confirm(`${words} ${t.name}?`)) return;
    run(async () => { await api(`/tenants/${t.code}/status`, { method: 'POST', body: { status, reason } }); setReason(''); await reload(); });
  };
  return (
    <div className="c-card c-form">
      <h2>Access</h2>
      <Alert>{error}</Alert>
      <dl className="c-kv">
        <dt>Status</dt><dd>{t.status}{t.statusReason ? ` - ${t.statusReason}` : ''}</dd>
        <dt>Can sign in</dt><dd>{t.access.canLogin ? 'Yes' : 'No'}</dd>
        <dt>Can make changes</dt><dd>{t.access.canWrite ? 'Yes' : 'No (view-only)'}</dd>
      </dl>
      {t.isDefault && <div className="c-muted c-small">The original company cannot be paused from the Console.</div>}
      {writable && !t.isDefault && (
        <>
          <Field label="Reason (saved in the audit trail)"><input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. payment pending since March" /></Field>
          <div className="c-row">
            {t.status !== 'active' && <button className="c-btn primary" disabled={busy} onClick={() => setStatus('active')}>Resume access</button>}
            {t.status === 'active' && <button className="c-btn danger" disabled={busy} onClick={() => setStatus('suspended')}>Pause access</button>}
            {t.status !== 'cancelled' && <button className="c-btn danger" disabled={busy} onClick={() => setStatus('cancelled')}>Cancel</button>}
          </div>
          <div className="c-muted c-small">Pausing or cancelling never deletes data; resume brings everything back.</div>
        </>
      )}
    </div>
  );
}

function Payments({ t, canWrite, reload }) {
  const [f, setF] = useState({ amount: '', method: 'Bank transfer', reference: '', paidOn: today(), months: 12, notes: '' });
  const { busy, error, done, run } = useAction();
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api(`/tenants/${t.code}/payments`, { method: 'POST', body: { ...f, amount: Number(f.amount), months: Number(f.months) } });
      setF(p => ({ ...p, amount: '', reference: '', notes: '' }));
      await reload();
      return res;
    }, 'Payment recorded and access extended.');
  };
  return (
    <div className="c-card">
      <h2>Payments</h2>
      {t.payments.length === 0 ? <div className="c-muted" style={{ marginBottom: 12 }}>No payments yet.</div> : (
        <div className="c-table-wrap" style={{ marginBottom: 12 }}>
          <table className="c-table">
            <thead><tr><th>Paid on</th><th className="num">Amount</th><th>Method</th><th>Covers</th></tr></thead>
            <tbody>
              {t.payments.map(p => (
                <tr key={p.id}>
                  <td>{fmtDate(p.paidOn)}<div className="c-muted c-small">{p.reference}</div></td>
                  <td className="num">{fmtMoney(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>{fmtDate(p.periodFrom)} – {fmtDate(p.periodTo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canWrite && !t.isInternal && (
        <form className="c-form" onSubmit={submit}>
          <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
          <div className="c-fields">
            <Field label="Amount (₹)"><input type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} required /></Field>
            <Field label="Method">
              <select value={f.method} onChange={set('method')}>
                {['Bank transfer', 'UPI', 'Cheque', 'Cash', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Reference (UTR / cheque no.)"><input value={f.reference} onChange={set('reference')} /></Field>
            <Field label="Paid on"><input type="date" value={f.paidOn} onChange={set('paidOn')} required /></Field>
            <Field label="Months covered" hint="Starts after the current paid period."><input type="number" min="1" max="36" value={f.months} onChange={set('months')} required /></Field>
          </div>
          <Field label="Notes"><input value={f.notes} onChange={set('notes')} /></Field>
          <div><button className="c-btn primary" disabled={busy}>Record payment</button></div>
        </form>
      )}
    </div>
  );
}

function Support({ t, me }) {
  const { busy, error, run } = useAction();
  const until = t.supportAccessUntil ? new Date(t.supportAccessUntil) : null;
  const allowed = until && until > new Date();
  const [link, setLink] = useState('');
  const open = () => {
    // Open the tab during the click (browsers block tabs opened after a wait),
    // then point it at the app once the session is ready.
    const tab = window.open('about:blank', '_blank');
    run(async () => {
      try {
        const res = await api(`/tenants/${t.code}/support-session`, { method: 'POST' });
        if (tab && !tab.closed) {
          tab.opener = null;
          tab.location.href = res.url;
        } else {
          setLink(res.url); // pop-up blocked: show a link to click instead
        }
      } catch (err) {
        if (tab && !tab.closed) tab.close();
        throw err;
      }
    });
  };
  return (
    <div className="c-card c-form">
      <h2>Support access</h2>
      <Alert>{error}</Alert>
      <div className="c-small">
        {allowed
          ? <>The company's Main Admin allowed support until <strong>{fmtDateTime(t.supportAccessUntil)}</strong>.</>
          : <>Not allowed right now. Ask the company's Main Admin to open <em>Settings › Company &amp; Subscription</em> and tap <em>Allow support for 24 hours</em>.</>}
      </div>
      {can(me, 'support.login') && (
        <div><button className="c-btn primary" disabled={busy || !allowed} onClick={open}>Open their app as support (30 min)</button></div>
      )}
      {link && <Alert tone="info">The browser blocked the new tab. <a href={link} target="_blank" rel="noopener noreferrer">Open the support session</a> (works for 30 minutes).</Alert>}
      <div className="c-muted c-small">Every support visit is recorded in the audit trail.</div>
    </div>
  );
}

function Users({ t, canAct, reload }) {
  const [temp, setTemp] = useState(null);
  const { busy, error, run } = useAction();
  const reset = (u) => {
    if (!window.confirm(`Reset the password for ${u.username}? They will have to set a new one at next login.`)) return;
    run(async () => {
      const res = await api(`/tenants/${t.code}/users/${encodeURIComponent(u.id)}/reset-password`, { method: 'POST' });
      setTemp({ username: u.username, password: res.tempPassword });
      await reload();
    });
  };
  const toggle = (u) => run(async () => {
    await api(`/tenants/${t.code}/users/${encodeURIComponent(u.id)}/enabled`, { method: 'POST', body: { enabled: !u.enabled } });
    await reload();
  });
  return (
    <div className="c-card c-span-all">
      <h2>Users <small>{t.users.length}</small></h2>
      <Alert>{error}</Alert>
      {temp && (
        <Alert tone="warn">
          Temporary password for <strong>{temp.username}</strong>: <span className="c-mono">{temp.password}</span> - share it privately; it is shown only once.
        </Alert>
      )}
      <div className="c-table-wrap">
        <table className="c-table">
          <thead><tr><th>User</th><th>Role</th><th>Status</th>{canAct && <th />}</tr></thead>
          <tbody>
            {t.users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name || u.username}</strong><div className="c-muted c-small">{u.username}{u.phone ? ` · ${u.phone}` : ''}</div></td>
                <td>{u.role}</td>
                <td>{u.enabled ? <span className="c-badge ok">On</span> : <span className="c-badge bad">Off</span>}{u.mustChangePassword && <div className="c-muted c-small">must change password</div>}</td>
                {canAct && (
                  <td><div className="c-row">
                    <button className="c-btn small" disabled={busy} onClick={() => reset(u)}>Reset password</button>
                    <button className="c-btn small" disabled={busy} onClick={() => toggle(u)}>{u.enabled ? 'Switch off' : 'Switch on'}</button>
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Details({ t, writable, reload }) {
  const [name, setName] = useState(t.name);
  const [contact, setContact] = useState({ person: '', phone: '', email: '', gstin: '', address: '', ...t.contact });
  const [notes, setNotes] = useState(t.notes);
  const { busy, error, done, run } = useAction();
  const setC = (k) => (e) => setContact(p => ({ ...p, [k]: e.target.value }));
  const save = (e) => {
    e.preventDefault();
    run(async () => { await api(`/tenants/${t.code}`, { method: 'PUT', body: { name, contact, notes } }); await reload(); }, 'Saved.');
  };
  return (
    <form className="c-card c-form" onSubmit={save}>
      <h2>Company details</h2>
      <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
      <div className="c-fields">
        <Field label="Company name"><input value={name} onChange={e => setName(e.target.value)} disabled={!writable} required /></Field>
        <Field label="Contact person"><input value={contact.person} onChange={setC('person')} disabled={!writable} /></Field>
        <Field label="Phone"><input value={contact.phone} onChange={setC('phone')} disabled={!writable} /></Field>
        <Field label="Email"><input value={contact.email} onChange={setC('email')} disabled={!writable} /></Field>
        <Field label="GSTIN"><input value={contact.gstin} onChange={setC('gstin')} disabled={!writable} /></Field>
      </div>
      <Field label="Billing address"><textarea rows={2} value={contact.address} onChange={setC('address')} disabled={!writable} /></Field>
      <Field label="Notes (Console only)"><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} disabled={!writable} /></Field>
      {writable && <div><button className="c-btn primary" disabled={busy}>Save</button></div>}
    </form>
  );
}

function ProfileCard({ t, writable, reload }) {
  const p = t.profile || {};
  const [addresses, setAddresses] = useState((p.addresses || []).map(a => ({ name: a.name, group: a.group, lines: a.lines.join('\n') })));
  const [poSignatory, setPoSignatory] = useState(p.poSignatory || '');
  const { busy, error, done, run } = useAction();
  const upd = (i, k, v) => setAddresses(prev => prev.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await api(`/tenants/${t.code}/profile`, { method: 'PUT', body: { poSignatory, addresses: addresses.map(a => ({ ...a, lines: a.lines.split('\n') })) } });
      await reload();
    }, 'Saved.');
  };
  return (
    <form className="c-card c-form" onSubmit={save}>
      <h2>Purchase order details</h2>
      <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
      {!p.addresses && t.isDefault && <div className="c-muted c-small">Uses the built-in Alagiri addresses until the company saves its own.</div>}
      {addresses.map((a, i) => (
        <div key={i} className="c-fields" style={{ borderTop: i ? '1px solid var(--border)' : 0, paddingTop: i ? 12 : 0 }}>
          <Field label="Name"><input value={a.name} onChange={e => upd(i, 'name', e.target.value)} disabled={!writable} required /></Field>
          <Field label="Group"><input value={a.group} onChange={e => upd(i, 'group', e.target.value)} disabled={!writable} /></Field>
          <Field label="Lines"><textarea rows={3} value={a.lines} onChange={e => upd(i, 'lines', e.target.value)} disabled={!writable} required /></Field>
          {writable && <div><button type="button" className="c-btn small danger" onClick={() => setAddresses(prev => prev.filter((_, j) => j !== i))}>Remove</button></div>}
        </div>
      ))}
      {writable && <div><button type="button" className="c-btn small" onClick={() => setAddresses(prev => [...prev, { name: '', group: '', lines: '' }])}>+ Add address</button></div>}
      <Field label="Authorized signatory"><input value={poSignatory} onChange={e => setPoSignatory(e.target.value)} disabled={!writable} /></Field>
      {writable && <div><button className="c-btn primary" disabled={busy}>Save</button></div>}
    </form>
  );
}

function BackupButton({ code }) {
  const { busy, error, run } = useAction();
  return (
    <>
      <Alert>{error}</Alert>
      <button className="c-btn" disabled={busy} onClick={() => run(() => download(`/tenants/${code}/backup`, `millmate-${code.toLowerCase()}-${today()}.db`))}>
        {busy ? 'Preparing...' : 'Download full data copy'}
      </button>
      <div className="c-muted c-small" style={{ marginTop: 4 }}>A complete copy of this company's database (for handover or archiving). Keep it private.</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
const FEATURE_LABELS = { whatsapp: 'WhatsApp messages to suppliers', dailySummary: 'Daily WhatsApp summary', supplierReminders: 'Automatic supplier reminders' };

function PlanForm({ plan, onSaved, onCancel }) {
  const [f, setF] = useState({
    name: plan?.name || '', priceMonthly: plan?.priceMonthly ?? '', priceYearly: plan?.priceYearly ?? '',
    maxUsers: plan?.limits?.maxUsers ?? '', maxOrdersPerMonth: plan?.limits?.maxOrdersPerMonth ?? '',
    features: { whatsapp: plan?.features?.whatsapp !== false, dailySummary: plan?.features?.dailySummary !== false, supplierReminders: plan?.features?.supplierReminders !== false },
    active: plan ? plan.active : true
  });
  const { busy, error, run } = useAction();
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const body = {
        name: f.name, priceMonthly: f.priceMonthly, priceYearly: f.priceYearly, active: f.active,
        limits: { maxUsers: f.maxUsers || 0, maxOrdersPerMonth: f.maxOrdersPerMonth || 0 }, features: f.features
      };
      await api(plan ? `/plans/${plan.id}` : '/plans', { method: plan ? 'PUT' : 'POST', body });
      onSaved();
    });
  };
  return (
    <form className="c-card c-form" onSubmit={submit}>
      <h2>{plan ? `Edit ${plan.name}` : 'New plan'}</h2>
      <Alert>{error}</Alert>
      <div className="c-fields">
        <Field label="Name"><input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required /></Field>
        <Field label="Price per month (₹)" hint="For reference on invoices; leave empty if not decided."><input type="number" min="0" value={f.priceMonthly} onChange={e => setF(p => ({ ...p, priceMonthly: e.target.value }))} /></Field>
        <Field label="Price per year (₹)"><input type="number" min="0" value={f.priceYearly} onChange={e => setF(p => ({ ...p, priceYearly: e.target.value }))} /></Field>
        <Field label="Max active users" hint="Empty = unlimited"><input type="number" min="0" value={f.maxUsers} onChange={e => setF(p => ({ ...p, maxUsers: e.target.value }))} /></Field>
        <Field label="Max new requests per month" hint="Empty = unlimited"><input type="number" min="0" value={f.maxOrdersPerMonth} onChange={e => setF(p => ({ ...p, maxOrdersPerMonth: e.target.value }))} /></Field>
      </div>
      <div className="c-row">
        {Object.entries(FEATURE_LABELS).map(([k, label]) => (
          <label key={k} className="c-check"><input type="checkbox" checked={f.features[k]} onChange={e => setF(p => ({ ...p, features: { ...p.features, [k]: e.target.checked } }))} /> {label}</label>
        ))}
      </div>
      <label className="c-check"><input type="checkbox" checked={f.active} onChange={e => setF(p => ({ ...p, active: e.target.checked }))} /> Offered for new companies</label>
      <div className="c-row">
        <button className="c-btn primary" disabled={busy}>Save plan</button>
        <button type="button" className="c-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Plans({ me }) {
  const [plans, setPlans] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | plan
  const { error, run } = useAction();
  const load = useCallback(() => run(async () => setPlans(await api('/plans'))), [run]);
  useEffect(() => { load(); }, [load]);
  const owner = can(me, 'plans.write');
  return (
    <>
      <div className="c-page-head"><div><h1>Plans</h1><p>What each subscription includes. Prices are for your records; payments are recorded per company.</p></div>
        {owner && !editing && <button className="c-btn primary" onClick={() => setEditing('new')}>+ New plan</button>}
      </div>
      <Alert>{error}</Alert>
      {editing && <PlanForm plan={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      <div className="c-card">
        <div className="c-table-wrap">
          <table className="c-table">
            <thead><tr><th>Plan</th><th className="num">Monthly</th><th className="num">Yearly</th><th>Limits</th><th>Features off</th><th className="num">Companies</th>{owner && <th />}</tr></thead>
            <tbody>
              {(plans || []).map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong>{!p.active && <div className="c-muted c-small">not offered</div>}</td>
                  <td className="num">{fmtMoney(p.priceMonthly)}</td>
                  <td className="num">{fmtMoney(p.priceYearly)}</td>
                  <td className="c-small">{p.limits.maxUsers ? `${p.limits.maxUsers} users` : 'Unlimited users'} · {p.limits.maxOrdersPerMonth ? `${p.limits.maxOrdersPerMonth} requests/month` : 'unlimited requests'}</td>
                  <td className="c-small">{Object.keys(FEATURE_LABELS).filter(k => p.features[k] === false).map(k => FEATURE_LABELS[k]).join(', ') || '-'}</td>
                  <td className="num">{p.companies}</td>
                  {owner && <td>{p.id !== 'internal' && <button className="c-btn small" onClick={() => setEditing(p)}>Edit</button>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------
function Announcements({ me }) {
  const [list, setList] = useState(null);
  const [f, setF] = useState({ message: '', level: 'info', tenantCode: '', startsAt: '', endsAt: '' });
  const { busy, error, run } = useAction();
  const load = useCallback(() => run(async () => setList(await api('/announcements'))), [run]);
  useEffect(() => { load(); }, [load]);
  const writable = can(me, 'announcements.write');
  const submit = (e) => {
    e.preventDefault();
    run(async () => { await api('/announcements', { method: 'POST', body: f }); setF({ message: '', level: 'info', tenantCode: '', startsAt: '', endsAt: '' }); await load(); });
  };
  const toggle = (a) => run(async () => { await api(`/announcements/${a.id}/active`, { method: 'POST', body: { active: !a.active } }); await load(); });
  return (
    <>
      <div className="c-page-head"><div><h1>Announcements</h1><p>A short notice shown at the top of the Mill Mate app (e.g. planned maintenance).</p></div></div>
      <Alert>{error}</Alert>
      {writable && (
        <form className="c-card c-form" onSubmit={submit}>
          <h2>New announcement</h2>
          <Field label="Message"><input value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))} maxLength={300} required placeholder="Mill Mate will be down for maintenance on Sunday 6-7 AM." /></Field>
          <div className="c-fields">
            <Field label="Type"><select value={f.level} onChange={e => setF(p => ({ ...p, level: e.target.value }))}><option value="info">Information</option><option value="warning">Warning</option></select></Field>
            <Field label="Only for company code" hint="Empty = every company"><input value={f.tenantCode} onChange={e => setF(p => ({ ...p, tenantCode: e.target.value.toUpperCase() }))} /></Field>
            <Field label="Show from"><input type="datetime-local" value={f.startsAt} onChange={e => setF(p => ({ ...p, startsAt: e.target.value }))} /></Field>
            <Field label="Show until"><input type="datetime-local" value={f.endsAt} onChange={e => setF(p => ({ ...p, endsAt: e.target.value }))} /></Field>
          </div>
          <div><button className="c-btn primary" disabled={busy}>Publish</button></div>
        </form>
      )}
      <div className="c-card">
        <div className="c-table-wrap">
          <table className="c-table">
            <thead><tr><th>Message</th><th>For</th><th>Window</th><th>Status</th>{writable && <th />}</tr></thead>
            <tbody>
              {(list || []).map(a => (
                <tr key={a.id}>
                  <td>{a.message}<div className="c-muted c-small">{a.level} · by {a.createdBy}</div></td>
                  <td>{a.tenantCode || 'All'}</td>
                  <td className="c-small">{a.startsAt ? fmtDateTime(a.startsAt) : 'now'} → {a.endsAt ? fmtDateTime(a.endsAt) : 'until hidden'}</td>
                  <td>{a.active ? <span className="c-badge ok">Shown</span> : <span className="c-badge info">Hidden</span>}</td>
                  {writable && <td><button className="c-btn small" disabled={busy} onClick={() => toggle(a)}>{a.active ? 'Hide' : 'Show'}</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------
function AuditTable({ rows }) {
  if (!rows?.length) return <div className="c-muted">Nothing recorded yet.</div>;
  return (
    <div className="c-table-wrap">
      <table className="c-table c-table-wide">
        <thead><tr><th>When</th><th>Who</th><th>What</th><th>Company</th><th>Details</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.at)}</td>
              <td>{r.actor}</td>
              <td className="c-mono c-small">{r.action}</td>
              <td>{r.tenantCode || '-'}</td>
              <td className="c-mono c-small" style={{ maxWidth: 360 }}>{r.details ? JSON.stringify(r.details) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Audit() {
  const [rows, setRows] = useState(null);
  const [tenant, setTenant] = useState('');
  const { error, run } = useAction();
  const load = useCallback((code) => run(async () => setRows(await api(`/audit?limit=300${code ? `&tenant=${encodeURIComponent(code)}` : ''}`))), [run]);
  useEffect(() => { load(''); }, [load]);
  return (
    <>
      <div className="c-page-head"><div><h1>Audit trail</h1><p>Every Console action and every support visit.</p></div>
        <form className="c-row" onSubmit={e => { e.preventDefault(); load(tenant); }}>
          <div className="c-field"><input placeholder="Company code" value={tenant} onChange={e => setTenant(e.target.value.toUpperCase())} /></div>
          <button className="c-btn">Filter</button>
        </form>
      </div>
      <Alert>{error}</Alert>
      <div className="c-card">{rows ? <AuditTable rows={rows} /> : <div className="c-muted">Loading...</div>}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Console users (owner) and own account
// ---------------------------------------------------------------------------
const ROLE_TEXT = {
  owner: 'Owner - everything, including plans, payments and Console users',
  admin: 'Admin - companies, payments and announcements',
  support: 'Support - help companies (password resets, support visits); no money'
};

function ConsoleUsers({ me }) {
  const [list, setList] = useState(null);
  const [f, setF] = useState({ username: '', name: '', role: 'support', password: '' });
  const { busy, error, done, run } = useAction();
  const load = useCallback(() => run(async () => setList(await api('/console-users'))), [run]);
  useEffect(() => { load(); }, [load]);
  const create = (e) => {
    e.preventDefault();
    run(async () => { await api('/console-users', { method: 'POST', body: f }); setF({ username: '', name: '', role: 'support', password: '' }); await load(); }, 'Console user created. They set up the authenticator at first sign-in.');
  };
  const update = (u, body, question) => {
    if (question && !window.confirm(question)) return;
    run(async () => { await api(`/console-users/${u.id}`, { method: 'PUT', body }); await load(); });
  };
  return (
    <>
      <div className="c-page-head"><div><h1>Console users</h1><p>People who can sign in to this Console.</p></div></div>
      <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
      <div className="c-card">
        <div className="c-table-wrap">
          <table className="c-table">
            <thead><tr><th>User</th><th>Role</th><th>Authenticator</th><th>Last sign-in</th><th /></tr></thead>
            <tbody>
              {(list || []).map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name || u.username}</strong><div className="c-muted c-small">{u.username}{u.enabled ? '' : ' · switched off'}</div></td>
                  <td>
                    <select value={u.role} disabled={busy || u.id === me.id} onChange={e => update(u, { role: e.target.value }, `Change ${u.username} to ${e.target.value}?`)}>
                      {Object.keys(ROLE_TEXT).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{u.twoFactor ? <span className="c-badge ok">Set up</span> : <span className="c-badge warn">Not yet</span>}</td>
                  <td>{fmtDateTime(u.lastLoginAt)}</td>
                  <td>
                    {u.id !== me.id && (
                      <div className="c-row">
                        <button className="c-btn small" disabled={busy} onClick={() => update(u, { enabled: !u.enabled }, `${u.enabled ? 'Switch off' : 'Switch on'} ${u.username}?`)}>{u.enabled ? 'Switch off' : 'Switch on'}</button>
                        <button className="c-btn small" disabled={busy} onClick={() => update(u, { resetTwoFactor: true }, `Reset ${u.username}'s authenticator (lost phone)? They set it up again at next sign-in.`)}>Reset authenticator</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form className="c-card c-form" onSubmit={create}>
        <h2>Add a Console user</h2>
        <div className="c-fields">
          <Field label="Username"><input value={f.username} onChange={e => setF(p => ({ ...p, username: e.target.value }))} required /></Field>
          <Field label="Name"><input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Role" hint={ROLE_TEXT[f.role]}>
            <select value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}>{Object.keys(ROLE_TEXT).map(r => <option key={r} value={r}>{r}</option>)}</select>
          </Field>
          <Field label="Temporary password" hint="At least 8 characters."><input value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} required minLength={8} /></Field>
        </div>
        <div><button className="c-btn primary" disabled={busy}>Add user</button></div>
      </form>
    </>
  );
}

function Account({ me }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const { busy, error, done, run } = useAction();
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      if (res?.token) setToken(res.token);
      setCurrent(''); setNext('');
    }, 'Password changed. Other signed-in devices were signed out.');
  };
  return (
    <>
      <div className="c-page-head"><div><h1>My account</h1><p>{me.name || me.username} · {ROLE_TEXT[me.role]}</p></div></div>
      <form className="c-card c-form" onSubmit={submit} style={{ maxWidth: 480 }}>
        <h2>Change password</h2>
        <Alert>{error}</Alert><Alert tone="ok">{done}</Alert>
        <Field label="Current password"><input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required /></Field>
        <Field label="New password"><input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" required minLength={8} /></Field>
        <div><button className="c-btn primary" disabled={busy}>Change password</button></div>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------
const parseHash = () => {
  const [page = 'overview', arg = ''] = (window.location.hash || '').replace(/^#\/?/, '').split('/');
  return { page: page || 'overview', arg: decodeURIComponent(arg) };
};

export default function ConsoleApp() {
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(!!getToken());
  const [notice, setNotice] = useState('');
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    onSessionExpired((msg) => { setMe(null); setNotice(msg || 'Please sign in again.'); });
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    if (getToken()) {
      api('/auth/me').then(setMe).catch(() => setToken('')).finally(() => setChecking(false));
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (page, arg = '') => { window.location.hash = `#/${page}${arg ? `/${encodeURIComponent(arg)}` : ''}`; window.scrollTo(0, 0); };
  const signOut = () => { setToken(''); setMe(null); setNotice('Signed out.'); };

  if (checking) return <div className="c-login c-muted">Loading...</div>;
  if (!me) return <Login notice={notice} onSignedIn={(u) => { setNotice(''); setMe(u); }} />;

  const nav = [
    ['overview', 'Overview', true],
    ['companies', 'Companies', true],
    ['plans', 'Plans', true],
    ['announcements', 'Announcements', true],
    ['audit', 'Audit trail', can(me, 'audit.read')],
    ['console-users', 'Console users', can(me, 'console.users')],
    ['account', 'My account', true]
  ].filter(n => n[2]);

  let pageEl;
  switch (route.page) {
    case 'companies': pageEl = <Companies me={me} go={go} />; break;
    case 'new-company': pageEl = can(me, 'tenants.write') ? <NewCompany go={go} /> : null; break;
    case 'company': pageEl = <CompanyDetail key={route.arg} me={me} code={route.arg} go={go} />; break;
    case 'plans': pageEl = <Plans me={me} />; break;
    case 'announcements': pageEl = <Announcements me={me} />; break;
    case 'audit': pageEl = <Audit />; break;
    case 'console-users': pageEl = can(me, 'console.users') ? <ConsoleUsers me={me} /> : null; break;
    case 'account': pageEl = <Account me={me} />; break;
    default: pageEl = <Overview me={me} go={go} />;
  }
  const activeNav = route.page === 'company' || route.page === 'new-company' ? 'companies' : route.page;

  return (
    <div className="c-shell">
      <nav className="c-nav" aria-label="Console">
        <div className="c-brand"><img src="/millmate-icon.png" alt="" /><div>Mill Mate<small>Console</small></div></div>
        {nav.map(([page, label]) => (
          <button key={page} className={activeNav === page ? 'active' : ''} onClick={() => go(page)}>{label}</button>
        ))}
        <div className="c-nav-foot">
          {me.name || me.username} · {me.role}
          <div><button onClick={signOut} style={{ padding: '6px 0', color: 'var(--bad)' }}>Sign out</button></div>
        </div>
      </nav>
      <main className="c-main">{pageEl || <Alert>Your Console role does not allow this page.</Alert>}</main>
    </div>
  );
}
