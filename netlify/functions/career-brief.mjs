// POST /api/career-brief — authenticated synthesis of a grounded company brief
// from the user's reviewed interview accounts + JD.  Shares the hourly
// research/coach quota.  Abstains honestly when evidence is thin.

import { createClient } from '@supabase/supabase-js';
import { makeProvider, hasAIProvider } from './lib/ai/provider.mjs';
import { synthesizeBrief } from './lib/ai/synthesize.mjs';

const reply = (statusCode, payload) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(payload) });

export function validateBriefRequest(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid request.');
    const limits = { company: 160, role: 160, jdText: 20000 };
    const result = {};
    for (const [key, max] of Object.entries(limits)) {
        if (value[key] != null && typeof value[key] !== 'string') throw new Error('Invalid input.');
        result[key] = (value[key] || '').trim();
        if (result[key].length > max) throw new Error(`${key} is too long.`);
    }
    if (!result.company || !result.role) throw new Error('Company and role are required.');
    if (!Array.isArray(value.claims)) throw new Error('Claims must be an array.');
    // Claims are the user's own reviewed accounts, bounded in count and size.
    result.claims = value.claims.slice(0, 20).map(c => {
        if (!c || typeof c !== 'object') throw new Error('Invalid claim.');
        return {
            id: String(c.id || '').slice(0, 120),
            statement: String(c.statement || c.evidenceSpan || '').slice(0, 600),
            sourceUrl: String(c.sourceUrl || '').slice(0, 2000),
        };
    }).filter(c => c.id && c.statement);
    return result;
}

export function makeBriefHandler({ env = process.env, clientFactory = createClient, provider = null } = {}) {
    return async event => {
        if (event.httpMethod !== 'POST') return reply(405, { error: 'Use POST.' });
        if ((event.body || '').length > 30000) return reply(413, { error: 'Request is too large.' });

        let input;
        try { input = validateBriefRequest(JSON.parse(event.body || '{}')); } catch (error) { return reply(400, { error: error.message }); }

        const token = event.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
        if (!token) return reply(401, { error: 'Sign in for a synthesized brief. Your reviewed accounts stay available.' });

        const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return reply(503, { error: 'Server authentication is not configured.' });
        if (!hasAIProvider(env)) return reply(503, { error: 'AI synthesis is not configured. Your reviewed accounts remain the source of truth.' });

        const client = clientFactory(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
        try {
            const { data, error } = await client.auth.getUser(token);
            if (error || !data?.user) return reply(401, { error: 'Your session expired. Sign in again.' });
            const quota = await client.rpc('claim_career_research');
            if (quota.error) return reply(503, { error: 'Synthesis needs the Career Garden database migration.' });
            if (!quota.data) return reply(429, { error: 'The hourly research/coaching limit is reached.' });
        } catch { return reply(503, { error: 'Could not verify your session. Try again shortly.' }); }

        try {
            const generateJSON = provider || makeProvider({ env });
            const brief = await synthesizeBrief({
                provider: generateJSON,
                target: { company: input.company, role: input.role },
                claims: input.claims,
                jd: input.jdText,
            });
            return reply(200, brief);
        } catch {
            return reply(502, { error: 'Synthesis did not return a usable brief. Your reviewed accounts are unchanged.' });
        }
    };
}

export const handler = makeBriefHandler();