import { assembleProcessMap, schedulePreparation } from '../lib/prepEngine.js';
import { workspaceFor } from './repository.js';

export const FAMILIES = [['engineering', 'Software engineering'], ['ml', 'Machine learning / data science'], ['design', 'Design / UX'], ['product', 'Product management'], ['general', 'Other role']];
// Task tiers are the plan's honesty axis: with little runway we keep only the
// essential set and say plainly what was left out, rather than compressing the
// whole curriculum into too few days.
export const TIERS = ['essential', 'core', 'stretch'];
// How much of the curriculum the runway before the interview can carry.
export const RUNWAY_BUCKETS = [
    { id: 'sprint', maxDays: 4, tiers: ['essential'], label: 'Short runway' },
    { id: 'standard', maxDays: 13, tiers: ['essential', 'core'], label: 'Focused runway' },
    { id: 'extended', maxDays: Infinity, tiers: ['essential', 'core', 'stretch'], label: 'Full runway' },
];
export function runwayBucket(spanDays) { return RUNWAY_BUCKETS.find(b => spanDays <= b.maxDays) || RUNWAY_BUCKETS[RUNWAY_BUCKETS.length - 1]; }
export const normalizeCompany = value => value.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function inferFamily(title) {
    if (/\b(ml|ai|machine learning|data scien|applied scien)/i.test(title)) return 'ml';
    if (/design|\bux\b/i.test(title)) return 'design';
    if (/product.*(manager|lead)|product management/i.test(title)) return 'product';
    if (/engineer|developer|software|\bsde\b/i.test(title)) return 'engineering';
    return 'general';
}
const resource = (title, url, section) => ({ title, url, section, access: 'Public learning material', checkedOn: '2026-09-08' });
const RESOURCES = {
    react: resource('React: thinking in components', 'https://react.dev/learn/thinking-in-react', 'Read the five steps, then build a small filtered list.'),
    web: resource('MDN: client–server overview', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview', 'Explain the request and response lifecycle.'),
    algorithms: resource('MIT: Introduction to Algorithms', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', 'Choose one relevant data-structure lecture, not the entire course.'),
    ml: resource('PyTorch: optimization loop', 'https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html', 'Loss, gradients and the training loop. Use a tiny CPU example.'),
    audio: resource('Hugging Face: evaluating speech recognition', 'https://huggingface.co/learn/audio-course/en/chapter5/evaluation', 'WER measures ASR transcription errors, not VAD quality.'),
    design: resource('W3C: accessibility tutorials', 'https://www.w3.org/WAI/tutorials/', 'Choose forms or page structure and inspect a real flow.'),
    product: resource('Atlassian: product roadmaps', 'https://www.atlassian.com/agile/product-management/product-roadmaps', 'Connect priorities with outcomes rather than feature counts.'),
};
const ADAPTERS = {
    engineering: { skill: 'Technical problem solving', title: 'Build and test one small feature', brief: 'Choose one requirement in the JD. Implement the smallest useful version locally, with success, failure and edge-case tests.', artifact: 'Working code, tests and a short README explaining one trade-off.', rubric: ['Behavior matches the requirement', 'Tests cover success and failure', 'Can explain technical trade-offs'], resource: 'web' },
    ml: { skill: 'Evaluation and experiments', title: 'Run a small, reproducible experiment', brief: 'Choose a task relevant to the JD. Start with a baseline and a tiny public or synthetic dataset. Separate evaluation data, compare errors and document compute limits.', artifact: 'A reproducible notebook, baseline comparison and error analysis.', rubric: ['No evaluation leakage', 'Metric matches the task', 'Baseline and limitations explained'], resource: 'ml' },
    design: { skill: 'Design decisions', title: 'Improve one product flow', brief: 'Describe a user problem, sketch an alternative and check accessibility. Label assumptions; do not invent user-research results.', artifact: 'Before/after flow and a five-minute case narrative.', rubric: ['User problem is explicit', 'Trade-offs are justified', 'Accessibility is considered'], resource: 'design' },
    product: { skill: 'Product judgment', title: 'Write a one-page product decision', brief: 'Identify a customer problem, compare two options and choose a success metric. State assumptions and how you would validate them.', artifact: 'Decision memo, prioritized options and measurement plan.', rubric: ['Clear target customer', 'Explicit prioritization trade-off', 'Measurable outcome and guardrail'], resource: 'product' },
    general: { skill: 'Role evidence', title: 'Show proof of one job requirement', brief: 'Choose a stated responsibility and prepare a small example of your work. Reuse an existing artifact when that is more useful.', artifact: 'One relevant artifact and an explanation of your contribution.', rubric: ['Matches a requirement', 'Personal contribution is clear', 'Limitations are acknowledged'] },
};
export function dateInZone(instant, timezone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}
export function localInstant(day, time, timezone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a valid date and start time.');
    const target = Date.parse(`${day}T${time}:00Z`);
    if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 10) !== day) throw new Error('Invalid calendar date.');
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    const represent = value => { const p = Object.fromEntries(formatter.formatToParts(new Date(value)).map(x => [x.type, x.value])); return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`); };
    let guess = target;
    for (let i = 0; i < 4; i++) guess += target - represent(guess);
    if (represent(guess) !== target || [-3600000, 3600000, -1800000, 1800000].some(delta => represent(guess + delta) === target)) throw new Error('This local time is skipped or repeated by daylight saving. Choose a different start time.');
    return new Date(guess).toISOString();
}
// Deadline urgency is a product heuristic, not an interview probability.
// `kind` distinguishes an application-closing date from an interview date.
export function deadlineInfo(workspace, now = new Date().toISOString()) {
    const w = workspace || {};
    const kind = w.preferences?.deadlineKind || 'interview';
    const deadline = w.deadline || '';
    if (!deadline) return { kind, daysRemaining: null, urgency: 'unknown', past: false };
    const today = Date.parse(`${dateInZone(now, w.preferences?.timezone || 'UTC')}T00:00:00Z`);
    const target = Date.parse(`${deadline}T00:00:00Z`);
    if (!Number.isFinite(today) || !Number.isFinite(target)) return { kind, daysRemaining: null, urgency: 'unknown', past: false };
    const daysRemaining = Math.round((target - today) / 86400000);
    if (daysRemaining < 0) return { kind, daysRemaining, urgency: 'past', past: true };
    const urgency = daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'soon' : 'normal';
    return { kind, daysRemaining, urgency, past: false };
}
export function makeAvailability(preferences, deadline, now) {
    const { dailyMinutes, weekdays, startTime, timezone } = preferences;
    if (!Number.isInteger(dailyMinutes) || dailyMinutes < 20 || dailyMinutes > 240) throw new Error('Choose 20–240 study minutes per day.');
    if (!Array.isArray(weekdays) || !weekdays.length || weekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Choose at least one study day.');
    if (!deadline) throw new Error('Set your interview or preparation deadline first.');
    const end = localInstant(deadline, '23:59', timezone);
    if (Date.parse(end) <= Date.parse(now)) throw new Error('That deadline has passed. Choose your next interview date.');
    const today = dateInZone(now, timezone);
    const span = Math.round((Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
    if (span > 180) throw new Error('Plan a milestone within the next 180 days. You can extend it later.');
    const slots = [];
    for (let i = 0; i <= span; i++) {
        const date = new Date(Date.parse(`${today}T00:00:00Z`) + i * 86400000);
        if (!weekdays.includes(date.getUTCDay())) continue;
        const day = date.toISOString().slice(0, 10);
        const start = localInstant(day, startTime, timezone);
        slots.push({ id: day, start, end: new Date(Date.parse(start) + dailyMinutes * 60000).toISOString() });
    }
    return { slots, deadline: end };
}
export function processFor(job, userId, now = new Date().toISOString()) {
    const w = workspaceFor(job);
    return assembleProcessMap({ target: { companyId: normalizeCompany(job.company), roleFamily: w.preferences.roleFamily || inferFamily(job.role), level: w.preferences.level, location: job.location, channel: w.preferences.channel }, reports: w.reports.filter(r => r.confirmed), userId, asOf: now });
}
export function jobDescriptionFor(job) {
    const w = workspaceFor(job);
    if (w.jdText) return w.jdText;
    const query = w.research?.query;
    if (!query || normalizeCompany(query.company || '') !== normalizeCompany(job.company) || query.role !== job.role || (query.url !== undefined && query.url !== (job.url || ''))) return '';
    return w.research?.jd?.text || '';
}
function fingerprint(job, w) { return JSON.stringify([job.company?.trim() || '', job.role?.trim() || '', job.location?.trim() || '', job.url?.trim() || '', w.deadline, w.preferences, w.jdText, w.research?.generatedAt, w.reports, w.attempts.map(a => [a.id, a.selfAssessment])]); }

// A bounded, transparent JD matcher, not an assertion of the employer's rounds.
// Keep the exact matching sentence so the candidate can audit each recommendation.
export function requirementsFor(job) {
    const sentences = jobDescriptionFor(job).split(/[\n.!?]+/).map(s => s.trim()).filter(Boolean);
    const rules = [
        ['react', /\breact\b/i, 'React component design', 'Build a filterable interface with loading, empty and error states.', 'react'],
        ['web', /\b(rest|http|apis?|client.server)\b/i, 'API and request handling', 'Trace a request, implement input validation and test a failed response.', 'web'],
        ['design', /\b(accessibility|wcag|a11y)\b/i, 'Accessible interaction', 'Audit one form using keyboard navigation, labels and helpful error messages.', 'design'],
        ['ml', /\b(pytorch|gradient descent|optimization|training loop)\b/i, 'Model training and evaluation', 'Run a tiny baseline, inspect gradients and compare evaluation errors.', 'ml'],
        ['audio', /\b(asr|speech recognition|wer)\b/i, 'Speech recognition evaluation', 'Compare transcription errors and explain what WER does not measure.', 'audio'],
        ['product', /\b(roadmaps?|product strategy|prioriti[sz]ation)\b/i, 'Product prioritization', 'Rank two opportunities using a stated outcome, trade-off and guardrail.', 'product'],
    ];
    return rules.flatMap(([id, match, title, exercise, resourceKey]) => {
        const evidence = sentences.find(s => match.test(s) && !/\b(not required|no experience|not necessary|not needed|no knowledge)\b/i.test(s));
        return evidence ? [{ id, title, exercise, evidence: evidence.slice(0, 600), resources: [RESOURCES[resourceKey]] }] : [];
    });
}
// JD -> project derivation. Deterministic and auditable: every detected
// capability quotes the JD sentence it came from, and the resulting project is
// a practice suggestion, never a claim about the employer's real task.
const CAPABILITIES = [
    { id: 'rest-api', label: 'REST / HTTP API design', noun: 'a REST API', match: /\b(rest|restful|http apis?|api design|endpoints?|graphql)\b/i, stack: 'an HTTP framework (Express, FastAPI or Go net/http)' },
    { id: 'database', label: 'Data modelling & persistence', noun: 'a persisted data store', match: /\b(postgres|postgresql|mysql|\bsql\b|database|schema|\borm\b|dynamodb|mongo)/i, stack: 'Postgres or SQLite' },
    { id: 'auth', label: 'Authentication & authorization', noun: 'an auth flow with roles', match: /\b(auth|oauth|\bjwt\b|session|permission|\brbac\b|access control)/i, stack: 'JWT or session cookies' },
    { id: 'frontend', label: 'Frontend / component UI', noun: 'a component interface', match: /\b(react|vue|angular|svelte|frontend|\bui\b|component|\bcss\b|tailwind)/i, stack: 'React (or the framework named in the JD)' },
    { id: 'testing', label: 'Automated testing', noun: 'a tested core', match: /\b(test|unit test|integration test|\btdd\b|jest|pytest|playwright|cypress)/i, stack: 'Jest/Vitest or Pytest' },
    { id: 'realtime', label: 'Realtime / streaming', noun: 'a realtime update path', match: /\b(realtime|real-time|websocket|\bsse\b|streaming|pub\/sub|kafka|queue|event-driven)/i, stack: 'WebSockets or Server-Sent Events' },
    { id: 'ml-training', label: 'Model training', noun: 'a training pipeline', match: /\b(train|training loop|fine-?tun|pytorch|tensorflow|gradient|optimiz)/i, stack: 'PyTorch' },
    { id: 'ml-eval', label: 'Model evaluation', noun: 'an evaluation harness', match: /\b(evaluation|\beval\b|metric|precision|recall|\bf1\b|\bauc\b|\bwer\b|benchmark|accuracy)/i, stack: 'scikit-learn metrics' },
    { id: 'data-pipeline', label: 'Data pipeline / ETL', noun: 'an ingest pipeline', match: /\b(etl|pipeline|ingest|data processing|airflow|spark|batch)/i, stack: 'a scheduler or plain scripts' },
    { id: 'llm', label: 'LLM / retrieval application', noun: 'a retrieval pipeline', match: /\b(llm|large language|prompt|\brag\b|embedding|vector|retrieval)/i, stack: 'an embedding store and a prompt harness' },
    { id: 'cloud', label: 'Deployment / cloud', noun: 'a containerised deployment', match: /\b(aws|gcp|azure|docker|kubernetes|deploy|ci\/cd|terraform)/i, stack: 'Docker' },
    { id: 'accessibility', label: 'Accessibility', noun: 'an accessible interface', match: /\b(accessibility|wcag|a11y|screen reader|aria)/i, stack: 'axe and keyboard testing' },
    { id: 'perf', label: 'Performance / optimisation', noun: 'a measured optimisation', match: /\b(performance|optimization|optimisation|latency|throughput|caching|scalab)/i, stack: 'a profiler and a benchmark script' },
    { id: 'design-research', label: 'User research & flows', noun: 'a revised user flow', match: /\b(user research|usability|wireframe|prototype|design system|figma)/i, stack: 'Figma and a usability checklist' },
    { id: 'product-metrics', label: 'Product metrics & experiments', noun: 'a metric-driven decision', match: /\b(metric|\bkpi\b|experiment|a\/b|north star|roadmap|prioritiz|prioritis)/i, stack: 'a spreadsheet or analytics tool' },
];
const PROJECT_READMES = ['One-paragraph purpose and the exact JD requirement it targets', 'Setup and run commands that work from a clean checkout', 'One design trade-off you made and why', 'Known limitations and what you would do next'];

/** Derive a concrete, JD-grounded practice project. Returns a role-default
 * spec when the JD is missing or names no recognised capability. */
export function deriveProject(job) {
    const w = workspaceFor(job);
    const family = w.preferences.roleFamily || inferFamily(job.role);
    const adapter = ADAPTERS[family] || ADAPTERS.general;
    const sentences = jobDescriptionFor(job).split(/[\n.!?]+/).map(s => s.trim()).filter(Boolean);
    const detected = CAPABILITIES.map(cap => {
        const evidence = sentences.find(s => cap.match.test(s) && !/\b(not required|no experience|not necessary|not needed|no knowledge|familiarity with)\b/i.test(s));
        return evidence ? { id: cap.id, label: cap.label, noun: cap.noun, stack: cap.stack, evidence: evidence.slice(0, 300) } : null;
    }).filter(Boolean).slice(0, 4);

    const evidence = detected.map(d => ({ capability: d.id, label: d.label, quote: d.evidence }));
    const stack = [...new Set(detected.map(d => d.stack))];
    const milestones = [
        { title: 'Scope and skeleton', minutes: 30, deliverable: `A repo with a README stating which JD requirement (${detected[0]?.label || adapter.skill}) it targets and how you will know it works.`, acceptance: ['Repo runs from a clean checkout', 'The targeted requirement is named', 'A first failing check exists'] },
        { title: 'Core behaviour', minutes: 90, deliverable: `The primary capability working end to end${detected[0] ? ` — ${detected[0].noun}` : ''}.`, acceptance: ['The happy path works', 'Inputs are validated', 'One error path is handled'] },
        { title: 'Tests and edge cases', minutes: 45, deliverable: 'Automated checks for success, one failure and one edge case.', acceptance: ['Tests pass locally', 'A failure case is asserted', 'An edge case is covered'] },
        { title: 'Document and review', minutes: 30, deliverable: 'A README a reviewer can follow, plus a note on one limitation.', acceptance: ['Setup steps are accurate', 'One trade-off is explained', 'Limitations are honest'] },
    ];

    if (!detected.length) return {
        id: 'project', basis: 'role_default', family, title: adapter.title, summary: adapter.brief,
        artifact: adapter.artifact, rubric: adapter.rubric, evidence: [], stack: adapter.resource ? [adapter.resource.title] : [],
        milestones, readme: PROJECT_READMES,
        caveat: 'No job description was matched, so this is a role-based practice project. Paste the JD or confirm expectations with your recruiter.',
    };

    const [top, second] = detected;
    const title = family === 'ml' ? `Build ${top.noun} with ${second ? second.noun.replace(/^an? /, 'a ') : 'a reproducible evaluation'}`
        : family === 'design' ? `Redesign one flow around ${top.label.toLowerCase()}`
        : family === 'product' ? `Write a product decision for ${top.noun.replace(/^an? /, '')}`
        : `Build ${top.noun}${second ? ` with ${second.noun}` : ''}`;
    const summary = `A scoped practice project derived from your job description. It exercises ${detected.map(d => d.label.toLowerCase()).join(', ')} so you have a concrete artifact to walk through in the interview. Start from the smallest version that runs, then add the remaining requirements.`;
    return {
        id: 'project', basis: 'jd_requirement', family, title, summary,
        artifact: `A runnable project, its tests and a README covering: ${PROJECT_READMES.map(r => r[0].toLowerCase() + r.slice(1)).join('; ')}.`,
        rubric: ['Targets a stated JD requirement', 'Runs from a clean checkout', 'Tests cover success, failure and an edge case', 'One trade-off and one limitation are explained'],
        evidence, stack: stack.length ? stack : [adapter.resource?.title || 'the stack named in the JD'],
        milestones, readme: PROJECT_READMES,
        caveat: 'This is a practice project derived from your job description, not a task the employer assigned. Confirm real expectations with your recruiter.',
    };
}

export function buildPreparation(job, userId, now = new Date().toISOString()) {
    const w = workspaceFor(job);
    const family = w.preferences.roleFamily || inferFamily(job.role);
    const adapter = ADAPTERS[family] || ADAPTERS.general;
    const project = deriveProject(job);
    const process = processFor(job, userId, now);
    const { slots, deadline } = makeAvailability(w.preferences, w.deadline, now);
    const task = (id, title, minutes, brief, artifact, rubric, extra = {}) => ({ id, title, minutes, brief, artifact, rubric, priority: 60, skill: 'Interview communication', reason: 'Recommended preparation; not a claimed employer question.', basis: 'general_recommendation', evidenceIds: [], dependsOn: [], ...extra });
    const urgencyInfo = deadlineInfo(w, now);
    const critical = urgencyInfo.urgency === 'critical';
    const spanDays = Math.floor((Date.parse(deadline) - Date.parse(now)) / 86400000);
    // Under three days: triage the next round instead of promising a full curriculum.
    const tasks = critical ? [
        task('triage-brief', 'List the three outcomes this role must prove', 20, 'Skim the job description and pick the three requirements that matter most. For each, name the strongest proof you already have and the one gap you would fix first.', 'Three requirements, your proof for each and the single gap you will close.', ['Requirements are specific', 'Proof is truthful', 'Gap is realistic in the time left'], { priority: 105 }),
        task('triage-gap', `Repair your weakest relevant skill: ${adapter.skill.toLowerCase()}`, 30, adapter.brief, adapter.artifact, adapter.rubric, { skill: adapter.skill, resources: adapter.resource ? [RESOURCES[adapter.resource]] : [], priority: 100 }),
        task('triage-stories', 'Rehearse two specific experience stories', 25, 'Choose one trade-off and one difficult collaboration. Explain your decision, the outcome and what you learned. Use real details, not invented metrics.', 'Two stories with real details and a clear personal contribution.', ['Personal contribution', 'Supported outcome', 'Specific reflection'], { priority: 95 }),
        task('mock', 'Rehearse a role-specific interview', 30, 'Use Practice to answer a craft prompt and a project question. Time yourself, then assess your answer against the rubric.', 'Saved answer, self-review and one improvement.', adapter.rubric, { skill: adapter.skill, dependsOn: ['triage-stories'], priority: 90 }),
        task('triage-logistics', 'Confirm logistics and prepare your questions', 15, 'Confirm the time, format, duration and any tools allowed. Prepare three questions for the interviewer about the team and the work.', 'Confirmed logistics and three prepared questions.', ['Time and format confirmed', 'Questions are specific to the role'], { priority: 85 }),
    ] : [
        task('role-map', 'Turn the job description into a checklist', 25, 'Identify three required outcomes. Match each to something you have done and mark the gaps. If no JD is available, ask for it.', 'Three requirements, matching proof and open questions.', ['Specific requirements', 'Truthful evidence', 'Unknowns recorded'], { priority: 100 }),
        task('format', 'Confirm the next interview', 20, 'Ask your recruiter about round format, duration, skills and allowed tools. Record the answer under Research.', 'A recruiter question or confirmed round brief.', ['Round and date clarified', 'AI and internet rules checked'], { priority: 95 }),
        task('company', `Understand ${job.company} and its customers`, 25, 'Read the official product and team pages. Record two facts with source URLs and three questions. Do not assume a stack from the company name.', 'A one-page company brief with sources.', ['Facts link to sources', 'Questions connect to the role'], { priority: 75 }),
        task('learn', `Review: ${adapter.skill.toLowerCase()}`, 35, 'Revisit one weak concept using the lesson. Explain it without notes and identify what you cannot yet explain.', 'A short explanation and worked example.', adapter.rubric, { skill: adapter.skill, resources: adapter.resource ? [RESOURCES[adapter.resource]] : [], dependsOn: ['role-map'], priority: 75 }),
        task('build', project.title, 60, `${project.summary} Start with the first milestone and get the smallest version running.`, project.artifact, project.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 70, basis: project.basis === 'jd_requirement' ? 'jd_requirement' : 'general_recommendation', evidenceIds: project.basis === 'jd_requirement' ? ['job-description'] : [], reason: project.basis === 'jd_requirement' ? `Your JD mentions: “${project.evidence[0].quote}”` : 'Recommended preparation; not a claimed employer question.' }),
        task('review', 'Review your work and its limitations', 30, 'Test or critique the artifact. Explain a failure case, an alternative and your next improvement.', 'Reviewed artifact with limitations.', adapter.rubric, { skill: adapter.skill, dependsOn: ['build'] }),
        task('stories', 'Prepare two specific experience stories', 30, 'Choose a trade-off and a difficult collaboration. Explain your decision, the outcome and what you learned.', 'Two stories with real details, not invented metrics.', ['Personal contribution', 'Supported outcome', 'Specific reflection'], { priority: 85, tier: 'essential' }),
        task('mock', 'Rehearse a role-specific interview', 40, 'Use Practice to answer a craft prompt and project question. Time yourself, then assess your answer against the rubric.', 'Saved answer, self-review and an improvement.', adapter.rubric, { skill: adapter.skill, dependsOn: ['stories'], priority: 90, tier: 'essential' }),
        task('recall', 'Explain the weak concept again', 20, 'Without reopening the lesson, answer a different example. Compare it with your first attempt.', 'A second unaided explanation.', adapter.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 50 }),
    ];
    const jd = jobDescriptionFor(job);
    if (!critical) {
        if (family === 'engineering' && /\breact\b/i.test(jd)) tasks.find(t => t.id === 'learn').resources = [RESOURCES.react];
        if (family === 'ml' && /\b(asr|speech recognition|wer)\b/i.test(jd)) tasks.find(t => t.id === 'learn').resources = [RESOURCES.audio, RESOURCES.ml];
        const algorithmsRequired = jd.split(/[\n.!?]+/).some(s => /\b(algorithms|data structures|dsa)\b/i.test(s) && !/\b(no|not|without)\b/i.test(s));
        if (family === 'engineering' && algorithmsRequired) tasks.push(task('algorithms', 'Practice one relevant data structure', 45, 'Solve one small problem, test edge cases and explain time and space complexity.', 'Tested solution and complexity analysis.', ['Correctness', 'Edge cases', 'Complexity'], { resources: [RESOURCES.algorithms], skill: 'Technical problem solving', reason: 'Algorithmic skills are mentioned in the supplied JD.', basis: 'jd_requirement', evidenceIds: ['job-description'], priority: 80 }));
        for (const requirement of requirementsFor(job)) tasks.push(task(`jd-${requirement.id}`, requirement.title, 40, `${requirement.exercise} Start with the linked concept, then try it without notes.`, 'A small working example or critique, one edge case and a short explanation.', ['Matches the stated requirement', 'Demonstrates the concept', 'Explains a limitation'], { resources: requirement.resources, skill: adapter.skill, dependsOn: ['role-map'], reason: `Your JD says: “${requirement.evidence}”`, basis: 'jd_requirement', evidenceIds: ['job-description'], priority: 85 }));
        const latestBySkill = new Map();
        for (const attempt of w.attempts) latestBySkill.set(attempt.skill, attempt);
        for (const attempt of [...latestBySkill.values()].filter(a => a.selfAssessment === 'needs-work' && w.preferences.gaps.includes(a.skill)).slice(-3)) {
            tasks.push(task(`repair-${attempt.id}`, `Revisit: ${attempt.skill.toLowerCase()}`, 25, `Answer your saved prompt again without notes: ${attempt.question}. Then compare it with your previous answer. ${attempt.reflection ? `Your improvement note: ${attempt.reflection}` : 'Identify one assumption and one better-supported explanation.'}`, 'A revised answer and a concrete comparison with your previous attempt.', attempt.rubric || adapter.rubric, { skill: attempt.skill, reason: 'You marked this skill as needing practice in a saved rehearsal.', basis: 'self_review', evidenceIds: [`attempt-${attempt.id}`], priority: 105 }));
        }
        for (const variant of process.variants.slice(0, 3)) for (const stage of variant.stages.slice(0, 4)) tasks.push(task(`evidence-${variant.id}-${stage.key}`, `Prepare for: ${stage.label || stage.key}`, 35, `Rehearse the reported assessment: ${stage.evidenceSpan}. Confirm these rules for your own interview. This is an original practice exercise.`, 'Practice response and assessment constraints.', ['Addresses the brief', 'Explains limitations', 'Follows confirmed tool rules'], { basis: 'reported_signal', evidenceIds: [variant.id], reason: 'Based on the account you reviewed. It may not describe your current process.', skill: adapter.skill, priority: 90 }));
        tasks.find(t => t.id === 'recall').availableAfter = new Date(Date.parse(now) + 2 * 86400000).toISOString();
        for (let week = 2; week <= Math.min(8, Math.ceil(spanDays / 7)); week++) {
            tasks.push(task(`recall-week-${week}`, `Week ${week}: revisit your weakest skill`, 30, 'Attempt a new example without notes. Use the same rubric as your previous attempt. Identify one change in your reasoning and a question you still have.', 'A fresh attempt, comparison and one corrected explanation.', adapter.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 55, availableAfter: new Date(Date.parse(now) + (week - 1) * 7 * 86400000).toISOString() }));
        }
    }
    // An applied role with no booked next step gets a small follow-up nudge.
    if (job.status === 'Applied' && !job.next_date) tasks.push(task('application-follow-up', 'Follow up on your application', 15, 'If you have not heard back, send a short, polite follow-up to the recruiter or hiring manager. Reference the role and restate your interest.', 'A short follow-up message ready to send.', ['Names the role', 'Is concise and polite', 'Offers a clear next step'], { priority: 45 }));
    for (const t of tasks) if (w.preferences.gaps.includes(t.skill)) t.priority += 35;
    for (const old of w.plan?.tasks || []) if (w.completed[old.id]?.done) { const index = tasks.findIndex(t => t.id === old.id); if (index >= 0) tasks[index] = old; else tasks.push(old); }
    const schedule = schedulePreparation({ tasks, slots, deadline, now, completedIds: Object.keys(w.completed).filter(id => w.completed[id]?.done), bufferFraction: .15 });
    return { version: 2, generatedAt: now, deadline, timezone: w.preferences.timezone, family, tasks, project, ...schedule, process, inputFingerprint: fingerprint(job, w), urgency: urgencyInfo.urgency, daysRemaining: urgencyInfo.daysRemaining, deadlineKind: urgencyInfo.kind, assumptions: ['Practice tasks are recommendations, not guaranteed interview questions.', '15% of available time is left unscheduled.', ...(critical ? ['Under three days: a short triage plan, not a full curriculum.'] : []), ...(urgencyInfo.kind === 'application' ? ['This date is treated as an application deadline, not an interview date.'] : []), ...(spanDays > 56 ? ['Recurring recall is planned for eight weeks. Reassess your next milestone afterward.'] : []), ...(!process.variants.length ? ['No reviewed company process yet. This is a role-based plan.'] : []), ...(family === 'general' ? ['General checklist; specialist curriculum is not available for this role.'] : [])] };
}
export function planIsStale(job) { const w = workspaceFor(job); return w.plan && w.plan.inputFingerprint !== fingerprint(job, w); }
export function practiceQuestions(job) {
    const w = workspaceFor(job);
    const family = w.preferences.roleFamily || inferFamily(job.role);
    const adapter = ADAPTERS[family] || ADAPTERS.general;
    return [
        ...[...w.attempts].reverse().filter(a => a.coach?.followUp && !w.attempts.some(done => done.questionId === `followup-${a.id}`)).slice(0, 3).map(a => ({ id: `followup-${a.id}`, title: a.coach.followUp, skill: a.skill, rubric: a.rubric, origin: 'AI follow-up from your saved rehearsal; review its assumptions.' })),
        { id: 'project', title: `Walk through work relevant to ${job.role}. What did you decide, and how did you evaluate the result?`, skill: adapter.skill, rubric: adapter.rubric },
        { id: 'tradeoff', title: 'Describe a difficult trade-off. What alternatives did you reject, and what happened afterward?', skill: 'Interview communication', rubric: ['Specific context', 'Decision and alternatives', 'Truthful outcome and reflection'] },
        { id: 'craft', title: family === 'ml' ? 'A model improves on the test set but fails for real users. How would you investigate leakage, distribution shift and the metric?' : family === 'engineering' ? 'A feature works locally but fails intermittently in production. How would you narrow down the cause and validate a fix?' : family === 'design' ? 'A redesigned flow looks simpler but completion drops. How would you investigate and decide what to change?' : family === 'product' ? 'Two teams want incompatible priorities. How would you decide and measure the outcome?' : 'A task has unclear requirements and a tight deadline. How would you clarify the outcome and decide what to deliver?', skill: adapter.skill, rubric: adapter.rubric },
        ...processFor(job, job.user_id || 'demo-user').variants.flatMap(v => v.stages.slice(0, 2).map(s => ({ id: `${v.id}-${s.key}`, title: `Explain your approach to this reported assessment: ${s.evidenceSpan}`, skill: adapter.skill, rubric: ['Addresses assessment', 'Explains alternatives', 'Acknowledges constraints'], sourceUrl: v.sourceUrl }))),
    ];
}
