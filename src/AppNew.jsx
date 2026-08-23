import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Check, Leaf, LockKeyhole, Mic, MoveUpRight, Sprout } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Workspace from "./Workspace";
import AuthCallback from "./AuthCallback";
import { DEMO_USER, isSupabaseConfigured, supabase } from "./lib/supabase";
import { PLANT_STAGES } from "./lib/plantStages";
import StageIcon from "./StageIcon";
import heroDesk from "./assets/hero-desk.png";

function isDemoSession() { try { return window.sessionStorage.getItem("career-garden-demo-session") === "true"; } catch { return false; } }
function startDemoSession() { try { window.sessionStorage.setItem("career-garden-demo-session", "true"); return true; } catch { return false; } }
function clearDemoSession() { try { window.sessionStorage.removeItem("career-garden-demo-session"); return true; } catch { return false; } }

function Brand({ light = false }) {
    return <div className={`brand-lockup ${light ? "light" : ""}`}><span className="brand-symbol"><Sprout size={17} /></span><span><strong>Career Garden</strong><small>your search, with roots</small></span></div>;
}

function PlantGrowthScene({ stage }) {
    const stageIndex = Math.max(0, PLANT_STAGES.findIndex(item => item.id === stage.id));
    const growth = [46, 65, 88, 113, 138, 64][stageIndex] || 46;
    const isFallen = stage.id === "Rejected";
    return <div className={`plant-growth-scene ${isFallen ? "is-fallen" : ""}`} data-stage={stage.id} style={{ "--growth-height": `${growth}px`, "--stage-color": stage.color, "--stage-tint": stage.tint }} aria-label={`${stage.label}: ${stage.title}`}>
        <div className="growth-sun" />
        <div className="growth-orbit growth-orbit-one" />
        <div className="growth-orbit growth-orbit-two" />
        <span className="growth-pollen pollen-one" />
        <span className="growth-pollen pollen-two" />
        <span className="growth-pollen pollen-three" />
        <div className="growth-ground" />
        <div className="growth-plant">
            <span className="growth-stem" />
            <span className="growth-branch branch-left" />
            <span className="growth-branch branch-right" />
            <span className="growth-leaf growth-leaf-left" />
            <span className="growth-leaf growth-leaf-right" />
            <span className="growth-leaf growth-leaf-top" />
            <span className="growth-bloom">{isFallen ? "✦" : "✿"}</span>
        </div>
        <div className="growth-pot"><span /><i /></div>
        <div className="growth-stage-chip"><span>Stage {stage.step} · {stage.label}</span><b>{stage.title}</b><small>{stage.short}</small></div>
        <div className="growth-icon-chip"><StageIcon stage={stage} size={17} /></div>
    </div>;
}

