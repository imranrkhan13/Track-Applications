// Callback ownership lives outside React so Strict Mode cannot consume a code twice.
export function createOAuthFlow({ auth, storage, storageKey }) {
    let starting = null;
    let callback = null;
    let callbackSearch = null;
    const verifierKey = `${storageKey}-code-verifier`;

    function checkStorage() {
        const key = `${storageKey}-storage-check`;
        try {
            storage.setItem(key, "ok");
            if (storage.getItem(key) !== "ok") throw new Error("Storage unavailable");
        } catch {
            throw new Error("Your browser could not save the sign-in request. Allow site storage, then try again in this browser.");
        } finally {
            try { storage.removeItem(key); } catch { /* Storage may be blocked. */ }
        }
    }

    async function start(origin) {
        // Session restoration must finish before generating the next verifier.
        const existing = await auth.getSession();
        if (existing.error) throw existing.error;
        if (existing.data.session?.user) return { session: existing.data.session };
        checkStorage();
        const result = await auth.signInWithOAuth({ provider: "google", options: {
            redirectTo: `${origin}/auth/callback`, skipBrowserRedirect: true,
        } });
        if (result.error) throw result.error;
        if (!storage.getItem(verifierKey)) throw new Error("The sign-in request could not be saved. Allow site storage and try again.");
        if (!result.data.url) throw new Error("Google sign-in could not be opened. Please try again.");
        return { url: result.data.url };
    }

    async function complete(search) {
        const params = new URLSearchParams(search);
        if (params.has("error") || params.has("error_description")) {
            throw new Error(params.get("error") === "access_denied"
                ? "Google sign-in was cancelled. You can try again when you’re ready."
                : "Google could not complete sign-in. Please start again from this browser.");
        }
        const existing = await auth.getSession();
        if (existing.error) throw existing.error;
        if (existing.data.session?.user) return existing.data.session;
        const code = params.get("code");
        if (!code) throw new Error("No sign-in response was received. Continue with Google to start again.");
        let verifier;
        try { verifier = storage.getItem(verifierKey); } catch { checkStorage(); }
        if (!verifier) throw new Error("This sign-in started in a different browser or website, or has expired. Open Career Garden in the browser you want to use and select Continue with Google again. Don’t reuse an old sign-in link.");
        const result = await auth.exchangeCodeForSession(code);
        if (result.error) {
            if (/verifier|flow_state|expired|invalid grant/i.test(`${result.error.code || ""} ${result.error.message}`)) {
                throw new Error("This sign-in link has expired or was already used. Continue with Google again in this browser.");
            }
            throw new Error("We couldn’t finish signing you in. Check your connection and try again.");
        }
        if (!result.data.session?.user) throw new Error("Google did not return a session. Please try signing in again.");
        return result.data.session;
    }

    return {
        start(origin) {
            if (!starting) starting = start(origin).finally(() => { starting = null; });
            return starting;
        },
        complete(search) {
            if (!callback || callbackSearch !== search) {
                callbackSearch = search;
                callback = complete(search);
            }
            return callback;
        },
    };
}
