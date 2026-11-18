// Atomic claim extraction: turns crawled source documents into attributed,
// quote-anchored evidence claims.  Every claim must rest on an exact source
// substring; anything else is rejected.

import { EXTRACT_SYSTEM, extractUser } from './prompts/extract.v1.js';

const MAX_ACCOUNTS = 4;
const MAX_STAGES = 5;
const MAX_QUOTED_WORDS_PER_SOURCE = 25;

// Validate one extracted account against its source document.
// Mirrors the guarantees of the old validateExtraction, tightened:
// - quote must be an exact (case-insensitive) substring of the document
// - per-source quote budget is enforced
// - stage labels are required and bounded
// Returns a normalized account or null.
function normalizeAccount(account, document, accountIndex, wordsBySource) {
    if (!document || document.kind === 'jd') return null;
    let words = wordsBySource.get(document.id) || 0;

    const stages = (Array.isArray(account.stages) ? account.stages : []).slice(0, MAX_STAGES).flatMap((stage, i) => {
        const quote = typeof stage.quote === 'string' ? stage.quote.trim() : '';
        const count = quote.split(/\s+/).filter(Boolean).length;
        if (!quote) return [];
        if (!document.text.toLowerCase().includes(quote.toLowerCase())) return [];
        if (count + words > MAX_QUOTED_WORDS_PER_SOURCE) return [];
        if (typeof stage.label !== 'string' || !stage.label.trim()) return [];
        words += count;
        return [{ key: `stage-${i}`, label: stage.label.trim().slice(0, 100), evidenceSpan: quote, aiPolicy: 'unknown' }];
    });

    wordsBySource.set(document.id, words);
    if (!stages.length) return null;

    return {
        id: `account-${document.id}-${accountIndex}`,
        title: document.title,
        sourceUrl: document.url,
        sourceType: 'unreviewed',
        stages,
        confirmed: false,
        reviewNote: 'Machine-extracted passages. Verify company, role, dates and whether the stages are part of the same account.',
    };
}

// Main extraction: provider → raw accounts → validated accounts.
export async function extractAccounts({ provider, target, documents }) {
    const accountDocuments = documents.filter(d => d.kind === 'account');
    if (!accountDocuments.length) return { accounts: [] };

    const value = await provider({
        system: EXTRACT_SYSTEM,
        user: extractUser({ target, documents: accountDocuments }),
        shape: { accounts: 'array' },
        maxTokens: 1800,
    });

    const wordsBySource = new Map();
    const accounts = value.accounts.slice(0, MAX_ACCOUNTS).flatMap((account, accountIndex) => {
        const document = accountDocuments.find(d => d.id === account.sourceId);
        const normalized = normalizeAccount(account, document, accountIndex, wordsBySource);
        return normalized ? [normalized] : [];
    });

    return { accounts };
}

// Back-compat: the old validateExtraction contract used by existing tests.
export function validateExtraction(value, documents) {
    if (!validateShapeLocal(value)) return [];
    const wordsBySource = new Map();
    return value.accounts.slice(0, MAX_ACCOUNTS).flatMap((account, accountIndex) => {
        const document = documents.find(d => d.id === account.sourceId);
        const normalized = normalizeAccount(account, document, accountIndex, wordsBySource);
        return normalized ? [normalized] : [];
    });
}

function validateShapeLocal(value) {
    return value && typeof value === 'object' && Array.isArray(value.accounts);
}