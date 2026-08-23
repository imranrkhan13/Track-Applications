import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        async function handleAuth() {
            if (!isSupabaseConfigured || !supabase) {
                navigate("/login", { replace: true });
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            const { error: exchangeError } = code ? await supabase.auth.exchangeCodeForSession(code) : { error: null };
            if (exchangeError) {
                navigate(`/login?auth_error=${encodeURIComponent(exchangeError.message)}`, { replace: true });
                return;
            }

            // Supabase reads implicit-flow tokens from the URL, while PKCE
            // needs the exchange above. Reading the session after either path
            // gives the app one deterministic hand-off into the workspace.
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error(error);
                navigate("/login", { replace: true });
                return;
            }

            if (data.session) {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/login?auth_error=No%20session%20was%20returned", { replace: true });
            }
        }

        handleAuth();
    }, [navigate]);

    return (
        <div className="loading-full">
            <div className="loading-ring" />
            <div className="loading-label">Signing you in…</div>
        </div>
    );
}
