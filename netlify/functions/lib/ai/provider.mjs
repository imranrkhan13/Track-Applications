// AI provider abstraction.
// One interface over Gemini today; a second provider can be added without
// touching callers.  All source text passed through here is untrusted data:
// prompts frame it as such, and responses are schema-validated before use.

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_MAX_TOKENS = 1800;
const MAX_RESPONSE_BYTES = 1_000_000;

// Bounded retry with exponential backoff for transient provider failures.
async function withRetry(fn, { retries = 1, baseDelayMs = 500 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
            }
        }
    }
    throw lastError;
}

// Minimal JSON shape check: every required top-level key must exist with the
// expected type.  Deep validation stays with each caller (domain-specific).
export function validateShape(value, shape) {
    if (!value || typeof value !== 'object') return false;
    for (const [key, type] of Object.entries(shape)) {
        if (!(key in value)) return false;
        const actual = Array.isArray(value[key]) ? 'array' : typeof value[key];
        if (actual !== type) return false;
    }
    return true;
}

// Gemini implementation of generateJSON.
async function geminiGenerateJSON({ env, system, user, maxTokens, timeoutMs, request }) {
    const model = env.GEMINI_MODEL;
    const apiKey = env.GEMINI_API_KEY;
    if (!model || !apiKey) throw new Error('AI provider is not configured.');

    const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: maxTokens },
        }),
    });

    if (!response.ok) throw new Error('AI provider unavailable.');
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error('AI response too large.');
    const data = JSON.parse(text);
    const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    return JSON.parse(raw || '{}');
}

// Public entry point.
// generateJSON({ system, user, shape, maxTokens, timeoutMs, retries })
// Returns the parsed, shape-validated JSON object, or throws.
export function makeProvider({ env = process.env, request = fetch, provider = 'gemini' } = {}) {
    if (provider !== 'gemini') throw new Error(`Unknown AI provider: ${provider}`);

    return async function generateJSON({
        system,
        user,
        shape,               // e.g. { accounts: 'array' } — required top-level keys
        maxTokens = DEFAULT_MAX_TOKENS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        retries = 1,
    }) {
        if (!system || !user) throw new Error('Prompt is missing system or user text.');
        const value = await withRetry(
            () => geminiGenerateJSON({ env, system, user, maxTokens, timeoutMs, request }),
            { retries }
        );
        if (shape && !validateShape(value, shape)) {
            throw new Error('AI response failed validation.');
        }
        return value;
    };
}