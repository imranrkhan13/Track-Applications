import { createClient } from '@supabase/supabase-js';
import { readPublicPage, sourceURL, textFromHTML } from './lib/safe-source.mjs';
import { runScrapePlan } from './lib/scraper.mjs';
import { adapterFor, BOARD_PROBES } from './lib/sources/adapters.mjs';
import { makeProvider, hasAIProvider } from './lib/ai/provider.mjs';
import { extractAccounts } from './lib/ai/extract.mjs';
import seed1 from '../../research/interview-source-seeds.json' with { type: 'json' };
import seed2 from '../../research/global-interview-sources.json' with { type: 'json' };

const reply = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
const normalize = value => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function validateInput(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid request.');
    const limits = { company: 160, role: 160, location: 200, url: 2000, jdText: 20000, language: 60, roleFamily: 40 };
    const result = {};
    for (const [key, max] of Object.entries(limits)) { if (value[key] != null && typeof value[key] !== 'string') throw new Error('Invalid input.'); result[key] = (value[key] || '').trim(); if (result[key].length > max) throw new Error(`${key} is too long.`); }
    if (!result.company || !result.role) throw new Error('Company and role are required.');
    if (result.url) sourceURL(result.url);
    return result;
}

export function validateExtraction(value, documents) {
    if (!Array.isArray(value?.accounts)) return [];
    const wordsBySource = new Map();
    return value.accounts.slice(0, 4).flatMap((account, accountIndex) => {
        const document = documents.find(d => d.id === account.sourceId);
        if (!document || document.kind === 'jd') return [];
        let words = wordsBySource.get(document.id) || 0;
        const stages = (Array.isArray(account.stages) ? account.stages : []).slice(0, 5).flatMap((stage, i) => {
            const quote = typeof stage.quote === 'string' ? stage.quote.trim() : '';
            const count = quote.split(/\s+/).length;
            if (!quote || !document.text.toLowerCase().includes(quote.toLowerCase()) || count + words > 25 || typeof stage.label !== 'string') return [];
            words += count;
            return [{ key: `stage-${i}`, label: stage.label.slice(0, 100), evidenceSpan: quote, aiPolicy: 'unknown' }];
        });
        wordsBySource.set(document.id, words);
        if (!stages.length) return [];
        return [{ id: `account-${document.id}-${accountIndex}`, title: document.title, sourceUrl: document.url, sourceType: 'unreviewed', stages, confirmed: false, reviewNote: 'Machine-extracted passages. Verify company, role, dates and whether the stages are part of the same account.' }];
    });
}

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Provider unavailable.');
    const text = await response.text();
    if (text.length > 1000000) throw new Error('Provider response too large.');
    return JSON.parse(text);
}

// Build discovery queries across search groups.  Language-aware where the
// user supplied a language preference.
function discoveryQueries(input) {
    const { company, role, location, language } = input;
    const lang = language && !/english/i.test(language) ? ` ${language}` : '';

    return [
        // Official / company site
        `${company} ${role} ${location} careers interview guide${lang}`,
        `${company} engineering hiring process${lang}`,
        // First-person accounts
        `${company} ${role} interview experience ${location}${lang}`,
        `${company} interview process candidate review${lang}`,
        // Site-specific discovery — a specific host may reject the robot,
        // but the search helps us find the right page.
        `site:ambitionbox.com ${company} interview`,
        `${company} interview experience site:medium.com`,
        `site:glassdoor.com ${company} ${role} interview`,
    ];
}

