# Pre-launch handoff — Google Drive intake

The editorial redesign has been merged into the repository. This follow-up removes the separate database requirement while preserving the landing design, sample interactions, both forms, and consent-gated GA4.

## Lead collection

Use **[PhotoTrackly Early Access Leads](https://docs.google.com/spreadsheets/d/1TG7qUvW0C8uu9WaGMKCSUTaamjZFdIxkNFJKlRxBl2c/edit)** in Google Drive. Both forms use a server-side Google Apps Script receiver. Follow [GOOGLE-SHEETS-LEADS.md](GOOGLE-SHEETS-LEADS.md).

Only `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET` are needed for collection. The obsolete database adapters, migration, and database CI service have been removed. Remove obsolete database environment variables from Vercel when activating the new receiver. Keep server secrets out of public environment variables, Git, and chat.

The Google Sheet headers are prepared. A live Apps Script web-app deployment and the Vercel environment settings still need owner authorization; the GitHub or ChatGPT Drive connection does not complete those steps. Verify a submission and explicit removal on the live site before sending traffic. Do not claim live registration until the Sheet row is confirmed.

Use the existing Vercel `fourtrans-projects` / `phototrackly-landing-pa` project, not a duplicate. The currently connected Vercel tool account could not administer that team during the redesign. Protected previews may require sign-in. The supplied chatgpt.site sample is not modified by repository changes.

## Imagery

Replacement on-site camera photograph: Gordon Cowie, Unsplash, https://unsplash.com/photos/a-man-holding-a-camera-on-a-tripod-KTMUmXEu-Xw . Listed under the Unsplash License. Other stock and supplied-design photographs are centralized in `lib/images.ts` and `components/prelaunch/media.tsx`; they are illustrative, not customer media or endorsements. Two expired supplied-design image URLs were replaced. Review rights for supplied-design assets and replace with commissioned property-media team photography when available.

## Analytics and operations

GA4 loads only after optional analytics consent. `generate_lead` fires only after a confirmed Google Sheet write. The Sheet is the registration source of truth. Confirmation-email delivery is not configured and is not claimed. Follow-up, private-sheet permissions, retention, and access review remain operator responsibilities.
