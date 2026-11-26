import test from 'node:test';
import assert from 'node:assert/strict';
import { titleMatches, sitemapKeywords, discoverCompany, discoverSitemap, discoverCommonPaths } from '../netlify/functions/lib/sources/discovery.mjs';

// ---------------------------------------------------------------------------
// titleMatches — guard against unrelated Wikipedia articles
// ---------------------------------------------------------------------------

test('titleMatches: accepts a page naming the company', () => {
    assert.equal(titleMatches('Stripe, LLC', 'Stripe'), true);
    assert.equal(titleMatches('Stripe', 'Stripe, Inc.'), true);
});

test('titleMatches: rejects an unrelated page', () => {
    assert.equal(titleMatches('Strike action', 'Stripe'), false);
    assert.equal(titleMatches('', 'Stripe'), false);
});

// ---------------------------------------------------------------------------
// sitemapKeywords — role-aware
// ---------------------------------------------------------------------------

test('sitemapKeywords: always includes careers/blog', () => {
    const keys = sitemapKeywords('Product Manager');
    assert(keys.includes('career'));
    assert(keys.includes('blog'));
});

test('sitemapKeywords: engineering roles add tech keywords', () => {
    assert(sitemapKeywords('Software Engineer').includes('engineering'));
    assert(sitemapKeywords('ML Engineer').includes('technology'));
});

// ---------------------------------------------------------------------------
// discoverCommonPaths — conventional pages, no fetch
// ---------------------------------------------------------------------------

test('discoverCommonPaths: returns absolute careers/blog/about URLs', () => {
    const urls = discoverCommonPaths('https://acme.com/');
    assert(urls.includes('https://acme.com/careers'));
    assert(urls.includes('https://acme.com/blog'));
    assert(urls.every(u => u.startsWith('https://acme.com/')));
});

test('discoverCommonPaths: bad origin yields nothing', () => {
    assert.deepEqual(discoverCommonPaths('not a url'), []);
});

// ---------------------------------------------------------------------------
// discoverCompany — Wikipedia + Wikidata official site
// ---------------------------------------------------------------------------

const wikiGetJSON = async url => {
    if (url.includes('wikipedia.org')) {
        return { query: { pages: { '1': { title: 'Stripe, LLC', extract: 'Stripe is a payments company.', fullurl: 'https://en.wikipedia.org/wiki/Stripe,_LLC', pageprops: { wikibase_item: 'Q7624104' } } } } };
    }
    if (url.includes('wikidata.org')) {
        return { claims: { P856: [{ mainsnak: { datavalue: { value: 'https://stripe.com/' } } }] } };
    }
    return {};
};

test('discoverCompany: returns summary, wiki URL and official site', async () => {
    const result = await discoverCompany({ company: 'Stripe', getJSON: wikiGetJSON });
    assert.equal(result.title, 'Stripe, LLC');
    assert.match(result.summary, /payments/);
    assert.equal(result.officialUrl, 'https://stripe.com/');
    assert.equal(result.wikiUrl, 'https://en.wikipedia.org/wiki/Stripe,_LLC');
});

test('discoverCompany: abstains for an unmatched company', async () => {
    const getJSON = async () => ({ query: { pages: { '1': { title: 'Totally Different Topic' } } } });
    assert.equal(await discoverCompany({ company: 'Stripe', getJSON }), null);
});

test('discoverCompany: abstains without a company name', async () => {
    assert.equal(await discoverCompany({ company: '', getJSON: wikiGetJSON }), null);
});

// ---------------------------------------------------------------------------
// discoverSitemap — official-site careers/blog pages
// ---------------------------------------------------------------------------

test('discoverSitemap: reads robots.txt sitemap and filters by keyword', async () => {
    const pages = {
        'https://acme.com/robots.txt': { text: 'User-agent: *\nAllow: /\nSitemap: https://acme.com/sitemap.xml' },
        'https://acme.com/sitemap.xml': { text: '<urlset><url><loc>https://acme.com/careers</loc></url><url><loc>https://acme.com/about</loc></url><url><loc>https://acme.com/logo.png</loc></url></urlset>' },
    };
    const readPage = async (url, opts) => { assert.deepEqual(opts.allowedHosts, [new URL(url).hostname]); return pages[url] || Promise.reject(new Error('404')); };
    const urls = await discoverSitemap({ origin: 'https://acme.com', readPage, keywords: ['career'] });
    assert.deepEqual(urls, ['https://acme.com/careers']);
});

test('discoverSitemap: follows a sitemap index one level', async () => {
    const pages = {
        'https://acme.com/robots.txt': { text: 'Sitemap: https://acme.com/sitemap.xml' },
        'https://acme.com/sitemap.xml': { text: '<sitemapindex><sitemap><loc>https://acme.com/partition-0.xml</loc></sitemap></sitemapindex>' },
        'https://acme.com/partition-0.xml': { text: '<urlset><url><loc>https://acme.com/engineering/blog</loc></url></urlset>' },
    };
    const readPage = async url => pages[url] || Promise.reject(new Error('404'));
    const urls = await discoverSitemap({ origin: 'https://acme.com', readPage, keywords: ['engineering'] });
    assert.deepEqual(urls, ['https://acme.com/engineering/blog']);
});

test('discoverSitemap: falls back to /sitemap.xml when robots has none', async () => {
    const pages = { 'https://acme.com/sitemap.xml': { text: '<urlset><url><loc>https://acme.com/careers</loc></url></urlset>' } };
    const readPage = async url => pages[url] || Promise.reject(new Error('404'));
    const urls = await discoverSitemap({ origin: 'https://acme.com', readPage, keywords: ['career'] });
    assert.deepEqual(urls, ['https://acme.com/careers']);
});

test('discoverSitemap: ignores cross-host locs', async () => {
    const pages = { 'https://acme.com/sitemap.xml': { text: '<urlset><url><loc>https://evil.com/careers</loc></url></urlset>' } };
    const readPage = async url => pages[url] || Promise.reject(new Error('404'));
    assert.deepEqual(await discoverSitemap({ origin: 'https://acme.com', readPage, keywords: ['career'] }), []);
});
