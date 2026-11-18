import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, isAllowed, fetchRobots, clearRobotsCache } from '../netlify/functions/lib/robots.mjs';
import { discoverLinks, crawlHost, runScrapePlan, resetHostClocks } from '../netlify/functions/lib/scraper.mjs';
import { adapterFor } from '../netlify/functions/lib/sources/adapters.mjs';
import { sourceURL, textFromHTML } from '../netlify/functions/lib/safe-source.mjs';

// ---------------------------------------------------------------------------
// robots.txt parsing
// ---------------------------------------------------------------------------

test('parseRobots: empty robots.txt allows all', () => {
    const parsed = parseRobots('');
    assert.equal(isAllowed(parsed, '/'), true);
    assert.equal(isAllowed(parsed, '/any/path'), true);
});

test('parseRobots: full universal block', () => {
    const txt = 'User-agent: *\nDisallow: /';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/'), false);
    assert.equal(isAllowed(parsed, '/interview'), false);
});

test('parseRobots: Allow overrides Disallow (longest-match)', () => {
    const txt = 'User-agent: *\nDisallow: /\nAllow: /public';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/'), false);
    assert.equal(isAllowed(parsed, '/public'), true);
    assert.equal(isAllowed(parsed, '/public/info'), true);
    assert.equal(isAllowed(parsed, '/private'), false);
});

test('parseRobots: specific disallow with wildcard', () => {
    const txt = 'User-agent: *\nDisallow: /admin/*/delete';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/'), true);
    assert.equal(isAllowed(parsed, '/admin/foo/delete'), false);
    assert.equal(isAllowed(parsed, '/admin/foo'), true);
});

test('parseRobots: end-of-path anchor ($)', () => {
    const txt = 'User-agent: *\nDisallow: /temp$\nAllow: /temp/';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/temp'), false);
    assert.equal(isAllowed(parsed, '/temp/'), true);
    assert.equal(isAllowed(parsed, '/temp/page'), true);
});

test('parseRobots: specific user-agent match', () => {
    const txt = 'User-agent: Googlebot\nDisallow: /\nUser-agent: *\nAllow: /';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/'), true);
    assert.equal(isAllowed(parsed, '/api'), true);
});

test('parseRobots: multiple user-agents on one line', () => {
    const txt = 'User-agent: googlebot, bingbot\nDisallow: /no-bots\nUser-agent: *\nAllow: /';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/'), true);
    // Our agent is CareerGardenResearch, not googlebot/bingbot, so it should be allowed
    assert.equal(isAllowed(parsed, '/no-bots'), true);
});

test('parseRobots: crawl-delay extraction', () => {
    const txt = 'User-agent: *\nDisallow: /slow\nCrawl-delay: 10';
    const parsed = parseRobots(txt);
    assert.equal(parsed.crawlDelayMs, 10000);
});

test('parseRobots: sitemaps extracted', () => {
    const txt = 'User-agent: *\nDisallow:\nSitemap: https://example.com/sitemap.xml';
    const parsed = parseRobots(txt);
    assert.equal(parsed.sitemaps.length, 1);
    assert.equal(parsed.sitemaps[0], 'https://example.com/sitemap.xml');
});

test('parseRobots: comments are stripped', () => {
    const txt = '# Welcome to robots.txt\nUser-agent: *\nDisallow: /private # keep-out';
    const parsed = parseRobots(txt);
    assert.equal(isAllowed(parsed, '/private'), false);
    assert.equal(isAllowed(parsed, '/'), true);
});

test('fetchRobots: 404 fails open (allow all)', async () => {
    clearRobotsCache();
    const result = await fetchRobots('https://example.com', {
        fetchPage: async () => ({ statusCode: 404, text: '' }),
    });
    assert.equal(isAllowed(result, '/'), true);
});

test('fetchRobots: 5xx fails open by default', async () => {
    clearRobotsCache();
    const result = await fetchRobots('https://example.com', {
        fetchPage: async () => ({ statusCode: 503, text: '' }),
    });
    assert.equal(isAllowed(result, '/'), true);
});

test('fetchRobots: 5xx fails closed with failOnUnavailable', async () => {
    clearRobotsCache();
    const result = await fetchRobots('https://example.com', {
        fetchPage: async () => ({ statusCode: 503, text: '' }),
        failOnUnavailable: true,
    });
    assert.equal(isAllowed(result, '/'), false);
});

