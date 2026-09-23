# Google Sheet lead capture + owner email — no database

Destination: [PhotoTrackly Landing Page — Early Access Leads](https://docs.google.com/spreadsheets/d/1Vqoauc6MORXZ8cwlTX7eKHXLfju3zKE-uS7wbwitJkE/edit), **Leads** tab.

Owner notification recipient: **tranvantubk@gmail.com**. The older PhotoTrackly CRM spreadsheet is not the destination of this receiver; its existing records are not migrated or modified.

**Website form → `/api/early-access` → Google Apps Script → save in Sheet → notify owner by email.**

Use both files from `integrations/google-apps-script/`: **Code.gs** and **appsscript.json**. No database, paid email provider, SMTP password, or service-account key is needed. A Git commit does not deploy Google Apps Script or authorize the website.

## 1. Open the script editor and paste the code

Open the new Sheet and choose **Extensions → Apps Script**. In this dedicated project, replace the contents of **Code.gs** with the repository file. Do not overwrite another website's Apps Script project or add a second copy of the receiver.

The code already contains:

```js
const SHEET_ID = '1Vqoauc6MORXZ8cwlTX7eKHXLfju3zKE-uS7wbwitJkE';
const NOTIFICATION_EMAIL = 'tranvantubk@gmail.com';
```

The Leads tab's 22 A:V columns must keep their existing names/order. No extra trigger is needed; the website calls `doPost` directly.

## 2. Add the mail permission

Open **Project Settings**, enable **Show "appsscript.json" manifest file in editor**, then return to the editor and replace **appsscript.json** with the included file. It requests only spreadsheet access and `https://www.googleapis.com/auth/script.send_mail`. It does not request access to read your Gmail inbox.

## 3. Set one shared secret

In **Project Settings → Script Properties**, add `WEBHOOK_SECRET` with at least 32 random characters. Generate a value on your own computer, for example:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep it private and stable. Never put it in the Sheet, Git, chat, a public environment variable, or a URL. If an existing dedicated deployment is already using a strong secret, preserve it; it signs registration-removal links as well as protecting the webhook.

## 4. Test email and publish

Save. Select **sendTestEmail** in the editor's function dropdown and click **Run**. Authorize spreadsheet access and sending email using the Google account that has edit access to this Sheet. This explicitly sends one test notification to `tranvantubk@gmail.com`, with subject **[PhotoTrackly] Email notification test**. Check Inbox and Spam. It does not add a lead row and does not prove the website is connected. Do not run `doPost` manually; it needs a website request.

Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Review the Google authorization prompts and deploy. The public receiver still rejects requests without the server-only secret. Keep Sheet sharing restricted. Workspace policies may restrict anonymous web apps.

Copy the **Web app URL ending in `/exec`**, not the Script ID or `/dev` test URL. For an already deployed dedicated script, use **Deploy → Manage deployments → Edit → New version → Deploy**, and authorize the new mail scope. Saving code alone does not update a versioned web app.

## 5. Connect Vercel and test the real form

In the existing `phototrackly-landing-pa` Vercel project, set these server-only environment variables for the intended deployment environment:

```dotenv
LEAD_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
LEAD_WEBHOOK_SECRET=the-same-private-value-as-WEBHOOK_SECRET
```

Keep `NEXT_PUBLIC_SITE_URL` set to the actual website origin and `NEXT_PUBLIC_GA_ID=G-0PSP21DKNJ`. Redeploy after changing environment values. Use a separate test receiver/Sheet for independent development rather than sending test traffic to the real lead list.

Submit a clearly labeled registration through each website form. Verify a new row in this Sheet and a notification in the owner's inbox. Retry the same unchanged request and verify that no second row or notification is created. Save its private removal receipt and test removal; confirm the corresponding active Sheet row disappears.

## Notification behavior

The notification contains submitted name, work email, company, role, country, monthly jobs, workflow challenge, form location, consent, time, reference, and the new Sheet link. Optional fields are labeled **Not provided**, not fabricated. It is plain text, with a sanitized subject and a single validated Reply-To mailbox when possible. The recipient is fixed in code; form input cannot change it. Secrets, raw IP addresses, request hashes and removal tokens are excluded. No automatic email is sent to the visitor.

The Sheet write is completed before email is attempted. Column **Q (`notification_status`)** records:

- `sent`: MailApp accepted the send; this does not prove inbox delivery.
- `failed`: Sending was not confirmed, for example because mail authorization failed.
- `quota-exceeded`: No daily recipient quota remained; no send was attempted.
- `pending`: No final status was saved; check the owner's inbox before resending.

Mail or notification-status errors do not turn a saved lead into a failed registration. Retries with an existing request ID never resend email, even after a mail error. There is no automatic mail retry queue. Review non-sent rows and handle follow-up manually; if delivery is uncertain, check the inbox first to avoid duplicates. Google mail quotas still apply and may be shared with other scripts on the same account.

A script lock serializes writes and the notification attempt. The website has a bounded timeout; an ambiguous network timeout can occur after the row was saved. Retrying with the unchanged request ID safely retrieves the existing confirmation.

## Privacy and safety

The server and script recheck consent and field constraints. The public website has no endpoint for reading the Sheet. The request ID and hash prevent duplicate retries or changed accepted payloads. Formula-like cell content is escaped. Google Script Cache supplies lightweight throttling, not a guaranteed durable rate limit; configure hosting edge controls for public campaigns.

The private removal link deletes the matching active Sheet row only. It does not erase the owner's notification email, exports, revision history or provider backups. Keep access restricted and establish retention and follow-up procedures. Do not use the Sheet's hidden columns as access control.

## Verification and activation status

The receiver/email unit tests use the actual Apps Script code with simulated Google Sheet and MailApp services. They do not send real email or prove live authorization. The code and Sheet are prepared; live Apps Script deployment, Google permission approval, Vercel settings and real submission checks must be completed before claiming live capture or notification delivery.

References: [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app), [web apps](https://developers.google.com/apps-script/guides/web), [manifests](https://developers.google.com/apps-script/concepts/manifests), [Google service quotas](https://developers.google.com/apps-script/guides/services/quotas).
