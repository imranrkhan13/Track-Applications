import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleProcessMap, schedulePreparation } from '../research/global-prep-reference.js';

// Synthetic fixtures test policy mechanics, not the truth of employer claims.
const target = { companyId: 'example', roleFamily: 'backend', location: 'IN', level: 'junior' };
const asOf = '2026-09-08T00:00:00Z';
function report(overrides = {}) {
    return { id: 'r1', companyId: 'example', sourceUrl: 'https://example.org/guide',
        access: 'read', rights: 'approved_retrieval', lifecycle: 'published', sourceType: 'official',
        effectiveAt: '2026-09-01T00:00:00Z', scope: { roleFamilies: ['backend'] },
        independenceGroup: 'event1', coverage: 'source_describes_full_loop',
        stages: [{ key: 'code-review', evidenceSpan: 'synthetic fixture', aiPolicy: 'allowed' }], ...overrides };
}
const map = reports => assembleProcessMap({ target, reports, asOf, userId: 'owner' });

test('process is unknown without readable evidence, and has no fabricated sequence', () => {
    const result = map([report({ access: 'blocked' })]);
    assert.equal(result.status, 'process_unknown');
    assert.equal(result.inferredUniversalSequence, null);
    assert.equal(result.confirmFormat, true);
});
test('wrong company, role and geography are rejected before ranking', () => {
    const result = map([report({ id: 'a', companyId: 'other' }), report({ id: 'b', scope: { roleFamilies: ['design'] } }), report({ id: 'c', scope: { roleFamilies: ['backend'], location: 'US' } })]);
    assert.deepEqual(result.rejected.map(r => r.reason), ['wrong_company', 'wrong_role_family', 'scope_mismatch']);
});
test('an official source explicitly covering the family can have global location scope', () => {
    assert.equal(map([report()]).variants.length, 1);
});
test('a proposed redesign is not silently treated as adopted', () => {
    assert.equal(map([report({ lifecycle: 'proposed' })]).variants.length, 0);
});
test('a private recruiter brief stays with its owner; unapproved content is excluded', () => {
    assert.equal(map([report({ rights: 'private_context', ownerId: 'someone-else' })]).variants.length, 0);
    assert.equal(map([report({ rights: 'discovery_only' })]).variants.length, 0);
    assert.equal(map([report({ sourceType: 'recruiter_private', ownerId: 'someone-else' })]).variants.length, 0);
    assert.equal(map([report({ rights: 'private_context', ownerId: 'owner', sourceType: 'recruiter_private' })]).variants.length, 1);
});
test('a source and its mirror do not create independent corroboration', () => {
    const result = map([report(), report({ id: 'mirror' })]);
    assert.equal(result.independentSourceGroups, 1);
    assert.equal(result.rejected[0].reason, 'duplicate_event');
});
test('old interview remains historical despite a recent publication', () => {
    const result = map([report({ sourceType: 'firsthand', eventAt: '2024-12-01T00:00:00Z', publishedAt: asOf })]);
    assert.equal(result.variants[0].freshness, 'historical');
    assert.equal(result.variants[0].attribution, 'candidate_report');
});
test('missing dates and unknown target team trigger confirmation', () => {
    const result = map([report({ effectiveAt: null, scope: { roleFamilies: ['backend'], team: 'payments' } })]);
    assert.equal(result.confirmFormat, true);
    assert.deepEqual(result.variants[0].needsConfirmation, ['team']);
});
test('two different loops stay separate, preserving AI policy per variant', () => {
    const result = map([report(), report({ id: 'r2', independenceGroup: 'event2', stages: [{ key: 'live-coding', evidenceSpan: 'another fixture', aiPolicy: 'prohibited' }] })]);
    assert.equal(result.variants.length, 2);
    assert.equal(result.confirmFormat, true);
    assert.equal(result.inferredUniversalSequence, null);
});
test('stages without supporting spans and future events are rejected', () => {
    assert.equal(map([report({ stages: [{ key: 'coding' }] })]).variants.length, 0);
    assert.equal(map([report({ sourceType: 'firsthand', eventAt: '2027-01-01T00:00:00Z' })]).variants.length, 0);
    assert.equal(map([report({ sourceType: 'toString' })]).variants.length, 0);
});