function Landing() {
    const navigate = useNavigate();
    const [activeStage, setActiveStage] = useState("Saved");
    const active = PLANT_STAGES.find(stage => stage.id === activeStage) || PLANT_STAGES[0];
    return <div className="editorial-landing">
        <div className="editorial-grain" aria-hidden="true" />
        <div className="editorial-field editorial-field-left" aria-hidden="true" />
        <div className="editorial-field editorial-field-right" aria-hidden="true" />
        <header className="editorial-nav">
            <a className="editorial-brand" href="#top" aria-label="Career Garden home"><span className="editorial-brand-mark"><Sprout size={18} /></span><span><b>Career Garden</b><small>your search, with roots</small></span></a>
            <nav aria-label="Landing page"><a href="#method">About</a><a href="#cycle">The cycle</a><a href="#practice">Practice</a></nav>
            <button className="editorial-nav-cta" onClick={() => navigate("/login")}>Enter the garden <ArrowRight size={14} /></button>
        </header>
        <main id="top" className="editorial-page">
            {/* <section className="editorial-masthead">
                <div><span className="editorial-index">Career Garden / 2026</span><span className="editorial-rule" /></div>
                <h1>About <em>your search.</em></h1>
                <div className="editorial-masthead-foot"><p>A small, living system for the work between “apply” and “offer”.</p><span>01 — 06</span></div>
            </section> */}

            <section className="editorial-feature" id="method">
                <div className="editorial-feature-copy">
                    <div className="editorial-feature-meta"><span>01 / 06</span><span>A calmer way to look for work</span></div>
                    <h2>Plant the work.<br /><em>Grow into the room.</em></h2>
                    <p>Career Garden turns a scattered job search into a place you can return to: every role, every signal, every next action, and the practice that makes the conversation easier.</p>
                    <button className="editorial-black-button" onClick={() => navigate("/login")}>Start with one role <ArrowRight size={15} /></button>
                    <div className="editorial-stat-row"><span><b>06</b><small>stages of care</small></span><span><b>01</b><small>place to remember</small></span><span><b>∞</b><small>lessons carried forward</small></span></div>
                </div>
                <div className="editorial-feature-media">
                    <img src={heroDesk} alt="Person working at a computer between thriving and dried plants" />
                    <div className="editorial-media-tint" />
                    <div className="editorial-media-caption"><span>THE SEARCH, IN MOTION</span><b>Career Garden</b></div>
                    <div className="editorial-float-card editorial-float-card-top"><small>GARDEN HEALTH</small><strong>74%</strong><i><em /></i></div>
                    <div className="editorial-float-card editorial-float-card-bottom"><small>NEXT CARE</small><strong>Practice an answer</strong><span>20 minutes · Role prep</span></div>
                </div>
            </section>

            <section className="editorial-story">
                <div className="editorial-side-label"><span>02</span><span>Why it works</span></div>
                <div className="editorial-story-copy"><h2>A better search begins with <em>a place to land.</em></h2><p>Most applications disappear into tabs, notes, and good intentions. This one gives each opportunity a home — then makes the next useful action obvious.</p><div className="editorial-story-links"><span><Check size={14} />Private by default</span><span><Check size={14} />Built for thoughtful candidates</span><span><Check size={14} />No spreadsheet required</span></div></div>
                <div className="editorial-story-note"><span>“</span><p>The garden remembers the work, so you can focus on doing it.</p><small>— A calmer candidate experience</small></div>
            </section>

            <section className="editorial-cycle" id="cycle">
                <div className="editorial-cycle-heading"><div><span className="editorial-section-kicker">03 · The growth cycle</span><h2>Six stages.<br /><em>One candidate story.</em></h2></div><p>From the first saved role to the lesson you carry into the next one, each stage has a clear job and a small action.</p></div>
                <div className="editorial-cycle-layout">
                    <div className="editorial-stage-list">{PLANT_STAGES.map(stage => <button type="button" key={stage.id} className={`editorial-stage ${activeStage === stage.id ? "is-active" : ""}`} onClick={() => setActiveStage(stage.id)}><span>{stage.step}</span><b className="editorial-stage-icon" style={{ color: stage.color, background: stage.tint }}><StageIcon stage={stage} size={17} /></b><strong>{stage.label}</strong><small>{stage.title}</small><ArrowRight size={14} /></button>)}</div>
                    <div className="editorial-cycle-preview" style={{ "--stage-color": active.color, "--stage-tint": active.tint }}><PlantGrowthScene stage={active} /><div className="editorial-cycle-preview-copy"><span>Current stage · {active.step}</span><h3>{active.label}</h3><p>{active.description}</p><button type="button" onClick={() => navigate("/login")}>Add a role to your garden <MoveUpRight size={14} /></button></div></div>
                </div>
            </section>

            <section className="editorial-photo-story" id="practice"><div className="editorial-photo-story-media"><div className="editorial-stem-art"><span /><i /><b /><em /></div><div className="editorial-photo-story-label">04 / 06<br /><b>Care before<br />the conversation</b></div></div><div className="editorial-photo-story-copy"><span className="editorial-section-kicker">Practice makes the room familiar</span><h2>Strong answers<br /><em>are grown.</em></h2><p>Research the company, understand the hiring process, collect the proof from your own work, then practice out loud until your story feels like yours.</p><div className="editorial-task-list"><span><b>01</b>Company signals and hiring steps</span><span><b>02</b>Role-specific questions and tasks</span><span><b>03</b>Mock interview with useful feedback</span></div><button className="editorial-outline-button" onClick={() => navigate("/login")}>Explore the role room <ArrowRight size={15} /></button></div></section>

            <section className="editorial-values"><div className="editorial-values-heading"><span className="editorial-section-kicker">05 · The soil</span><h2>Good systems leave<br /><em>room for people.</em></h2><p>The search is practical, but it should still feel human.</p></div><div className="editorial-value-grid"><article><span>01</span><div className="editorial-value-icon"><Sprout size={18} /></div><h3>Plant</h3><p>Capture the opportunity while the signal is fresh.</p></article><article className="editorial-value-dark"><span>02</span><div className="editorial-value-icon"><Leaf size={18} /></div><h3>Water</h3><p>Give every conversation a date, a task, and a little care.</p></article><article><span>03</span><div className="editorial-value-icon"><Mic size={18} /></div><h3>Bloom</h3><p>Walk into the room with evidence you can reach.</p></article></div></section>

            <section className="editorial-final"><div><span className="editorial-section-kicker">06 · A place to begin</span><h2>Make space for<br /><em>the right work.</em></h2><p>Start with one role. Give it a next step. Let the system do the remembering.</p></div><button className="editorial-light-button" onClick={() => navigate("/login")}>Enter the garden <ArrowRight size={15} /></button></section>
        </main>
        <footer className="editorial-footer"><a className="editorial-brand" href="#top"><span className="editorial-brand-mark"><Sprout size={18} /></span><span><b>Career Garden</b><small>your search, with roots</small></span></a><span>For the next thoughtful move.</span><a href="#top">Back to the top <ArrowDown size={14} /></a></footer>
    </div>;
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
            // Keep the existing dashboard redirect allowlist. Authenticated
            // explicitly exchanges the PKCE code before rendering the app.
            const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { access_type: "offline", prompt: "select_account" } } });
            if (authError) setError(`${authError.message} Make sure Google is enabled in Supabase Authentication → Providers and this URL is in the redirect allowlist.`);
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
        let authResolved = false;
        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            if (!active || !authResolved) return;
            if (session) setUser(session.user);
            else { setUser(null); navigate("/login", { replace: true }); }
        });
        const restoreSession = async () => {
            let session = (await supabase.auth.getSession()).data.session;
            const code = new URLSearchParams(window.location.search).get("code");
            if (!session && code) {
                const exchanged = await supabase.auth.exchangeCodeForSession(code);
                if (!exchanged.error) {
                    session = exchanged.data.session;
                    window.history.replaceState({}, document.title, "/dashboard");
                }
            }
            if (!active) return;
            if (session) setUser(session.user);
            else navigate("/login", { replace: true });
            authResolved = true;
            setAuthChecked(true);
        };
        restoreSession().catch(() => {
            if (!active) return;
            authResolved = true;
            setAuthChecked(true);
            navigate("/login?auth_error=Google%20session%20could%20not%20be%20restored", { replace: true });
        });
        return () => { active = false; listener.subscription.unsubscribe(); };
    }, [demoSession, navigate]);
    const signOut = async () => { clearDemoSession(); if (supabase && !demoSession) await supabase.auth.signOut(); setUser(isSupabaseConfigured ? null : DEMO_USER); navigate("/"); };
    if (!authChecked || (isSupabaseConfigured && !user)) return <div className="loading-state"><div className="spinner" /><b>Checking your garden</b><span>Restoring your Supabase session…</span></div>;
    return <Workspace user={user} onSignOut={signOut} />;
}

export default function AppNew() { return <BrowserRouter><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/auth/callback" element={<AuthCallback />} /><Route path="/dashboard/*" element={<Authenticated />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>; }
