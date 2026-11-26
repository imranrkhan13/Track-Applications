// Keyless discovery — find public pages about a company without paying for a
// search-engine API. Everything here is a public, deterministic, citable
// source:
//   1. Wikipedia  → company background (encyclopedic summary).
//   2. Wikidata   → the company's official website (property P856), so we
//                   never guess a domain.
//   3. Sitemap    → the official site's own careers / engineering / blog pages,
//                   taken from its robots.txt sitemap declarations.
//
// These feed the same polite crawler; they do not bypass robots.txt, login
// walls or paywalls. No API key is required.

import { parseRobots } from '../robots.mjs';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const normalize = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// A Wikipedia page is only accepted when its title plausibly names the company
// (guards against search returning an unrelated article).
export function titleMatches(pageTitle, company) {
    const title = normalize(pageTitle);
    const target = normalize(company);
    if (!title || !target) return false;
    if (title.includes(target) || target.includes(title)) return true;
    // Fall back to the first significant word ("Acme Inc." → "acme").
    const head = String(company).split(/\s+/).find(w => normalize(w).length >= 3);
    return head ? title.includes(normalize(head)) : false;
}

/** Company background + official website from Wikipedia/Wikidata. */
export async function discoverCompany({ company, getJSON }) {
    if (!company) return null;
    const params = new URLSearchParams({
        action: 'query', generator: 'search', gsrsearch: `${company} company`, gsrlimit: '1',
        prop: 'extracts|info|pageprops', exintro: '1', explaintext: '1',
        inprop: 'url', ppprop: 'wikibase_item', redirects: '1', format: 'json',
    });
    let page;
    try {
        const data = await getJSON(`${WIKI_API}?${params.toString()}`);
        page = Object.values(data?.query?.pages || {})[0];
    } catch { return null; }
    if (!page || !titleMatches(page.title, company)) return null;

    const summary = String(page.extract || '').trim();
    const wikiUrl = page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;

    // Official website via Wikidata (P856) — authoritative, never guessed.
    let officialUrl = '';
    const qid = page.pageprops?.wikibase_item || '';
    if (qid) {
        try {
            const claims = await getJSON(`${WIKIDATA_API}?action=wbgetclaims&entity=${encodeURIComponent(qid)}&property=P856&format=json`);
            officialUrl = claims?.claims?.P856?.[0]?.mainsnak?.datavalue?.value || '';
        } catch { /* website is optional */ }
    }
    return { title: page.title, wikiUrl, summary, officialUrl, qid };
}

const SITEMAP_SKIP = /\.(xml|gz|jpg|jpeg|png|gif|svg|css|js|pdf|zip)$/i;
const SITEMAP_MAX_BYTES = 600000; // skip multi-megabyte sitemaps (cheap win: common paths cover those sites)

/**
 * Conventional paths nearly every company site uses. Returned as absolute URLs
 * (no fetch) so the polite crawler can read the ones that exist — cheaper and
 * more reliable than crawling a multi-megabyte sitemap.
 */
export function discoverCommonPaths(origin) {
    let base;
    try { base = new URL(origin); } catch { return []; }
    return ['careers', 'jobs', 'blog', 'engineering', 'about', 'team'].map(p => `${base.origin}/${p}`);
}

/**
 * Read an official site's sitemap(s) and return URLs whose path matches one of
 * the keywords (e.g. careers, engineering, blog). Reads robots.txt for sitemap
 * declarations, then follows one level of sitemap index. Oversized sitemaps are
 * skipped — for very large sites, discoverCommonPaths covers the usual pages.
 */
export async function discoverSitemap({ origin, readPage, keywords = [], limit = 8 }) {
    let base;
    try { base = new URL(origin); } catch { return []; }
    const host = base.hostname;
    const read = url => readPage(url, { allowedHosts: [new URL(url).hostname], maxBytes: SITEMAP_MAX_BYTES });

    let sitemaps = [];
    try {
        const robots = await read(`${base.origin}/robots.txt`);
        sitemaps = parseRobots(robots.text).sitemaps;
    } catch { /* no robots.txt */ }
    if (!sitemaps.length) sitemaps = [`${base.origin}/sitemap.xml`];
    sitemaps = sitemaps.slice(0, 3);

    const urls = new Set();
    for (const sitemap of sitemaps) {
        let xml = '';
        try { xml = (await read(sitemap)).text; } catch { continue; }
        // Sitemap index → pull child sitemaps (one level deep, capped).
        const children = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>\s*([^<\s]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi)].map(m => m[1]);
        for (const child of children.slice(0, 2)) {
            try { xml += '\n' + (await read(child)).text; } catch { /* skip child */ }
        }
        for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) urls.add(m[1]);
        if (urls.size > 400) break;
    }

    const needles = keywords.map(k => k.toLowerCase());
    return [...urls]
        .filter(u => {
            let path;
            try { path = new URL(u).pathname; } catch { return false; }
            if (host && new URL(u).hostname !== host) return false;
            if (SITEMAP_SKIP.test(path)) return false;
            const p = u.toLowerCase();
            return needles.some(k => p.includes(k));
        })
        .slice(0, limit);
}

/** Keywords worth surfacing from an official site, derived from the role. */
export function sitemapKeywords(role = '') {
    const keys = ['career', 'job', 'blog', 'engineering', 'interview', 'about', 'team'];
    if (/engineer|developer|software|data|ml|ai|platform|infra/i.test(role)) keys.push('technology', 'developers');
    return keys;
}
