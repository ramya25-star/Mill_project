# Mill Mate multi-company (SaaS): deploy and test plan

Work through this from top to bottom. Tick each box, `- [x]`, when it passes.

If a step fails:
- Write down the test number, what you did, and what you saw. A screenshot helps.
- Send that to me.
- **Do not continue past Part 1 if anything in 1C fails.** Go to the rollback section at the end.

**Words used here**
- **Console**: the owner's admin website, at `https://alagiri-mill.vercel.app/console/`.
- **App**: Mill Mate itself, at `https://alagiri-mill.vercel.app`, plus the phone apps.
- **Company code**: what a user types on the login screen. Alagiri users leave it empty.
- **TESTMILL**: the test company you will create. It stays in the Console, cancelled, because nothing is ever deleted.

**Before you start**
- Pick a quiet time, such as an evening or Sunday, when Alagiri staff are not working. The server restarts once.
- Have:
  - your laptop;
  - your phone with **Google Authenticator** or **Microsoft Authenticator** installed;
  - a second browser, or an incognito window, so you can be signed in as two people;
  - one spare mobile number with WhatsApp to act as a test supplier (your own is fine).
- Allow about 2 hours, plus 10 minutes the next morning.

---

## Part 1: Deploy

### 1A. Prepare (laptop)

- [ ] **1A.1** Tell me "go". I will merge `saas-platform` into `main` on your laptop. Nothing is pushed yet.
- [ ] **1A.2** Take a fresh backup of the live data before anything changes. Run:
  `ssh -i ~/.ssh/millmate-api.pem ubuntu@api.alagiriduplex.com "sudo systemctl start millmate-backup.service && sudo journalctl -u millmate-backup -n 5 --no-pager"`
  → *Expect:* the last lines say the backup finished, with no error.
  If the SSH connection is refused, run `.\scripts\check-whatsapp.ps1` once; it opens the firewall for your current IP and only reads from the server. Then try again.
- [ ] **1A.3** Note the version running now:
  `ssh -i ~/.ssh/millmate-api.pem ubuntu@api.alagiriduplex.com "git -C /opt/millmate rev-parse --short HEAD"`
  → Write it here: `__________`. You need it if you have to go back.

### 1B. Deploy

- [ ] **1B.1** In the project folder, run `.\deploy.ps1 -Message "Multi-company platform and Console"`.
  Running it is your OK to push `main` to GitHub.
  → *Expect:* all 8 steps go green and it ends with the health check passing.
- [ ] **1B.2** Open GitHub, go to Dhanuja's fork, and press **Sync fork**. Wait about 2 minutes for Vercel to finish.
- [ ] **1B.3** Open `https://alagiri-mill.vercel.app` and press Ctrl+F5.
  → *Expect:* the login screen now has a **Company code** box with the hint "Leave empty if not given".

### 1C. Alagiri must still work (smoke test, about 10 minutes)

If any of these fail, stop and go to the rollback section.

- [ ] **1C.1** Log in as an Alagiri user with the company code **empty**.
  → *Expect:* you are logged in as before, with no banner about trial or payment.
- [ ] **1C.2** All the old data is there:
  - Live Orders counts look the same as before the deploy;
  - suppliers, users and old POs are all present.
- [ ] **1C.3** Open one existing PO and download or share the PDF.
  → *Expect:* the same Alagiri addresses and signatory as before.
- [ ] **1C.4** Create one new request and move it one step forward. Use a real one, or a test one you will cancel.
  → *Expect:* it saves with no error.
- [ ] **1C.5** Log in once with the company code typed as `ALAGIRI`.
  → *Expect:* it works exactly like an empty code.
- [ ] **1C.6** The Play Store reviewer account `playreview` can still log in with the code empty. Don't change its password.
- [ ] **1C.7** On an Android phone that has the app, close the app fully and reopen it twice. This lets the over-the-air update arrive.
  → *Expect:* the Company code box appears, and login works with it empty.

---

## Part 2: Console accounts

Decide first who gets the **owner** account. Owner can see money, plans and everything else.
Since Mill Mate now belongs to Apronics, I suggest:
- **owner** = you, for Apronics;
- **support** = Dhanuja.

Alagiri is now just a customer and does not need Console access.

- [ ] **2.1** Create the owner account:
  `.\scripts\create-console-user.ps1 -Username <you> -Role owner -Name '<Your name>' -Password '<at least 8 characters>'`
  → *Expect:* step "2/2 Creating Console user" finishes with no red error.
