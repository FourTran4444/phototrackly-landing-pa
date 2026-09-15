# PhotoTrackly

A Next.js App Router implementation of the PhotoTrackly landing page and interactive property-media workspace preview. Built with native React components, TypeScript, and the supplied Architectural Precision visual direction.

## Run locally

Use Node.js 22 LTS.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. No credentials are required to explore the sample workspace. Once a package-lock.json is present, use `npm ci` for reproducible installs.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Pre-launch landing page, team roles, workflow explorer, and early-access form |
| `/workspace/pipeline` | Searchable job board/table, job creation, property briefs, and stage transitions |
| `/workspace/schedule` | Date navigation and manual photographer assignment |
| `/workspace/review` | Human review checklist, revision notes, and approval |
| `/workspace/delivery` | Record the final handoff and export a metadata manifest |
| `/delivery/[id]` | Local-only delivery preview for a sample delivered job |
| `/api/early-access` | Validated, server-side registration webhook adapter |

These are actual Next.js routes; the app does not embed the original HTML or use hash-based routing.

## Deploy on Vercel

Import `FourTran4444/phototrackly-landing-pa` as a new Vercel project. Select the **Next.js** framework preset, repository root `./`, and Node.js **22.x**. Use the standard `npm run build` command and the default output directory. No custom rewrite or static-export configuration is needed.

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin for canonical URLs, robots, and sitemap metadata. Redeploy after changing environment variables. The sample workspace works without any environment variables.

### Early-access collection

Without `EARLY_ACCESS_WEBHOOK_URL`, the form explicitly saves an interest **draft in the visitor's browser**, not a registration. The API responds with 503 for genuine submissions when no collector is configured. The UI never reports a successful live registration in this mode.

To enable real collection, configure a trusted HTTPS endpoint in `EARLY_ACCESS_WEBHOOK_URL` and optionally set `EARLY_ACCESS_WEBHOOK_TOKEN`. The server sends only the validated email, company, optional role/market, source, and submission timestamp. A bearer token stays server-side. A successful response from that endpoint is required before the UI confirms registration. Configure persistent storage, retention/deletion practices, and abuse protection in your collection service before accepting public submissions. This repository does not create a database, email account, CRM, or mailing list.

## Scope and data handling

PhotoTrackly remains **in development**. The workspace is a functional front-end preview with fictional jobs and a fixed sample date of 15 September 2026. Edits are stored in localStorage on the current browser and origin, with an in-memory fallback when storage is unavailable. Cross-tab changes are synchronized. Do not enter confidential or real customer data.

File attachment controls record filenames and sizes only. They do not upload, retain, or deliver file contents. Review is performed by the person using the app, not by automated image analysis. Delivery controls record local status; they do not send email or host a client gallery. Delivery-preview URLs are not shareable customer delivery links: another browser has its own sample data. Downloads contain metadata, not media assets.

There is no authentication, authorization, multi-tenant database, shared schedule, payment processing, GPS tracking, automated editing, or autonomous quality review. No analytics ID or secret is hardcoded.

## Design and implementation

- Pale-blue/white surfaces, dark structural framing, orange actions, and restrained teal review states.
- Plus Jakarta Sans and JetBrains Mono loaded from Google Fonts; system fonts remain usable when the font service is unavailable.
- Source photographs are hotlinked from the supplied HTML. A local branded placeholder is shown if a source becomes unavailable. Replace these illustrative sources with owned, licensed production media before launch.
- Server-rendered landing-page content, client components for interactions, shared typed demo state, accessible native dialogs, keyboard-operable tabs, responsive layouts, reduced-motion support, and no-index workspace routes.
- Marketing language follows the supplied Product and Landing-Page Brief: no fabricated customers, testimonials, quantified savings, pricing, launch date, or claims that the SaaS is already available.

## Verification

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

Install the Playwright browser once with `npx playwright install chromium`. Browser tests run against the production server and cover the landing interactions, real routes, job persistence, review/delivery gates, honest early-access behavior, keyboard dialogs, and mobile navigation. GitHub Actions runs these checks and publishes test reports and screenshots as build artifacts.
