// Polite public-web crawler.
// Respects robots.txt, enforces per-host rate limits, caps pages/depth,
// reuses the existing SSRF-safe fetch (safe-source.mjs).
// Does NOT bypass login walls, CAPTCHA, proxy rotation, or X/Twitter.

import { readPublicPage, sourceURL, textFromHTML } from './safe-source.mjs';
import { fetchRobots, isAllowed } from './robots.mjs';
const DEFAULT_MIN_DELAY_MS = 1500;
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_BYTES = 180000;
const DEFAULT_TIMEOUT_MS = 8000;

// Per-host last-fetch timestamp (in-memory, not persisted).
const hostClocks = new Map();

// Wait at least minDelayMs since last request to this host.
async function pace(hostname, minDelayMs) {
    const last = hostClocks.get(hostname) || 0;
    const elapsed = Date.now() - last;
    const wait = Math.max(0, minDelayMs - elapsed);
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    hostClocks.set(hostname, Date.now());
}

// Fetch one page politely: check robots, wait min delay, SSRF-safe fetch.
// Returns { status: 'read'|'thin'|'unavailable'|'disallowed', url, title?, text? }.
export async function fetchPolite(raw, {
    allowedHosts,
    respectRobots = true,
    minDelayMs = DEFAULT_MIN_DELAY_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    robotsCache,
    robotsTTL,
} = {}) {
    let url;
    try { url = sourceURL(raw); } catch (e) { return { status: 'unavailable', url: raw, note: e.message }; }

    const hostname = url.hostname;

    // Check robots.txt before fetching.
    if (respectRobots) {
        try {
            const parsed = await fetchRobots(url.origin, {
                fetchPage: async (robotsUrl) => {
                    try {
                        const page = await readPublicPage(robotsUrl, { allowedHosts: [robotsUrl, new URL(robotsUrl).hostname], maxBytes: 64000, timeoutMs: 5000 });
                        return { statusCode: 200, text: page.text };
                    } catch (e) {
                        // Treat as 404 if the fetch failed
                        return { statusCode: e.message?.toLowerCase?.()?.includes('404') ? 404 : 503, text: '' };
                    }
                },
                cache: robotsCache,
                ttlMs: robotsTTL,
            });
            if (!isAllowed(parsed, url.pathname || '/')) {
                const delay = parsed.crawlDelayMs;
                return { status: 'disallowed', url: url.href, note: `Blocked by robots.txt${delay ? ` (crawl-delay: ${delay}ms)` : ''}.` };
            }
        } catch {
            // Robots.txt check failed → skip this page (conservative).
            return { status: 'unavailable', url: url.href, note: 'Could not verify robots.txt.' };
        }
    }

    // Pace requests to this host.
    await pace(hostname, Math.max(minDelayMs, respectRobots ? 0 : minDelayMs));

    try {
        const page = await readPublicPage(url.href, { allowedHosts, maxBytes, timeoutMs });
        const text = textFromHTML(page.text);
        const titleMatch = page.text.match(/<title[^>]*>([^<]*)<\/title>/i);
        return {
            status: text.length > 120 ? 'read' : 'thin',
            url: page.url || url.href,
            title: titleMatch ? titleMatch[1].trim().slice(0, 300) : null,
            text: text.slice(0, 20000),
        };
    } catch (e) {
        return { status: 'unavailable', url: url.href, note: e.message };
    }
}

// Extract absolute same-origin links from HTML.
// Skips anchors, mailto, tel, javascript, and asset extensions.
const SKIP_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.pdf', '.zip', '.tar', '.gz']);
const SKIP_PATH = /^\/(cdn|assets|static|img|images|fonts|dist|build)\//i;