- [ ] **2.2** Open `https://alagiri-mill.vercel.app/console/` and sign in.
  → *Expect:* it shows a **setup key**.
  - In the authenticator, choose "Enter a setup key", type it, and pick time-based.
  - Type the 6-digit code.
  → *Expect:* the Overview page opens.
- [ ] **2.3** Sign out, then sign in again.
  → *Expect:* it asks for the password **and** a fresh 6-digit code, and does not show the setup key again.
- [ ] **2.4** Wrong-code test: type a wrong 6-digit code once.
  → *Expect:* a clear error. Then the right code works.
  *Don't* get it wrong 5 times: that locks the username for 15 minutes.
- [ ] **2.5** Console users: add Dhanuja as **support** with a temporary password. Dhanuja then signs in on their own laptop and sets up an authenticator.
- [ ] **2.6** My account: change your password.
  → *Expect:* "Password changed. Other signed-in devices were signed out."
  If the Console is open in a second browser, it must now ask that browser to sign in again.

---

## Part 3: Create the test company

- [ ] **3.1** Plans: confirm you see **Internal (no billing)** and **Standard**.
  Open Internal and try changing a limit.
  → *Expect:* refused: "The Internal plan always has every feature and no limits. Only its name can be changed."
- [ ] **3.2** Plans: create **"Test small"** with **Max active users = 3**, and leave the other limits empty.
- [ ] **3.3** Companies: open **+ New company** and fill in:
  - Company code `TESTMILL`
  - Name `Test Mill (delete later)`
  - Plan `Test small`
  - Free trial `14`
  - Grace days `3`
  - Main Admin username `testadmin`, a temporary password, and your mobile number
  - One PO address (e.g. "TEST MILL / 1, TEST STREET / KOVILPATTI")
  - Signatory "Test Signatory"
  → *Expect:* the company opens with the **Trial** badge.
- [ ] **3.4** Try creating another company with code `TESTMILL`.
  → *Expect:* refused, because the code is already used.
- [ ] **3.5** Overview: TESTMILL appears in the company list. Alagiri shows **Internal**.

---

## Part 4: The test company in the app

Use the second browser or incognito window for this part.

- [ ] **4.1** Log in with company code `TESTMILL`, username `testadmin` and the temporary password.
  → *Expect:* it forces a password change, then opens with a **trial** banner.
- [ ] **4.2** It is empty: no Alagiri suppliers, orders, users or POs anywhere. **This is the most important check.**
- [ ] **4.3** Settings › Company & Subscription:
  - shows the plan, the trial end date and the PO address you entered;
  - add a second PO address and save.
- [ ] **4.4** Add a department, a supplier (use the spare WhatsApp number), and one request. Take it through to a PO and open the PO PDF.
  → *Expect:* the TEST MILL address and "Test Signatory".
  → **There must be no Alagiri address anywhere on it.**
- [ ] **4.5** Go back to the Alagiri browser and refresh.
  → *Expect:* none of TESTMILL's supplier, request or PO appear in Alagiri.
- [ ] **4.6** Wrong company code: log out, then log in as `testadmin` with the company code **empty**.
  → *Expect:* it fails, because that user doesn't exist in Alagiri.
  Try code `NOSUCHCO`.
  → *Expect:* "Unknown company code. Please check it with your administrator."

---

## Part 5: Plan limits (Test small allows 3 active users)

- [ ] **5.1** As testadmin, add users until there are 3 active, counting testadmin.
  Then try a 4th.
  → *Expect:* refused, with a message about the plan's user limit.
- [ ] **5.2** Disable one user. Add a new user, which now works. Then try to **enable** the disabled one again.
  → *Expect:* refused, the same limit message.
- [ ] **5.3** Console › TESTMILL › Users: try enabling that user from the Console.
  → *Expect:* also refused.
- [ ] **5.4** Reset a user's password, from the app or the Console.
  → *Expect:*
  - a random temporary password shown once (not `Alagiri<name>`);
  - the user must change it at next login.

---

## Part 6: Subscription states

Do these in order on TESTMILL. After each change, refresh the TESTMILL app window.

- [ ] **6.1 Payment during trial.** In Payments, record ₹1, method UPI, 1 month.
  → *Expect:*
  - "Payment recorded and access extended";
  - **Paid until** is about 1 month **after the trial end date**, not after today;
  - the badge says **Active**.
- [ ] **6.2 Save keeps the payment.** In "Plan and subscription", change only Grace days to 5 and press Save.
  → *Expect:* Paid until is **unchanged**.
- [ ] **6.3 Payment due.** Set Trial ends and Paid until both to **yesterday**, Grace days 3, then Save.
  → *Expect:*
  - the badge says **Payment due**;
  - the app shows a warning banner;
  - you can still create and edit.
