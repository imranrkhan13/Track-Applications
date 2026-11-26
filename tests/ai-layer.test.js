import test from 'node:test';
import assert from 'node:assert/strict';
import { makeProvider, validateShape, hasAIProvider } from '../netlify/functions/lib/ai/provider.mjs';
import { extractAccounts, validateExtraction } from '../netlify/functions/lib/ai/extract.mjs';
import { synthesizeBrief, validateBrief } from '../netlify/functions/lib/ai/synthesize.mjs';
import { makeBriefHandler, validateBriefRequest } from '../netlify/functions/career-brief.mjs';
import { COACH_SYSTEM, EXTRACT_SYSTEM, SYNTHESIZE_SYSTEM } from '../netlify/functions/lib/ai/prompts/extract.v1.js';

// ---------------------------------------------------------------------------
// Provider: shape validation
// ---------------------------------------------------------------------------

test('validateShape: accepts correct shapes, rejects wrong types and missing keys', () => {
    assert.equal(validateShape({ accounts: [] }, { accounts: 'array' }), true);
    assert.equal(validateShape({ accounts: [] }, { accounts: 'array', summary: 'string' }), false);
    assert.equal(validateShape({ accounts: 'nope' }, { accounts: 'array' }), false);
    assert.equal(validateShape(null, { accounts: 'array' }), false);
});

// ---------------------------------------------------------------------------
// Provider: Gemini call path with retry
// ---------------------------------------------------------------------------

test('provider retries once on transient failure, then succeeds', async () => {
    let calls = 0;
    const request = async () => {
        calls++;
        if (calls === 1) throw new Error('Transient');
        return {
            ok: true,
            text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"accounts":[]}' }] } }] }),
        };
    };
    const generateJSON = makeProvider({ env: { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }, request });
    const value = await generateJSON({ system: 's', user: 'u', shape: { accounts: 'array' } });
    assert.deepEqual(value, { accounts: [] });
    assert.equal(calls, 2);
});

test('provider throws after exhausting retries', async () => {
    const request = async () => { throw new Error('Down'); };
    const generateJSON = makeProvider({ env: { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }, request });
    await assert.rejects(generateJSON({ system: 's', user: 'u', retries: 1 }), /Down/);
});

test('provider rejects responses that fail shape validation', async () => {
    const request = async () => ({
        ok: true,
        text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"wrong":true}' }] } }] }),
    });
    const generateJSON = makeProvider({ env: { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }, request });
    await assert.rejects(generateJSON({ system: 's', user: 'u', shape: { accounts: 'array' } }), /validation/);
});

test('provider refuses to run without credentials', async () => {
    const generateJSON = makeProvider({ env: {} });
    await assert.rejects(generateJSON({ system: 's', user: 'u' }), /not configured/);
});

test('provider falls through to the next provider when the first fails', async () => {
    const seen = [];
    const request = async url => {
        seen.push(url);
        if (url.includes('generativelanguage')) throw new Error('Gemini rate-limited');
        return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: '{"accounts":[]}' } }] }) };
    };
    const generateJSON = makeProvider({ env: { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm', GROQ_API_KEY: 'g' }, request });
    const value = await generateJSON({ system: 's', user: 'u', shape: { accounts: 'array' } });
    assert.deepEqual(value, { accounts: [] });
    assert(seen.some(u => u.includes('generativelanguage')));
    assert(seen.some(u => u.includes('groq.com')));
});

test('hasAIProvider reports true when any single provider is configured', () => {
    assert.equal(hasAIProvider({}), false);
    assert.equal(hasAIProvider({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }), true);
    assert.equal(hasAIProvider({ GROQ_API_KEY: 'g' }), true);
    assert.equal(hasAIProvider({ COHERE_API_KEY: 'c' }), true);
    assert.equal(hasAIProvider({ OPENROUTER_API_KEY: 'o' }), true);
    // A key without a model is not a usable Gemini config.
    assert.equal(hasAIProvider({ GEMINI_API_KEY: 'k' }), false);
});

test('provider strips markdown fences around JSON', async () => {
    const request = async () => ({
        ok: true,
        text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: '```json\n{"accounts":[]}\n```' }] } }] }),
    });
    const generateJSON = makeProvider({ env: { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }, request });
    assert.deepEqual(await generateJSON({ system: 's', user: 'u', shape: { accounts: 'array' } }), { accounts: [] });
});

// ---------------------------------------------------------------------------
// Extraction: quote-entailment and budget rules
// ---------------------------------------------------------------------------

const documents = [
    { id: 's1', kind: 'account', title: 'Blog', url: 'https://example.com/a', text: 'We had a technical assessment and a discussion.' },
    { id: 'jd', kind: 'jd', title: 'JD', url: '', text: 'React role requirements.' },
];

test('extractAccounts rejects invented quotes and JD-sourced stages', async () => {
    const provider = async () => ({
        accounts: [
            { sourceId: 's1', stages: [{ label: 'Invented', quote: 'No coding was asked' }] },
            { sourceId: 's1', stages: [{ label: 'Real', quote: 'technical assessment' }] },
            { sourceId: 'jd', stages: [{ label: 'From JD', quote: 'React role' }] },
        ],
    });
    const { accounts } = await extractAccounts({ provider, target: { company: 'X', role: 'Y' }, documents });
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].stages.length, 1);
    assert.equal(accounts[0].stages[0].evidenceSpan, 'technical assessment');
    assert.equal(accounts[0].confirmed, false);
});

