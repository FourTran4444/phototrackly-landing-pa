# PhotoTrackly search launch checklist

This checklist applies to the `phototrackly-landing-pa` deployment. The `qrTrackly` repository and any search results for its old URLs are a separate property. Do not reuse their domain without confirming ownership and redirects.

## Production domain and crawl

1. Identify the production URL in the Vercel project linked to this repository. Set `NEXT_PUBLIC_SITE_URL` to that **HTTPS origin** in production, with no path or trailing slash. The app falls back to Vercel's production URL when this variable is absent; explicitly setting it makes canonical URLs stable.
2. Request the homepage, `/robots.txt`, and `/sitemap.xml` on the production domain. Check that each is public and that sitemap and canonical URLs use the same origin. Check `/privacy` and any new marketing pages after they are merged.
3. Check that the homepage is indexable and renders its headline and copy in the initial HTML. Check that preview deployments and the illustrative `/workspace/*` and `/delivery/*` pages are not indexed.
4. If an older PhotoTrackly domain is under your control, choose one canonical domain and implement **permanent URL redirects** from old equivalent pages only after mapping them. Do not redirect unrelated websites or blindly redirect every old URL to the new homepage.

## Search ownership and measurement

5. Verify the production domain in Google Search Console and Bing Webmaster Tools. Prefer DNS verification. For HTML meta verification, put the issued values in production `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`, then redeploy. Never commit verification tokens.
6. Submit `https://<production-domain>/sitemap.xml` to both tools. Inspect the homepage URL and confirm it is eligible for indexing; request indexing for priority pages after publishing. Submission is not an indexing guarantee.
7. Confirm that the consent-gated GA4 property is the intended PhotoTrackly property. In GA4, mark `generate_lead` as a key event; it fires only after the Google Sheets receiver confirms a saved lead. Compare confirmed Sheet rows with GA4 consenting visitors, not as if the numbers must match.
8. Record a baseline: indexed pages, impressions/clicks and queries by page/country in Search Console, Bing search performance and AI citations where available, GA4 landing page sessions, and confirmed registrations. Review monthly.

## Release check

Run `npm run typecheck && npm run lint && npm run test:unit && npm run build`. After deployment, repeat the crawl, canonical, sitemap, consent, and registration checks on the actual production URL. A live registration requires the separate Google Apps Script and Vercel secret setup in `docs/GOOGLE-SHEETS-LEADS.md`.