const now = '2026-09-08T09:00:00+05:30';
const deadline = '2026-09-08T12:00:00+05:30';
const slots = [{ id: 'morning', start: now, end: deadline }];
function task(id, overrides = {}) { return { id, minutes: 30, priority: 1, dependsOn: [], reason: 'Synthetic reviewed task', evidenceIds: ['claim1'], ...overrides }; }
const schedule = (tasks, extra = {}) => schedulePreparation({ tasks, now, deadline, slots, ...extra });

test('scheduler fits the deadline and buffer using explicit timezone offsets', () => {
    const result = schedule(Array.from({ length: 6 }, (_, i) => task(String(i))));
    assert.equal(result.capacityMinutes, 180);
    assert.equal(result.budgetMinutes, 153);
    assert.equal(result.scheduledMinutes, 150);
    assert.equal(result.deferred.length, 1);
    assert.ok(result.scheduled.every(t => Date.parse(t.end) <= Date.parse(deadline)));
});
test('prerequisites come first, even if dependent work has higher priority', () => {
    const result = schedule([task('mock', { priority: 10, dependsOn: ['basics'] }), task('basics', { priority: 0 })]);
    assert.deepEqual(result.scheduled.map(t => t.id), ['basics', 'mock']);
});
test('a long mock is not split across two short availability slots', () => {
    const result = schedule([task('mock', { minutes: 150 })], { slots: [
        { id: 'a', start: now, end: '2026-09-08T10:00:00+05:30' },
        { id: 'b', start: '2026-09-08T11:00:00+05:30', end: deadline },
    ] });
    assert.equal(result.scheduled.length, 0);
    assert.equal(result.status, 'partial');
});
test('completed work is retained and does not consume future availability', () => {
    const result = schedule([task('basics'), task('mock', { dependsOn: ['basics'] })], { completedIds: ['basics'] });
    assert.deepEqual(result.scheduled.map(t => t.id), ['mock']);
});
test('round-specific due dates can be earlier than the overall deadline', () => {
    const result = schedule([task('early', { minutes: 60, dueAt: '2026-09-08T09:15:00+05:30' })]);
    assert.equal(result.scheduled.length, 0);
});
test('past deadlines, overlapping slots, unknown prerequisites and cycles fail explicitly', () => {
    assert.throws(() => schedule([], { deadline: now }), /Deadline has passed/);
    assert.throws(() => schedule([], { slots: [...slots, { ...slots[0], id: 'duplicate-time' }] }), /Overlapping/);
    assert.throws(() => schedule([task('a', { dependsOn: ['missing'] })]), /Unknown prerequisite/);
    assert.throws(() => schedule([task('a', { dependsOn: ['b'] }), task('b', { dependsOn: ['a'] })]), /Cyclic/);
});
test('zero availability yields an honest partial plan; no unlabelled generic tasks', () => {
    assert.equal(schedule([task('a')], { slots: [] }).status, 'partial');
    assert.throws(() => schedule([task('a', { evidenceIds: [] })]), /explicit general recommendation/);
    assert.equal(schedule([task('a', { evidenceIds: [], basis: 'general_recommendation' })]).scheduled.length, 1);
});

test('invalid calendar dates and timezone-free inputs are not normalized silently', () => {
    assert.throws(() => schedule([], { deadline: '2027-02-30T00:00:00Z' }), /Invalid timestamp/);
    assert.throws(() => schedule([], { deadline: '2027-02-28T00:00:00' }), /timezone/);
});

test('unconfirmed single-candidate format stays a confirmation question', () => {
    assert.equal(map([report({ sourceType: 'firsthand', eventAt: '2026-09-01T00:00:00Z' })]).confirmFormat, true);
});
