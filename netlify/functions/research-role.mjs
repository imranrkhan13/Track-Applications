// Retire the unauthenticated legacy crawler. New research requires authentication,
// a persistent request budget, bounded fetches and source review.
export async function handler() {
    return { statusCode: 410, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Use the authenticated Career Garden research workspace.' }) };
}
