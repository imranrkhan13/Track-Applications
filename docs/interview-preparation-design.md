# Career Garden: evidence-based interview preparation

Design version 1 · researched 6 September 2026

Continuation: [Global interview algorithm, version 2](global-interview-algorithm.md) adds cross-language research, process variants, policy lifecycle handling, and a tested reference engine. V2 is the canonical algorithm specification.

Status: implementation specification and initial source research, not a deployed research engine or a trained model. The home page is unchanged. The accompanying JSON is a reviewed discovery manifest, not a licensed training dataset. It does not cover every YC company.

## 1. Product decision

The product should answer: **“For this role, with my experience and the time I have, what should I practise next—and why?”**

Use source-backed retrieval plus a deterministic scheduler. Company knowledge belongs in a versioned, updateable evidence store; the language model explains the evidence and creates exercises. Retrieval-augmented generation is an established architecture for combining external documents with model generation; using it here is our design choice, not a guarantee against hallucination. [RAG paper](https://arxiv.org/abs/2005.11401)

Do not fine-tune on scraped tweets. X's published guidelines disallow using its data to train ML models and non-API scraping. An X integration requires an approved use case, appropriate API access, and review of storage, deletion, embedding, and inference permissions. RAG is not automatically an exception. Until approved, retain discovery links and allow source material supplied for an individual user's preparation; do not redistribute it into a shared corpus. [X guidelines](https://docs.x.com/developer-guidelines)

Later, evaluate fine-tuning for extraction and feedback quality using owned or explicitly licensed examples. Keep changing company facts in retrieval. User resumes, recordings, and answers are private and excluded from training by default.

## 2. The user flow

```text
Save role → identify company + read JD → assemble evidence → diagnose gaps
          → fit practice to available time → learn / build / mock → reassess
```

Saving the job must succeed independently of research. The user sees a saved role immediately, then research progress, then a plan with its evidence status. No extra dashboard full of menus: within a role, expose **Today**, **Plan**, **Practice**, and an expandable **Sources** panel.

Minimum inputs: company, role, JD link or pasted description. Ask for experience level, interview/application deadline distinction, timezone, next round if known, daily/weekly availability, and optional resume/project evidence. Allow a provisional plan without a resume or exact deadline, but display assumptions and make them editable. A job-application closing date is not an interview date.

Keep the existing plant stages as application status. Learning progress must not advance a role from Applied to Interview or Offer. Never display a probability of getting hired based on task completion.

## 3. Research algorithm

### A. Resolve the exact target

Canonical company record: name, aliases, official domain, optional YC profile, current job locations, and separately headquarters and historical locations. Require a matching official domain or user confirmation for ambiguous names. Avoid mixing Sarvam AI with similarly named companies.

Represent the target as `(company, job/team, role family, seniority, geography, campus/off-campus, hiring period)`. Speech ML, applied LLM engineering, data science, frontend, backend, QA/SDET, product, and design are different tracks. Do not collapse all engineers into a DSA template. Do not infer role location from headquarters or directory labels.

### B. Discover candidate sources

For each role, generate bounded queries in these groups:

| Group | Query patterns | Intended use |
|---|---|---|
| Official | company + exact role + careers / interview guide; site:official-domain hiring | Current requirements and stated process |
| First-person | company + role + level + “my interview experience”; location + campus/year | What a particular candidate experienced |
| X | company aliases + interview/assessment/machine coding; author/thread lookup | Dated anecdotes and interviewer advice |
| Engineering | official engineering blog, docs, public repositories + JD skills | Technical/product context, not proof of interview rounds |
| Learning | exact skill + official docs/course/exercise | Direct free resources |

Start with a proposed budget of 8 queries and up to 12 document fetches per new role; expand only when a material gap remains and budget permits. These are configurable engineering limits, not completeness guarantees. Prioritize current role sources and recent reports, but search older periods when recent evidence is sparse.

For X, use a permitted API connector. Recent search alone cannot backfill historical interviews; X documents separate recent and full-archive search. Handle rate limits, cost ceilings, and unavailable access explicitly. No proxy rotation, login-wall bypasses, or mirror scraping as an API substitute. [X search documentation](https://docs.x.com/x-api/posts/search/quickstart/full-archive-search)

For public Notion/Docs/Drive links: fetch only publicly accessible exports with an appropriate parser. For private links, ask for pasted text or a user-authorized upload. Never call a login page a successfully read JD. Parse PDF text; use OCR only when needed, with extraction confidence and page references.

### C. Read, classify, and deduplicate

Search snippets discover sources; they are not sufficient support for company claims. Fetch the document and record `read`, `partial`, `blocked`, `deleted`, or `unsupported`. Retain original URL, final URL, source type, retrieved date, document version/hash, author, publication date, interview date and date precision separately.

Classify content as official process, official JD, firsthand candidate report, interviewer advice, secondhand report, tutorial/hypothetical interview, or promotional/unsupported content. “Imagine you're interviewing at Google” is not a Google interview report. Popularity and compensation claims do not increase credibility.

Cluster by original post/thread, author + interview event, canonical URL, and text similarity. A tweet, its Reddit cross-post, and its mirror count as **one** experience. The same author can report different companies, but those are not independent corroboration for either company.

### D. Extract atomic claims

Each claim needs:

```text
claim_id, source_version_id, supporting_span/page, attribution
company_id, role_family, role_title, level, team, location, hiring_channel
interview_date, published_at, retrieved_at, date_precision
kind: round | topic | duration | tool_constraint | evaluation | requirement
value, polarity, scope, extraction_confidence, corroboration_group
status: official_statement | candidate_report | conflicting | historical | unknown
rights: transient_only | approved_retrieval | licensed_training | excluded
```

Example: “The author reports a 150-minute VAD assessment for a December 2024 campus ML role.” Do not turn it into “Sarvam always asks VAD and never asks DSA.” A mention of a tool in someone's previous internship is not evidence that the interviewing company uses that tool.

Technical assertions in anecdotes require separate technical sources. For example, the Sarvam post's descriptions of model internals or its preferred VAD accuracy are not verified architectural or benchmark facts. Preserve the interview topic; do not teach those assertions as truth.

### E. Rank evidence, retain disagreements

First apply hard exclusions: wrong company, inaccessible body, revoked permissions, unrelated job family, and content without a supporting span. Then rank relevant evidence with an initial heuristic:

```text
rank = 0.30 role/team fit + 0.20 level/channel fit + 0.15 geography fit
     + 0.20 freshness + 0.15 source quality
freshness = 2 ^ (-age_in_days / half_life)
```

All components are 0–1. Start with 180-day half-life for interview anecdotes and 365 days for technical learning material; calibrate against reviewed examples. Use interview date for anecdotes, not the date a mirror reposted them. Unknown dates get an explicit unknown status and conservative freshness, not today's date. The score is for ordering, not a confidence percentage or interview probability.

Use a scoped recruiter brief supplied by the user for their own loop; keep it private. Company-published process pages are official statements within their stated scope. Two independent matching reports may justify “multiple candidates reported,” not “confirmed current process.” One report stays “one candidate reported.” Contradictory reports stay visible, separated by role/date/location; do not invent a consensus. Never infer “not tested” from a topic being absent from an account.

## 4. Turn evidence into a curriculum

Build a skill dependency graph from the JD and qualifying claims. Every topic must have either a source-backed role requirement, a reported assessment signal, or a labeled prerequisite/general recommendation. Store the reason separately from the generated exercise.

Run a short diagnostic: one relevant implementation/problem, a concept explanation, and a project or behavioral discussion. Make it optional and accessible in text. Record skills as unassessed, needs support, developing, or demonstrated, with evidence. Completing a video does not demonstrate mastery.

Prioritize tasks using a tunable heuristic:

```text
priority(task) = relevance × skill_gap × next_round_urgency × evidence_strength
                 × learning_value / estimated_minutes
```

Do not let this formula discard prerequisites or every uncertain-but-essential foundation. Apply prerequisite and minimum-skill-coverage constraints first. Weak evidence can justify exploratory practice, but cannot remove important JD requirements. Use role-specific defaults only when clearly labeled.

Each learning unit contains one precise objective, a direct resource/section, a short exercise, a tangible deliverable, a rubric, estimated minutes, and a later unaided check. A proposed pattern is **learn → attempt without help → explain → receive feedback → try a new variant later**. Practice testing and spaced study have stronger support than passive rereading; the exact scheduling intervals below are product heuristics, not an interview-specific clinical result. [Learning-techniques review](https://doi.org/10.1177/1529100612453266)

### Deadline scheduler

1. Construct actual available slots in the user's timezone before the next round, excluding unavailable dates and elapsed time. No fake 14-day replacement for an expired deadline.
2. If deadline is missing, offer an explicitly provisional 14-day plan. If it is past, request a new date. If today, allocate only remaining available minutes or say there is no preparation time left.
3. Reserve a configurable 15% buffer. With a 21-day window and 90 minutes every day, capacity is 1,890 minutes; plan at most 1,606 minutes after rounding down. Unavailable days reduce this.
4. Split work into 20–45-minute units unless a timed assessment requires a larger contiguous block. A 150-minute simulation cannot fit a 90-minute day: request one longer slot or label a split exercise as non-simulated practice.
5. Schedule prerequisites before dependent work. Place early diagnostics, targeted drills, project milestones only when useful, then realistic mocks and light final review. Schedule recall checks around +1, +3, and +7 days where capacity permits.
6. Under 3 days: triage the next round, repair one or two key gaps, practise relevant stories, and run a short mock. Do not promise a new production project or mastery of an entire stack.
7. Replan after missed tasks, changed rounds, changed availability, or poor performance. Preserve completed work and show what moved or was dropped. Never silently extend the deadline.
8. For multiple applications, reuse demonstrated skills and artifacts; keep company-specific evidence and round assumptions separate.

Task selection can be a greedy priority queue with a dependency DAG initially. Add constraint optimization only if measured scheduling failures justify it. Validate dates and budgets outside the language model.

### Free resource policy

Each task gets one primary link and at most one alternate. Store exact title, publisher, relevant section, skill level, language/captions, access status, checked date, setup time, and compute/API requirements. Search-result URLs are discovery links, not learning resources. A free tutorial requiring paid GPUs is not a zero-cost exercise. Choose CPU-sized datasets and local tools where possible; disclose optional hardware costs. If a resource breaks, replace it or show unavailable—never invent a URL.

Initial direct resources: [MIT algorithms course](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), [PyTorch optimization](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial), [Hugging Face ASR evaluation](https://huggingface.co/learn/audio-course/en/chapter5/evaluation), [WebRTC VAD Python binding](https://github.com/wiseman/py-webrtcvad), [Silero VAD](https://github.com/snakers4/silero-vad), and [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/). These are discovery-ready resources; runtime access and exact task suitability must still be checked.

## 5. Worked example: speech-ML preparation

Input assumption: fresher targeting a speech-ML role, 21 days, 90 minutes daily, Python basics, no confirmed current interview format. The user's Sarvam account describes a December 2024 campus experience. Original X access returned 403 during this research; the user-provided text and [public mirror](https://threadnavigator.com/thread/2065801122494001516/) represent one report. Its later publication does not make the interview recent.

| Window | Focus and output | Evidence boundary |
|---|---|---|
| Days 1–7 | Diagnose Python/ML/audio gaps; inspect sample rate and framing; implement an energy-based VAD baseline; evaluate false positives and missed speech on a small held-out set | VAD emphasis is inspired by the historical account; specific exercises are our recommendations |
| Days 8–14 | Compare local VAD approaches; add tests and error analysis; implement simple gradient descent; explain attention and speech evaluation; write a reproducible benchmark README | Do not assert a particular method is best without measuring it; no requirement to train a large model |
| Days 15–20 | Explain an actual project, defend accuracy/latency tradeoffs, practise failure diagnosis, complete a timed build if a long enough slot is available, and run an adaptive technical mock | The candidate's previous work determines project questions; never fabricate their achievements |
| Day 21 | Brief recall, questions for recruiter/interviewer, logistics and rest | No guarantee about the actual rounds or outcome |

Recommended VAD project evidence: labelled train/validation/test separation where applicable, speech precision/recall/F1, false-positive examples, latency measurements with hardware and workload stated, tests, limitations, and a short walkthrough. WER belongs to an ASR transcript evaluation, not directly to binary VAD classification. [ASR evaluation reference](https://huggingface.co/learn/audio-course/en/chapter5/evaluation)

Do not impose the reported no-external-API constraint on every learning activity. Apply it to an explicitly labeled historical-format simulation, or when a current recruiter brief confirms it. Do not remove all DSA because one candidate was not asked it. Ask the recruiter to confirm the current format.

## 6. Adaptive mock interviews

Modes: coach (hints allowed), practice (feedback after each answer), simulation (rules and timing disclosed in advance). Generated questions are original exercises informed by topics, never described as leaked or guaranteed real interview questions.

Use a role-specific rubric: correctness, reasoning, implementation/test quality, tradeoffs, and communication. Behavioral feedback uses the candidate's own evidence and identifies missing specificity without inventing metrics. For coding/build tasks, run executable checks in an isolated sandbox with no secrets, default-denied network, resource limits, and read-only fixtures. Never execute candidate code in the app server.

After an answer, ask one relevant follow-up: counterexample if incorrect, changed constraints if strong, an easier prerequisite if stuck. Feedback points to code/test output or a transcript span. Mark unreliable transcription or insufficient evidence as unscorable. Do not infer competence or personality from accent, voice pitch, facial expression, or demographic traits.

Update demonstrated skill only after an unaided attempt or artifact review. Test recall with a new variant later. Show “demonstrated on two exercises” rather than “92% interview ready.” Evaluation weights are our coaching rubric unless explicitly published by the employer.

## 7. Company coverage and research findings

The source manifest contains URLs, access states, dates, and limitations. It is intentionally a seed set rather than a claim of exhaustive coverage.

| Priority | Initial coverage | What changes preparation |
|---|---|---|
| 1: Big tech | Google, Amazon, Microsoft, Meta; later Apple and Netflix when relevant sources are reviewed | Separate company + level + job family. Amazon SDE II and university SDE must not share a fixed loop |
| 2: Mumbai roles | BrowserStack and Dream11 reports; Kodo and Neodocs official roles; expand by current Mumbai/Navi Mumbai/Thane job demand | Match actual role location and seniority, not stale headquarters claims |
| 3: YC | Use the official directory for inventory; start deep research with companies users apply to and those with readable hiring documentation | “YC-backed” identifies a company cohort, not an interview style |

Concrete source distinctions:

- [Amazon's SDE II guide](https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep) explicitly covers coding, system design, and Leadership Principles. Use that role's guide, not a fresher anecdote, to select its preparation mix.
- [Microsoft's technical guide](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing) covers problem solving, design, coding, testing, and role-dependent specialisms. Testing must be part of the drills.
- [Aidan Lakshman's first-person comparison](https://www.ahl27.com/posts/2025/04/faang-interviews/) distinguishes PhD/new-grad Amazon and Google experiences from a Meta systems/infrastructure research role. It is not interchangeable with Indian campus hiring.
- [Sarthak Soni's Google account](https://sarthaksoni25.github.io/Google/) reports no design round in his particular senior-role process. Retain that scope rather than deleting design preparation for every senior candidate.
- [Mayur Kadam's Dream11 account](https://medium.com/mighty-ghost-hack/in-person-interview-experience-at-dream11-sde-2-mumbai-a47f1e415673) describes an October 2024 SDE-2 process combining DSA and practical implementation. It supports historical exercise inspiration, not a current hiring guarantee.
- [PostHog's engineering technical guide](https://posthog.com/handbook/people/hiring-process/engineering-tech-screen) describes a 60-minute architecture/design discussion. Its [hiring handbook](https://posthog.com/handbook/people/hiring-process/engineering-hiring) is a stronger process source than a generic startup interview article.
- [Kodo's Senior AI Engineer JD](https://www.ycombinator.com/companies/kodo/jobs/iJfJWnN-senior-ai-engineer) provides role skills, but does not establish interview rounds. Build a requirements-driven plan and say the process is unknown.

For every YC company: maintain a permission-compliant directory inventory with canonical profile, domain, status, batch, job locations, and `last_checked`. Enumerate available directory pages with resumable cursors and deduplication; record inaccessible batches/pages. Do not assume there is a public bulk API or scrape undocumented internal endpoints. Seek a permitted feed/export if required. Refresh changed records, then prioritize deeper research by actual user demand, interview urgency, evidence gaps, and active roles. [YC directory](https://www.ycombinator.com/companies), [Mumbai job discovery](https://www.ycombinator.com/jobs/role/software-engineer/mumbai)

Coverage must expose separate counts: inventoried companies, companies searched, readable sources, and company-role pairs with useful evidence. No public evidence is a valid state. The system should serve an explicitly JD-based plan instead of inventing a hiring process. No recurring crawler or scheduled research was started in this design task.

## 8. Backend and data design

Supabase tables: `companies`, `source_documents`, `source_versions`, `evidence_claims`, `claim_links`, `research_runs`, `prep_profiles`, `plan_versions`, `prep_tasks`, `task_attempts`, `resource_catalog`, and `research_outbox`. Private uploads/resumes must never enter the shared source namespace. Use owner-based RLS and isolate shared editorial content with server-only writes. Deleting a private source invalidates its derived embeddings, claims, and future plan retrieval.

Proposed API workflow:

1. `POST /roles`: validate session; transactionally save role + outbox event with an idempotency key. Return role even if later research fails.
2. Worker consumes event, resolves target, fetches permitted sources, extracts and validates claims. Retry transient provider failures with bounded backoff. Distinguish partial results from completed research.
3. `GET /roles/:id/research`: return queued/reading/needs-input/partial/ready/failed, with ownership checks and honest counts.
4. `POST /roles/:id/plan`: combine approved evidence, profile, diagnostic and capacity; validate structured output before publishing a version.
5. `POST /tasks/:id/attempts`: grade available evidence, store private result, propose a plan revision. Pin unchanged completed tasks.

Proposed cache policy: refresh JD/process sources after 7 days or when a user reports a change; recheck broken learning links before assignment; queue slower refreshes for long-tail inventory. These are design defaults, not currently running automations. Log fetch state, duration, provider cost, evidence IDs, prompt/model version, and validation failures without exposing private content or credentials.

Fetch safety before enabling broader ingestion: authenticated rate limits; HTTP(S)-only; block loopback/private/link-local IPs for IPv4 and IPv6; resolve and validate DNS on every redirect; limited redirect count; byte/time/content-type limits; exact Google host matching; safe parser sandbox; no remote scripts; no internal cookies/headers forwarded. Source text is untrusted data, never instructions to tools or the planner. An extracted link must pass the same checks. Sanitize rendering and allowlist learning URLs from retrieved catalog entries.

## 9. Current code gaps and implementation order

Inspected `src/lib/roleResearch.js` and `netlify/functions/research-role.mjs`:

- Search currently collects link titles, not the bodies of candidate experiences. Keyword extraction combines those titles with the JD.
- Weekly plans are generic, capped at eight weeks, and do not use availability or demonstrated skills. Expired deadlines silently become 14 days; checkpoints can collide on short windows.
- Several “free resources” are search result pages, not validated lessons.
- The fetch helper follows arbitrary redirects and reads the full response before truncation. Broader ingestion needs the security boundary above first.
- Current research results and task progress are local per-role enhancements, not the shared versioned evidence store described here.

Build in this order:

1. **Safe ingestion + source model:** authentication, ownership, fetch protections, parsing states, duplicate handling, source rights. Keep job save independent. Gate: forbidden/private URLs and inaccessible JDs cannot become evidence.
2. **Evidence extraction + retrieval:** structured claims, role scopes, dates, provenance, contradictions, current JD priority. Start with a manually reviewed big-tech/ML pilot. Gate: every displayed company claim points to a supporting span.
3. **Constraint scheduler + real resources:** availability, deadline semantics, diagnostic, dependencies, direct verified resources. Gate: no task outside capacity or deadline; failed prerequisites never silently skipped.
4. **Role-specific mocks + adaptation:** original exercises, artifact-based grading, unaided recall, versioned replanning. Gate: explainable feedback, no fabricated candidate achievements.
5. **Mumbai and YC expansion:** directory inventory, deduplication, demand-driven company research, approved connectors. Gate: coverage and unknowns reported honestly; no blanket “all companies covered.”

## 10. Acceptance suite before production

Create a reviewer-labelled evaluation set across role families, levels, locations, sparse evidence and contradictions; split by company/author/event and time so duplicate posts do not leak across train/evaluation sets. A proposed initial pilot is 50 role scenarios; this is a target, not an existing test suite.

Required adversarial cases:

- Sarvam's December 2024 report republished later stays historical; “no DSA” stays scoped.
- Ringg and Sarvam accounts from one author are not treated as corroborating the same company's loop.
- Hypothetical “Google interview” tutorials do not become candidate reports.
- A search hit returning 404, a login page, or a title-only result cannot establish rounds.
- One author's tweet, blog, and mirror count once; conflicting rounds remain visible.
- A campus SDET report does not define a senior backend loop; Mumbai is not inferred from old headquarters.
- Same-day, past, missing, changed and timezone-boundary deadlines; zero availability; a long mock that cannot fit; three applications sharing a skill.
- Prompt injection in a JD; redirected internal URL; oversized PDF; another user's source/task; no server secrets in generated output.
- Resource links are direct and currently accessible; paid compute requirements disclosed; generated links rejected.
- Code feedback agrees with executable tests; unverifiable answers are not scored as facts; completed tasks survive replanning.

Release gates: zero uncited company-specific claims, cross-user disclosures, forbidden fetches, and budget/deadline violations in the acceptance suite. Human reviewers must separately score citation entailment and role relevance; merely having a URL does not pass. Measure resource validity, duplicate inflation, abstention quality, diagnostic improvement, delayed recall, task feasibility, cost and latency. Do not optimize against self-reported offers or invent accuracy numbers before evaluation.
