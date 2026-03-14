import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        async function handleAuth() {

            // Wait for Supabase to read the URL token
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error(error);
                navigate("/login");
                return;
            }

            if (data.session) {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/login");
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