// Brief synthesis: combines reviewed evidence claims + JD into a grounded
// company brief.  Every brief line cites a claim id; unsupported statements
// are rejected.  Abstains to a JD-based brief when evidence is thin.

import { SYNTHESIZE_SYSTEM, synthesizeUser } from './prompts/extract.v1.js';

const MAX_BRIEFS = 12;
const MAX_UNKNOWNS = 8;

// Validate the synthesized brief against the claims it cites.
// - every brief must cite an existing claimId
// - statement must be non-empty and bounded
// - unknowns must be strings
// - basis must be 'evidence' or 'jd'
// Returns normalized {briefs, unknowns, basis, summary} or null.
export function validateBrief(value, claims) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.briefs)) return null;
    const claimIds = new Set(claims.map(c => c.id));

    const briefs = value.briefs.slice(0, MAX_BRIEFS).flatMap(b => {
        if (!b || typeof b !== 'object') return [];
        if (!claimIds.has(b.claimId)) return [];
        if (typeof b.statement !== 'string' || !b.statement.trim() || b.statement.length > 600) return [];
        return [{ claimId: b.claimId, statement: b.statement.trim() }];
    });

    if (!briefs.length) return null;

    const unknowns = (Array.isArray(value.unknowns) ? value.unknowns : [])
        .filter(u => typeof u === 'string' && u.trim() && u.length <= 300)
        .slice(0, MAX_UNKNOWNS);

    const basis = value.basis === 'evidence' && claims.length ? 'evidence' : 'jd';

    return {
        briefs,
        unknowns,
        basis,
        summary: typeof value.summary === 'string' ? value.summary.slice(0, 800) : '',
        method: 'ai-synthesized-unverified',
        generatedAt: new Date().toISOString(),
    };
}

// Main synthesis: reviewed claims + JD → grounded brief.
// Abstains (returns JD-basis brief) when there are no reviewed claims.
export async function synthesizeBrief({ provider, target, claims, jd }) {
    if (!claims.length) {
        // Honest abstention: no reviewed evidence, so no evidence-based brief.
        return {
            briefs: [],
            unknowns: ['No reviewed interview accounts yet. Confirm the process with your recruiter.'],
            basis: 'jd',
            summary: jd ? 'JD-based brief. No reviewed company evidence available yet.' : 'No JD and no reviewed evidence yet.',
            method: 'abstained',
            generatedAt: new Date().toISOString(),
        };
    }

    const value = await provider({
        system: SYNTHESIZE_SYSTEM,
        user: synthesizeUser({ target, claims, jd }),
        shape: { briefs: 'array' },
        maxTokens: 1600,
    });

    const brief = validateBrief(value, claims);
    if (!brief) throw new Error('Synthesis failed validation: no brief line cited a known claim.');

    // If every cited claim was rejected, fall back to JD basis.
    return brief;
}