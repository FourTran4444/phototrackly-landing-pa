# PhotoTrackly pre-launch website

A responsive Next.js landing page for the planned property-media workspace. The design, two early-access forms, interactive sample job, and illustrative production board are preserved. **Lead submissions go to a Google Sheet in Google Drive. No separate database is required.**

PhotoTrackly is in development. Registration is free, requires no payment or mandatory sales call, and does not create an account or guarantee immediate access. Manual photographer assignment is an initial priority; rules-based or AI-assisted assignment is a later direction.

## Lead destination

[PhotoTrackly Early Access Leads](https://docs.google.com/spreadsheets/d/1TG7qUvW0C8uu9WaGMKCSUTaamjZFdIxkNFJKlRxBl2c/edit), **Leads** tab.

Both forms POST to `/api/early-access`; the server validates the request and forwards it to a secret-protected Google Apps Script receiver. The receiver writes a row in the private Sheet and confirms it. No browser-only drafts or fabricated successes are used.

## Setup

Use Node.js 22.x, then:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The visual website works without credentials. Actual lead collection requires deploying the included Google Apps Script and setting just two server-only variables: `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET`. Follow **[the Google Sheets setup guide](docs/GOOGLE-SHEETS-LEADS.md)**. Set `NEXT_PUBLIC_SITE_URL` for production metadata. No database project, migration, service-account key, or local data directory is needed.

Use the existing Vercel project linked to this repository, Next.js preset, root directory, Node 22.x, and standard build settings. A Git push does not authorize or redeploy Google Apps Script. The connected Drive tools can edit the Sheet but do not authorize your deployed website. Live Google intake still needs the one-time owner deployment and a live submission check.

## Validation, consent, and receipts

The website and receiver validate the fields, bound request sizes, require consent, and reject malformed requests. The server keeps the shared secret out of the browser. Google responses must explicitly confirm a saved row and its matching request ID before a success state or conversion event is shown. Google sign-in pages and network errors never count as success.

The receiver uses a lock and Sheet request IDs to prevent unchanged retries from creating duplicate rows. User text is escaped to prevent spreadsheet formula injection. Lightweight Google cache throttling is best effort; use Vercel edge controls for stronger abuse protection. The public site cannot read the lead list. Keep the Sheet private.

Each success provides a downloadable confirmation with a private removal link. Visiting the link alone does not remove the registration; the visitor must confirm. Removal deletes its associated row from the active Sheet, not Google revision history, exports, or backups. The removal page is no-index, no-referrer, and has no analytics.

No email delivery is configured or claimed. Invitations, follow-up, retention, and access reviews remain operator responsibilities. Do not enter real customer data in illustrative workspace previews.

## Conversion measurement

The owner-supplied GA4 ID `G-0PSP21DKNJ` is retained behind optional analytics consent. Form values and private removal tokens are excluded from custom analytics events. `form_submit` is an attempt; **`generate_lead` fires only after a confirmed Sheet write**. The Sheet, not analytics, is the lead source of truth. CTA, sample-stage, board-filter, and FAQ events remain unchanged. Mark `generate_lead` as a key event in GA4 manually.

## Routes

`/` is the pre-launch landing page; `/privacy` describes signup data handling; `/api/early-access` receives forms; `/early-access/preferences` and `/api/early-access/withdraw` handle explicit private removal. Existing `/workspace/*` and `/delivery/[id]` routes remain clearly labeled browser-only illustrative concepts; they have no product database or real media upload/delivery.

## Design, imagery, and performance

The new marketing design is isolated under `.pl` and does not restyle the existing prototype. Large ivory/sage editorial sections alternate with a forest-green board and a panoramic property photograph. Mobile navigation, keyboard-operated tabs, board filters, native FAQs, reduced-motion preferences, focus states, and native form controls are included.

Marketing photography uses the existing project imagery plus two Unsplash property photographs, through Next.js image optimization with bounded remote patterns, responsive sizes, lazy loading, AVIF/WebP output, and a hero preload. Meaningful alt text and a branded image-error fallback are included. Review continued source availability and usage rights before launch; replace sample photos with owned or appropriately licensed assets as appropriate. No stock image is presented as a customer endorsement.

Metadata includes title/description, canonical, Open Graph image, Twitter card, favicon, sitemap, robots directives, and no-index private/prototype routes. Marketing copy is server-rendered, with client islands for actual interactions.

## Verification

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build
npx playwright install chromium
# Run browser tests with the isolated Google receiver test double:
export NEXT_PUBLIC_SITE_URL=http://localhost:3000
export LEAD_WEBHOOK_URL=https://script.google.com/macros/s/phototrackly-test-only/exec
export LEAD_WEBHOOK_SECRET=test-only-google-webhook-secret-never-deploy
export PHOTOTRACKLY_TEST_SHEET_FILE="$(mktemp)"
printf '[]' > "$PHOTOTRACKLY_TEST_SHEET_FILE"
NODE_OPTIONS="--import=$PWD/tests/helpers/mock-google.mjs" npm run test:e2e
```

GitHub Actions runs types, lint, unit/receiver tests, production build, and desktop/mobile browser tests. Tests execute the actual Apps Script against a simulated Sheets API; they do not claim a live Google integration is authorized or verified. The test-only preload is not imported by application code and refuses to run on Vercel. No database is used in development, production, or CI.

## Owner-approved UI reference

The landing now follows the supplied operations-site UI and uses its five original photographs as local assets. See [reference notes](docs/REFERENCE-UI.md) and `reference-media.json`. Google Sheets remains the only lead destination; no application database is required. Both forms require work email, company and explicit consent. Other context is optional.
