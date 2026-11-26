// Full-application smoke test.
//
// Serves the production build the same way Netlify does — static files from
// `dist/` with an index.html fallback, and `/api/*` routed to the real
// function handlers (mirroring netlify.toml) — then checks that the app boots,
// its assets resolve, deep links work and the API is wired.
//
// Local:   node scripts/smoke.mjs            (builds dist if missing)
// Live:    SMOKE_BASE_URL=https://x.netlify.app node scripts/smoke.mjs
//
// Exits non-zero if any check fails, so CI can block (and revert) a bad deploy.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { makeHandler } from '../netlify/functions/career-research.mjs';
import { makeCoachHandler } from '../netlify/functions/career-coach.mjs';
import { makeBriefHandler } from '../netlify/functions/career-brief.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
};
const contentType = file => CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';

// --- API handlers, routed exactly like netlify.toml ------------------------
const apiHandlers = {
    '/api/career-research': makeHandler({ env: {} }),
    '/api/career-coach': makeCoachHandler({ env: {} }),
    '/api/career-brief': makeBriefHandler({ env: {} }),
};

async function readBody(req) {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 1_000_000) break; }
    return body;
}

function createAppServer() {
    return createServer(async (req, res) => {
        let pathname;
        try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
        catch { res.writeHead(400); res.end('Bad request'); return; }

        const handler = apiHandlers[pathname];
        if (handler) {
            try {
                const body = await readBody(req);
                const result = await handler({ httpMethod: req.method, headers: req.headers, body });
                res.writeHead(result.statusCode, { 'content-type': 'application/json' });
                res.end(result.body);
            } catch (error) {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
            return;
        }

        // Static file, else SPA fallback to index.html (like the "/*" redirect).
        const relative = pathname.replace(/^\/+/, '');
        const candidate = path.join(distDir, relative || 'index.html');
        if (candidate.startsWith(distDir)) {
            try {
                const info = await stat(candidate);
                if (info.isFile()) {
                    res.writeHead(200, { 'content-type': contentType(candidate) });
                    res.end(await readFile(candidate));
                    return;
                }
            } catch { /* fall through to SPA fallback */ }
        }
        try {
            const html = await readFile(path.join(distDir, 'index.html'));
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end('Not found');
        }
    });
}

// --- Checks ----------------------------------------------------------------
const results = [];
async function check(name, fn) {
    try { await fn(); results.push({ name, ok: true }); }
    catch (error) { results.push({ name, ok: false, error: error.message }); }
}

function assert(condition, message) { if (!condition) throw new Error(message); }

async function get(base, pathname) {
    return fetch(new URL(pathname, base), { redirect: 'follow', signal: AbortSignal.timeout(20000) });
}

function assetRefs(html) {
    const refs = new Set();
    for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/gi)) refs.add(match[1]);
    for (const match of html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/gi)) refs.add(match[1]);
    return [...refs].filter(ref => ref.startsWith('/'));
}

async function runChecks(base) {
    let indexHtml = '';
    await check('home page loads and returns HTML', async () => {
        const response = await get(base, '/');
        assert(response.status === 200, `expected 200, got ${response.status}`);
        assert(/text\/html/.test(response.headers.get('content-type') || ''), 'content-type is not HTML');
        indexHtml = await response.text();
        assert(indexHtml.includes('<div id="root"'), 'missing React root element');
        assert(/Career Garden/i.test(indexHtml), 'missing app title');
    });

    await check('referenced JS/CSS assets resolve', async () => {
        assert(indexHtml, 'index.html was not captured');
        const refs = assetRefs(indexHtml);
        assert(refs.length > 0, 'no built assets referenced from index.html');
        for (const ref of refs) {
            const response = await get(base, ref);
            assert(response.status === 200, `${ref} returned ${response.status}`);
        }
    });

    await check('deep link falls back to the app shell', async () => {
        const response = await get(base, '/workspace/applications');
        assert(response.status === 200, `expected 200, got ${response.status}`);
        assert((await response.text()).includes('<div id="root"'), 'deep link did not return the app shell');
    });

    await check('research API is wired and guards auth', async () => {
        const response = await fetch(new URL('/api/career-research', base), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ company: 'Acme', role: 'Engineer' }),
            signal: AbortSignal.timeout(20000),
        });
        assert(response.status !== 404, 'API route is not deployed (404)');
        assert(response.status !== 500, 'API handler crashed (500)');
        assert(response.status === 401, `expected 401 without a token, got ${response.status}`);
        const body = await response.json();
        assert(typeof body.error === 'string' && body.error.length > 0, 'missing error message');
    });

    await check('research API rejects non-POST methods', async () => {
        const response = await get(base, '/api/career-research');
        assert(response.status === 405, `expected 405, got ${response.status}`);
    });
}

// --- Main ------------------------------------------------------------------
async function ensureBuild() {
    try { await stat(path.join(distDir, 'index.html')); return; }
    catch { /* build below */ }
    console.log('dist/ not found — running the production build…');
    const build = spawnSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit' });
    if (build.status !== 0) throw new Error('Production build failed.');
}

async function main() {
    const live = (process.env.SMOKE_BASE_URL || '').trim().replace(/\/+$/, '');
    let server;
    let base = live;
    if (!base) {
        await ensureBuild();
        server = createAppServer();
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
        console.log(`Smoke-testing the local build at ${base}`);
    } else {
        console.log(`Smoke-testing the live deployment at ${base}`);
    }

    try { await runChecks(base); }
    finally { if (server) server.close(); }

    const failed = results.filter(r => !r.ok);
    console.log('');
    for (const r of results) console.log(`${r.ok ? '  ✓' : '  ✗'} ${r.name}${r.ok ? '' : ` — ${r.error}`}`);
    console.log(`\n${results.length - failed.length}/${results.length} smoke checks passed.`);
    if (failed.length) {
        console.error('\nSMOKE TEST FAILED — the application is not healthy.');
        process.exit(1);
    }
}

main().catch(error => { console.error(`Smoke test could not run: ${error.message}`); process.exit(1); });
