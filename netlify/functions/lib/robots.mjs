// Robots Exclusion Protocol parser.
// Compliant with Google's robots.txt spec: longest-match path rules,
// Allow/Disallow, wildcards (*), end-of-path anchors ($), Crawl-delay, Sitemaps.
// Fails open on 404 (no robots.txt = allow all); configurable on 5xx/timeout.

const USER_AGENT = 'CareerGardenResearch/2.0';

// In-memory host → parsed {rules, crawlDelayMs, sitemaps, fetchedAt}
const CACHE = new Map();
// Default TTL for robots.txt cache (1 hour) — operator configurable.
const DEFAULT_TTL_MS = 3_600_000;

// Join a path pattern to a regex string.
// * matches any sequence of characters that are not /
// $ anchors at end of path
function patternToRegex(pattern) {
    // Pull off a trailing $ anchor before escaping — otherwise the escape
    // step would turn it into a literal dollar sign.
    const anchored = pattern.endsWith('$');
    const body = anchored ? pattern.slice(0, -1) : pattern;
    let s = body
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials
        .replace(/\*/g, '.*');                // * → any sequence
    // A pattern ending with / matches the directory index, so append ?
    if (body.endsWith('/')) s += '?';
    return new RegExp('^' + s + (anchored ? '$' : ''));
}

// Parse one robots.txt body into a structured object.
export function parseRobots(text, userAgent = USER_AGENT) {
    const lines = text.split(/\r?\n/);
    const rules = [];          // [{allow: boolean, regex: RegExp, raw: string}]
    const sitemaps = [];
    let crawlDelayMs = null;
    let currentUserAgents = [];

    function recordRule(allow, raw) {
        // Malformed or empty paths are ignored (spec).
        if (!raw || raw.trim() === '') return;
        try {
            const regex = patternToRegex(raw.trim());
            rules.push({ allow, regex, raw: raw.trim() });
        } catch {
            // Unparseable pattern → skip (robots.txt is advisory).
        }
    }

    for (const line of lines) {
        // Strip comments
        const stripped = line.split('#')[0].trim();
        if (!stripped) continue;

        const colonIndex = stripped.indexOf(':');
        if (colonIndex < 0) continue;

        const directive = stripped.slice(0, colonIndex).trim().toLowerCase();
        const value = stripped.slice(colonIndex + 1).trim();

        if (directive === 'user-agent') {
            currentUserAgents = value.split(',').map(s => s.trim().toLowerCase());
            continue;
        }

        // Sitemap is a global directive (RFC 9309 §2.2.1): it is not scoped to
        // a user-agent group, so it must be recorded before the group gate.
        if (directive === 'sitemap') {
            if (value) sitemaps.push(value);
            continue;
        }

        // Only apply to our user agent or *
        const applies = currentUserAgents.some(ua =>
            ua === userAgent.toLowerCase() || ua === '*'
        );
        if (!applies) continue;

        switch (directive) {
            case 'disallow':
                // Empty disallow means "allow all" (spec — empty path after Disallow)
                if (!value) break;
                recordRule(false, value);
                break;
            case 'allow':
                recordRule(true, value);
                break;
            case 'crawl-delay': {
                const seconds = parseFloat(value);
                if (Number.isFinite(seconds) && seconds >= 0) {
                    crawlDelayMs = Math.floor(seconds * 1000);
                }
                break;
            }
        }
    }

    return { rules, crawlDelayMs, sitemaps };
}

// Check whether a pathname is allowed by parsed robots rules.
// A pathname of '/' represents the root.
// Returns true if allowed, false if disallowed.
// If no matching rule: allowed (default per spec).
export function isAllowed(parsed, pathname) {
    const normalized = pathname.startsWith('/') ? pathname : '/' + pathname;
    let matched = null;
    let matchedLength = -1;

    for (const rule of parsed.rules) {
        if (rule.regex.test(normalized)) {
            const len = rule.raw.length;
            // Longest match wins; ties go to the rule appearing later in the file.
            if (len > matchedLength) {
                matched = rule;
                matchedLength = len;
            }
        }
    }

    // No matching rule → allowed
    if (!matched) return true;
    return matched.allow;
}

// Fetch and parse robots.txt for a given origin.
// Caches in memory; returns the parsed object.
// fetchPage is a function (url) => Promise<{statusCode, text?}>
export async function fetchRobots(origin, { fetchPage, cache = CACHE, ttlMs = DEFAULT_TTL_MS, failOnUnavailable = false } = {}) {
    const now = Date.now();
    const cached = cache.get(origin);
    if (cached && now - cached.fetchedAt < ttlMs) return cached.parsed;

    const robotsUrl = `${origin}/robots.txt`;
    let parsed;
    try {
        let result;
        try {
            result = await fetchPage(robotsUrl);
        } catch {
            // DNS/network failure → conservative
            parsed = failOnUnavailable ? { rules: [{ allow: false, regex: /./, raw: '/' }], crawlDelayMs: null, sitemaps: [] } : { rules: [], crawlDelayMs: null, sitemaps: [] };
        }
        if (!parsed) {
            if (result.statusCode === 404 || result.statusCode === 410) {
                // No robots.txt → allow all
                parsed = { rules: [], crawlDelayMs: null, sitemaps: [] };
            } else if (Math.floor(result.statusCode / 100) === 5 || !result.text) {
                // 5xx / unreadable → conservative (disallow by default) or fail-open per config
                parsed = failOnUnavailable
                    ? { rules: [{ allow: false, regex: /./, raw: '/' }], crawlDelayMs: null, sitemaps: [] }
                    : { rules: [], crawlDelayMs: null, sitemaps: [] };
            } else {
                parsed = parseRobots(result.text);
            }
        }
    } catch {
        parsed = failOnUnavailable
            ? { rules: [{ allow: false, regex: /./, raw: '/' }], crawlDelayMs: null, sitemaps: [] }
            : { rules: [], crawlDelayMs: null, sitemaps: [] };
    }

    cache.set(origin, { parsed, fetchedAt: now });
    return parsed;
}

// Clear the robots cache (for testing).
export function clearRobotsCache() {
    CACHE.clear();
}

// Prune old entries from the cache.
export function pruneRobotsCache(ttlMs = DEFAULT_TTL_MS) {
    const cutoff = Date.now() - ttlMs;
    for (const [host, entry] of CACHE) {
        if (entry.fetchedAt < cutoff) CACHE.delete(host);
    }
}