import { createClient } from '@supabase/supabase-js';
import { makeProvider, hasAIProvider } from './lib/ai/provider.mjs';
import { COACH_SYSTEM, coachUser } from './lib/ai/prompts/extract.v1.js';
const reply = (statusCode, payload) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(payload) });
export function validateCoach(value, answer, rubric) {
    if (!Array.isArray(value?.criteria)) throw new Error('Invalid coach response.');
    const criteria = rubric.map((criterion, index) => {
        const item = value.criteria.find(c => c.index === index);
        if (!item || !['demonstrated', 'partial', 'unclear'].includes(item.verdict) || typeof item.reason !== 'string') return { criterion, verdict: 'unclear', quote: '', reason: 'The coach did not provide usable evidence for this criterion.' };
        const quote = typeof item.quote === 'string' && item.quote.length <= 600 && answer.includes(item.quote) ? item.quote : '';
        return { criterion, verdict: quote ? item.verdict : 'unclear', quote, reason: quote ? item.reason.slice(0, 500) : 'No matching answer passage was provided. Review this criterion yourself.' };
    });
    return { criteria, followUp: typeof value.followUp === 'string' ? value.followUp.slice(0, 500) : 'What evidence would test your main assumption?', method: 'ai-coach-unverified', createdAt: new Date().toISOString() };
}
export function makeCoachHandler({ env = process.env, clientFactory = createClient, request = fetch, provider = null } = {}) {
    return async event => {
        if (event.httpMethod !== 'POST') return reply(405, { error: 'Use POST.' });
        if ((event.body || '').length > 22000) return reply(413, { error: 'Answer is too long.' });
        let input;
        try { input = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid request.' }); }
        if (typeof input.answer !== 'string' || !input.answer.trim() || input.answer.length > 12000 || typeof input.question !== 'string' || input.question.length > 2000 || !Array.isArray(input.rubric) || !input.rubric.length || input.rubric.length > 6 || input.rubric.some(r => typeof r !== 'string' || r.length > 200)) return reply(400, { error: 'Include an answer, question and valid rubric.' });
        const token = event.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
        if (!token) return reply(401, { error: 'Sign in for AI coaching. Self-review is available without a provider.' });
        const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key || !hasAIProvider(env)) return reply(503, { error: 'AI coaching is not configured. Your answer is preserved; use the rubric for self-review.' });
        try {
            const client = clientFactory(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
            const session = await client.auth.getUser(token);
            if (session.error || !session.data?.user) return reply(401, { error: 'Sign in again to use AI coaching.' });
            const quota = await client.rpc('claim_career_research');
            if (quota.error) return reply(503, { error: 'AI coaching requires the Career Garden database migration.' });
            if (!quota.data) return reply(429, { error: 'The hourly research/coaching limit is reached. You can still save and self-review your answer.' });
            const generateJSON = provider || makeProvider({ env, request });
            const value = await generateJSON({
                system: COACH_SYSTEM,
                user: coachUser({ question: input.question, answer: input.answer, rubric: input.rubric }),
                shape: { criteria: 'array' },
                maxTokens: 1600,
            });
            return reply(200, validateCoach(value, input.answer, input.rubric));
        } catch { return reply(502, { error: 'The AI coach did not return usable feedback. Your answer is preserved; try again or self-review.' }); }
    };
}
export const handler = makeCoachHandler();
