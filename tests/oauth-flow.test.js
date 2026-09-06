import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthFlow } from '../src/lib/oauthFlow.js';

function setup({ session = null, blocked = false, saveVerifier = true, exchangeError = null } = {}) {
    const values = new Map();
    const calls = { start: 0, exchange: 0 };
    const signedIn = { user: { id: 'candidate' } };
    const storage = {
        getItem: key => values.get(key) || null,
        setItem: (key, value) => { if (blocked) throw new Error('Blocked'); values.set(key, value); },
        removeItem: key => values.delete(key),
    };
    const auth = {
        getSession: async () => ({ data: { session }, error: null }),
        signInWithOAuth: async options => {
            calls.start++;
            calls.options = options;
            if (saveVerifier) storage.setItem('test-auth-code-verifier', 'test-verifier');
            return { data: { url: 'https://example.supabase.co/auth/v1/authorize' }, error: null };
        },
        exchangeCodeForSession: async () => {
            calls.exchange++;
            storage.removeItem('test-auth-code-verifier');
            return { data: { session: signedIn }, error: exchangeError };
        },
    };
    return { flow: createOAuthFlow({ auth, storage, storageKey: 'test-auth' }), calls, storage, signedIn };
}

test('new login saves the verifier before redirect and returns to its starting origin', async () => {
    const { flow, calls, storage } = setup();
    assert.ok((await flow.start('https://career-garden.techiesaie.com')).url);
    assert.equal(calls.options.options.redirectTo, 'https://career-garden.techiesaie.com/auth/callback');
    assert.equal(calls.options.options.skipBrowserRedirect, true);
    assert.ok(storage.getItem('test-auth-code-verifier'));
});
test('blocked or nonpersistent storage never redirects to Google', async () => {
    const blocked = setup({ blocked: true });
    await assert.rejects(blocked.flow.start('https://example.com'), /Allow site storage/);
    assert.equal(blocked.calls.start, 0);
    const silent = setup({ saveVerifier: false });
    await assert.rejects(silent.flow.start('https://example.com'), /could not be saved/);
});
test('concurrent login clicks start only one flow', async () => {
    const { flow, calls } = setup();
    await Promise.all([flow.start('https://example.com'), flow.start('https://example.com')]);
    assert.equal(calls.start, 1);
});
test('callback remounts exchange the one-use code only once', async () => {
    const { flow, calls, signedIn } = setup();
    await flow.start('https://example.com');
    assert.deepEqual(await Promise.all([flow.complete('?code=valid'), flow.complete('?code=valid')]), [signedIn, signedIn]);
    assert.equal(calls.exchange, 1);
});
test('missing verifier produces a restart instruction without attempting an exchange', async () => {
    const { flow, calls } = setup();
    await assert.rejects(flow.complete('?code=from-another-browser'), /different browser or website/);
    assert.equal(calls.exchange, 0);
});
test('existing sessions bypass both new login and a stale callback', async () => {
    const session = { user: { id: 'existing' } };
    const { flow, calls } = setup({ session });
    assert.deepEqual(await flow.start('https://example.com'), { session });
    assert.deepEqual(await flow.complete('?code=already-used'), session);
    assert.equal(calls.start + calls.exchange, 0);
});
test('expired verifier and cancellation recover without SDK diagnostics', async () => {
    const { flow } = setup({ exchangeError: { code: 'bad_code_verifier' } });
    await flow.start('https://example.com');
    await assert.rejects(flow.complete('?code=expired'), /already used/);
    await assert.rejects(flow.complete('?error=access_denied'), /cancelled/);
});
