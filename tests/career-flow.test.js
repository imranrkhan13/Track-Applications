import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository, emptyWorkspace, jobPayload, workspaceFor } from '../src/career/repository.js';
import { practiceQuestions, planIsStale, processFor, requirementsFor } from '../src/career/planner.js';
import { recordPractice, synchronizePreparation, workflowSteps } from '../src/career/workflow.js';
import { schedulePreparation } from '../src/lib/prepEngine.js';
import { makeHandler, validateExtraction } from '../netlify/functions/career-research.mjs';

const now = '2026-09-10T08:00:00Z';
function job() {
    const w = emptyWorkspace();
    w.deadline = '2026-10-01';
    w.preferences = { ...w.preferences, timezone: 'Asia/Kolkata', dailyMinutes: 90, roleFamily: 'engineering' };
    w.jdText = 'Build React applications. Integrate REST APIs. Follow WCAG accessibility requirements.';
    return { company: 'Example', role: 'Frontend Engineer', status: 'Saved', location: 'Mumbai', workspace: w };
}
function repository() {
    const values = new Map();
    return createRepository({ userId: 'demo-user', loadLegacy: async () => [], storage: { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) } });
}
const authenticated = () => ({ auth: { getUser: async () => ({ data: { user: { id: 'demo-user' } } }) }, rpc: async () => ({ data: true }) });

test('flow 1: add job → automatic JD plan → reload → stage update → clear follow-up', async () => {
    const repo = repository();
    const transition = synchronizePreparation(job(), 'demo-user', now);
    assert.equal(transition.status, 'planned');
    let saved = await repo.save(transition.job);
    const reloaded = (await repo.list())[0];
    assert.equal(planIsStale(reloaded), false);
    assert.deepEqual(requirementsFor(reloaded).map(r => r.id), ['react', 'web', 'design']);
    assert(reloaded.workspace.plan.tasks.some(t => t.id === 'jd-react' && t.resources[0].url.includes('react.dev')));
    assert.equal(workflowSteps(reloaded)[2].complete, true);
    saved = await repo.save({ ...saved, status: 'Interview', next_date: '2026-09-20' });
    assert.equal(saved.date, '2026-09-20');
    assert.equal(jobPayload({ ...saved, next_date: '' }, 'demo-user').date, null);
    saved = await repo.save({ ...saved, next_date: '' });
    assert.equal((await repo.list())[0].next_date, '');
    await assert.rejects(repo.remove(reloaded), /another tab/);
    await repo.remove(saved);
    assert.equal((await repo.list()).length, 0);
});

