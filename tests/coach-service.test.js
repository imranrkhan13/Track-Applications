import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCoachHandler, validateCoach } from '../netlify/functions/career-coach.mjs';

test('coach feedback without matching answer evidence is explicitly unclear', () => {
    const result = validateCoach({ criteria: [{ index: 0, verdict: 'demonstrated', quote: 'I ran every test', reason: 'Good tests' }] }, 'I have a hypothesis.', ['Testing']);
    assert.equal(result.criteria[0].verdict, 'unclear');
    assert.equal(result.criteria[0].quote, '');
    assert.equal(result.score, undefined);
});
test('coach retains cited observations, not numerical hiring scores', () => {
    const result = validateCoach({ score: 95, criteria: [{ index: 0, verdict: 'partial', quote: 'check the logs', reason: 'Names an investigation step, but no validation.' }], followUp: 'How would you validate the fix?' }, 'I would check the logs.', ['Diagnosis']);
    assert.equal(result.criteria[0].verdict, 'partial');
    assert.equal(result.method, 'ai-coach-unverified');
    assert.equal(result.score, undefined);
});
test('coach returns explicit configuration error while leaving local review available', async () => {
    const handler = makeCoachHandler({ env: {} });
    const result = await handler({ httpMethod: 'POST', headers: { authorization: 'Bearer test' }, body: JSON.stringify({ answer: 'My answer', question: 'A question', rubric: ['Reasoning'] }) });
    assert.equal(result.statusCode, 503);
    assert.match(JSON.parse(result.body).error, /preserved/);
});
test('coach requires authentication before sending any answer to a provider', async () => {
    const handler = makeCoachHandler({ env: {}, request: () => assert.fail('No provider call') });
    const result = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ answer: 'Private answer', question: 'Question', rubric: ['Reasoning'] }) });
    assert.equal(result.statusCode, 401);
});
