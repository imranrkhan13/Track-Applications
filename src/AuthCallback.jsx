import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./App";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuth = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error(error);
                navigate("/login");
                return;
            }

            if (data.session) {
                navigate("/dashboard"); // redirect after login
            } else {
                navigate("/login");
            }
        };

        handleAuth();
    }, [navigate]);

    return <div>Signing you in...</div>;
}