export function makeHandler({
    env = process.env,
    clientFactory = createClient,
    readPage = readPublicPage,
    getJSON = fetchJSON,
    scrapePlan = runScrapePlan,
    provider = null,
} = {}) {
    return async event => {
        if (event.httpMethod !== 'POST') return reply(405, { error: 'Use POST.' });
        if ((event.body || '').length > 30000) return reply(413, { error: 'Request is too large.' });

        let input;
        try { input = validateInput(JSON.parse(event.body || '{}')); } catch (error) { return reply(400, { error: error.message }); }

        const token = event.headers?.authorization?.match(/^Bearer (.+)$/i)?.[1];
        if (!token) return reply(401, { error: 'Sign in to research live sources. Demo mode supports your own notes and JD-based plans.' });

        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return reply(503, { error: 'Server authentication is not configured. Jobs and manual preparation still work.' });

        const client = clientFactory(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
        try {
            const { data, error } = await client.auth.getUser(token);
            if (error || !data?.user) return reply(401, { error: 'Your session expired. Sign in again.' });
            const quota = await client.rpc('claim_career_research');
            if (quota.error) return reply(503, { error: 'Research needs the Career Garden database migration before it can run.' });
            if (!quota.data) return reply(429, { error: 'Research limit reached: eight requests per hour. Your saved research is still available.' });
        } catch { return reply(503, { error: 'Could not verify your session. Try again shortly.' }); }

        const warnings = [];
        const documents = [];

        // --- JD fetch ---
        let jd = { status: input.jdText ? 'pasted' : 'missing', text: input.jdText };
        if (!input.jdText && input.url) {
            try {
                const page = await readPage(input.url);
                const text = textFromHTML(page.text).slice(0, 20000);
                jd = { status: text.length > 120 ? 'read' : 'thin', text };
            } catch (jderr) { jd = { status: 'unavailable', text: '' }; warnings.push(jderr.message); }
        }
        if (jd.text) documents.push({ id: 'jd', title: 'Supplied job description', kind: 'jd', text: jd.text, url: input.url });

        // --- Seed catalogue ---
        let sources = [...seed1.sources, ...seed2.sources]
            .filter(s => normalize(s.company || '') === normalize(input.company))
            .map(s => ({
                title: s.title || 'Interview account',
                url: s.url,
                status: 'discovered',
                note: 'Catalogue link. Role and current applicability need review.',
            }));

        const catalogueSourceUrls = new Set(sources.map(s => s.url));

        // --- Brave search with expanded query groups ---
        if (env.BRAVE_SEARCH_API_KEY) {
            try {
                const queries = discoveryQueries(input);
                // Apply a budget per query: 5 results each.
                const results = await Promise.all(queries.map(q =>
                    getJSON(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`, {
                        headers: { 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY, accept: 'application/json' },
                    })
                ));
                const searchSources = results.flatMap(result =>
                    (result.web?.results || []).map(row => ({
                        title: row.title,
                        url: row.url,
                        status: 'discovered',
                        note: 'Search result; not a verified process.',
                    }))
                );
                for (const s of searchSources) {
                    if (!catalogueSourceUrls.has(s.url)) sources.push(s);
                }
            } catch {
                warnings.push('Live search failed. Showing catalogue links and your JD.');
            }
        } else {
            warnings.push('Live web search is not configured. Only matching catalogue links and your supplied JD are available.');
        }

        // Deduplicate by URL.
        sources = [...new Map(
            sources
                .filter(s => { try { sourceURL(s.url); return true; } catch { return false; } })
                .map(s => [s.url, s])
        ).values()].slice(0, 16).map((s, i) => ({ ...s, id: `source-${i}` }));

        // --- Crawl allowed hosts (new: polite scraper) ---
        const allowlistHosts = (env.RESEARCH_ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
        const crawlHosts = (env.RESEARCH_CRAWL_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
        // '*' means "any discovered host" (still robots-checked and rate-limited).
        const allowAll = crawlHosts.length === 1 && crawlHosts[0] === '*';
        // Otherwise the operator must name the hosts explicitly. An empty
        // RESEARCH_CRAWL_HOSTS means "no crawling beyond the reviewed allowlist"
        // — it must never widen the allowlist by accident.
        const effectiveCrawlHosts = allowAll ? [] : crawlHosts;
        // Hosts we are permitted to fetch: the reviewed allowlist plus any
        // explicitly named crawl hosts.
        const permittedHosts = [...new Set([...allowlistHosts, ...effectiveCrawlHosts])];

        // Collect seeds: adapter discovery + search results.
        const crawlSeeds = new Set();

        // 1. Adapter discovery for known sites.
        //    Only seeds from permitted hosts are used.
        for (const source of sources) {
            const adapter = adapterFor(source.url);
            if (!adapter) continue;
            const discovered = adapter.discover({ company: input.company, role: input.role, location: input.location, language: input.language });
            for (const d of discovered) {
                try {
                    const seed = sourceURL(d.url);
                    if (allowAll || permittedHosts.includes(seed.hostname)) crawlSeeds.add(seed.href);
                } catch { /* skip unparseable */ }
            }
        }

        // 1b. Direct job-board probe: slug-based boards (Greenhouse/Lever) are
        //     public and deterministic, so probe them from the company name even
        //     when search returned nothing. Still gated by the allowlist.
        if (input.company) {
            for (const base of BOARD_PROBES) {
                const adapter = adapterFor(base);
                if (!adapter) continue;
                for (const d of adapter.discover({ company: input.company, role: input.role })) {
                    try {
                        const seed = sourceURL(d.url);
                        if (allowAll || permittedHosts.includes(seed.hostname)) crawlSeeds.add(seed.href);
                    } catch { /* skip unparseable */ }
                }
            }
        }

        // 2. Search result URLs on permitted hosts.
        for (const source of sources) {
            try {
                const hostname = sourceURL(source.url).hostname;
                if (allowAll || permittedHosts.includes(hostname)) {
                    crawlSeeds.add(source.url);
                }
            } catch { /* skip */ }
        }

        if (crawlSeeds.size > 0) {
            const respectRobots = env.RESEARCH_RESPECT_ROBOTS !== 'false';
            const crawlBudget = Math.max(1, Math.min(30, parseInt(env.RESEARCH_CRAWL_BUDGET, 10) || 12));
            const maxPagesPerHost = Math.max(1, Math.min(10, parseInt(env.RESEARCH_MAX_PAGES_PER_HOST, 10) || 5));
            const minDelayMs = Math.max(500, Math.min(10000, parseInt(env.RESEARCH_MIN_DELAY_MS, 10) || 1500));
            const allowedHosts = allowAll ? [] : [...new Set([...allowlistHosts, ...effectiveCrawlHosts])];

            try {
                const scrapeResult = await scrapePlan([...crawlSeeds], {
                    allowedHosts: allowedHosts.length ? allowedHosts : undefined,
                    respectRobots,
                    minDelayMs,
                    maxPagesPerHost,
                    maxDepth: 2,
                    crawlBudget,
                });

                // Merge crawl documents into the research documents list.
                let docIdx = 0;
                for (const doc of scrapeResult.documents) {
                    documents.push({
                        id: `crawl-${docIdx++}-${doc.id || crypto.randomUUID().slice(0, 8)}`,
                        title: doc.title || 'Crawled page',
                        url: doc.url,
                        kind: 'account',
                        text: doc.text,
                        source: 'crawler',
                    });
                }

                // Add crawl sources (links that weren't readable) to sources list.
                for (const s of scrapeResult.sources) {
                    const url = s.url || s.sourceUrl || '';
                    try { sourceURL(url); } catch { continue; }
                    sources.push({
                        title: s.title || url,
                        url,
                        status: s.status || 'unavailable',
                        note: s.note || 'Could not read this page.',
                    });
                }

                if (scrapeResult.warnings.length) {
                    warnings.push(...scrapeResult.warnings);
                }
            } catch (scrapeErr) {
                warnings.push(`Crawling did not complete: ${scrapeErr.message}. Links are discovery-only.`);
            }
        } else if (allowlistHosts.length) {
            // Legacy path: read up to 3 allowlisted sources directly.
            const readable = sources.filter(s => {
                try { return allowlistHosts.includes(new URL(s.url).hostname); } catch { return false; }
            }).slice(0, 3);
            await Promise.all(readable.map(async s => {
                try {
                    const page = await readPage(s.url, { allowedHosts: allowlistHosts });
                    const text = textFromHTML(page.text).slice(0, 18000);
                    s.status = text.length > 120 ? 'read' : 'thin';
                    if (s.status === 'read') documents.push({ ...s, text, kind: 'account' });
                } catch (err) { s.status = 'unavailable'; s.note = err.message; }
            }));
        }

        if (!allowlistHosts.length && !crawlSeeds.size) {
            warnings.push('Automatic reading needs an operator-reviewed host allowlist. All links are discovery-only until reviewed.');
        }

        // --- AI extraction (provider abstraction) ---
        let accounts = [];
        if (hasAIProvider(env) && documents.some(d => d.kind === 'account')) {
            try {
                const generateJSON = provider || makeProvider({ env, request: (url, options) => getJSON(url, options) });
                const extraction = await extractAccounts({
                    provider: generateJSON,
                    target: { company: input.company, role: input.role },
                    documents,
                });
                accounts = extraction.accounts;
            } catch {
                warnings.push('Automatic extraction was unavailable. Review sources and add an account manually.');
            }
        } else if (documents.some(d => d.kind === 'account')) {
            warnings.push('No automatic interview account extraction ran. Add reviewed source notes to ground your plan.');
        }

        // Deduplicate sources again after crawl additions.
        sources = [...new Map(sources.filter(s => { try { sourceURL(s.url); return true; } catch { return false; } }).map(s => [s.url, s])).values()].map((s, i) => ({ ...s, id: `source-${i}` }));

        return reply(200, {
            version: 3,
            generatedAt: new Date().toISOString(),
            mode: warnings.length ? 'partial' : 'researched',
            jd,
            sources: sources.slice(0, 20),
            accounts,
            documents: documents.map(d => ({ id: d.id, title: d.title, url: d.url, kind: d.kind, textPreview: (d.text || '').slice(0, 200), source: d.source || 'direct' })),
            warnings,
            query: { company: input.company, role: input.role, location: input.location, url: input.url },
        });
    };
}

export const handler = makeHandler();