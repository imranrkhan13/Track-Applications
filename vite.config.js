import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { makeHandler } from './netlify/functions/career-research.mjs';
import { makeCoachHandler } from './netlify/functions/career-coach.mjs';
import { makeBriefHandler } from './netlify/functions/career-brief.mjs';

export default defineConfig(({ mode }) => ({
    plugins: [react(), {
        // Replaces __PUBLIC_URL__ in index.html with the deploy origin so social
        // tags resolve. Falls back to the Netlify site URL, then to a relative
        // root, so a local build never emits a broken placeholder.
        name: 'career-public-url',
        transformIndexHtml(html, ctx) {
            const env = loadEnv(mode, '.', '');
            const origin = (env.VITE_PUBLIC_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');
            if (!origin) ctx.server && ctx.server.config.logger.warn('VITE_PUBLIC_URL is not set; social share tags will use a relative URL.');
            return html.replaceAll('__PUBLIC_URL__', origin);
        },
    }, {
        name: 'career-local-api',
        configureServer(server) {
            const env = loadEnv(mode, '.', '');
            for (const [path, handler] of [['/api/career-research', makeHandler({ env })], ['/api/career-coach', makeCoachHandler({ env })], ['/api/career-brief', makeBriefHandler({ env })]]) server.middlewares.use(path, async (req, res) => {
                let body = '';
                for await (const chunk of req) { body += chunk; if (body.length > 30000) { res.statusCode = 413; res.end(JSON.stringify({ error: 'Request too large.' })); return; } }
                try { const result = await handler({ httpMethod: req.method, headers: req.headers, body }); res.writeHead(result.statusCode, result.headers); res.end(result.body); }
                catch { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'Research failed. Your job is still saved.' })); }
            });
        },
    }],
}));
