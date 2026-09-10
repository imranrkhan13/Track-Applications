import { assembleProcessMap, schedulePreparation } from '../lib/prepEngine.js';
import { workspaceFor } from './repository.js';

export const FAMILIES = [['engineering', 'Software engineering'], ['ml', 'Machine learning / data science'], ['design', 'Design / UX'], ['product', 'Product management'], ['general', 'Other role']];
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
export function buildPreparation(job, userId, now = new Date().toISOString()) {
    const w = workspaceFor(job);
    const family = w.preferences.roleFamily || inferFamily(job.role);
    const adapter = ADAPTERS[family] || ADAPTERS.general;
    const process = processFor(job, userId, now);
    const { slots, deadline } = makeAvailability(w.preferences, w.deadline, now);
    const task = (id, title, minutes, brief, artifact, rubric, extra = {}) => ({ id, title, minutes, brief, artifact, rubric, priority: 60, skill: 'Interview communication', reason: 'Recommended preparation; not a claimed employer question.', basis: 'general_recommendation', evidenceIds: [], dependsOn: [], ...extra });
    const tasks = [
        task('role-map', 'Turn the job description into a checklist', 25, 'Identify three required outcomes. Match each to something you have done and mark the gaps. If no JD is available, ask for it.', 'Three requirements, matching proof and open questions.', ['Specific requirements', 'Truthful evidence', 'Unknowns recorded'], { priority: 100 }),
        task('format', 'Confirm the next interview', 20, 'Ask your recruiter about round format, duration, skills and allowed tools. Record the answer under Research.', 'A recruiter question or confirmed round brief.', ['Round and date clarified', 'AI and internet rules checked'], { priority: 95 }),
        task('company', `Understand ${job.company} and its customers`, 25, 'Read the official product and team pages. Record two facts with source URLs and three questions. Do not assume a stack from the company name.', 'A one-page company brief with sources.', ['Facts link to sources', 'Questions connect to the role'], { priority: 75 }),
        task('learn', `Review: ${adapter.skill.toLowerCase()}`, 35, 'Revisit one weak concept using the lesson. Explain it without notes and identify what you cannot yet explain.', 'A short explanation and worked example.', adapter.rubric, { skill: adapter.skill, resources: adapter.resource ? [RESOURCES[adapter.resource]] : [], dependsOn: ['role-map'], priority: 75 }),
        task('build', adapter.title, 60, adapter.brief, adapter.artifact, adapter.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 70 }),
        task('review', 'Review your work and its limitations', 30, 'Test or critique the artifact. Explain a failure case, an alternative and your next improvement.', 'Reviewed artifact with limitations.', adapter.rubric, { skill: adapter.skill, dependsOn: ['build'] }),
        task('stories', 'Prepare two specific experience stories', 30, 'Choose a trade-off and a difficult collaboration. Explain your decision, the outcome and what you learned.', 'Two stories with real details, not invented metrics.', ['Personal contribution', 'Supported outcome', 'Specific reflection'], { priority: 85 }),
        task('mock', 'Rehearse a role-specific interview', 40, 'Use Practice to answer a craft prompt and project question. Time yourself, then assess your answer against the rubric.', 'Saved answer, self-review and an improvement.', adapter.rubric, { skill: adapter.skill, dependsOn: ['stories'], priority: 90 }),
        task('recall', 'Explain the weak concept again', 20, 'Without reopening the lesson, answer a different example. Compare it with your first attempt.', 'A second unaided explanation.', adapter.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 50 }),
    ];
    const jd = jobDescriptionFor(job);
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
    const spanDays = Math.floor((Date.parse(deadline) - Date.parse(now)) / 86400000);
    tasks.find(t => t.id === 'recall').availableAfter = new Date(Date.parse(now) + 2 * 86400000).toISOString();
    for (let week = 2; week <= Math.min(8, Math.ceil(spanDays / 7)); week++) {
        tasks.push(task(`recall-week-${week}`, `Week ${week}: revisit your weakest skill`, 30, 'Attempt a new example without notes. Use the same rubric as your previous attempt. Identify one change in your reasoning and a question you still have.', 'A fresh attempt, comparison and one corrected explanation.', adapter.rubric, { skill: adapter.skill, dependsOn: ['learn'], priority: 55, availableAfter: new Date(Date.parse(now) + (week - 1) * 7 * 86400000).toISOString() }));
    }
    for (const t of tasks) if (w.preferences.gaps.includes(t.skill)) t.priority += 35;
    for (const old of w.plan?.tasks || []) if (w.completed[old.id]?.done) { const index = tasks.findIndex(t => t.id === old.id); if (index >= 0) tasks[index] = old; else tasks.push(old); }
    const schedule = schedulePreparation({ tasks, slots, deadline, now, completedIds: Object.keys(w.completed).filter(id => w.completed[id]?.done), bufferFraction: .15 });
    return { version: 2, generatedAt: now, deadline, timezone: w.preferences.timezone, family, tasks, ...schedule, process, inputFingerprint: fingerprint(job, w), assumptions: ['Practice tasks are recommendations, not guaranteed interview questions.', '15% of available time is left unscheduled.', ...(spanDays > 56 ? ['Recurring recall is planned for eight weeks. Reassess your next milestone afterward.'] : []), ...(!process.variants.length ? ['No reviewed company process yet. This is a role-based plan.'] : []), ...(family === 'general' ? ['General checklist; specialist curriculum is not available for this role.'] : [])] };
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
