import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository, emptyWorkspace, jobPayload, safeLink, workspaceFor, canonicalStatus } from '../src/career/repository.js';
import { buildPreparation, inferFamily, jobDescriptionFor, localInstant, makeAvailability, normalizeCompany, planIsStale, practiceQuestions, processFor } from '../src/career/planner.js';
import { schedulePreparation } from '../src/lib/prepEngine.js';

const now = '2026-09-08T04:00:00Z';
function role(overrides = {}) { return { id: '1', user_id: 'user-1', company: 'Example', role: 'Software Engineer', status: 'Saved', location: '', workspace: { ...emptyWorkspace(), deadline: '2026-09-29', preferences: { ...emptyWorkspace().preferences, timezone: 'Asia/Kolkata', weekdays: [1, 2, 3, 4, 5], roleFamily: 'engineering' } }, ...overrides }; }
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, v) }; };
function database(result) {
    const calls = [];
    const chain = {};
    for (const method of ['select', 'eq', 'order', 'update', 'insert', 'delete']) chain[method] = (...args) => { calls.push([method, ...args]); return chain; };
    chain.single = chain.maybeSingle = async () => result;
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return { calls, client: { from: name => { calls.push(['from', name]); return chain; } } };
}
test('job payload excludes generated identity, revision and timestamps', () => {
    const payload = jobPayload({ ...role(), revision: 5, created_at: 'malicious', id: 99 }, 'user-1');
    assert.equal(payload.id, undefined); assert.equal(payload.revision, undefined); assert.equal(payload.created_at, undefined);
    assert.equal(payload.user_id, 'user-1');
});
test('job validation rejects empty titles and dangerous link protocols', () => {
    assert.throws(() => jobPayload(role({ company: ' ' }), 'user-1'));
    assert.throws(() => jobPayload(role({ url: 'javascript:alert(1)' }), 'user-1'));
    assert.throws(() => jobPayload(role({ status: 'Anything' }), 'user-1'));
    assert.equal(safeLink('data:text/html,hello'), '');
    assert.equal(safeLink('https://user:password@example.com'), '');
});
test('cloud edits use update, identity filter, ownership and optimistic revision', async () => {
    const db = database({ data: role(), error: null });
    const repo = createRepository({ client: db.client, userId: 'user-1', storage: memory() });
    await repo.save(role({ revision: 3 }));
    assert(db.calls.some(c => c[0] === 'update'));
    assert(!db.calls.some(c => c[0] === 'insert'));
    assert(db.calls.some(c => c[0] === 'eq' && c[1] === 'user_id' && c[2] === 'user-1'));
    assert(db.calls.some(c => c[0] === 'eq' && c[1] === 'revision' && c[2] === 3));
});
test('new cloud jobs let the database choose the ID', async () => {
    const db = database({ data: role(), error: null });
    const repo = createRepository({ client: db.client, userId: 'user-1', storage: memory() });
    await repo.save(role({ id: undefined }));
    const insert = db.calls.find(c => c[0] === 'insert');
    assert(insert); assert(!Object.hasOwn(insert[1], 'id'));
});
test('missing schema never silently falls back to local cloud storage', async () => {
    const db = database({ data: null, error: { code: 'PGRST204' } });
    const repo = createRepository({ client: db.client, userId: 'user-1', storage: { setItem: () => assert.fail('No local fallback allowed') } });
    await assert.rejects(repo.save(role()), /migration/);
});
test('stale revision rejects save rather than reporting success', async () => {
    const db = database({ data: null, error: null });
    await assert.rejects(createRepository({ client: db.client, userId: 'user-1' }).save(role()), /another tab/);
});
test('cloud delete is owner- and revision-scoped', async () => {
    const db = database({ data: [{ id: '1' }], error: null });
    await createRepository({ client: db.client, userId: 'user-1' }).remove(role({ revision: 2 }));
    assert(db.calls.some(c => c[0] === 'delete'));
    assert(db.calls.some(c => c[0] === 'eq' && c[1] === 'user_id'));
    assert(db.calls.some(c => c[0] === 'eq' && c[1] === 'revision' && c[2] === 2));
});
test('demo add, edit, reload and delete persist without touching old demo storage', async () => {
    const storage = memory(); storage.setItem('track-applications-v2', 'preserved');
    const options = { userId: 'demo-user', storage, loadLegacy: async () => [] };
    const repo = createRepository(options);
    const saved = await repo.save(role({ id: undefined }));
    const edited = await repo.save({ ...saved, status: 'Interview' });
    assert.equal((await createRepository(options).list())[0].status, 'Interview');
    await assert.rejects(repo.save(saved), /another tab/);
    await repo.remove(edited); assert.equal((await repo.list()).length, 0);
    assert.equal(storage.getItem('track-applications-v2'), 'preserved');
});
test('legacy status and next-action metadata are retained', async () => {
    const db = database({ data: [{ id: 1, company: 'Example', role: 'Engineer', status: 'applied', workspace: {}, date: '2026-09-09' }], error: null });
    const rows = await createRepository({ client: db.client, userId: 'user-1', legacyMeta: () => ({ deadline: '2026-09-20', next_step: 'Follow up' }) }).list();
    assert.equal(rows[0].status, 'Applied'); assert.equal(rows[0].workspace.next_step, 'Follow up'); assert.equal(rows[0].workspace.deadline, '2026-09-20');
    assert.equal(canonicalStatus('UNDER_REVIEW'), 'Screening');
});
test('ML engineer is not accidentally classified as generic software engineering', () => {
    assert.equal(inferFamily('ML Engineer'), 'ml'); assert.equal(inferFamily('Product Designer'), 'design'); assert.equal(inferFamily('Product Manager'), 'product');
    assert.equal(normalizeCompany('Sarvam AI'), normalizeCompany('SarvamAI'));
});
test('local calendar converts India offset and rejects ambiguous/nonexistent DST time', () => {
    assert.equal(localInstant('2026-09-08', '18:00', 'Asia/Kolkata'), '2026-09-08T12:30:00.000Z');
    assert.throws(() => localInstant('2026-03-08', '02:30', 'America/New_York'), /daylight saving/);
    assert.throws(() => localInstant('2026-11-01', '01:30', 'America/New_York'), /daylight saving/);
    assert.throws(() => localInstant('2026-02-30', '12:00', 'UTC'), /Invalid calendar/);
});
test('deadlines are required; expired deadlines are not silently extended', () => {
    const prefs = role().workspace.preferences;
    assert.throws(() => makeAvailability(prefs, '', now), /deadline/);
    assert.throws(() => makeAvailability(prefs, '2026-08-01', now), /passed/);
    assert.throws(() => makeAvailability({ ...prefs, weekdays: [] }, '2026-09-20', now), /study day/);
});
test('plan respects weekday capacity, timezone and buffer; resources are direct links', () => {
    const plan = buildPreparation(role(), 'user-1', now);
    assert(plan.scheduledMinutes <= plan.budgetMinutes);
    assert.equal(plan.budgetMinutes, Math.floor(plan.capacityMinutes * .85));
    assert(plan.scheduled.every(t => Date.parse(t.end) <= Date.parse(plan.deadline)));
    assert(plan.tasks.flatMap(t => t.resources || []).every(r => !/google.com\/search|youtube.com\/results|github.com\/search/.test(r.url)));
    assert.equal(plan.process.status, 'process_unknown');
});
test('unreviewed sources do not generate company-specific interview claims', () => {
    const job = role(); job.workspace.research = { accounts: [{ title: 'Unverified rumor', stages: [{ key: 'dsa' }] }] };
    const plan = buildPreparation(job, 'user-1', now);
    assert(!plan.tasks.some(t => t.basis === 'reported_signal'));
});
test('JD changes select relevant resources and explicit DSA only when mentioned', () => {
    const job = role(); job.workspace.jdText = 'React and data structures are required.';
    const plan = buildPreparation(job, 'user-1', now);
    assert(plan.tasks.some(t => t.id === 'algorithms'));
    assert(plan.tasks.find(t => t.id === 'learn').resources[0].url.includes('react.dev'));
    assert(!buildPreparation(role(), 'user-1', now).tasks.some(t => t.id === 'algorithms'));
});
test('short availability defers indivisible project without silently splitting it', () => {
    const job = role(); job.workspace.preferences.dailyMinutes = 20;
    const plan = buildPreparation(job, 'user-1', now);
    assert(plan.deferred.some(t => t.id === 'build')); assert(!plan.scheduled.some(t => t.id === 'build'));
});
test('replanning retains completed work and changes staleness for skill gaps', () => {
    const job = role(); job.workspace.plan = buildPreparation(job, 'user-1', now);
    assert.equal(planIsStale(job), false);
    job.workspace.completed['role-map'] = { done: true, note: 'My actual artifact' };
    job.workspace.preferences.gaps = ['Technical problem solving'];
    assert.equal(planIsStale(job), true);
    const plan = buildPreparation(job, 'user-1', now);
    assert(!plan.scheduled.some(t => t.id === 'role-map'));
    assert.equal(plan.tasks.find(t => t.id === 'role-map').artifact, job.workspace.plan.tasks.find(t => t.id === 'role-map').artifact);
    assert(plan.tasks.find(t => t.id === 'learn').priority > job.workspace.plan.tasks.find(t => t.id === 'learn').priority);
});
test('week-two retrieval is not scheduled in the first week', () => {
    const plan = buildPreparation(role(), 'user-1', now);
    const recall = plan.scheduled.find(t => t.id === 'recall-week-2');
    assert(recall); assert(Date.parse(recall.start) >= Date.parse(now) + 7 * 86400000);
});
test('available-after honors release time even within a free slot', () => {
    const t = { id: 'recall', minutes: 20, priority: 1, reason: 'Spaced recall', evidenceIds: [], basis: 'general_recommendation', availableAfter: '2026-09-08T12:30:00Z' };
    const p = schedulePreparation({ tasks: [t], slots: [{ id: 's', start: '2026-09-08T12:00:00Z', end: '2026-09-08T13:00:00Z' }], now, deadline: '2026-09-09T00:00:00Z' });
    assert.equal(p.scheduled[0].start, '2026-09-08T12:30:00.000Z');
});
test('practice has craft-specific prompts without fabricated automatic scores', () => {
    const job = role({ role: 'ML Engineer' }); job.workspace.preferences.roleFamily = 'ml';
    assert(practiceQuestions(job).some(q => q.title.includes('leakage')));
    assert(practiceQuestions(job).every(q => q.rubric.length && !Object.hasOwn(q, 'score')));
    assert.equal(processFor(job, 'user-1', now).status, 'process_unknown');
    assert.equal(workspaceFor(job).attempts.length, 0);
});
test('research JD is not reused after changing the company, role or source link', () => {
    const job = role({ url: 'https://example.com/job' });
    job.workspace.research = { query: { company: job.company, role: job.role, url: job.url }, jd: { text: 'React required' } };
    assert.equal(jobDescriptionFor(job), 'React required');
    assert.equal(jobDescriptionFor({ ...job, company: 'Different' }), '');
    assert.equal(jobDescriptionFor({ ...job, role: 'Product Designer' }), '');
    assert.equal(jobDescriptionFor({ ...job, url: 'https://example.com/new-job' }), '');
});
test('a JD explicitly saying no DSA does not generate an algorithms task', () => {
    const job = role(); job.workspace.jdText = 'React required. No DSA is asked.';
    assert(!buildPreparation(job, 'user-1', now).tasks.some(t => t.id === 'algorithms'));
});
