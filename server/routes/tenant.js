// The signed-in user's own company: subscription status, plan, announcements,
// Company Profile (PO addresses, signatory) and the "allow Mill Mate support"
// switch.
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { tenantLimits, activeAnnouncements, platformDb, getTenant, audit } from '../platform.js';
import { getCompanyProfile, cleanCompanyProfile, saveCompanyProfile } from '../companyProfile.js';

const router = Router();
router.use(requireAuth);

const accessView = (access) => ({
  state: access.state,
  canWrite: access.canWrite,
  message: access.message || '',
  endsOn: access.endsOn || null,
  daysLeft: access.daysLeft ?? null
});

router.get('/', (req, res) => {
  const { plan, features, limits } = tenantLimits(req.tenant.code);
  const tenant = getTenant(req.tenant.code);
  res.json({
    code: tenant.code,
    name: tenant.name,
    access: accessView(req.tenantAccess),
    plan: plan ? { id: plan.id, name: plan.name } : null,
    features,
    limits,
    announcements: activeAnnouncements(tenant.code),
    supportAccessUntil: tenant.supportAccessUntil && Date.parse(tenant.supportAccessUntil) > Date.now() ? tenant.supportAccessUntil : null,
    isSupportSession: !!req.user.isSupport,
    profile: getCompanyProfile()
  });
});

router.get('/profile', (req, res) => {
  res.json(getCompanyProfile());
});

router.put('/profile', requireRole('Main Admin'), (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Profile must be an object.' });
  }
  const { profile, error } = cleanCompanyProfile(req.body);
  if (error) return res.status(400).json({ error });
  res.json(saveCompanyProfile(profile));
});

// Main Admin lets Mill Mate support open the app for up to 72 hours (0 = stop now).
router.put('/support-access', requireRole('Main Admin'), (req, res) => {
  if (req.user.isSupport) return res.status(403).json({ error: 'Support sessions cannot change support access.' });
  const hours = Number(req.body?.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 72) {
    return res.status(400).json({ error: 'Hours must be between 0 and 72.' });
  }
  const until = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
  platformDb.prepare("UPDATE tenants SET support_access_until = ?, updated_at = datetime('now') WHERE code = ?").run(until, req.tenant.code);
  audit(`company:${req.tenant.code}:${req.user.username}`, hours > 0 ? 'support.allow' : 'support.revoke', req.tenant.code, { hours });
  res.json({ supportAccessUntil: until });
});

export default router;
