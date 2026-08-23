import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronRight, Leaf, LockKeyhole, Mic, MoveUpRight, Sprout } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Workspace from "./Workspace";
import { DEMO_USER, isSupabaseConfigured, supabase } from "./lib/supabase";
import { PLANT_STAGES } from "./lib/plantStages";
import StageIcon from "./StageIcon";
import heroDesk from "./assets/hero-desk.png";

const benefits = [
    { icon: Sprout, title: "Capture the signal", body: "Save the role, context, and reason it matters before the tab disappears." },
    { icon: Leaf, title: "Know the next move", body: "Every application gets a clear status, owner, date, and small action." },
    { icon: Mic, title: "Practice before it counts", body: "Turn each job description into focused questions and confident answers." },
];

function Brand({ light = false }) {
    return <div className={`brand-lockup ${light ? "light" : ""}`}><span className="brand-symbol"><Sprout size={17} /></span><span><strong>Career Garden</strong><small>your search, with roots</small></span></div>;
}

function Landing() {
    const navigate = useNavigate();
    const [activeStage, setActiveStage] = useState("Saved");
    const active = PLANT_STAGES.find(stage => stage.id === activeStage) || PLANT_STAGES[0];
    return <div className="new-landing">
        <header className="landing-nav"><Brand /><nav><a href="#why">Why it works</a><a href="#cycle">The growth cycle</a><a href="#practice">Practice</a></nav><button className="nav-button" onClick={() => navigate("/login")}>Open the garden <ArrowRight size={15} /></button></header>
        <main>
            <section className="new-hero">
                <div className="hero-noise" />
                <div className="hero-copy reveal-up">
                    <div className="eyebrow-pill"><span />A calmer job search for ambitious people</div>
                    <h1>Your search<br /><em>deserves a system.</em></h1>
                    <p className="hero-lede">One calm home for every role, every next step, and the proof that you are getting better.</p>
                    <div className="hero-actions"><button className="primary-cta" onClick={() => navigate("/login")}>Start growing <ArrowRight size={16} /></button><a className="text-cta" href="#cycle">See how it works <ArrowDown size={15} /></a></div>
                    <div className="hero-trust"><span><Check size={13} />Private by default</span><span><Check size={13} />Demo ready in seconds</span><span><Check size={13} />No spreadsheet required</span></div>
                </div>
                <div className="hero-scene hero-photo-scene reveal-scene" aria-label="Person working at a computer between a thriving and a dried plant">
                    <img className="hero-photo" src={heroDesk} alt="Person working at a desk with a thriving plant and a dried plant" />
                    <div className="hero-photo-overlay" />
                    <div className="scene-caption"><span>THE SEARCH, IN MOTION</span><b>01 — 06</b></div>
                    <div className="scene-card scene-card-top"><small>GARDEN HEALTH</small><strong>74%</strong><i><em /></i></div>
                    <div className="scene-card scene-card-bottom"><small>NEXT CARE</small><strong>Practice an answer</strong><span>20 minutes · Role prep</span></div>
                    <div className="hero-photo-label">A small system<br /><b>for the next right move.</b></div>
                </div>
            </section>
            <section className="signal-bar"><div><strong>01</strong><span>Capture the opportunity</span></div><div><strong>06</strong><span>Stages with a purpose</span></div><div><strong>∞</strong><span>Progress you can feel</span></div><p>Less scramble.<br /><b>More signal.</b></p></section>
            <section className="why-section" id="why"><div className="section-intro"><span className="section-kicker">The point of the garden</span><h2>A job search is a living thing.</h2><p>It needs a place to land, a rhythm to follow, and enough room for the good work between applications.</p></div><div className="benefit-grid">{benefits.map(({ icon: Icon, title, body }, index) => <article className="benefit-card" key={title} style={{ "--delay": `${index * 80}ms` }}><span className="benefit-index">0{index + 1}</span><div className="benefit-icon"><Icon size={19} /></div><h3>{title}</h3><p>{body}</p><ChevronRight size={16} /></article>)}</div></section>
            <section className="cycle-section" id="cycle"><div className="section-intro cycle-intro"><span className="section-kicker">The growth cycle</span><h2>Every role gets<br /><em>a next step.</em></h2><p>Move from the first spark of interest to a confident conversation without losing the thread.</p></div><div className="cycle-layout"><div className="cycle-list">{PLANT_STAGES.map(stage => <button type="button" key={stage.id} className={`cycle-item ${activeStage === stage.id ? "active" : ""}`} onClick={() => setActiveStage(stage.id)}><span>{stage.step}</span><b className="stage-glyph"><StageIcon stage={stage} size={18} /></b><strong>{stage.label}</strong><small>{stage.title}</small><ArrowRight size={15} /></button>)}</div><div className="cycle-feature" style={{ "--stage-color": active.color, "--stage-tint": active.tint }}><div className="cycle-feature-meta"><span>Stage {active.step}</span><b>{active.soil}</b></div><div className="cycle-feature-glyph"><StageIcon stage={active} size={38} strokeWidth={1.6} /></div><h3>{active.label}</h3><p>{active.description}</p><button type="button" onClick={() => navigate("/login")}>Add a role to your garden <MoveUpRight size={14} /></button></div></div></section>
            <section className="practice-section" id="practice"><div className="practice-art"><div className="practice-ring" /><div className="practice-sprout"><Sprout size={70} strokeWidth={1.15} /></div><span>ROLE-SPECIFIC</span></div><div className="practice-copy"><span className="section-kicker">Before the interview</span><h2>Confidence is<br /><em>rehearsed.</em></h2><p>Paste a job description, get a focused question set, and practice out loud with a transcript and clear coaching.</p><div className="practice-points"><span><Check size={14} />Role-specific questions</span><span><Check size={14} />Voice practice with fallback support</span><span><Check size={14} />A score you can act on</span></div><button className="dark-cta" onClick={() => navigate("/login")}>Explore practice <ArrowRight size={16} /></button></div></section>
            <section className="final-cta"><div className="final-cta-inner"><div><span className="section-kicker light-kicker">A better place to begin</span><h2>Make space for<br /><em>the right work.</em></h2><p>Start with one role. Give it a next step. Let the system do the remembering.</p></div><button className="light-cta" onClick={() => navigate("/login")}>Enter the garden <ArrowRight size={16} /></button></div></section>
        </main><footer className="landing-footer"><Brand light /><span>For the next thoughtful move.</span><a href="#why">Back to the top <ArrowRight size={14} /></a></footer>
    </div>;
}

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const signIn = async () => {
        setError("");
        if (!isSupabaseConfigured) {
            setError("Google sign-in is not connected in this environment yet. Use the demo garden below, or configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production auth.");
            return;
        }
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { access_type: "offline", prompt: "select_account" } } });
            if (authError) setError(`${authError.message} Make sure Google is enabled in Supabase Authentication → Providers and this URL is in the redirect allowlist.`);
        } catch (authError) {
            setError(authError?.message || "Google sign-in could not be started. Please try again or use the demo garden.");
        } finally { setLoading(false); }
    };
    return <div className="new-auth"><div className="auth-story"><button type="button" className="auth-back" onClick={() => navigate("/")}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />Back to the garden</button><div className="auth-story-copy"><span className="section-kicker light-kicker">Your next move starts here</span><h1>Keep the good<br /><em>work growing.</em></h1><p>Every role has a story. Career Garden helps you keep hold of it from first click to final conversation.</p></div><div className="auth-story-footer"><span><LockKeyhole size={13} />Your demo stays in this browser.</span><span><Leaf size={13} />Your progress gets easier to see.</span></div></div><div className="auth-panel"><div className="auth-panel-inner"><Brand /><div className="auth-heading"><span className="auth-overline">Welcome back</span><h2>Come tend to<br />your garden.</h2><p>Choose how you want to continue.</p></div>{error && <div className="auth-error" role="alert">{error}</div>}<button type="button" className="google-login" onClick={signIn} disabled={loading}><span className="google-mark">G</span><span>{loading ? "Opening Google…" : "Continue with Google"}</span><ArrowRight size={15} /></button><div className="auth-separator"><span>or</span></div><button type="button" className="demo-login" onClick={() => navigate("/dashboard")}><Sprout size={16} /><span>Open the demo garden</span><ArrowRight size={15} /></button><p className="auth-footnote">Demo mode is ready now. Production Google login requires a configured Supabase project.</p><div className={`auth-status ${isSupabaseConfigured ? "ready" : "demo"}`}><i />{isSupabaseConfigured ? "Google auth is configured" : "Demo mode is active"}</div></div></div></div>;
}

function Authenticated() {
    const navigate = useNavigate();
    const [user, setUser] = useState(isSupabaseConfigured ? null : DEMO_USER);
    const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
    useEffect(() => {
        if (!supabase) return undefined;
        let active = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            if (data.session) setUser(data.session.user);
            else navigate("/login", { replace: true });
            setAuthChecked(true);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            if (!active) return;
            if (session) setUser(session.user);
            else { setUser(null); navigate("/login", { replace: true }); }
        });
        return () => { active = false; listener.subscription.unsubscribe(); };
    }, [navigate]);
    const signOut = async () => { if (supabase) await supabase.auth.signOut(); setUser(isSupabaseConfigured ? null : DEMO_USER); navigate("/"); };
    if (!authChecked || (isSupabaseConfigured && !user)) return <div className="loading-state"><div className="spinner" /><b>Checking your garden</b><span>Restoring your Supabase session…</span></div>;
    return <Workspace user={user} onSignOut={signOut} />;
}

export default function AppNew() { return <BrowserRouter><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/dashboard/*" element={<Authenticated />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>; }
