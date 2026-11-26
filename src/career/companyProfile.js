// Assembles a company profile from research sources alone — no provider key
// required. Sources are classified by host and path into four buckets so the
// candidate can see what is known about the product, tech, hiring and reviews.
// This only groups links the research already found; it asserts no facts.

const REVIEW_HOSTS = ['glassdoor.', 'ambitionbox.', 'indeed.', 'blind.', 'naukri.', 'levels.fyi'];
const JOB_BOARD_HOSTS = ['greenhouse.io', 'lever.co', 'workable.', 'ashbyhq.', 'myworkdayjobs.', 'smartrecruiters.', 'jobs.'];
const BUCKET_ORDER = ['product', 'tech', 'hiring', 'reviews'];

export const BUCKET_META = {
    product: { label: 'Product & company', hint: 'Official site, product and about pages.' },
    tech: { label: 'Engineering & tech', hint: 'Engineering blogs, developer docs and stack signals.' },
    hiring: { label: 'Hiring & careers', hint: 'Careers pages and job boards — teams and open roles.' },
    reviews: { label: 'Reviews & interviews', hint: 'Interview accounts and employer reviews from other candidates.' },
};

export function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// Classify one source into a bucket. Host wins over path; path over text.
export function classifySource(source) {
    const url = source?.url || '';
    const host = hostOf(url);
    let path = '';
    try { path = new URL(url).pathname.toLowerCase(); } catch { /* leave empty */ }
    const text = `${source?.title || ''} ${source?.note || ''}`.toLowerCase();

    if (REVIEW_HOSTS.some(h => host.includes(h))) return 'reviews';
    if (JOB_BOARD_HOSTS.some(h => host.includes(h))) return 'hiring';
    if (/interview/.test(path) || /interview|review|candidate account/.test(text)) return 'reviews';
    if (/\/(careers?|jobs?|join|hiring|roles|positions)\b/.test(path) || /career|hiring|open roles|job opening/.test(text)) return 'hiring';
    if (/\/(engineering|tech|developers?|blog|handbook)\b/.test(path) || /engineering blog|tech stack|technology|developer/.test(text)) return 'tech';
    return 'product';
}

/** Build a profile view model from a research result. Pure and deterministic. */
export function companyProfile(research) {
    const sources = (research?.sources || []).filter(s => s && s.url);
    const buckets = { product: [], tech: [], hiring: [], reviews: [] };
    for (const source of sources) {
        const bucket = classifySource(source);
        buckets[bucket].push({ title: source.title || source.url, url: source.url, host: hostOf(source.url), status: source.status });
    }
    const hostCounts = new Map();
    for (const source of sources) {
        const host = hostOf(source.url);
        if (host) hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
    }
    return {
        total: sources.length,
        buckets,
        order: BUCKET_ORDER,
        hosts: [...hostCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([host, count]) => ({ host, count })),
    };
}
