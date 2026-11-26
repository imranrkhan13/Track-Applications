// Source-site adapters: each knows how to discover candidate URLs and how to
// parse HTML into clean text for a specific host.  Extending the adapter
// registry is the recommended way to add a site without touching the crawl
// engine.

// Adapters are advisory — a page is still subject to robots.txt and the
// operator allowlist before being fetched.  A site not in the registry is
// fetched with the generic adapter, which strips HTML normally.

// ---------------------------------------------------------------------------
// Shared HTML cleaning
// ---------------------------------------------------------------------------

// Strip a document to readable text.  Prefers <article> then <main> so
// navigation, sidebars and footers do not pollute the extracted text.  Also
// captures <title> and the meta/og description for a one-line summary.
export function cleanHTML(html, { prefer = ['article', 'main'] } = {}) {
    const source = String(html || '');
    const title = source.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '';
    const description = source.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim()
        || source.match(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["'](?:og:description|description)["']/i)?.[1]?.trim()
        || '';

    let cleaned = source
        .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<header\b[\s\S]*?<\/header>/gi, ' ');

    for (const tag of prefer) {
        const match = cleaned.match(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i'));
        if (match) { cleaned = match[0]; break; }
    }

    cleaned = cleaned
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();

    return { title, description, text: cleaned.slice(0, 20000) };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const ADAPTERS = new Map();

function register(hostnames, adapter) {
    for (const h of hostnames) ADAPTERS.set(h, adapter);
}

export function adapterFor(url) {
    try { return ADAPTERS.get(new URL(url).hostname) || null; } catch { return null; }
}

export { ADAPTERS as registry };

// ---------------------------------------------------------------------------
// AmbitionBox — company interview review pages
// ---------------------------------------------------------------------------

register(['www.ambitionbox.com', 'ambitionbox.com'], {
    id: 'ambitionbox',

    // Build discovery URLs from the company name.
    discover({ company }) {
        const slug = company.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const companySlug = slug || company.toLowerCase().replace(/[^\w]/g, '');
        return [
            {
                url: `https://www.ambitionbox.com/companies/${companySlug}/reviews`,
                title: `${company} reviews on AmbitionBox`,
                note: 'Company review page. Each review may describe interview experience.',
            },
        ];
    },

    parse(html) {
        const { title, description, text } = cleanHTML(html, { prefer: ['main', 'article'] });
        return { title, description, text };
    },
});

// ---------------------------------------------------------------------------
// Medium — interview experience posts
// ---------------------------------------------------------------------------

register(['medium.com', 'www.medium.com', '*.medium.com'], {
    id: 'medium',

    discover({ company, role }) {
        const q = encodeURIComponent(`${company} ${role} interview experience`);
        // Medium uses a search page; the actual article URLs come from crawl
        // discovery, not guessing slugs.
        return [
            {
                url: `https://medium.com/search?q=${q}`,
                title: `Medium search for ${company} interview experience`,
                note: 'Search result page. Actual article links are discovered during fetch.',
            },
        ];
    },

    parse(html) {
        const { title, description, text } = cleanHTML(html, { prefer: ['article', 'main'] });
        return { title, description, text };
    },
});

// ---------------------------------------------------------------------------
// Glassdoor — interview section
// ---------------------------------------------------------------------------

register(['www.glassdoor.com', 'glassdoor.com', 'www.glassdoor.co.in', 'glassdoor.co.in'], {
    id: 'glassdoor',

    discover({ company, role }) {
        // Glassdoor uses numeric company IDs internally, but their interview
        // search by company name is publicly reachable.
        const q = encodeURIComponent(`${company} ${role}`);
        return [
            {
                url: `https://www.glassdoor.com/Interview/${encodeURIComponent(company.replace(/\s+/g, '-'))}-interview-questions-SRCH_KE_0,${company.length}.htm`,
                title: `${company} interview questions on Glassdoor`,
                note: 'Interview review page. Individual reviews may describe the process.',
            },
            {
                url: `https://www.glassdoor.com/Search/results.htm?keyword=${q}`,
                title: `${company} ${role} on Glassdoor`,
                note: 'Search results.',
            },
        ];
    },

    parse(html) {
        const { title, description, text } = cleanHTML(html, { prefer: ['main', 'article'] });
        return { title, description, text };
    },
});

// ---------------------------------------------------------------------------
// Greenhouse — job boards (boards.greenhouse.io / job-boards.greenhouse.io)
// ---------------------------------------------------------------------------

const companySlug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');

register(['boards.greenhouse.io', 'job-boards.greenhouse.io', 'www.greenhouse.io', 'greenhouse.io'], {
    id: 'greenhouse',

    discover({ company }) {
        const slug = companySlug(company);
        if (!slug) return [];
        return [
            {
                url: `https://boards.greenhouse.io/${slug}`,
                title: `${company} roles on Greenhouse`,
                note: 'Employer job board. Reveals teams, level and the roles the company hires for.',
            },
        ];
    },

    parse(html) {
        const { title, description, text } = cleanHTML(html, { prefer: ['main', 'article'] });
        return { title, description, text };
    },
});

// ---------------------------------------------------------------------------
// Lever — job boards (jobs.lever.co)
// ---------------------------------------------------------------------------

register(['jobs.lever.co', 'lever.co', 'www.lever.co'], {
    id: 'lever',

    discover({ company }) {
        const slug = companySlug(company);
        if (!slug) return [];
        return [
            {
                url: `https://jobs.lever.co/${slug}`,
                title: `${company} roles on Lever`,
                note: 'Employer job board. Reveals teams, level and the roles the company hires for.',
            },
        ];
    },

    parse(html) {
        const { title, description, text } = cleanHTML(html, { prefer: ['main', 'article'] });
        return { title, description, text };
    },
});

// ---------------------------------------------------------------------------
// Generic careers / company blog page (fallback)
// ---------------------------------------------------------------------------

const GENERIC = {
    id: 'generic',

    discover() {
        // No discovery — the crawler uses Brave search results as seeds.
        return [];
    },

    parse(html) {
        // Company careers pages and engineering blogs usually put the article
        // in <article> or <main>; fall back to the whole document.
        const { title, description, text } = cleanHTML(html, { prefer: ['article', 'main'] });
        return { title, description, text };
    },
};

export { GENERIC as defaultAdapter };

// Base URLs for public job boards that can be probed directly from a company
// name (slug-based, no search key needed). career-research probes these even
// when no search results exist, so a logged job still surfaces the employer's
// own board — subject to the same allowlist and robots.txt checks.
export const BOARD_PROBES = ['https://boards.greenhouse.io/', 'https://jobs.lever.co/'];
