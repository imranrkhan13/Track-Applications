// Source-site adapters: each knows how to discover candidate URLs and how to
// parse HTML into clean text for a specific host.  Extending the adapter
// registry is the recommended way to add a site without touching the crawl
// engine.

// Adapters are advisory — a page is still subject to robots.txt and the
// operator allowlist before being fetched.  A site not in the registry is
// fetched with the generic adapter, which strips HTML normally.

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

    // Strip navigation, sidebar, footer.  AmbitionBox main content is in
    // article or the main content area.
    parse(html) {
        // Keep title
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Remove scripts, styles, and nav boilerplate.
        let cleaned = html
            .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
            .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
            .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
            .replace(/<header\b[\s\S]*?<\/header>/gi, ' ');

        // Keep the main content area if present.
        const mainMatch = cleaned.match(/<main\b[\s\S]*?<\/main>/i);
        if (mainMatch) cleaned = mainMatch[0];

        // Strip remaining HTML.
        cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();

        return { title, text: cleaned.slice(0, 20000) };
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
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        // Medium article content is in <article> or data-blocks.
        let cleaned = html
            .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
            .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
            .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ');

        const articleMatch = cleaned.match(/<article\b[\s\S]*?<\/article>/i);
        if (articleMatch) cleaned = articleMatch[0];

        cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        return { title: titleMatch ? titleMatch[1].trim() : '', text: cleaned.slice(0, 20000) };
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
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        let cleaned = html
            .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
            .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
            .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
            .replace(/<header\b[\s\S]*?<\/header>/gi, ' ');
        cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        return { title: titleMatch ? titleMatch[1].trim() : '', text: cleaned.slice(0, 20000) };
    },
});

// ---------------------------------------------------------------------------
// Generic careers / blog page (fallback)
// ---------------------------------------------------------------------------

const GENERIC = {
    id: 'generic',

    discover() {
        // No discovery — the crawler uses Brave search results as seeds.
        return [];
    },

    parse(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        let cleaned = html
            .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
            .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
            .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
            .replace(/<header\b[\s\S]*?<\/header>/gi, ' ');
        cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
        return { title: titleMatch ? titleMatch[1].trim() : '', text: cleaned.slice(0, 20000) };
    },
};

export { GENERIC as defaultAdapter };