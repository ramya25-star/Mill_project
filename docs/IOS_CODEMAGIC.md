# iPhone app: Apple account → Codemagic → TestFlight → App Store

Tick each box when it is done. Stop and ask if a screen looks different from what is written here.

- Apple account: **Individual, in Ramya's name**. The app can move to an Apronics account later; its users keep it.
- Bundle ID: **`tech.apranex.millmate`**. It can never be changed.
- Builds run on **Codemagic**, so no Mac is needed for each build. A Mac (or an iPhone/iPad) is needed only once, for enrolling.

Keep every key and password in `C:\Users\sivas\MillMate_secrets`. Never put them in chat or git.

---

## Step 1: Apple Developer account (Ramya)

- [ ] **1.1** Ramya's Apple Account has two-factor authentication on. The name on it is Ramya's real legal name, exactly as on Aadhaar or PAN, with no nickname and no company name.
- [ ] **1.2** On the friend's Mac, use a macOS user signed in with **Ramya's** Apple Account (not the MillMate user, which uses Alagiri's Apple ID). An iPhone or iPad of Ramya's also works.
- [ ] **1.3** Install the **Apple Developer** app from the App Store.
- [ ] **1.4** Apple Developer app → Account → **Enroll Now** → entity type **Individual** → accept the agreement.
- [ ] **1.5** Pay the yearly fee with **Ramya's own card**. Another person's card delays approval.
- [ ] **1.6** Wait for the "Welcome to the Apple Developer Program" email. This usually takes 1–2 days, longer if Apple asks for an ID photo.
  If you see "Unable to continue" or "Address not valid", contact Apple Developer Support straight away from developer.apple.com/contact. Don't wait for it to clear.

## Step 2: Register the app (Ramya signs in)

- [ ] **2.1** developer.apple.com → Certificates, Identifiers & Profiles → **Identifiers** → **+** → App IDs → App:
  - Description: `Mill Mate`
  - Bundle ID: **Explicit**, `tech.apranex.millmate`
  - Capabilities: leave the defaults.
- [ ] **2.2** appstoreconnect.apple.com → Apps → **+** → New App:
  - Platform iOS. Name `Mill Mate`. If that name is taken, use `Mill Mate - Purchase Orders`.
  - Language English (U.K.) or (U.S.). Bundle ID `tech.apranex.millmate`. SKU `millmate-ios`.
  - User Access: Full.
- [ ] **2.3** Users and Access → **Integrations** → **App Store Connect API** → **+**:
  - Name `Codemagic`, access **App Manager**.
  - Download the `.p8` file. **It can be downloaded only once.** Save it in `MillMate_secrets`.
  - Note the **Issuer ID** and **Key ID** shown on that page.
- [ ] **2.4** Users and Access → **+** → add Siva (and Dhanuja if wanted) with the **Admin** or **App Manager** role. Then Siva can do the rest without Ramya.

## Step 3: Codemagic (once)

- [ ] **3.1** codemagic.io → sign up **with GitHub**. Use a **personal** account, not a Team; only personal accounts get the free 500 Mac minutes a month.
- [ ] **3.2** **Add application** → GitHub → pick the Mill Mate repository (the one `deploy.ps1` pushes to) → project type **Ionic Capacitor**. When asked, choose **codemagic.yaml** as the configuration.
- [ ] **3.3** Settings → Integrations → **Developer Portal** → Connect / Manage keys → add the key:
  - Name: **`MillMate ASC`**, exactly; `codemagic.yaml` looks for this name.
  - Issuer ID, Key ID, and the `.p8` file.
- [ ] **3.4** Settings → **Code signing identities**:
  - **iOS certificates** → **Generate certificate** → type *Apple Distribution*, using the `MillMate ASC` key. Give it a reference name and keep the password it shows in `MillMate_secrets`.
  - developer.apple.com → **Profiles** → **+** → *App Store Connect* → App ID `tech.apranex.millmate` → the certificate just made → name `Mill Mate App Store` → Generate.
  - Back in Codemagic → **iOS provisioning profiles** → **Fetch profiles** → pick `Mill Mate App Store`.

## Step 4: First build → TestFlight

- [ ] **4.1** Codemagic → the app → **Start new build** → branch `main` → workflow **iOS -> TestFlight**.
  → *Expect:* it takes about 10–15 minutes, all steps are green, and the build is uploaded to App Store Connect.
  The build number looks like `5.1`. It is the Android versionCode, then a counter; phone updates rely on this.
- [ ] **4.2** App Store Connect → the app → **TestFlight**. Wait 10–30 minutes while the build shows "Processing".
- [ ] **4.3** TestFlight → **Internal Testing** → **+** → add yourself and the Alagiri people (each must first be added under Users and Access).
  Internal testers get the app **without Apple review**.
- [ ] **4.4** On an iPhone: install **TestFlight** from the App Store, accept the invite, install Mill Mate, and run the iPhone checks below.

### iPhone checks
- [ ] Log in with the company code empty (Alagiri).
- [ ] Create a request. Attach a photo using the camera, and one from the photo library. Both ask for permission first.
- [ ] Open a PO → **Share PDF**. The share sheet opens and WhatsApp can send it.
- [ ] Edit a dispatch date and change a status. The date stays.
- [ ] Nothing is hidden under the notch or the home bar.
- [ ] Close the app fully and reopen it after the next `deploy.ps1`. The over-the-air update arrives.
- [ ] Settings → **Delete My Account** is visible. Don't use it on a real account.

## Step 5: Reviewer demo company (Console, after the next deploy)

Apple's reviewer must not see Alagiri's real orders.

- [ ] **5.1** Console → Companies → **+ New company**:
  - Code `DEMO`, name `Demo Paper Mill`, plan **Internal (no billing)**.
  - Main Admin `appreview` with a strong password.
- [ ] **5.2** Log in to the app as `DEMO` / `appreview` and add sample data:
  - 2 departments;
  - 3 suppliers with made-up numbers;
  - 4–5 requests at different stages (one with a PO, one Received).
- [ ] **5.3** Add a second Main Admin `demoowner` in DEMO. If the reviewer tests Delete My Account, it then works, and the company keeps an admin.

## Step 6: App Store listing and submit

App Store Connect → the app → **App Store** tab, version 1.4:

- [ ] **Screenshots** (6.9-inch iPhone, at least 3). I'll make them from the DEMO company.
- [ ] **Description**, **keywords** and **promotional text**. I'll write them.
- [ ] **Support URL** and **Privacy Policy URL**: `https://alagiri-mill.vercel.app/privacy.html`. Move them to apranex.tech when that site exists.
- [ ] **Category** Business. **Age rating**: answer "No" to everything, which gives 4+.
- [ ] **App Privacy**:
  - Data collected: Name, Email, Phone number, Photos, Other user content, User ID.
  - All of them are *App Functionality* and *Linked to the user*. **No tracking.**
- [ ] **Sign-in information for review**:
  - Company code `DEMO`, username `appreview`, password.
  - Review notes:
    > Mill Mate is a purchase-order app that Apronics sells directly to companies (mills) for their staff (guideline 3.1.3(c)).
    > Accounts are created by each company's administrator; there is no public sign-up and no in-app purchase.
    > Enter company code DEMO on the login screen.
    > Account deletion: Settings › Delete My Account.
- [ ] Pick the TestFlight build → **Add for Review** → **Submit**. Review usually takes 1–2 days.

---

## Later

- **New native plugin, permission or icon:**
  1. Raise the Android `versionCode` and `versionName` in `android/app/build.gradle`.
  2. Build Android as usual and run a new Codemagic build.
  3. Phone updates (`deploy.ps1`) skip installs below that versionCode, on both Android and iPhone.
- **Web-only changes:** `deploy.ps1` alone updates installed iPhones too. No new Codemagic build is needed.
- **Moving the app to Apronics:** when Apronics has its own Apple Organization account, use App Store Connect → App Information → **Transfer App**. The bundle ID and users stay.
