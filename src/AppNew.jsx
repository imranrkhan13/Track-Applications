import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronRight, Leaf, LockKeyhole, Mic, MoveUpRight, Sprout } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Workspace from "./Workspace";
import { DEMO_USER, isSupabaseConfigured, supabase } from "./lib/supabase";
import { PLANT_STAGES } from "./lib/plantStages";
import StageIcon from "./StageIcon";
import heroDesk from "./assets/hero-desk.png";

function isDemoSession() { try { return window.sessionStorage.getItem("career-garden-demo-session") === "true"; } catch { return false; } }
function startDemoSession() { try { window.sessionStorage.setItem("career-garden-demo-session", "true"); return true; } catch { return false; } }
function clearDemoSession() { try { window.sessionStorage.removeItem("career-garden-demo-session"); return true; } catch { return false; } }

const benefits = [
    { icon: Sprout, title: "Plant the seed", body: "Save the role, context, and reason it matters before the tab disappears." },
    { icon: Leaf, title: "Water the signal", body: "Give every application a stage, a date, and one small action that keeps it alive." },
    { icon: Mic, title: "Bloom in the room", body: "Turn each job description into focused questions and confident answers." },
];

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
    return <div className="new-landing">
        <header className="landing-nav"><Brand /><nav><a href="#why">Why it works</a><a href="#cycle">The growth cycle</a><a href="#practice">Practice</a></nav><button className="nav-button" onClick={() => navigate("/login")}>Open the garden <ArrowRight size={15} /></button></header>
        <main>
            <section className="new-hero">
                <div className="hero-noise" />
                <div className="hero-copy reveal-up">
                    <div className="eyebrow-pill"><span />A calmer job search for ambitious people</div>
                    <h1>Plant the work<br /><em>grow into the room.</em></h1>
                    <p className="hero-lede">Every role starts as a seed. Career Garden gives it a place to take root, branch into conversations, and bloom into your next move.</p>
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
            <section className="signal-bar"><div><strong>01</strong><span>Plant the opportunity</span></div><div><strong>06</strong><span>Care through each stage</span></div><div><strong>∞</strong><span>Lessons feed the soil</span></div><p>Less scramble.<br /><b>More room to grow.</b></p></section>
            <section className="why-section" id="why"><div className="section-intro"><span className="section-kicker">The point of the garden</span><h2>A job search is a living thing.</h2><p>It needs a place to land, a rhythm to follow, and enough room for the good work between applications.</p></div><div className="benefit-grid">{benefits.map(({ icon: Icon, title, body }, index) => <article className="benefit-card" key={title} style={{ "--delay": `${index * 80}ms` }}><span className="benefit-index">0{index + 1}</span><div className="benefit-icon"><Icon size={19} /></div><h3>{title}</h3><p>{body}</p><ChevronRight size={16} /></article>)}</div></section>
            <section className="cycle-section" id="cycle"><div className="section-intro cycle-intro"><span className="section-kicker">The growth cycle · six stages</span><h2>Every role gets<br /><em>a next step.</em></h2><p>Plant the first signal, care for the conversation, and keep the lessons from every role in the soil for the next one.</p></div><div className="cycle-layout"><div className="cycle-list">{PLANT_STAGES.map(stage => <button type="button" key={stage.id} className={`cycle-item ${activeStage === stage.id ? "active" : ""}`} onClick={() => setActiveStage(stage.id)}><span>{stage.step}</span><b className="stage-glyph"><StageIcon stage={stage} size={18} /></b><strong>{stage.label}</strong><small>{stage.title}</small><ArrowRight size={15} /></button>)}</div><div className="cycle-feature" style={{ "--stage-color": active.color, "--stage-tint": active.tint }}><PlantGrowthScene stage={active} /><div className="cycle-feature-copy"><div className="cycle-feature-meta"><span>Stage {active.step}</span><b>{active.soil}</b></div><div className="cycle-feature-glyph"><StageIcon stage={active} size={38} strokeWidth={1.6} /></div><h3>{active.label}</h3><p>{active.description}</p><button type="button" onClick={() => navigate("/login")}>Add a role to your garden <MoveUpRight size={14} /></button></div></div></div></section>
            <section className="practice-section" id="practice"><div className="practice-art"><div className="practice-ring" /><div className="practice-sprout"><Sprout size={70} strokeWidth={1.15} /></div><span>CARE BEFORE THE CONVERSATION</span></div><div className="practice-copy"><span className="section-kicker">Before the interview · branch out</span><h2>Strong answers<br /><em>are grown.</em></h2><p>Paste a job description, get a focused question set, and practice out loud until your evidence feels easy to reach.</p><div className="practice-points"><span><Check size={14} />Role-specific questions</span><span><Check size={14} />Voice practice with fallback support</span><span><Check size={14} />A score you can act on</span></div><button className="dark-cta" onClick={() => navigate("/login")}>Explore practice <ArrowRight size={16} /></button></div></section>
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
    return <div className="new-auth"><div className="auth-story"><button type="button" className="auth-back" onClick={() => navigate("/")}><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />Back to the garden</button><div className="auth-story-copy"><span className="section-kicker light-kicker">Your next move starts here</span><h1>Keep the good<br /><em>work growing.</em></h1><p>Every role has a story. Career Garden helps you keep hold of it from first click to final conversation.</p></div><div className="auth-story-footer"><span><LockKeyhole size={13} />Your demo stays in this browser.</span><span><Leaf size={13} />Your progress gets easier to see.</span></div></div><div className="auth-panel"><div className="auth-panel-inner"><Brand /><div className="auth-heading"><span className="auth-overline">Welcome back</span><h2>Come tend to<br />your garden.</h2><p>Choose how you want to continue.</p></div>{error && <div className="auth-error" role="alert">{error}</div>}<button type="button" className="google-login" onClick={signIn} disabled={loading}><span className="google-mark">G</span><span>{loading ? "Opening Google…" : "Continue with Google"}</span><ArrowRight size={15} /></button><div className="auth-separator"><span>or</span></div><button type="button" className="demo-login" onClick={() => { startDemoSession(); navigate("/dashboard"); }}><Sprout size={16} /><span>Open the demo garden</span><ArrowRight size={15} /></button><p className="auth-footnote">Demo mode is ready now. Production Google login requires a configured Supabase project.</p><div className={`auth-status ${isSupabaseConfigured ? "ready" : "demo"}`}><i />{isSupabaseConfigured ? "Google auth is configured" : "Demo mode is active"}</div></div></div></div>;
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
    }, [demoSession, navigate]);
    const signOut = async () => { clearDemoSession(); if (supabase && !demoSession) await supabase.auth.signOut(); setUser(isSupabaseConfigured ? null : DEMO_USER); navigate("/"); };
    if (!authChecked || (isSupabaseConfigured && !user)) return <div className="loading-state"><div className="spinner" /><b>Checking your garden</b><span>Restoring your Supabase session…</span></div>;
    return <Workspace user={user} onSignOut={signOut} />;
}

export default function AppNew() { return <BrowserRouter><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/dashboard/*" element={<Authenticated />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>; }