export function discoverLinks(html, baseUrl, { sameHost = true } = {}) {
    const base = baseUrl instanceof URL ? baseUrl : sourceURL(baseUrl);
    const hrefs = new Set();
    const regex = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        let href = match[1];
        // Skip empty, anchors, and non-http schemes.
        if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('mailto:') || href.startsWith('tel:')) continue;

        let resolved;
        try { resolved = new URL(href, base); } catch { continue; }
        if (!['http:', 'https:'].includes(resolved.protocol)) continue;
        if (sameHost && resolved.hostname !== base.hostname) continue;

        const path = resolved.pathname.toLowerCase();
        if (SKIP_PATH.test(path)) continue;
        const ext = path.match(/\.[a-z0-9]+$/i)?.[0];
        if (ext && SKIP_EXT.has(ext)) continue;

        resolved.hash = '';
        hrefs.add(resolved.href);
    }
    return [...hrefs];
}

// Crawl one host: BFS from a set of seed URLs, respecting depth and page caps.
// Returns [{url, status, title, text, links[]}].
export async function crawlHost(seedUrls, {
    allowedHosts,
    respectRobots = true,
    minDelayMs = DEFAULT_MIN_DELAY_MS,
    maxPages = DEFAULT_MAX_PAGES,
    maxDepth = DEFAULT_MAX_DEPTH,
    maxBytes = DEFAULT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
    const seen = new Set();
    const results = [];
    // BFS queue: {url, depth}
    const queue = [];

    for (const seed of seedUrls) {
        try {
            const u = sourceURL(seed);
            if (!seen.has(u.href)) {
                seen.add(u.href);
                queue.push({ url: u.href, depth: 0 });
            }
        } catch { /* skip unparseable seeds */ }
    }

    const robotsCache = new Map();

    while (queue.length > 0 && results.length < maxPages) {
        const { url, depth } = queue.shift();
        const result = await fetchPolite(url, {
            allowedHosts: allowedHosts || [new URL(url).hostname],
            respectRobots,
            minDelayMs,
            maxBytes,
            timeoutMs,
            robotsCache,
        });

        const doc = { ...result, links: [] };
        results.push(doc);

        if (result.status === 'read' && result.text && depth < maxDepth) {
            const links = discoverLinks(result.text, url, { sameHost: true });
            doc.links = links;
            for (const link of links) {
                if (!seen.has(link) && results.length + queue.length < maxPages) {
                    seen.add(link);
                    queue.push({ url: link, depth: depth + 1 });
                }
            }
        }
    }

    return results;
}

// Multi-host scrape plan. Each seed group maps to one host.
// Returns { documents: [...read pages], sources: [...discovery-only links], warnings: [...] }.
export async function runScrapePlan(seeds, {
    allowedHosts,
    respectRobots = true,
    minDelayMs = DEFAULT_MIN_DELAY_MS,
    maxPagesPerHost = DEFAULT_MAX_PAGES,
    maxDepth = DEFAULT_MAX_DEPTH,
    maxBytes = DEFAULT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    crawlBudget = 12, // total pages across all hosts
} = {}) {
    const allDocuments = [];
    const allSources = [];
    const warnings = [];
    let remaining = crawlBudget;

    for (const seed of seeds) {
        if (remaining <= 0) {
            warnings.push('Crawl budget exhausted; remaining links are discovery-only.');
            break;
        }

        try {
            const u = sourceURL(seed);
            const hostPages = await crawlHost([seed], {
                allowedHosts: allowedHosts || [u.hostname],
                respectRobots,
                minDelayMs,
                maxPages: Math.min(maxPagesPerHost, remaining),
                maxDepth,
                maxBytes,
                timeoutMs,
            });

            for (const page of hostPages) {
                if (page.status === 'read' || page.status === 'thin') {
                    allDocuments.push({
                        id: `crawl-${crypto.randomUUID().slice(0, 8)}`,
                        title: page.title || new URL(page.url).hostname,
                        url: page.url,
                        kind: 'account',
                        text: page.text,
                        source: 'crawler',
                    });
                } else {
                    allSources.push({
                        title: page.title || page.url,
                        url: page.url,
                        status: page.status,
                        note: page.note || 'Could not read this page.',
                    });
                }
            }
            remaining -= hostPages.length;
        } catch (e) {
            warnings.push(`Could not crawl ${seed}: ${e.message}`);
        }
    }

    return { documents: allDocuments, sources: allSources, warnings };
}

// For tests: reset the rate-limiting clock.
export function resetHostClocks() {
    hostClocks.clear();
}