- [ ] **6.4 View-only.** Set Grace days to 0 and Save.
  → *Expect:*
  - the badge says **View-only**;
  - the app shows data, but saving anything is refused with a clear message.
- [ ] **6.5 Paused.** Set Paid until a month ahead and Save, so it is Active again. In Access, enter a reason and press **Pause access**.
  → *Expect:*
  - the TESTMILL app session stops working;
  - logging in is refused;
  - the reason shows in the audit trail.
- [ ] **6.6 Resume.** Press **Resume access**.
  → *Expect:* login works again, and the data is all still there.
- [ ] **6.7** On Alagiri's company page in the Console, the Access card says it cannot be paused, and there is no Pause button.

---

## Part 7: Support visit

- [ ] **7.1** Console › TESTMILL › Support access says "Not allowed right now", and the button is disabled.
- [ ] **7.2** In the TESTMILL app as testadmin, go to Settings › Company & Subscription and press **Allow support for 24 hours**.
- [ ] **7.3** Refresh the Console.
  → *Expect:* it shows "allowed until …".
  Press **Open their app as support (30 min)**.
  → *Expect:*
  - a new tab opens TESTMILL's app with a support banner;
  - if the browser blocks it, a link appears instead.
- [ ] **7.4** Audit trail shows the support visit, with your name and the time.
- [ ] **7.5** Sign in to the Console as Dhanuja (support). Check:
  - Dhanuja **cannot** see the Payments form or change plans;
  - Dhanuja **can** see usage, users and support access.

---

## Part 8: Announcements

- [ ] **8.1** Create an announcement with the message "Test notice", type Information, and **Only for company code = TESTMILL**.
  → *Expect:* it shows at the top of the TESTMILL app and **not** in Alagiri's app.
- [ ] **8.2** Try "Show until" earlier than "Show from".
  → *Expect:* refused: "End must be after the start."
- [ ] **8.3** Press **Hide** on the test announcement.
  → *Expect:* it disappears from the app.

---

## Part 9: WhatsApp (real messages)

- [ ] **9.1** In TESTMILL, send the test supplier (your spare number) a PO or availability request.
  → *Expect:* the WhatsApp message arrives with TEST MILL's details.
- [ ] **9.2** Reply from that phone, for example by choosing a dispatch date.
  → *Expect:* the reply updates the **TESTMILL** order, and nothing changes in Alagiri.
- [ ] **9.3** Alagiri's real suppliers keep getting their normal messages. Ask Alagiri the next day if anything looked odd.

---

## Part 10: Phones

- [ ] **10.1 Android:** log in with the code empty (Alagiri), then log out and log in with `TESTMILL`.
  → *Expect:*
  - both work;
  - the code is remembered on the next login;
  - the PO share or PDF works.
- [ ] **10.2 iPhone** (home-screen web app): the same as 10.1, in Safari.
- [ ] **10.3 Dark mode** on the phone: the login, the banners and Settings › Company & Subscription are readable.

---

## Part 11: Next morning (10 minutes)

- [ ] **11.1** Console › TESTMILL and Console › Alagiri: the **Morning jobs** card shows last night's and this morning's runs, with no errors.
- [ ] **11.2** The daily summary WhatsApp arrived for Alagiri as usual. It arrives for TESTMILL only if its plan has the daily summary switched on.
- [ ] **11.3** The backup ran. In AWS S3 › the backup bucket › `backups/`, there are today's files for Alagiri **and** `TESTMILL`, plus `platform`.
- [ ] **11.4** Alagiri staff used the app normally. Ask them.

---

## Part 12: Clean up

- [ ] **12.1** Console › TESTMILL › Access: **Cancel**, with the reason "test company".
- [ ] **12.2** Plans: edit "Test small", untick **Offered for new companies**, and save.
- [ ] **12.3** On the test supplier's phone, delete the test chats if you like.

---

## Rollback: if Part 1C fails

1. Don't keep testing. Send me the error first if you can.
2. Put the server back to the version you wrote down in 1A.3:
   `ssh -i ~/.ssh/millmate-api.pem ubuntu@api.alagiriduplex.com "sudo -u millmate git -C /opt/millmate reset --hard <old version> && sudo -u millmate -H bash -c 'cd /opt/millmate/server && npm install --omit=dev' && sudo systemctl restart millmate"`
3. The data is safe:
   - the new version only **adds** things to the database;
   - the old version ignores them;
   - the backup from 1A.2 is in S3.
4. Tell me before running `deploy.ps1` again.

## What to send me for each problem

```
Test number:
What I did:
What I expected:
What happened (exact message / screenshot):
Browser or phone:
```