test('flow 2: unavailable JD and providers leave the saved job and usable plan intact', async () => {
    const repo = repository();
    const saved = await repo.save(synchronizePreparation(job(), 'demo-user', now).job);
    const handler = makeHandler({ env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-key' }, clientFactory: authenticated, readPage: async () => { throw new Error('Private document: paste the JD.'); } });
    const response = await handler({ httpMethod: 'POST', headers: { authorization: 'Bearer test' }, body: JSON.stringify({ company: saved.company, role: saved.role, url: 'https://example.com/private-jd' }) });
    assert.equal(response.statusCode, 200);
    const research = JSON.parse(response.body);
    assert.equal(research.mode, 'partial');
    assert.equal(research.jd.status, 'unavailable');
    const next = synchronizePreparation({ ...saved, workspace: { ...saved.workspace, research } }, 'demo-user', now);
    const updated = await repo.save(next.job);
    assert.equal(updated.id, saved.id);
    assert(updated.workspace.plan.tasks.some(t => t.id === 'jd-react'));
    assert.equal(updated.workspace.plan.process.status, 'process_unknown');
});

test('flow 3: reviewed role-scoped evidence updates plan; unreviewed and other-owner accounts do not', () => {
    let current = synchronizePreparation(job(), 'demo-user', now).job;
    const report = { id: 'account-one', companyId: 'example', sourceUrl: 'https://example.com/interview', sourceType: 'firsthand', access: 'read', rights: 'private_context', ownerId: 'demo-user', lifecycle: 'published', scope: { roleFamilies: ['engineering'], location: 'Mumbai' }, independenceGroup: 'event-one', eventAt: '2026-09-01T00:00:00Z', stages: [{ key: 'build', label: 'Build an interface', evidenceSpan: 'A small interface exercise with a discussion of accessibility.' }], confirmed: false };
    current.workspace.reports = [report];
    assert.equal(processFor(current, 'demo-user', now).variants.length, 0);
    current.workspace.reports = [{ ...report, confirmed: true }];
    current = synchronizePreparation(current, 'demo-user', now).job;
    assert(current.workspace.plan.tasks.some(t => t.id === 'evidence-account-one-build'));
    assert.equal(planIsStale(current), false);
    assert.equal(processFor(current, 'someone-else', now).variants.length, 0);
    assert.equal(processFor({ ...current, company: 'Different company' }, 'demo-user', now).variants.length, 0);
});

test('flow 4: completed work → practice review → targeted repair → saved coach follow-up', async () => {
    const repo = repository();
    let current = await repo.save(synchronizePreparation(job(), 'demo-user', now).job);
    const w = workspaceFor(current);
    w.completed['role-map'] = { done: true, note: 'Three requirements mapped to my project.', completedAt: now };
    const question = practiceQuestions(current)[0];
    const attempt = { id: 'attempt-1', questionId: question.id, question: question.title, skill: question.skill, rubric: question.rubric, answer: 'I built an accessible interface and tested the failure states.', reflection: 'Explain how I chose my edge cases.', selfAssessment: 'needs-work', createdAt: now, coach: { followUp: 'How did you decide which failure cases mattered most?' } };
    current.workspace = recordPractice(w, attempt);
    current = await repo.save(synchronizePreparation(current, 'demo-user', now).job);
    assert(current.workspace.plan.tasks.some(t => t.id === 'repair-attempt-1'));
    assert(!current.workspace.plan.scheduled.some(t => t.id === 'role-map'));
    assert.equal(current.workspace.completed['role-map'].note, w.completed['role-map'].note);
    assert.equal(practiceQuestions(current)[0].id, 'followup-attempt-1');
    current.workspace = recordPractice(current.workspace, { ...attempt, id: 'attempt-2', questionId: 'followup-attempt-1', selfAssessment: 'comfortable', coach: null });
    current = await repo.save(synchronizePreparation(current, 'demo-user', now).job);
    assert(!current.workspace.plan.tasks.some(t => t.id === 'repair-attempt-1'));
    assert(!practiceQuestions(current).some(q => q.id === 'followup-attempt-1'));
    assert.equal((await repo.list())[0].workspace.attempts.length, 2);
});

test('flow 5: invalid deadline preserves work; partial schedules respect release times and capacity', async () => {
    const repo = repository();
    const current = job(); current.workspace.deadline = '2026-01-01';
    const transition = synchronizePreparation(current, 'demo-user', now);
    assert.equal(transition.status, 'needs-attention');
    assert.equal((await repo.save(transition.job)).company, 'Example');
    const base = { minutes: 20, reason: 'Recommended exercise', basis: 'general_recommendation', evidenceIds: [] };
    const plan = schedulePreparation({ now, deadline: '2026-09-11T00:00:00Z', slots: [{ id: 'today', start: '2026-09-10T12:00:00Z', end: '2026-09-10T13:00:00Z' }], tasks: [{ ...base, id: 'later', priority: 100, availableAfter: '2026-09-10T12:30:00Z' }, { ...base, id: 'ready', priority: 10 }] });
    assert.deepEqual(plan.scheduled.map(t => t.id), ['ready', 'later']);
    assert.equal(plan.scheduled[0].start, '2026-09-10T12:00:00.000Z');
    assert.equal(plan.scheduled[1].start, '2026-09-10T12:30:00.000Z');
    assert(plan.scheduledMinutes <= plan.budgetMinutes);
    current.workspace.deadline = '';
    assert.equal(synchronizePreparation(current, 'demo-user', now).status, 'needs-date');
});

test('flow 6: multiple extracted accounts retain unique provenance and one per-source quote budget', () => {
    const text = 'We built an interface and discussed testing. Then we reviewed accessibility and API design.';
    const documents = [{ id: 'blog', kind: 'account', title: 'My interview', url: 'https://example.com/account', text }];
    const accounts = validateExtraction({ accounts: [
        { sourceId: 'blog', stages: [{ label: 'First account', quote: text }] },
        { sourceId: 'blog', stages: [{ label: 'Second account', quote: 'We built an interface' }] },
        { sourceId: 'blog', stages: [{ label: 'Third account', quote: text }] },
        { sourceId: 'blog', stages: [{ label: 'Invented', quote: 'Three rounds of dynamic programming' }] },
    ] }, documents);
    assert.equal(accounts.length, 2);
    assert.equal(new Set(accounts.map(a => a.id)).size, accounts.length);
    assert(accounts.flatMap(a => a.stages).reduce((n, s) => n + s.evidenceSpan.split(/\s+/).length, 0) <= 25);
    assert(accounts.every(a => a.confirmed === false));
});
