import { authStorageKey, supabase } from "./supabase";
import { createOAuthFlow } from "./oauthFlow";

export const browserOAuth = supabase ? createOAuthFlow({
    auth: supabase.auth,
    storageKey: authStorageKey,
    storage: {
        getItem: key => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
        removeItem: key => window.localStorage.removeItem(key),
    },
}) : null;
