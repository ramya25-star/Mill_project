// Creates (or resets) a Mill Mate Console user. The first one must be made this
// way, on the server, because the Console has no sign-up page.
//
//   CONSOLE_PASSWORD='...' node scripts/create-console-user.js <username> <owner|admin|support> ["Full name"]
//
// Resetting an existing user also clears their authenticator, so they set it
// up again at the next sign-in (use this if a phone is lost).
import '../loadEnv.js';
import bcrypt from 'bcryptjs';
import { platformDb, newId, audit, PLATFORM_DB_PATH } from '../platform.js';
import { PLATFORM_ROLES } from '../middleware/platformAuth.js';

const [username, role, name = ''] = process.argv.slice(2);
const password = process.env.CONSOLE_PASSWORD
  || (process.env.CONSOLE_PASSWORD64 ? Buffer.from(process.env.CONSOLE_PASSWORD64, 'base64').toString('utf8') : '');

if (!username || !PLATFORM_ROLES.includes(role) || !/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
  console.error(`Usage: CONSOLE_PASSWORD='...' node scripts/create-console-user.js <username> <${PLATFORM_ROLES.join('|')}> ["Full name"]`);
  process.exit(1);
}
if (password.length < 8) {
  console.error('CONSOLE_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const existing = platformDb.prepare('SELECT * FROM platform_users WHERE username = ? COLLATE NOCASE').get(username);
if (existing) {
  platformDb.prepare('UPDATE platform_users SET password_hash = ?, role = ?, enabled = 1, totp_enabled = 0, totp_secret = NULL, totp_last_step = NULL, name = COALESCE(NULLIF(?, \'\'), name) WHERE id = ?')
    .run(hash, role, name, existing.id);
  audit('server-script', 'console_user.reset', null, { username, role });
  console.log(`Console user "${existing.username}" reset (role ${role}). Authenticator will be set up again at next sign-in.`);
} else {
  platformDb.prepare('INSERT INTO platform_users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)')
    .run(newId('pu'), username, hash, role, name);
  audit('server-script', 'console_user.create', null, { username, role });
  console.log(`Console user "${username}" created (role ${role}).`);
}
console.log(`Platform database: ${PLATFORM_DB_PATH}`);
