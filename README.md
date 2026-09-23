# PhotoTrackly pre-launch website

An editorial, responsive Next.js landing page for a **planned** property-media workspace. The page centers on “One tool for the whole property media job,” with real photography, a four-stage interactive concept, an illustrative production board, and two real lead forms. The existing browser-only workspace prototype is preserved at `/workspace/pipeline`.

## What is and is not live

This repository contains a working website and server-side persistent registration implementation. **It does not provision a Supabase project or a Vercel project.** Production registration is only operational after the database migration and server environment variables below are configured and a real submission is verified on the deployed origin. An unavailable database returns an error, never a local draft or false success.

PhotoTrackly itself is in development. Registration is free, requires no payment or mandatory sales call, and does not create an account or guarantee immediate access. All sample jobs, people, statuses, numbers, and product interfaces are clearly illustrative. Manual photographer assignment is an initial priority; rules-based or AI-assisted assignment is a later direction.

## Local development with real persistence

Use **Node.js 22.16 or newer in the 22.x line**. The standalone SQLite adapter uses Node's built-in `node:sqlite` module. Its experimental warning on Node 22 does not mean storage is simulated.

```sh
npm ci
cp .env.example .env.local
```

For a local, persistent collector, set the following in `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
LEAD_STORAGE=sqlite
LEAD_DATA_DIRECTORY=/absolute/private/path/phototrackly-leads
LEAD_TOKEN_SECRET=replace-with-a-cryptographically-random-secret-at-least-32-characters
```

Generate the secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep it stable: it derives private registration-removal links and privacy-preserving rate-limit identifiers. Do not commit the value. Keep the data directory outside `public`, outside your repository, and on a persistent volume with restricted access and backups appropriate for contact data.

```sh
npm run dev
```

Both forms POST to `/api/early-access`. The SQLite database is `early-access.sqlite` under the configured private directory. Data survives server restarts. **SQLite is explicitly disabled on Vercel**; a serverless filesystem must not be mistaken for durable storage.

## Production on Vercel + Supabase

1. Create or select the intended Supabase project. Apply `supabase/migrations/202609230001_early_access.sql` once in that project. It creates private tables and narrowly scoped server-side functions.
2. Import `FourTran4444/phototrackly-landing-pa` into Vercel with the Next.js preset, repository root, Node 22.x, and the standard build/output settings. No static export is used.
3. Set the following Vercel environment variables for the intended deployment environments:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your actual HTTPS site origin, with no path |
| `NEXT_PUBLIC_GA_ID` | `G-0PSP21DKNJ`, the project measurement ID supplied by the owner |
| `LEAD_STORAGE` | `supabase` |
| `SUPABASE_URL` | Your project's HTTPS Supabase origin |
| `SUPABASE_SECRET_KEY` | Your server-side Supabase secret key; never an anon/publishable key |
| `LEAD_TOKEN_SECRET` | A new random secret, at least 32 characters, kept stable |

`SUPABASE_SERVICE_ROLE_KEY` is supported as an alternative for an existing legacy service-role JWT. Never use a `NEXT_PUBLIC_` prefix for either database key or the signing secret. Do not set `LEAD_DATA_DIRECTORY` in Vercel.

4. Deploy. Submit one clearly labeled test registration through each form. Confirm the actual rows in Supabase, including source, consent timestamp/version, and qualification fields. Save the confirmation and use its removal link to remove the test record. Confirm the row is removed.
5. Confirm canonical/OG metadata, both mobile and desktop layouts, image availability, optional analytics consent, and your operational handling of the lead list before sending public traffic.

No email provider is configured or silently simulated. The useful success state confirms registration and offers a downloadable confirmation containing a private removal link; it does **not** claim an email was sent. Invitations and follow-up are an operator responsibility. Include each recipient's removal link in any future outreach; add appropriate email/list handling before automating messages.

## Privacy and security design

- Browser and server validation; bounded JSON body; allowlisted role, market, job-volume and source fields; explicit consent; hidden honeypot; same-origin browser checks.
- Transactions and idempotency keys: retrying an unchanged submission does not create another record. Separate intentional submissions, including the same email, are separate records and each has its own removal link.
- Persistent rate limit of eight new submissions per connection/hour. Only a keyed hash of the proxy-provided IP is retained; expired rate-limit entries are pruned during later submissions.
- The hosting proxy must overwrite forwarding headers. Configure abuse protection at the edge before large campaigns; origin checks alone are not bot authentication.
- Supabase row-level security is enabled. Anonymous/authenticated roles cannot read or mutate the lead tables or invoke the registration functions. Only the server-side service role can call those functions.
- No lead data, database errors, private tokens, or email/company/name/challenge values are sent to analytics or application logs. No contact details are stored in browser localStorage.
- Removal URLs use a fragment, so the token is not sent in the initial page request. Merely opening a URL does not delete a record; the visitor must confirm removal. The page is no-index, no-referrer, and has no analytics script.
- The `/privacy` notice describes the implementation, not a certification of legal compliance. The operator must establish access controls, backup/deletion practices, retention review, and appropriate outbound-email handling before launch. Active-record removal does not imply instant deletion of infrastructure backups.

## Conversion measurement

The existing owner-supplied measurement ID `G-0PSP21DKNJ` is used, with `NEXT_PUBLIC_GA_ID` as an override. Google Analytics is loaded **only after optional analytics consent**. Decline/accept controls and footer cookie settings are available. No optional tracking is needed to use a form. Query strings and private fragments are omitted from tracked page locations.

| Event | Trigger |
| --- | --- |
| `cta_click` | A join/explore CTA; includes a static placement label |
| `form_start` | First form focus per placement |
| `form_submit` | Attempted submission, not a conversion |
| `form_error` | Validation/storage/network failure category |
| `generate_lead` | **Only after a confirmed persistent save** |
| `sample_stage_view` | Selected illustrative job stage |
| `board_filter` | Selected illustrative board filter |
| `faq_open` | Opened FAQ number |

Mark `generate_lead` as a key event in the project's GA4 property. The application cannot change GA4 administration settings. Counts will exclude people who decline analytics or block it; the database remains the source of truth for registrations. The test suite intercepts the Google script and does not send test events to the live analytics property.

## Routes and scope

| Route | Purpose |
| --- | --- |
| `/` | Nine-section pre-launch page and two registration forms |
| `/privacy` | Registration data and optional analytics notice |
| `/early-access/preferences#TOKEN` | Explicit, private removal flow |
| `/api/early-access` | Validated persistent registration endpoint |
| `/api/early-access/withdraw` | Explicit token-based removal endpoint |
| `/workspace/*` | Preserved, browser-only illustrative app prototype |
| `/delivery/[id]` | Preserved, local-only illustrative delivery preview |

The workspace prototype has no authentication or real client media storage. Its jobs are fictional, stored in the browser, and clearly labeled. File controls retain metadata only; delivery controls do not send email or host galleries. The landing-page signup database is separate from that prototype.

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
# Export LEAD_STORAGE=sqlite, a private absolute LEAD_DATA_DIRECTORY,
# LEAD_TOKEN_SECRET, and NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run test:e2e
```

GitHub Actions runs the application checks, real SQLite persistence tests, an isolated PostgreSQL migration/permission test, and Chromium desktop/mobile tests. Browser tests confirm both forms persist real rows, retries, honest failure states, consent-gated analytics, removal, keyboard controls, responsive widths, and the preserved app prototype. CI exports screenshots, traces/reports, and a source archive. Never run the PostgreSQL test fixture against a live lead database.
