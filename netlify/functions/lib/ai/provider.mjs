// AI provider abstraction.
// One interface over several providers. Providers are tried in order so a
// rate-limited free tier falls through to the next instead of failing the
// feature. All source text passed through here is untrusted data: prompts frame
// it as such, and responses are schema-validated before use.

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

// Some models wrap JSON in markdown fences despite a JSON response mode.
function parseModelJSON(raw) {
    const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned || '{}');
}

// --- Gemini ---
async function geminiCall({ env, request, system, user, maxTokens, timeoutMs }) {
    const response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
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
    return parseModelJSON(data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '');
}

// --- OpenAI-compatible chat completions (Groq, OpenRouter) ---
async function chatCall({ name, url, apiKey, model, request, system, user, maxTokens, timeoutMs }) {
    const response = await request(url, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            temperature: 0,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
    });
    if (!response.ok) throw new Error(`${name} unavailable.`);
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error('AI response too large.');
    const data = JSON.parse(text);
    return parseModelJSON(data.choices?.[0]?.message?.content);
}

// --- Cohere v2 chat ---
async function cohereCall({ env, request, system, user, maxTokens, timeoutMs }) {
    const response = await request('https://api.cohere.com/v2/chat', {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.COHERE_API_KEY}` },
        body: JSON.stringify({
            model: env.COHERE_MODEL || 'command-a-03-2025',
            temperature: 0,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
    });
    if (!response.ok) throw new Error('cohere unavailable.');
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error('AI response too large.');
    const data = JSON.parse(text);
    return parseModelJSON(data.message?.content?.find?.(b => b.type === 'text')?.text || data.message?.content?.[0]?.text);
}

// True when at least one provider has credentials. Handlers gate on this
// instead of a specific provider so a configured fallback still works.
export function hasAIProvider(env = process.env) {
    return Boolean(
        (env.GEMINI_API_KEY && env.GEMINI_MODEL)
        || env.GROQ_API_KEY
        || env.COHERE_API_KEY
        || env.OPENROUTER_API_KEY
    );
}

function buildProviders(env, request) {
    const providers = [];
    if (env.GEMINI_API_KEY && env.GEMINI_MODEL) providers.push({ name: 'gemini', call: args => geminiCall({ env, request, ...args }) });
    if (env.GROQ_API_KEY) providers.push({ name: 'groq', call: args => chatCall({ name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL || 'openai/gpt-oss-20b', request, ...args }) });
    if (env.COHERE_API_KEY) providers.push({ name: 'cohere', call: args => cohereCall({ env, request, ...args }) });
    if (env.OPENROUTER_API_KEY) providers.push({ name: 'openrouter', call: args => chatCall({ name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free', request, ...args }) });
    return providers;
}

// Public entry point.
// generateJSON({ system, user, shape, maxTokens, timeoutMs, retries })
// Returns the parsed, shape-validated JSON object, or throws.
// `provider` forces a single provider by name; the default 'auto' tries all
// configured providers in order.
export function makeProvider({ env = process.env, request = fetch, provider = 'auto' } = {}) {
    return async function generateJSON({
        system,
        user,
        shape,               // e.g. { accounts: 'array' } — required top-level keys
        maxTokens = DEFAULT_MAX_TOKENS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        retries = 1,
    }) {
        if (!system || !user) throw new Error('Prompt is missing system or user text.');
        const all = buildProviders(env, request);
        const providers = provider === 'auto' ? all : all.filter(p => p.name === provider);
        if (!providers.length) throw new Error('AI provider is not configured.');

        let lastError;
        for (const candidate of providers) {
            try {
                const value = await withRetry(
                    () => candidate.call({ system, user, maxTokens, timeoutMs }),
                    { retries }
                );
                if (shape && !validateShape(value, shape)) throw new Error('AI response failed validation.');
                return value;
            } catch (error) {
                lastError = error; // try the next provider
            }
        }
        throw lastError;
    };
}