test('extractAccounts enforces per-source quote budget', async () => {
    const long = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
    const provider = async () => ({
        accounts: [{ sourceId: 's1', stages: [{ label: 'Long', quote: long }] }],
    });
    const { accounts } = await extractAccounts({ provider, target: { company: 'X', role: 'Y' }, documents });
    assert.equal(accounts.length, 0);
});

test('extractAccounts returns empty with no account documents', async () => {
    const provider = () => assert.fail('No provider call without account documents');
    const { accounts } = await extractAccounts({ provider, target: {}, documents: [documents[1]] });
    assert.deepEqual(accounts, []);
});

test('validateExtraction back-compat contract still holds', () => {
    const result = validateExtraction({ accounts: [{ sourceId: 's1', stages: [{ label: 'A', quote: 'technical assessment' }] }] }, documents);
    assert.equal(result.length, 1);
    assert.equal(result[0].stages[0].aiPolicy, 'unknown');
});

// ---------------------------------------------------------------------------
// Synthesis: citation enforcement and abstention
// ---------------------------------------------------------------------------

const claims = [
    { id: 'claim-1', statement: 'A 60-minute technical screen was reported.', sourceUrl: 'https://example.com/a' },
    { id: 'claim-2', statement: 'A system design round followed.', sourceUrl: 'https://example.com/b' },
];

test('synthesizeBrief rejects brief lines citing unknown claims', () => {
    const value = { briefs: [{ claimId: 'made-up', statement: 'Unsupported.' }], unknowns: [], basis: 'evidence', summary: '' };
    assert.equal(validateBrief(value, claims), null);
});

test('synthesizeBrief keeps cited lines and unknowns', () => {
    const value = {
        briefs: [
            { claimId: 'claim-1', statement: 'Expect a technical screen.' },
            { claimId: 'claim-2', statement: 'A design round may follow.' },
        ],
        unknowns: ['Round order not established.'],
        basis: 'evidence',
        summary: 'Two reviewed accounts.',
    };
    const brief = validateBrief(value, claims);
    assert.equal(brief.briefs.length, 2);
    assert.equal(brief.basis, 'evidence');
    assert.equal(brief.unknowns.length, 1);
});

test('synthesizeBrief abstains honestly with no claims', async () => {
    const provider = () => assert.fail('No provider call without claims');
    const brief = await synthesizeBrief({ provider, target: { company: 'X', role: 'Y' }, claims: [], jd: 'Some JD' });
    assert.equal(brief.basis, 'jd');
    assert.equal(brief.method, 'abstained');
    assert(brief.unknowns.some(u => u.includes('recruiter')));
});

test('synthesizeBrief forces jd basis when claims are absent but model says evidence', () => {
    const value = { briefs: [{ claimId: 'claim-1', statement: 'ok' }], unknowns: [], basis: 'evidence', summary: '' };
    const brief = validateBrief(value, []);
    assert.equal(brief, null); // no claims → no cited line can survive
});

// ---------------------------------------------------------------------------
// Brief endpoint: auth, quota, validation
// ---------------------------------------------------------------------------

const briefRequest = (body = {}, auth = true) => ({
    httpMethod: 'POST',
    headers: auth ? { authorization: 'Bearer t' } : {},
    body: JSON.stringify({ company: 'Example', role: 'Engineer', claims: [], ...body }),
});
const briefEnv = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'k', GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' };
const authedClient = () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) }, rpc: async () => ({ data: true }) });

test('brief endpoint requires authentication before any provider call', async () => {
    const handler = makeBriefHandler({ env: briefEnv, provider: () => assert.fail('No provider before auth') });
    assert.equal((await handler(briefRequest({}, false))).statusCode, 401);
});

test('brief endpoint validates request shape', () => {
    assert.throws(() => validateBriefRequest({ company: 'X', role: 'Y', claims: 'not-an-array' }));
    assert.throws(() => validateBriefRequest({ company: '', role: 'Y', claims: [] }));
    const ok = validateBriefRequest({ company: 'X', role: 'Y', claims: [{ id: 'c1', statement: 's' }] });
    assert.equal(ok.claims.length, 1);
});

test('brief endpoint returns 503 without provider configuration', async () => {
    const handler = makeBriefHandler({ env: { SUPABASE_URL: 'u', SUPABASE_ANON_KEY: 'k' } });
    const result = await handler(briefRequest());
    assert.equal(result.statusCode, 503);
});

test('brief endpoint abstains (200/jd) with no reviewed claims', async () => {
    const handler = makeBriefHandler({ env: briefEnv, clientFactory: authedClient });
    const result = await handler(briefRequest());
    assert.equal(result.statusCode, 200);
    const brief = JSON.parse(result.body);
    assert.equal(brief.basis, 'jd');
});

test('brief endpoint synthesizes from reviewed claims', async () => {
    const provider = async () => ({ briefs: [{ claimId: 'claim-1', statement: 'Expect a technical screen.' }], unknowns: [], basis: 'evidence', summary: 'One account.' });
    const handler = makeBriefHandler({ env: briefEnv, clientFactory: authedClient, provider });
    const result = await handler(briefRequest({ claims: [{ id: 'claim-1', statement: 'A 60-minute screen.' }] }));
    assert.equal(result.statusCode, 200);
    const brief = JSON.parse(result.body);
    assert.equal(brief.basis, 'evidence');
    assert.equal(brief.briefs.length, 1);
});

// ---------------------------------------------------------------------------
// Prompts: injection framing present
// ---------------------------------------------------------------------------

test('prompts frame source text as untrusted data', () => {
    assert.match(EXTRACT_SYSTEM, /UNTRUSTED DATA/i);
    assert.match(COACH_SYSTEM, /untrusted data/i);
    assert.match(SYNTHESIZE_SYSTEM, /UNTRUSTED DATA/i);
});