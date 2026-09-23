# Approved PhotoTrackly UI reference

Reference selected by the owner: https://phototrackly-operations.tranvantubk.chatgpt.site/
Retrieved and rendered on 23 September 2026 at desktop (1440px) and mobile (390px) sizes.

This update follows the reference rather than inventing a new visual direction:
- DM Sans body copy and bold Manrope headings; dark slate, muted sage and pale green surfaces.
- The original hero composition, compact inline form, pill buttons, and in-photo job-status card.
- Original section order and wording; four-step dark workflow with photographer/editor images.
- Tall interior story image, compact sample-job tabs, side-by-side explanatory copy, simple production board, dusk-image section, FAQs, and signup section.

## Original images

The five WebP files under `public/images/reference/` are byte-for-byte copies of the images served by that reference, not replacement stock photos or newly generated images. `reference-media.json` records source URLs, dimensions, alt text, byte lengths and SHA-256 values. Next.js serves responsive optimized derivatives from these local originals. No external image host is needed for the homepage.

These assets are reused at the owner's explicit direction. The manifest records provenance, not an independent license determination.

## Preserved functionality and deliberate refinements

The website remains a Next.js landing page. The existing server-only Google Apps Script → Google Sheet submission mechanism, consent, idempotent retries, error handling, receipts, and private removal links remain. There is no application database.

Email and company are required; name and role are optional, as in the reference. Country and monthly job volume remain available in an optional disclosure. Consent remains required. The Apps Script's validation matches this optional-context rule; deploy the latest receiver when activating collection.

Keyboard-operable tabs, visible focus outlines, accessible mobile navigation, readable light-section body text, a privacy link, and optional analytics controls are retained. The non-initial sample-job stages use the existing planned-workflow concept in the reference's visual shell; they are illustrative, not real jobs. The board shows illustrative counts and example rows, not a functioning SaaS dashboard.

Google web-app authorization and Vercel `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET` remain separate activation steps. No live submission is claimed merely because the visual update is deployed. See `GOOGLE-SHEETS-LEADS.md`.
