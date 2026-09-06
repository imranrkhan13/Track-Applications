import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { browserOAuth } from "./lib/browserOAuth";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        if (!browserOAuth) {
            navigate("/login", { replace: true });
            return undefined;
        }
        browserOAuth.complete(window.location.search).then(() => {
            if (!active) return;
            try { window.sessionStorage.removeItem("career-garden-demo-session"); } catch { /* Demo mode may be unavailable. */ }
            navigate("/dashboard", { replace: true });
        }).catch(error => {
            if (active) navigate(`/login?auth_error=${encodeURIComponent(error.message || "Sign-in could not finish. Please try again.")}`, { replace: true });
        });
        return () => { active = false; };
    }, [navigate]);

    return (
        <div className="loading-full">
            <div className="loading-ring" />
            <div className="loading-label">Signing you in…</div>
        </div>
    );
}
