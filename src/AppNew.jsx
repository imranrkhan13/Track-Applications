import React, { useEffect, useState } from "react";
import { ArrowRight, Leaf, LockKeyhole, Sprout } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Workspace from "./Workspace";
import AuthCallback from "./AuthCallback";
import { browserOAuth } from "./lib/browserOAuth";
import { DEMO_USER, isSupabaseConfigured, supabase } from "./lib/supabase";
import LandingPage from "./components/landing/LandingPage";

function isDemoSession() { try { return window.sessionStorage.getItem("career-garden-demo-session") === "true"; } catch { return false; } }
function startDemoSession() { try { window.sessionStorage.setItem("career-garden-demo-session", "true"); return true; } catch { return false; } }
function clearDemoSession() { try { window.sessionStorage.removeItem("career-garden-demo-session"); return true; } catch { return false; } }

function Brand({ light = false }) {
    return <div className={`brand-lockup ${light ? "light" : ""}`}><span className="brand-symbol"><Sprout size={17} /></span><span><strong>Career Garden</strong><small>your search, with roots</small></span></div>;
}

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(() => new URLSearchParams(window.location.search).get("auth_error") || "");
    const signIn = async () => {
        if (loading) return;
        setError("");
        if (!isSupabaseConfigured) {
            setError("Google sign-in is not connected in this environment yet. Use the demo garden below, or configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production auth.");
            return;
        }
        setLoading(true);
        try {
            const result = await browserOAuth.start(window.location.origin);
            clearDemoSession();
            if (result.session) navigate("/dashboard", { replace: true });
            else window.location.assign(result.url);
        } catch (authError) {
            setError(authError?.message || "Google sign-in could not be started. Please try again or use the demo garden.");
        } finally { setLoading(false); }
    };
    return <div className="new-auth"><div className="auth-story"><button type="button" className="auth-back" onClick={() => navigate("/")}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />Back to the garden</button><div className="auth-story-copy"><span className="section-kicker light-kicker">Your next move starts here</span><h1>Keep the good<br /><em>work growing.</em></h1><p>Every role has a story. Career Garden helps you keep hold of it from first click to final conversation.</p></div><div className="auth-story-footer"><span><LockKeyhole size={13} />Your demo stays in this browser.</span><span><Leaf size={13} />Your progress gets easier to see.</span></div></div><div className="auth-panel"><div className="auth-panel-inner"><Brand /><div className="auth-heading"><span className="auth-overline">Welcome back</span><h2>Come tend to<br />your garden.</h2><p>Choose how you want to continue.</p></div>{error && <div className="auth-error" role="alert">{error}</div>}<button type="button" className="google-login" onClick={signIn} disabled={loading}><span className="google-mark">G</span><span>{loading ? "Opening secure sign-in…" : "Continue with Google"}</span><ArrowRight size={15} /></button>{loading && <p className="auth-loading-note">Google is opening in a new step. Keep this window open while we return you to the garden.</p>}<div className="auth-separator"><span>or</span></div><button type="button" className="demo-login" onClick={() => { startDemoSession(); navigate("/dashboard"); }}><Sprout size={16} /><span>Open the demo garden</span><ArrowRight size={15} /></button><p className="auth-footnote">Demo mode is ready now. Production Google login requires a configured Supabase project.</p><div className={`auth-status ${isSupabaseConfigured ? "ready" : "demo"}`}><i />{isSupabaseConfigured ? "Google auth is configured" : "Demo mode is active"}</div></div></div></div>;
}

function Authenticated() {
    const navigate = useNavigate();
    const demoSession = isDemoSession();
    const [user, setUser] = useState(demoSession || !isSupabaseConfigured ? DEMO_USER : null);
    const [authChecked, setAuthChecked] = useState(demoSession || !isSupabaseConfigured);
    useEffect(() => {
        if (demoSession) return undefined;
        if (!supabase) return undefined;
        let active = true;
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;
            if (session?.user) {
                setUser(session.user);
                setAuthChecked(true);
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setAuthChecked(true);
                navigate("/login", { replace: true });
            }
        });
        const restoreSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (!active) return;
            if (data.session?.user) setUser(data.session.user);
            else navigate("/login", { replace: true });
            setAuthChecked(true);
        };
        restoreSession().catch(() => {
            if (!active) return;
            setAuthChecked(true);
            navigate("/login?auth_error=Google%20session%20could%20not%20be%20restored", { replace: true });
        });
        return () => { active = false; listener.subscription.unsubscribe(); };
    }, [demoSession, navigate]);
    const signOut = async () => { clearDemoSession(); if (supabase && !demoSession) await supabase.auth.signOut(); setUser(isSupabaseConfigured ? null : DEMO_USER); navigate("/"); };
    if (!authChecked || (isSupabaseConfigured && !user)) return <div className="loading-state"><div className="spinner" /><b>Checking your garden</b><span>Restoring your Supabase session…</span></div>;
    return <Workspace user={user} onSignOut={signOut} />;
}

function hasAuthResponse(search) {
    const params = new URLSearchParams(search);
    return params.has("code") || params.has("error") || params.has("error_description");
}

function LandingRoute() {
    const navigate = useNavigate();
    const location = useLocation();
    if (hasAuthResponse(location.search)) return <Navigate to={`/auth/callback${location.search}`} replace />;
    return <LandingPage onStart={() => navigate("/login")} onSignIn={() => navigate("/login")} />;
}

function AuthenticatedRoute() {
    const location = useLocation();
    if (hasAuthResponse(location.search)) return <Navigate to={`/auth/callback${location.search}`} replace />;
    return <Authenticated />;
}

export default function AppNew() { return <BrowserRouter><Routes><Route path="/" element={<LandingRoute />} /><Route path="/login" element={<Login />} /><Route path="/auth/callback" element={<AuthCallback />} /><Route path="/dashboard/*" element={<AuthenticatedRoute />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>; }
