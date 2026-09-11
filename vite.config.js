import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { makeHandler } from './netlify/functions/career-research.mjs';
import { makeCoachHandler } from './netlify/functions/career-coach.mjs';

export default defineConfig(({ mode }) => ({
    plugins: [react(), {
        name: 'career-local-api',
        configureServer(server) {
            const env = loadEnv(mode, '.', '');
            for (const [path, handler] of [['/api/career-research', makeHandler({ env })], ['/api/career-coach', makeCoachHandler({ env })]]) server.middlewares.use(path, async (req, res) => {
                let body = '';
                for await (const chunk of req) { body += chunk; if (body.length > 30000) { res.statusCode = 413; res.end(JSON.stringify({ error: 'Request too large.' })); return; } }
                try { const result = await handler({ httpMethod: req.method, headers: req.headers, body }); res.writeHead(result.statusCode, result.headers); res.end(result.body); }
                catch { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'Research failed. Your job is still saved.' })); }
            });
        },
    }],
}));
