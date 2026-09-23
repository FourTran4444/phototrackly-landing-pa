# Lead collection in Google Drive — no database

Destination: [PhotoTrackly Early Access Leads](https://docs.google.com/spreadsheets/d/1TG7qUvW0C8uu9WaGMKCSUTaamjZFdIxkNFJKlRxBl2c/edit), **Leads** tab.

The website remains a Next.js landing page on Vercel. Both forms use:

**Browser → `/api/early-access` → Google Apps Script → Google Sheet**

No Supabase, PostgreSQL, SQLite, database migration, or service-account key is needed. The Sheet is the lead list. The ChatGPT Google Drive connection is for operations in this conversation; it does not automatically grant the deployed website access.

## One-time Google setup

1. Open Google Apps Script under the account with edit access to the Sheet. Create a **dedicated project** for this landing page. There is older intake code in `qrTrackly`; do not replace that deployment while another website still uses its older request format.
2. Paste `integrations/google-apps-script/Code.gs` into `Code.gs`. In Project Settings enable the manifest file and use the supplied `appsscript.json`. This script requests Sheets access only, not Mail access. The intended Sheet ID is already set in the code.
3. Add the Script Property `WEBHOOK_SECRET` with a random value of at least 32 characters. Generate it locally, for example:
   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
   Store the value securely; do not paste it into chat or commit it to Git. Keep it stable because it also signs private registration-removal links.
4. Choose **Deploy → New deployment → Web app**, execute as **Me**, and access **Anyone**. Authorize Google when prompted. This publishes only a secret-protected receiver, not your Sheet. Keep the Sheet's sharing restricted. Workspace policies can prevent anonymous web apps; an administrator may need to permit this deployment.
5. Copy the resulting `/exec` URL. In the existing Vercel `phototrackly-landing-pa` project, add server-only environment variables:
   - `LEAD_WEBHOOK_URL`: that Google Apps Script `/exec` URL.
   - `LEAD_WEBHOOK_SECRET`: the same secret used in Script Properties.
   Keep `NEXT_PUBLIC_SITE_URL` set to the real origin and `NEXT_PUBLIC_GA_ID=G-0PSP21DKNJ`. Redeploy after changing environment settings.
6. Submit a clearly labeled test through each form. Confirm its row in the **Leads** tab, including country, source, consent, and consent version. Retry an unchanged request and confirm it does not duplicate the row. Save the receipt; use its private removal link, confirm removal, and verify the associated row disappears.

**Deployment status:** the code and Sheet headers are prepared. The live Apps Script deployment and Vercel environment configuration are not completed by a Git commit or a Drive connector call. Until these are set, the API returns an error, never a fabricated success. No email is sent or promised by this receiver.

## Sheet layout and preservation

Existing columns A:Q are preserved, including existing campaign fields and `request_id`. New headers R:V are `Country`, `Consent`, `Consent Version`, `request_hash`, and `withdrawal_hash`. These header additions were made through the connected Drive tools on 23 September 2026; no lead rows or other tabs were changed.

The receiver checks the headers before writing; it fails rather than replacing a mismatched column. The new forms map challenge to **Manual Bottleneck**, volume to **Monthly Orders**, and source to `phototrackly-landing:hero` or `phototrackly-landing:footer`. Fields not collected by the new page remain blank rather than fabricated. Notification status is `not-configured`. The receiver does not write to Events, Prospects, Interviews, Content, Dashboard, Activity, or Feedback.

## Safeguards and limitations

The secret stays on the server and in Script Properties. The server only posts to a Google Apps Script URL; ContentService redirects are read with GET without forwarding contact details or the secret. A valid response must confirm `saved: true` and the matching request ID. A health response, login page, timeout, or HTTP 200 alone is insufficient.

A script lock serializes receiver writes. Request IDs and hashes prevent retries from adding duplicates or changing an accepted submission. Values beginning with formula characters are escaped before insertion. The Google script rechecks consent and field constraints. Keep the private Sheet restricted to the operators who need it.

Google Script Cache provides lightweight per-connection throttling (eight new submissions per hour); it is best effort, not a durable rate limit. Configure Vercel's edge abuse controls for public campaigns. Raw IP addresses are not saved in lead rows; only keyed representations are sent for rate checks. Google service quotas and Workspace policies still apply.

The removal endpoint deletes only a row matching the hash of its private token, and only after explicit confirmation. It does not erase copies, Sheet revision history, exports, or provider backups. Do not treat hidden columns as access control. Establish appropriate access, retention, and follow-up practices for the private Sheet. Existing registrations from a previous provider are not automatically migrated.

## Tests

Unit tests exercise the real Apps Script source in a simulated Sheets environment and test the server transport's confirmation and redirect handling. Browser/API tests use a test-only Node preload for the same receiver and inspect an isolated JSON fixture. These are **not** live Google submissions and are never enabled on Vercel. The production code contains no mock-storage fallback.

Official references: [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [ContentService redirects](https://developers.google.com/apps-script/guides/content).
