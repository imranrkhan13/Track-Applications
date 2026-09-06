# Career Garden

A calmer career workspace for managing job applications, preparing for a specific role, and practicing interview answers out loud. The application is designed to work immediately in **demo mode** and can be connected to Supabase and server-side voice providers for production use.

## What is included

The redesigned workspace brings the complete search loop into one product. Users can maintain a pipeline with statuses, next steps, dates, compensation, links, and notes; see all six plant stages on the dashboard; switch between table and board views; open analytics for response-rate and source-mix signals; and keep a lightweight activity timeline.

The **Candidate Room** is the role-first preparation loop. For each saved application it provides source trails for the official role, hiring process, tech-stack signals, and company context; an evidence log; a six-stage task plan; targeted questions; and a direct handoff into mock interview practice. The **Research & build plan** action uses the Netlify server function to fetch a public job page, Google Docs/Drive export, or other readable URL without browser CORS issues, search the main company signals, and work backwards from the saved deadline or interview date. If a server Gemini key is configured, it also creates a grounded role brief; otherwise it still returns a source-backed dated template. Research results, task progress, and notes are stored locally per user and role until a server-side research table is connected.

The **Role Prep** area creates a private preparation room for a selected application. It accepts a job description or interview notes, builds a role-specific positioning brief, suggests focused questions, and maintains a story bank for behavioral answers. The **Mock Interview** room provides three practice prompts, browser voice capture where supported, an editable transcript, a provider-routing selector, a structured rating rubric, and saved answer history.

The rating rubric measures clarity, relevance, structure, and confidence. In production, the client calls server endpoints rather than provider APIs directly. If the rating endpoint is unavailable, the app uses a deterministic local rubric so the demo still returns useful feedback.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. With no environment variables, the app opens a sample workspace backed by browser local storage. This is the fastest way to review the product flows.

For a production-like build, run:

```bash
npm run build
```

## Environment configuration

Copy `.env.example` to `.env.local` when configuring the application. Client-side `VITE_*` values are limited to non-sensitive feature flags and public Supabase configuration. Provider secrets must remain in the server or worker environment that implements `/api/voice/transcribe` and `/api/voice/rate`.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL. Optional in demo mode. |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous key. Optional in demo mode. |
| `VITE_GOOGLE_CLIENT_ID` | Legacy optional value; Google OAuth is now brokered through Supabase. |
| `VITE_ENABLE_DEEPGRAM` | Non-secret flag that marks the Deepgram server route as configured. |
| `VITE_ENABLE_WHISPER` | Non-secret flag that marks the OpenAI Whisper server route as configured. |
| `VITE_ENABLE_GRADIUM` | Non-secret flag that marks the Gradium server route as configured. |
| `DEEPGRAM_API_KEY` | Server-side Deepgram credential. Never expose it through `VITE_*`. |
| `OPENAI_API_KEY` | Server-side OpenAI credential for Whisper fallback. Never expose it through `VITE_*`. |
| `GRADIUM_API_KEY` | Server-side Gradium credential. Never expose it through `VITE_*`. |
| `GEMINI_API_KEY` | Optional server-side Gemini credential for grounded role-plan synthesis. Never expose it through `VITE_*`. |

### Google login setup

Google login is intentionally disabled when Supabase is not configured; the login screen shows the reason and keeps the demo garden available. To enable it, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`, enable the Google provider in **Supabase → Authentication → Providers**, and add `${SITE_URL}/auth/callback` to **Supabase → Authentication → URL Configuration → Redirect URLs**. In Google Cloud, use the project callback shown by Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`) as the authorized redirect URI. The client uses one explicit PKCE callback exchange and does not contain a Google client secret.

The browser currently uses the Web Speech API when available. The service layer is prepared to send recorded audio to `/api/voice/transcribe` with `X-Voice-Provider: deepgram`, `whisper`, or `gradium`, and to send answer text to `/api/voice/rate`. A deployment target must provide those server routes to activate the external providers.

## Data model and persistence

In demo mode, jobs, role briefs, mock interview sessions, and notes are stored under user-scoped local-storage keys. When Supabase is configured, the data helpers are structured to use tables for `jobs`, `role_briefs`, `interview_sessions`, and `notes`. The current UI remains usable without a database so product review and local development do not depend on external credentials.

## Safety note for the credentials previously shared

Do not commit provider keys to this repository or place them in browser-exposed environment variables. The credentials pasted into the earlier request should be revoked or rotated in each provider dashboard before production use. The implementation intentionally does not contain those values.

## Main files

| File | Responsibility |
| --- | --- |
| `src/AppNew.jsx` | Landing page, login/demo entrypoint, and authenticated workspace routing. |
| `src/Workspace.jsx` | Application shell, navigation, dashboard, pipeline, analytics, settings, and job drawer. |
| `src/RoleRoom.jsx` | Company research trails, six-stage candidate task plan, evidence log, and targeted questions. |
| `src/InterviewPrep.jsx` | Legacy role-specific brief, question set, and story-bank workflow retained for compatibility. |
| `src/MockInterview.jsx` | Voice practice room, provider selector, transcript, rating, and session history. |
| `src/lib/appData.js` | Local persistence and Supabase-aware data helpers. |
| `src/lib/voiceInterview.js` | Voice provider status, browser recognition, server hooks, and local scoring fallback. |
| `src/index.css` | Responsive visual system for the full application. |

## Verification

The current repository passes `npm run build`. Vite emits only informational warnings about third-party module directives and an outdated Browserslist database; these do not block the production bundle.
