# One global interview-preparation algorithm

Version 2 · 8 September 2026

Implementation update (10 September): the app now uses this evidence/scheduling core in `src/lib/prepEngine.js`. See [workspace release](workspace-release.md) for the implemented flows, required cloud configuration and remaining validation boundaries. The design below remains the target specification, not a claim that every capability is deployed.

Extends [the original design](interview-preparation-design.md). This is the canonical algorithm design; the linked reference engine implements only the deterministic evidence-selection and time-scheduling portions. No home-page changes, live ingestion, model training, or deployment are included.

## Core rule

**The algorithm is global. Interview expectations remain specific to a job, a team, a hiring route, a place, and a time.**

The output is not a summary of everything on the internet. It is a source-attributed interview map, the unknowns that matter, and the smallest useful preparation plan that fits the candidate's calendar.

```text
Role + JD + candidate + calendar
              ↓
Resolve target → discover/read sources → extract attributed process variants
              ↓
Filter scope, rights, dates and duplicates → identify important unknowns
              ↓
Map assessment skills → diagnose gaps → choose tasks + free resources
              ↓
Schedule before each round → practise → assess evidence → revise remaining work
```

## 1. What the wider research changes

| Source | Observed distinction | Algorithm consequence |
|---|---|---|
| [Canva engineering blog](https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/) | Its June 2025 article describes AI-assisted technical interviewing for named engineering families | Store permitted tools and assessment format per stage; practise reviewing/debugging AI output where appropriate |
| [Atlassian engineering guide](https://www.atlassian.com/company/careers/resources/interviewing/engineering) | Coding, design, and adaptive follow-up discussions; links to family/level-specific guides | Retrieve the exact craft guide and vary question depth instead of treating all engineering jobs identically |
| [Zalando SWE blog](https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers) and [Applied Scientist blog](https://jobs.zalando.com/en/blog/technical-interview-for-applied-science) | Distinct engineering and science interview dimensions; explicit variations by role | Same company must support different process variants and skill graphs |
| [GitLab technical guide](https://handbook.gitlab.com/handbook/hiring/interviewing/technical/) and [proposed redesign](https://handbook.gitlab.com/handbook/company/working-groups/ai-native-hiring/) | Published guidance and a proposal coexist | “Official website” alone is insufficient: distinguish adopted guidance, pilot, proposal, and historical material |
| [Murat Yiğen's Wolt account](https://careers.wolt.com/en/blog/tech/my-first-three-months-as-a-product-lead-at-wolt) | A 2022 Product Lead account includes case-study preparation and a panel discussion | A first-person post on a company blog is still one historical experience, not a universal current policy |
| [Spanish-language Mercado Libre account](https://www.reddit.com/r/devsarg/comments/1owlmd9/entrevista_t%C3%A9cnica_mercado_libre_para_backend/) | The original poster updates a request for advice with their actual technical experience; comments describe other experiences | Separate questions, speculation, original-author updates, and other authors; language/community name does not prove job location |

These observations support design choices, not assertions that those processes apply to every opening today. More recent source retrieval does not update the event or policy date. Additional source metadata is in [the global source manifest](../research/global-interview-sources.json).

## 2. Global normalization without country stereotypes

Target schema:

```text
company_id, official_domain, business_unit, job_id, role_family, specialty
raw_title, employer_level, normalized_seniority, normalization_evidence
job_country/city, remote_eligibility, hiring_channel, employment_type
JD_version, current_round, interview_language, learning_language
timezone, round_deadlines[], available_slots[], candidate_skill_evidence[]
```

Use canonical employer identity and aliases, including local scripts and acquired-company names. Preserve raw titles; “SDE II,” “L4,” and “Senior Engineer” are not automatically equivalent. Infer a provisional scope from responsibilities only when title/level is unclear, and expose that assumption.

Geography filters job evidence, not people's ability. Never infer nationality, interview language, language proficiency, or work authorization from name or location. Let users supply relevant eligibility and scheduling constraints; the planner does not issue immigration or employment-law advice.

Search in the job's relevant language plus English where useful. Examples of discovery terms include “interview experience,” “expérience entretien,” “Vorstellungsgespräch Erfahrungsbericht,” and “experiencia entrevista.” Preserve original text, translated text, translator version, and source spans separately. Ask for clarification when a translation changes a material rule such as “must,” “may,” “not,” duration, or allowed tools. Cross-language reposts must share a duplicate cluster.

## 3. Find full accounts—but measure completeness honestly

Prefer detailed firsthand reports containing the actual sequence, role/level, event date, assessment format, duration, constraints, evaluated skills, and outcome. A candidate rejected at round two cannot establish later rounds. A lengthy SEO page is not necessarily more complete than a short recruiter guide.

Extract each author's account independently. A thread's first post might ask what to expect; a later update might report what happened. Comments are separate sources. Employer blog hosting and first-person authorship are separate classification fields.

For every process variant, record this coverage vector:

```text
target_identified, event_dated, stages_observed, order_supported,
timings_present, tools_present, skills_present, outcome_known,
ends_at_rejection, author_claims_full_loop, unresolved_fields[]
```

Do not collapse it to “100% complete.” A narrative can describe a complete loop while leaving tools or timings unknown. Display “four stages described; tools not stated,” or “candidate reached assessment only.” Employer-stated end-to-end sequences are still scoped statements.

Discovery operates in two passes:

1. Cache + official JD + exact-role process guides + recent firsthand accounts in relevant languages.
2. Targeted gap searches: missing next round, conflicting AI policy, unclear duration, old account, or ambiguous location.

Stop when essential unknowns have been researched and further queries yield no new independent relevant evidence, or the per-role time/cost limit is reached. Record which reason stopped research. Do not require a fixed number of blogs when no good accounts exist. Paywalls, login walls, deleted pages and search-only results remain access states, not invented content.

## 4. Build process variants, never a stitched-together loop

Represent an account as an ordered graph. Nodes are observed stages; edges mean a source actually establishes an ordering. Concurrent panels and alternative take-home/live tasks are branches. Missing order remains missing. Do not union two accounts into a made-up seven-round interview.

Each node contains:

```text
stage_id, original_label, normalized_format, order_edges
duration/range, async_or_live, assessed_skill_ids
tool_rules { AI, internet, APIs, IDE, language, documentation }
expected_artifact, stated_rubric, evidence_claim_ids
policy_lifecycle, scope, effective_period, source_version
```

Supported formats include conversational screen, timed algorithmic coding, machine coding, code review, take-home build, portfolio critique, case study, system design, scientific depth, paper/project discussion, sales roleplay, presentation, behavioral discussion, and work trial. These are format categories, not requirements to insert into every plan.

Keep policy dimensions separate: API access is not the same as AI assistance; an IDE is not automatically internet access. Unknown tool rules must remain unknown. Require the candidate to confirm material simulation constraints with their recruiter. The app is for preparation, not covert assistance during a real assessment.

Evidence selection first excludes wrong-company, incompatible role, known level/location/channel mismatches, unread bodies, proposals presented as adopted policy, rights failures, and unsupported claims. Then order by exact job/team fit, source authority within that scope, event/policy recency, and specificity. A globally scoped official guide may apply across locations; a local candidate story with missing target geography requires confirmation.

Maintain a set of plausible variants, not fabricated probabilities. A personal recruiter brief for the scheduled round has strong relevance to that candidate but remains private. An official proposal cannot override adopted guidance simply because it is newer. Multiple matching independent reports justify “reported by multiple candidates,” not “guaranteed.” Contradictory variants prompt confirmation and contingency preparation when affordable.

## 5. Map the process to demonstrated skills

Separate two graphs:

- **Process graph:** what the sources say might be assessed.
- **Learning graph:** our recommended prerequisites, exercises, projects, mocks, and review sessions.

Every learning task has `basis = official_requirement | reported_signal | prerequisite | general_recommendation`, evidence IDs when applicable, an explanation, a deliverable and a rubric. Generated exercises must never be presented as actual employer questions.

The same engine selects different skill adapters:

| Assessed format | Useful practice artifact |
|---|---|
| Timed coding | Correct solution, complexity analysis, edge-case tests |
| AI-assisted build | Working increment, prompt/decision log, corrected model mistakes, tests |
| ML/science | Reproducible small experiment, evaluation and error analysis, explanation of assumptions |
| Design portfolio | Case narrative, design decisions, accessibility reasoning, critique response |
| Product case | Problem framing, prioritization, metrics, decision memo and defense |
| Sales/customer roleplay | Discovery questions, accurate product explanation, objections and next steps |

These adapters need their own reviewed exercises and rubrics. A generic language model cannot truthfully provide expert coverage for every profession; unsupported families receive a clearly labeled JD-based checklist until an appropriate adapter exists.

The optional diagnostic uses short unaided tasks. Skills remain unassessed until evidence exists. A missed deadline is a scheduling observation, not evidence of low ability; a transcription failure is not a wrong answer. Accessible text alternatives must be available.

## 6. One planning objective

Select tasks that improve weak, relevant skills under the actual constraints:

```text
maximize: relevant skill coverage + next-round practice + useful artifact completion
          - repeated already-demonstrated work - unnecessary task switching
subject to:
  per-slot and total time limits, round-specific deadlines, dependencies,
  permitted tools, free-resource constraints, device/compute availability,
  language/accessibility needs, and pinned completed work
```

Weights are proposed product heuristics, not learned hiring probabilities. Prioritize the next known round; retain a modest foundation reserve when process evidence is weak. Uncertainty triggers a targeted question or useful general practice, not an unlimited syllabus. Do not add a project if rehearsing an existing one better serves the next round.

Resource selection resolves exact lessons or exercises. Link title, section/timestamp, prerequisites, estimated study time, captions/language, access date, and paid-compute dependencies must be checked. No Google/YouTube search pages masquerading as recommendations, no “free” course that requires a paid subscription to complete the assigned unit.

Scheduling uses explicit availability intervals and timezone-aware deadlines. Convert local recurring availability using IANA timezone rules upstream, accounting for DST, then pass absolute instants to the scheduler. Resolve ambiguous local times with the user. Deadline missing means explicitly provisional planning; past deadline means ask for a new one.

Default proposed buffer: 15%. Tasks are small but indivisible; a 150-minute mock must fit a real 150-minute block. If it cannot, offer a shorter drill or request a longer slot. Split drills are never labeled full simulations. Report omitted tasks, remaining risks, and unfilled time instead of filling every minute with low-value work.

## 7. End-to-end orchestration pseudocode

```text
prepare(role, candidate, calendar):
  target = resolve_and_confirm_identity_and_scope(role)
  slots = normalize_calendar_and_validate_deadline(calendar)
  jd = safely_read_permitted_source_or_request_upload(role.jd)

  sources = discover_from_cache_official_pages_and_firsthand_accounts(target)
  documents = fetch_permitted_bodies_with_limits(sources)
  accounts = classify_authors_events_language_lifecycle_and_rights(documents)
  claims = extract_with_supporting_spans(accounts)
  valid_claims = verify_entailment_scope_dates_and_deduplicate(claims)
  variants = assemble_attributed_process_graphs(valid_claims)

  if high_impact_unknowns(variants):
    do bounded_targeted_research_or_ask_candidate_to_confirm()

  skills = map_jd_and_process_to_reviewed_skill_adapters(jd, variants)
  gaps = update_from_diagnostic_or_mark_unassessed(candidate, skills)
  tasks = propose_original_practice_units(skills, gaps, next_round)
  resources = resolve_and_validate_direct_free_resources(tasks)
  tasks = validate_evidence_reasons_rubrics_dependencies_and_tool_rules(tasks)
  schedule = dependency_aware_pack(tasks, slots, round_deadlines, buffer)

  return versioned_plan(
    schedule, sources, variants, assumptions, missing_information,
    deferred_work, resource_access_states, generation_and_validation_versions
  )
```

Use independent structured validators after extraction and generation. Citation presence is insufficient: confirm the source passage actually entails the attributed claim. Redact private details, reject embedded instructions in sources, and keep security/fetch enforcement outside the model. See the original design for authenticated queues, RLS and fetch protections.

## 8. Adapt after practice without pretending to retrain a model

An attempt updates that user's skill evidence, not the employer's process facts. Grade against observable tests or an explicit rubric; cite the relevant answer span. Ask a deeper follow-up when strong, a prerequisite probe when weak, and a new variant later for recall. Track coached and unaided attempts separately.

On a plan revision, preserve completed artifacts and future tasks the user pinned, recompute remaining capacity, and show the change. If new credible process evidence changes allowed tools or the next round, request confirmation before replacing material preparation work. Model-generated feedback cannot become training labels without review and appropriate consent.

## 9. Global scale means measured coverage

Store shared public permitted knowledge by company-role-scope; keep candidate profiles, private sources, tasks and recordings tenant-private. Reuse source versions and skill exercises across applications. A single role request should not rescrape the entire internet.

Inventory and deep research are separate jobs. Cover YC company identity via a permitted directory/feed mechanism, then deepen company-role evidence on demand. Expand beyond YC using current job demand and public employer directories—not the unsupported assumption that every startup appears in YC.

Maintain coverage metrics by region, language, role family and level. The current research includes examples relevant to India, North America, Europe, Australia and Spanish-language accounts, but it is not exhaustive regional coverage. Africa, the Middle East, East Asia and many professions still need dedicated source review. Never substitute North American SWE anecdotes without labeling that mismatch.

Use bounded query/fetch budgets, per-domain rate limits, cache invalidation, deduplicated worker jobs, retries for transient errors and explicit partial results. All proposed refresh behavior requires implementation and appropriate source permissions; no background crawler is running from this task.

## 10. Reference engine and validation boundary

The executable [reference engine](../research/global-prep-reference.js) implements:

- Exact company/family and known-scope gates, source rights/ownership checks, lifecycle and provenance checks.
- Event-based freshness, independent-source deduplication, separate ordered variants and format-confirmation flags.
- Dependency-aware greedy scheduling with absolute timestamps, overall/round deadlines, a buffer, completed-task preservation, and explicit deferred work.

The rank weights in this reference are **0.55 scope fit + 0.25 freshness + 0.20 source weight**. They replace the illustrative V1 weights for this prototype only and remain uncalibrated. “Historical” begins at 365 days in the reference; this is a UI heuristic, not a factual expiration rule. Unknown dates stay unknown. The score does not prove a source is truthful.

The reference receives already normalized, reviewed inputs. Its presence does not validate extraction, translations, source truth, resource quality, production authorization or model grading. Ordered stage lists are a minimal representation of variants; arbitrary branching graphs are specified above but not implemented. The greedy scheduler is feasible, not globally optimal. It does not yet implement spaced-recall generation, resource search, curriculum optimization or cross-role reuse.

Run `npm test` for synthetic policy/constraint fixtures. They cover blocked and wrong-scope sources, proposals, ownership, duplicate events, old reports with new publication dates, unknown dates/teams, competing AI policies, missing provenance, deadlines/timezones, dependencies, oversized mocks, completed work and zero capacity.

Before production, also require a blinded human-reviewed evaluation set covering actual multilingual sources and unseen company-role pairs. Split by author/event and time; keep mirrors in the same split. Measure extraction accuracy, citation entailment, scope leakage, false certainty, feasible task completion, delayed recall, resource access, latency and cost. Do not report interview-success prediction or global completeness from unit-test results.
