# Pre-launch handoff — 23 September 2026

The redesign is proposed in PR #1, on `feat/prelaunch-editorial`; it does not overwrite the supplied chatgpt.site reference or publish to main.

GitHub's existing Vercel integration deploys previews in the `fourtrans-projects` team, project `phototrackly-landing-pa`. The currently connected Vercel tool account does not have access to that team. Use this existing project rather than creating a duplicate, unless intentionally separating environments. A protected preview may require the project owner's Vercel sign-in.

## Required production activation

The repository includes the real registration API and Supabase migration, but production storage has not been connected or verified by this change. Apply `supabase/migrations/202609230001_early_access.sql` in the intended Supabase project. In the intended Vercel environment, set `LEAD_STORAGE=supabase`, `SUPABASE_URL`, the server-only `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and a stable random `LEAD_TOKEN_SECRET` of at least 32 characters. Set `NEXT_PUBLIC_SITE_URL` to the real origin and retain `NEXT_PUBLIC_GA_ID=G-0PSP21DKNJ`. See README.md for exact setup and verification steps. Do not put server secrets in NEXT_PUBLIC variables or in GitHub source.

Before sending traffic: submit through both forms, confirm their rows and qualification/consent fields in the database, and test explicit removal using the private confirmation link. An unconfigured collector correctly returns an error rather than pretending it saved the lead. SQLite storage is for standalone/local testing, never Vercel.

## Imagery

Replacement on-site camera photograph: Gordon Cowie, Unsplash, https://unsplash.com/photos/a-man-holding-a-camera-on-a-tripod-KTMUmXEu-Xw . Listed under the Unsplash License. Other stock and supplied-design photographs are centralized in `lib/images.ts` and `components/prelaunch/media.tsx`; they are illustrative, not customer media or endorsements. Two expired supplied-design image URLs were replaced. Review rights for supplied-design assets and replace with commissioned property-media team photography when available.

## Analytics

GA4 loads only after optional analytics consent. `generate_lead` fires only after a confirmed database response; attempted submissions are separate events. Database records, not analytics, are the lead source of truth. Mark `generate_lead` as a key event in GA4 manually. Confirmation-email delivery is not configured and is not claimed by the success screen.