test('fetchRobots: caches per host', async () => {
    clearRobotsCache();
    let calls = 0;
    const fetchPage = async () => { calls++; return { statusCode: 200, text: 'User-agent: *\nDisallow:' }; };
    await fetchRobots('https://example.com', { fetchPage });
    await fetchRobots('https://example.com', { fetchPage });
    assert.equal(calls, 1); // second call was cached
});

// ---------------------------------------------------------------------------
// Link discovery
// ---------------------------------------------------------------------------

test('discoverLinks: same-host links only', () => {
    const html = `<a href="/about">About</a><a href="https://other.com">Other</a><a href="/blog/post">Post</a><a href="#top">Top</a>`;
    const links = discoverLinks(html, 'https://example.com', { sameHost: true });
    assert.equal(links.length, 2);
    assert(links.includes('https://example.com/about'));
    assert(links.includes('https://example.com/blog/post'));
});

test('discoverLinks: skips anchors, javascript, mailto, tel', () => {
    const html = `<a href="#section">Section</a><a href="javascript:void(0)">JS</a><a href="mailto:a@b.com">Mail</a><a href="tel:123">Tel</a><a href="/ok">OK</a>`;
    const links = discoverLinks(html, 'https://example.com');
    assert.equal(links.length, 1);
    assert.equal(links[0], 'https://example.com/ok');
});

test('discoverLinks: skips asset extensions', () => {
    const html = `<a href="/image.png">Img</a><a href="/style.css">CSS</a><a href="/app.js">JS</a><a href="/doc.pdf">PDF</a><a href="/page">Page</a>`;
    const links = discoverLinks(html, 'https://example.com');
    assert.deepEqual(links, ['https://example.com/page']);
});

test('discoverLinks: resolves relative URLs', () => {
    const html = `<a href="../parent">Parent</a>`;
    const links = discoverLinks(html, 'https://example.com/blog/post');
    assert.equal(links[0], 'https://example.com/parent');
});

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

test('adapterFor: matches known hosts', () => {
    assert.equal(adapterFor('https://www.ambitionbox.com/companies/x/reviews').id, 'ambitionbox');
    assert.equal(adapterFor('https://medium.com/something').id, 'medium');
    assert.equal(adapterFor('https://www.glassdoor.com/Interview/x.htm').id, 'glassdoor');
});

test('adapterFor: returns null for unknown hosts', () => {
    assert.equal(adapterFor('https://random-company.com/careers'), null);
});

test('ambitionbox adapter discover returns real URL', () => {
    const a = adapterFor('https://www.ambitionbox.com/');
    const result = a.discover({ company: 'Stripe' });
    assert(result.length > 0);
    assert(result[0].url.includes('ambitionbox.com'));
    assert(result[0].url.includes('stripe'));
});

test('medium adapter discover returns search URL', () => {
    const a = adapterFor('https://medium.com/');
    const result = a.discover({ company: 'Stripe', role: 'Engineer' });
    assert(result.length > 0);
    assert(result[0].url.includes('medium.com/search'));
});

test('glassdoor adapter discover returns interview URL', () => {
    const a = adapterFor('https://www.glassdoor.com/');
    const result = a.discover({ company: 'Stripe' });
    assert(result.length > 0);
});

// ---------------------------------------------------------------------------
// SSRF guard: safe-source still rejects private addresses
// ---------------------------------------------------------------------------

test('sourceURL: rejects all forms of unsafe input', () => {
    for (const url of ['http://example.com', 'file:///etc/passwd', 'https://127.0.0.1', 'https://user:secret@example.com', 'https://x.com/person/status/1']) {
        assert.throws(() => sourceURL(url));
    }
});

test('textFromHTML: strips scripts, styles, renders entities', () => {
    assert.equal(textFromHTML('<script>bad()</script><style>.h{}</style><p>Hello &amp; World</p>'), 'Hello & World');
});

// ---------------------------------------------------------------------------
// (integration stubs — runScrapePlan is tested via career-research integration)
// ---------------------------------------------------------------------------

test('crawlHost: empty seeds returns empty results', async () => {
    resetHostClocks();
    const results = await crawlHost([], { maxPages: 1 });
    assert.equal(results.length, 0);
});

test('scrape plan: noop when budget is zero', async () => {
    const result = await runScrapePlan([], { crawlBudget: 0 });
    assert.equal(result.documents.length, 0);
});