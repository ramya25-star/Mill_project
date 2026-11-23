# Mill Mate multi-company (SaaS) and the Console

Mill Mate now serves many companies from one server. Each company gets its own
separate database, its own users and its own suppliers. The **Mill Mate
Console** is where the platform owner manages the companies.

- App (every company): https://alagiri-mill.vercel.app
- Console (platform owner and support only): https://alagiri-mill.vercel.app/console/

## Who does what

| Console role | Who | Can do |
|---|---|---|
| owner | Alagiri Duplex (master control) | Everything: plans, payments, companies, Console users, data copies |
| admin | Owner's staff | Companies, payments, announcements |
| support | Developers (Siva, Dhanuja) | Help companies: view usage, reset a user's password, support visits. No money, no plans. |

## How it works

- **Company code**: users type it on the login screen (for example `XYZMILLS`).
  It is remembered on the phone. An empty code means the original company
  (Alagiri Duplex), so existing users sign in exactly as before.
- **Data**:
  - Alagiri Duplex keeps its original database file, untouched.
  - Each new company gets its own `tenants/<code>.db`, next to it.
  - The Console's own data is in `platform.db`.
  - All of them are backed up nightly to S3 (`backups/`).
- **Subscription** (worked out automatically each day, India time):

  | Situation | Status | What users can do |
  |---|---|---|
  | Free trial running | Trial | Full access |
  | Paid period running | Active | Full access |
  | Paid period or trial ended, still in grace days | Payment due | Full access, with a warning banner |
  | Grace days also over | View-only | See data, cannot change it. No WhatsApp reminders. |
  | Paused or Cancelled in the Console | Blocked | Cannot sign in. Data is kept. |

  - Alagiri Duplex is internal: it never expires and cannot be paused.
- **Payments**: recorded by hand for now (bank transfer, UPI or cheque). Recording
  one extends "paid until" by the months you enter. Online payment
  (Razorpay) can be added later.
- **Plans**:
  - Name and prices are for your records.
  - Optional limits: maximum users, maximum new requests per month.
  - Feature switches: WhatsApp, daily summary, supplier reminders.
- **WhatsApp**: one shared Mill Mate number. Each supplier reply is matched back
  to the right company.
- **Support visits**: a company's Main Admin taps **Settings > Company &
  Subscription > Allow support for 24 hours**. Then support can press **Open
  their app as support** in the Console. That gives a 30-minute session, and every
  visit is in the audit trail.

## First-time setup (after this version is deployed)

1. Deploy as usual (`.\deploy.ps1` from `main`), then **Sync fork** for Vercel.
2. Create the owner's Console account:
   ```powershell
   .\scripts\create-console-user.ps1 -Username <owner-username> -Role owner -Name '<Owner name>' -Password '<strong password>'
   ```
3. Create the developers' accounts with `-Role support`.
4. Each person opens the Console and signs in. The first time, the Console shows a
   **setup key**: add it in Google Authenticator or Microsoft Authenticator ("Enter a
   setup key", time-based), then type the 6-digit code. After that, every
   sign-in needs the password and a fresh code.
5. Lost phone: run the same script again for that username. It resets the
   password and the authenticator.

## Adding a new company

1. Console > **Companies > + New company**.
2. Fill in:
   - **Company code**: cannot be changed later.
   - **Company name** and contact details.
   - **Plan**, trial days and grace days.
   - **First Main Admin** username, temporary password, name and mobile.
   - At least one **PO address** and the **authorized signatory**.
3. Give the company its code, username and temporary password. They must
   change the password at first login.
4. Their Main Admin adds departments, users and suppliers in the app, and more
   addresses in Settings > Company & Subscription.

## Optional server settings (`/etc/millmate.env`)

| Setting | Default | Purpose |
|---|---|---|
| `APP_PUBLIC_URL` | `https://alagiri-mill.vercel.app` | App address used for support visits |
| `PLATFORM_JWT_SECRET` | derived from `JWT_SECRET` | Separate secret for Console sessions |
| `PLATFORM_DB_PATH` | next to `DB_PATH` | Console database file |
| `TENANT_DATA_DIR` | `tenants/` next to `DB_PATH` | Where company databases live |
| `DEFAULT_TENANT_CODE` | `ALAGIRI` | Code of the original company |

## Not built yet (decide later)

- Online payment (Razorpay) and GST invoice PDFs.
- A company using its own WhatsApp number (today everyone shares the Mill Mate number).
- Permanently deleting a cancelled company's data. Today: download a data copy
  (owner), then cancel. Nothing is deleted automatically.
