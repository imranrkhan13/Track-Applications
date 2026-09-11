import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler, validateExtraction, validateInput } from '../netlify/functions/career-research.mjs';
import { documentURL, isPublicIPv4, readPublicPage, sourceURL, textFromHTML } from '../netlify/functions/lib/safe-source.mjs';

const request = (body = {}, auth = true) => ({ httpMethod: 'POST', headers: auth ? { authorization: 'Bearer example-token' } : {}, body: JSON.stringify({ company: 'Example', role: 'Engineer', ...body }) });
const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test' };
const clientFactory = () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) }, rpc: async () => ({ data: true }) });
const json = response => JSON.parse(response.body);
test('source fetch rejects unsafe schemes, IP literals, credential URLs and X scraping', () => {
    for (const url of ['http://example.com', 'file:///etc/passwd', 'https://127.0.0.1', 'https://[::1]', 'https://user:secret@example.com', 'https://example.com:444/', 'https://host.local', 'https://x.com/person/status/1']) assert.throws(() => sourceURL(url));
});
test('DNS gate excludes loopback, LAN, metadata, reserved and non-IPv4 addresses', async () => {
    for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '198.18.0.1', '224.0.0.1', '::1']) assert.equal(isPublicIPv4(ip), false);
    assert.equal(isPublicIPv4('93.184.216.34'), true);
    await assert.rejects(readPublicPage('https://example.com', { resolve: async () => ['127.0.0.1'] }), /restricted network/);
});
test('Google document normalization matches exact hostname, not substring impersonation', () => {
    assert.equal(documentURL('https://docs.google.com/document/d/abc/edit'), 'https://docs.google.com/document/d/abc/export?format=txt');
    assert.equal(documentURL('https://docs.google.com.evil.test/document/d/abc/edit'), 'https://docs.google.com.evil.test/document/d/abc/edit');
});
test('HTML script and style contents are not extracted as job requirements', () => {
    assert.equal(textFromHTML('<script>secret()</script><style>.bad{}</style><p>React &amp; Python</p>'), 'React & Python');
});
test('invalid and oversized request fields fail validation', () => {
    assert.throws(() => validateInput({ company: 12, role: 'Engineer' }));
    assert.throws(() => validateInput({ company: 'A', role: 'Engineer', jdText: 'a'.repeat(20001) }));
});
test('no token means no research fetch or provider cost', async () => {
    const handler = makeHandler({ env, readPage: () => assert.fail('No fetch before auth'), getJSON: () => assert.fail('No provider before auth') });
    assert.equal((await handler(request({}, false))).statusCode, 401);
});
test('expired session and persistent rate limits fail closed before fetching', async () => {
    const handler = makeHandler({ env, clientFactory: () => ({ auth: { getUser: async () => ({ error: true }) } }), readPage: () => assert.fail('No fetch') });
    assert.equal((await handler(request())).statusCode, 401);
    const limited = makeHandler({ env, clientFactory: () => ({ ...clientFactory(), rpc: async () => ({ data: false }) }), readPage: () => assert.fail('No fetch') });
    assert.equal((await limited(request())).statusCode, 429);
});
test('missing migration is reported, never bypassing the usage limit', async () => {
    const handler = makeHandler({ env, clientFactory: () => ({ ...clientFactory(), rpc: async () => ({ error: true }) }) });
    assert.equal((await handler(request())).statusCode, 503);
});
test('JD paste works with no providers and honestly labels partial research', async () => {
    const handler = makeHandler({ env, clientFactory, readPage: () => assert.fail('Pasted JD needs no fetch') });
    const result = json(await handler(request({ jdText: 'Python role requirements' })));
    assert.equal(result.jd.status, 'pasted'); assert.equal(result.mode, 'partial');
    assert.equal(result.accounts.length, 0); assert(result.warnings.some(w => w.includes('not configured')));
});
test('blocked JD preserves useful partial response and requests pasted text', async () => {
    const handler = makeHandler({ env, clientFactory, readPage: async () => { throw new Error('Private document. Paste text.'); } });
    const result = json(await handler(request({ url: 'https://example.com/private' })));
    assert.equal(result.jd.status, 'unavailable'); assert(result.warnings.some(w => w.includes('Paste text')));
});
test('search snippets are not fetched or treated as process evidence without allowed host', async () => {
    let calls = 0;
    const handler = makeHandler({ env: { ...env, BRAVE_SEARCH_API_KEY: 'test' }, clientFactory, readPage: () => assert.fail('Domain is not approved'), getJSON: async () => { calls++; return { web: { results: [{ title: 'Unverified title claiming four rounds', url: 'https://example.com/blog' }] } }; } });
    const result = json(await handler(request()));
    assert.equal(calls, 2); assert.equal(result.sources.length, 1); assert.equal(result.sources[0].status, 'discovered'); assert.equal(result.accounts.length, 0);
});
test('extraction rejects invented citations and leaves tool rules/applicability unconfirmed', () => {
    const documents = [{ id: 's1', url: 'https://example.com', title: 'Account', text: 'We had a technical assessment and a discussion.', kind: 'account' }];
    const result = validateExtraction({ accounts: [{ sourceId: 's1', stages: [{ label: 'Invented', quote: 'No coding was asked' }, { label: 'Assessment', quote: 'technical assessment', aiPolicy: 'allowed' }] }] }, documents);
    assert.equal(result[0].stages.length, 1); assert.equal(result[0].stages[0].aiPolicy, 'unknown'); assert.equal(result[0].confirmed, false);
    assert.equal(validateExtraction({ accounts: [{ sourceId: 'nonexistent', stages: [] }] }, documents).length, 0);
});
test('extracted quotations are bounded per source', () => {
    const text = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
    assert.equal(validateExtraction({ accounts: [{ sourceId: 's', stages: [{ label: 'Long', quote: text }] }] }, [{ id: 's', text, kind: 'account' }]).length, 0);
});
