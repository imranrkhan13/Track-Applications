import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

let pendingCode = "";
let pendingExchange = null;

function exchangeCodeOnce(code) {
    if (pendingCode !== code || !pendingExchange) {
        pendingCode = code;
        pendingExchange = supabase.auth.exchangeCodeForSession(code);
    }
    return pendingExchange;
}

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        async function handleAuth() {
            if (!isSupabaseConfigured || !supabase) {
                navigate("/login", { replace: true });
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            const providerError = params.get("error_description") || params.get("error");

            if (providerError) {
                navigate(`/login?auth_error=${encodeURIComponent(providerError)}`, { replace: true });
                return;
            }

            if (!code) {
                const { data } = await supabase.auth.getSession();
                navigate(data.session ? "/dashboard" : "/login?auth_error=Google%20did%20not%20return%20a%20sign-in%20code", { replace: true });
                return;
            }

            const { data, error } = await exchangeCodeOnce(code);

            if (error) {
                console.error(error);
                navigate(`/login?auth_error=${encodeURIComponent(`${error.message}. Please start Google sign-in again.`)}`, { replace: true });
                return;
            }

            if (!active) return;
            if (data.session?.user) {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/login?auth_error=No%20session%20was%20returned", { replace: true });
            }
        }

        handleAuth();
        return () => { active = false; };
    }, [navigate]);

    return (
        <div className="loading-full">
            <div className="loading-ring" />
            <div className="loading-label">Signing you in…</div>
        </div>
    );
}
