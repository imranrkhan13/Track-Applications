# Career Garden workspace implementation

Updated 10 September 2026. The landing page and Google PKCE flow are preserved.

## Product flow

1. **My jobs:** capture, edit, search, filter and sort jobs; list/board views; six application stages; dated next actions and activity.
2. **Research:** authenticated discovery, safe public-JD reading, optional permitted-domain reading and AI extraction. Sources remain discovery-only or unreviewed until the user checks the account. Recruiter notes stay private.
3. **Preparation:** role-family curriculum, direct public learning resources, artifact-based tasks, available study days/times, timezone-aware deadlines, buffer, prerequisites and spaced recall. Deferred work and unsupported role families are explicit.
4. **Practice:** role-specific prompts, timer, optional browser dictation, typed answers, self-review, optional evidence-linked AI coaching, saved attempts and user-identified skill gaps for replanning.

Preparation and practice overview rows show their own relevant context rather than repeating the job-tracking table. Typography uses the existing Manrope/Newsreader fonts. Styling is scoped to `.career-app`; mobile controls wrap and the forms use native modal dialogs with accessible names and keyboard dismissal.

The four-step job navigation now shows tracking, source review, remaining preparation and saved rehearsals together. Adding a deadline creates a plan automatically using the displayed default availability (weekdays, 60 minutes at 18:00 in the browser timezone). Research results, reviewed accounts and saved practice reviews update the remaining plan through one shared transition. Invalid dates or insufficient capacity never prevent saving the job or answer; they produce actionable planning notices. Completed artifacts survive replanning.

JD matching is intentionally bounded and transparent: React, HTTP/API work, accessibility, optimization, speech evaluation and product prioritization produce source-linked concept exercises using direct learning links. DSA is not added from a negative statement such as “No DSA.” Research from another company, role or changed source URL does not become the current JD. This is not exhaustive semantic extraction of every possible occupation or stack.

An answer marked “needs work” creates a targeted repair exercise, even when earlier curriculum tasks are already complete. A later comfortable self-review removes that unfinished repair. Saved AI follow-ups appear when the practice room is reopened, remain clearly labeled, and disappear from the prompt queue once answered. There is no automated claim of mastery.

## Persistence and migration

Apply `supabase/migrations/202609080001_career_workspace.sql` to the existing Supabase project **before deploying this workspace**. Use the normal Supabase migration workflow; the migration is tracked once, not a repeatable seed script. Back up the database and review existing schema/policies before applying.

The migration preserves existing job IDs and rows. It adds a JSON workspace, optimistic revision counter, update timestamp, ownership policies and authenticated research/coaching quota. Existing jobs columns must match the application's existing `company`, `role`, `status`, `location`, `salary`, `date`, `url`, `notes`, `created_at`, `user_id` model. It does not rewrite arbitrary legacy column types.

Job edits use `UPDATE` with owner, ID and revision filters, never an identity-ID upsert. Job fields, plans, tasks, research and practice history save atomically in the owned job row. Conflicting revisions fail visibly. A missing cloud schema is not silently replaced with browser storage.

Demo changes stay in a separate browser key. Existing demo and legacy role-room stores are preserved. Older private metadata hydrates into the first cloud workspace save; old research is not automatically promoted to evidence. Previous role-room notes remain available on the device, but legacy briefs and interview-session tables are not imported into the new practice history.

## Runtime configuration

The existing deployment is Netlify/React/Supabase, not a Sites-hosted Worker. No hosting migration or publication was performed.

Set public build-time values `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep existing Google provider settings and allowlisted `/auth/callback` origins.

Set the following server-side only:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` (server can also read the corresponding public values).
- `BRAVE_SEARCH_API_KEY` for live search.
- `GEMINI_API_KEY` and an explicitly configured supported `GEMINI_MODEL` for extraction and coaching.
- `RESEARCH_ALLOWED_HOSTS`: comma-separated exact hosts whose retrieval, retention and processing terms the operator has reviewed. Defaults to no blog crawling. It is not proof of rights by itself.

The Vite configuration serves the two API handlers locally. `public/_redirects` places APIs before the SPA fallback; `netlify.toml` provides the production build/function configuration. The unauthenticated old research endpoint returns 410.

Without providers, jobs, pasted-JD planning and self-review remain usable. Without Supabase, the app runs in explicitly labeled demo mode. Missing functions and missing configuration are visible states, not fabricated research results.

## Safety and evidence boundaries

- Live research and coaching verify Supabase identity and share a persistent eight-call hourly allowance.
- Public source reads allow HTTPS only, validate and pin public IPv4 DNS results to the socket, check redirects, cap size, limit hops and enforce deadlines. IPv6-only hosts and large/unsupported documents fail clearly. Public Google Docs text export is supported; private Drive/Notion/PDF documents need pasted text.
- X/Twitter scraping is blocked. Adding a user's own short notes is not model training or permission to ingest a corpus.
- Search snippets never become process facts. Automatic extraction requires exact source substrings, remains unreviewed, and does not infer tool policy.
- Reviewed accounts remain separate and scoped. AI coaching quotes the candidate's submitted answer; it is labeled fallible and does not produce a hiring probability or personality/confidence score.
- Browser dictation may use a remote browser speech service; the UI explains this. Typed practice does not require microphone access. Answers are sent to the configured AI provider only by the explicit coaching button.
- No database credentials, search or model keys were present in the local environment during implementation. Live Supabase policy enforcement, Google consent and provider responses still need end-to-end verification in the configured deployment.

## Validation

Run `npm test`, `npm run lint`, and `npm run build`. Tests cover storage CRUD and failure states, optimistic concurrency, evidence filtering, timezone/DST boundaries, scheduling constraints, source-fetch gates, authentication and quotas, citation validation, coaching fallbacks and the previous PKCE regressions.

These tests use mock services. They do not establish live source accuracy, global company coverage, live database migrations, visual/browser QA or model grading quality. Keep a release check for real-account save/reload, cross-account access denial, research failure recovery and responsive form interactions.

Six automated test files cover OAuth, the evidence/scheduling core, repository/planner behavior, research service, coach service and the connected career workflow. The workflow file includes six integration scenarios: save/reload/stage changes; research failure recovery; reviewed evidence adoption; practice-to-plan feedback; deadline/capacity recovery; and multi-account extraction provenance/quote limits.

Local release check: 71 automated tests pass across those six files. ESLint and the production build pass. The build reports non-blocking legacy bundle-size and outdated Browserslist-data warnings. Live providers, live database policies and browser visual behavior are not certified by these checks.

## Responsive workspace refresh — 11 September 2026

The workspace now uses one consolidated, scoped stylesheet: paper surfaces, forest-green controls, Manrope body text and Newsreader headings. A three-item sidebar becomes a keyboard-accessible disclosure menu at tablet/phone widths. Job navigation is one compact tab strip; stage counts, plan assumptions, research gaps and activity use expandable disclosures. Role status, notes, resources and task controls remain accessible on small screens instead of being hidden.

Browser checks covered 320px, 768px and 1440px layouts for role details, research, generated preparation and practice review, plus the phone job board, overview lists and add-job dialog. The checked pages matched viewport width without horizontal document overflow. Mobile menu open/close, Escape, navigation, long role titles, a generated three-week plan and an expanded learning-resource task were exercised. No browser console errors were captured. Test content was browser-local demo data; no live cloud or model calls were made. Native date submissions now read the displayed form value directly. The production build and all 71 existing automated tests pass after this refresh.
