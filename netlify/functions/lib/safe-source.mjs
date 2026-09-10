import https from 'node:https';
import { resolve4 } from 'node:dns/promises';
import { isIP } from 'node:net';

export function isPublicIPv4(address) {
    if (isIP(address) !== 4) return false;
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}
export function sourceURL(raw) {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || isIP(url.hostname) || !url.hostname.includes('.') || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal')) throw new Error('Use a public HTTPS page, not an IP address or private network.');
    if (/(^|\.)(x\.com|twitter\.com|t\.co)$/.test(url.hostname)) throw new Error('X posts require a permitted API. Paste your own short notes instead.');
    url.hash = '';
    return url;
}
export function documentURL(raw) {
    const url = sourceURL(raw);
    const match = url.pathname.match(/^\/document\/d\/([\w-]+)/);
    if (url.hostname === 'docs.google.com' && match) return `https://docs.google.com/document/d/${match[1]}/export?format=txt`;
    return url.href;
}
// DNS is validated and pinned to the socket, preventing redirect and DNS-rebinding SSRF.
export async function readPublicPage(raw, { allowedHosts, maxBytes = 180000, timeoutMs = 6500, resolve = resolve4 } = {}) {
    const deadline = Date.now() + timeoutMs;
    let current = documentURL(raw);
    const initialHost = sourceURL(current).hostname;
    for (let hop = 0; hop < 4; hop++) {
        const url = sourceURL(current);
        if (!(allowedHosts || [initialHost]).includes(url.hostname)) throw new Error('Redirected to a different host. Open the final public link or paste the JD.');
        let dnsTimer;
        const addresses = await Promise.race([resolve(url.hostname), new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error('Source timed out.')), Math.max(1, deadline - Date.now())); })]).finally(() => clearTimeout(dnsTimer));
        if (!addresses.length || addresses.some(address => !isPublicIPv4(address))) throw new Error('Source resolves to a restricted network.');
        const result = await new Promise((resolveResponse, reject) => {
            const req = https.request(url, { method: 'GET', headers: { 'user-agent': 'CareerGardenResearch/2.0', accept: 'text/html,text/plain', 'accept-encoding': 'identity' }, lookup: (_hostname, options, callback) => options?.all ? callback(null, [{ address: addresses[0], family: 4 }]) : callback(null, addresses[0], 4) }, res => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) { res.resume(); resolveResponse({ redirect: res.headers.location }); return; }
                if (res.statusCode !== 200) { res.resume(); reject(new Error(`Source returned HTTP ${res.statusCode}. Paste the JD if access is restricted.`)); return; }
                if (!/^(text\/(html|plain)|application\/xhtml\+xml)/i.test(res.headers['content-type'] || '')) { res.resume(); reject(new Error('This source is not readable HTML or text. Paste text from your PDF, Drive file or private document.')); return; }
                let size = 0;
                const chunks = [];
                res.on('data', chunk => { size += chunk.length; if (size > maxBytes) req.destroy(new Error('Source exceeds the safe reading limit. Paste the relevant section.')); else chunks.push(chunk); });
                res.on('error', reject);
                res.on('end', () => resolveResponse({ text: Buffer.concat(chunks).toString('utf8'), url: url.href }));
            });
            const timer = setTimeout(() => req.destroy(new Error('Source timed out.')), Math.max(1, deadline - Date.now()));
            req.on('close', () => clearTimeout(timer));
            req.on('error', reject);
            req.end();
        });
        if (!result.redirect) return result;
        current = new URL(result.redirect, url).href;
    }
    throw new Error('Too many source redirects. Paste the relevant text.');
}
export function textFromHTML(html) {
    return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
