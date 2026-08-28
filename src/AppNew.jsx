import React, { useEffect, useState } from "react";
import { ArrowRight, ArrowUp, BarChart3, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, Code2, FileSearch, GitBranch, Hash, HeartHandshake, Leaf, LockKeyhole, MessageCircle, Mic, MoveUpRight, Network, Sprout, Target } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Workspace from "./Workspace";
import AuthCallback from "./AuthCallback";
import { DEMO_USER, isSupabaseConfigured, supabase } from "./lib/supabase";
import { PLANT_STAGES } from "./lib/plantStages";
import StageIcon from "./StageIcon";
import careerGardenWorkspace from "./assets/career-garden-workspace.jpeg";

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
    return <div className={`plant-growth-scene ${isFallen ? "is-fallen" : ""}`} data-stage={stage.id} style={{ "--growth-height": `${growth}px`, "--stage-color": stage.color, "--stage-tint": stage.tint }} aria-label={`${stage.gardenName || stage.title}: ${stage.statusText || stage.label}`}>
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
            <span className="growth-bloom" aria-hidden="true" />
        </div>
        <div className="growth-pot"><span /><i /></div>
        <div className="growth-stage-chip"><span>Stage {stage.step} · {stage.gardenName || stage.title}</span><b>{stage.statusText || stage.label}</b><small>{stage.short}</small></div>
        <div className="growth-icon-chip"><StageIcon stage={stage} size={17} /></div>
    </div>;
}

function Landing() {
    const navigate = useNavigate();
    const [activeStage, setActiveStage] = useState("Interview");
    const active = PLANT_STAGES.find(stage => stage.id === activeStage) || PLANT_STAGES[0];
    return <div className="editorial-landing">
        <div className="editorial-grain" aria-hidden="true" />
        <div className="editorial-field editorial-field-left" aria-hidden="true" />
        <div className="editorial-field editorial-field-right" aria-hidden="true" />
        <header className="editorial-nav">
            <a className="editorial-brand" href="#top" aria-label="Career Garden home"><span className="editorial-brand-mark"><Sprout size={18} /></span><span><b>Career Garden</b><small>your search, with roots</small></span></a>
            <nav aria-label="Landing page"><a href="#method">About</a><a href="#product">The workspace</a><a href="#cycle">The cycle</a><a href="#practice">Practice</a></nav>
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
                    <img src={careerGardenWorkspace} alt="A warm miniature workspace surrounded by plants" fetchPriority="high" />
                    <div className="editorial-media-tint" />
                    <div className="editorial-media-caption"><span>THE SEARCH, IN MOTION</span><b>Career Garden</b></div>
                    <div className="editorial-float-card editorial-float-card-top"><small>GARDEN HEALTH</small><strong>74%</strong><i><em /></i></div>
                    <div className="editorial-float-card editorial-float-card-bottom"><small>NEXT CARE</small><strong>Practice an answer</strong><span>20 minutes · Role prep</span></div>
                </div>
            </section>

            <section className="editorial-garden-intro" id="garden">
                <div className="editorial-garden-intro-copy"><span className="editorial-section-kicker">02 / THE GARDEN</span><h2>Every opportunity<br /><em>starts as a seed.</em></h2><p>Track every application from saved role to final outcome. Each role gets a clear stage, a next action, and a preparation room that grows with it.</p><div className="editorial-garden-proof"><span><Check size={14} />Application tracker</span><span><Check size={14} />Company and JD research</span><span><Check size={14} />Personal interview plan</span></div></div>
                <div className="editorial-garden-examples"><div className="editorial-garden-examples-head"><span>Three roles in motion</span><small>live view</small></div><div className="editorial-garden-example-grid">{PLANT_STAGES.slice(0, 3).map((stage, index) => <button type="button" className="editorial-garden-example" key={stage.id} onClick={() => document.getElementById("cycle")?.scrollIntoView({ behavior: "smooth" })}><span className="editorial-example-plant"><StageIcon stage={stage} size={22} /></span><span><b>{["Google", "Stripe", "Notion"][index]}</b><small>{["Senior Backend Engineer", "Backend Engineer", "Senior Software Engineer"][index]}</small></span><em style={{ color: stage.color }}>{stage.gardenName}</em></button>)}</div><div className="editorial-garden-ground"><i /><i /><i /><i /></div></div>
            </section>

            <section className="editorial-cycle" id="cycle">
                <div className="editorial-cycle-heading"><div><span className="editorial-section-kicker">03 · The growth cycle</span><h2>Six stages.<br /><em>One candidate story.</em></h2></div><p>From the first saved role to the lesson you carry into the next one, each stage has a clear job and a small action.</p></div>
                <div className="editorial-cycle-layout">
                    <div className="editorial-stage-list">{PLANT_STAGES.map(stage => <button type="button" key={stage.id} className={`editorial-stage ${activeStage === stage.id ? "is-active" : ""}`} onClick={() => setActiveStage(stage.id)}><span>{stage.step}</span><b className="editorial-stage-icon" style={{ color: stage.color, background: stage.tint }}><StageIcon stage={stage} size={17} /></b><strong>{stage.gardenName || stage.label}</strong><small>{stage.statusText || stage.label} · {stage.short}</small><ArrowRight size={14} /></button>)}</div>
                    <div className="editorial-cycle-preview" style={{ "--stage-color": active.color, "--stage-tint": active.tint }}><PlantGrowthScene stage={active} /><div className="editorial-cycle-preview-copy"><span>Current stage · {active.step} · {active.statusText || active.label}</span><h3>{active.gardenName || active.title}</h3><p>{active.description}</p><button type="button" onClick={() => navigate("/login")}>Open Interview Prep <MoveUpRight size={14} /></button></div></div>
                </div>
            </section>

            <section className="editorial-interview-preview" id="practice">
                <div className="editorial-room-visual"><img src={careerGardenWorkspace} alt="Interview preparation workspace with a desk and plants" loading="lazy" /><div className="editorial-room-wash" /><div className="editorial-room-label"><span>04 / INTERVIEW PREP</span><b>One room for<br />the work before.</b></div><div className="editorial-room-card editorial-room-card-top"><span><Target size={12} />READINESS</span><strong>74%</strong><i><em /></i></div><div className="editorial-room-card editorial-room-card-bottom"><span><CalendarDays size={12} />TODAY</span><strong>3 tasks ready</strong><small>Company · role · practice</small></div></div>
                <div className="editorial-interview-copy"><span className="editorial-section-kicker">04 / INTERVIEW PREP</span><h2>Walk into the interview<br /><em>already knowing the room.</em></h2><p>Career Garden researches the company, analyzes the job description, studies public interview experiences, and builds a plan around the role.</p><div className="editorial-prep-checklist"><span><CheckCircle2 size={15} />Company intelligence</span><span><CheckCircle2 size={15} />JD skill breakdown</span><span><CheckCircle2 size={15} />Hiring-process research</span><span><CheckCircle2 size={15} />Reported interview topics</span><span><CheckCircle2 size={15} />Personalized questions</span><span><CheckCircle2 size={15} />Mock interviews</span><span><CheckCircle2 size={15} />1–3 week preparation plan</span></div><button className="editorial-outline-button" onClick={() => navigate("/login")}>Explore Interview Prep <ArrowRight size={15} /></button></div>
            </section>

            <section className="editorial-channel-showcase"><div className="editorial-channel-showcase-head"><div><span className="editorial-section-kicker">05 / THE PREP ROOM</span><h2>Everything the role asks for,<br /><em>in one focused place.</em></h2></div><p>Research, learning tasks, resources, notes, and mock interviews stay attached to the opportunity—not scattered across tabs.</p></div><div className="editorial-channel-mock"><aside className="editorial-channel-sidebar"><div className="editorial-channel-role"><span className="editorial-channel-avatar">G</span><span><b>Google</b><small>Senior Backend Engineer</small></span></div><small className="editorial-channel-label">PREP ROOM</small>{["overview", "company", "job-description", "hiring-process"].map((item, index) => <span className={`editorial-channel-link ${index === 0 ? "is-active" : ""}`} key={item}><Hash size={13} />{item}</span>)}<small className="editorial-channel-label">PRACTICE</small>{[[Code2, "technical"], [Network, "system-design"], [HeartHandshake, "behavioral"], [Mic, "mock-interview"]].map(([ChannelIcon, item]) => <span className="editorial-channel-link" key={item}>{React.createElement(ChannelIcon, { size: 13 })}{item}</span>)}<small className="editorial-channel-label">PLAN</small>{[[CalendarDays, "today"], [Target, "14-day-plan"], [FileSearch, "notes"]].map(([ChannelIcon, item]) => <span className="editorial-channel-link" key={item}>{React.createElement(ChannelIcon, { size: 13 })}{item}</span>)}</aside><div className="editorial-channel-main"><div className="editorial-channel-main-head"><span><Hash size={16} />system-design</span><small>role-specific practice</small></div><div className="editorial-coach-message"><div className="editorial-coach-avatar"><Sprout size={15} /></div><div><strong>AI Interview Coach <small>just now</small></strong><p>Based on Google's role requirements and your profile, system design is currently your highest-priority preparation area.</p><div className="editorial-priority-list"><span>Distributed systems</span><span>Caching</span><span>API scalability</span><span>Database partitioning</span></div><button type="button" onClick={() => navigate("/login")}>Start practice <ArrowRight size={13} /></button></div></div><div className="editorial-channel-input">Write a note or ask the coach… <span>⌘ ↵</span></div></div><aside className="editorial-channel-insights"><div><small>INTERVIEW</small><strong>12 <em>days</em></strong><span>remaining</span></div><div><small>READINESS</small><strong>74%</strong><i><em /></i></div><div><small>TODAY</small><strong>3 <em>/ 5 tasks</em></strong><span>keep the momentum</span></div><button type="button" onClick={() => navigate("/login")}>Open the room <ArrowRight size={13} /></button></aside></div></section>

            <section className="editorial-how" id="how-it-works"><div className="editorial-how-heading"><span className="editorial-section-kicker">06 / HOW CAREER GARDEN WORKS</span><h2>A simple system<br /><em>for serious preparation.</em></h2><p>One opportunity becomes one clear route: save it, understand it, prepare for it, and keep the lesson.</p></div><div className="editorial-how-grid"><article><span>01</span><div className="editorial-how-icon"><Sprout size={18} /></div><h3>Plant</h3><p>Save the opportunity.</p><small>Paste a job URL and Career Garden captures the role, company, and requirements.</small></article><article className="editorial-how-sage"><span>02</span><div className="editorial-how-icon"><Leaf size={18} /></div><h3>Nurture</h3><p>Prepare intelligently.</p><small>Research the company and build a private interview preparation room.</small></article><article className="editorial-how-dark"><span>03</span><div className="editorial-how-icon"><GitBranch size={18} /></div><h3>Grow</h3><p>Move through the process.</p><small>Track interviews, follow-ups, tasks, and the next action without extra menus.</small></article><article className="editorial-how-bloom"><span>04</span><div className="editorial-how-icon"><CheckCircle2 size={18} /></div><h3>Bloom</h3><p>Turn preparation into opportunities.</p><small>Offers become proof that the right small actions compound.</small></article></div></section>

            <section className="editorial-product" id="product"><div className="editorial-product-head"><div><span className="editorial-section-kicker">06 · The workspace</span><h2>One role.<br /><em>A whole room.</em></h2></div><p>Add an application once. Career Garden keeps its brief, research, plan, questions, practice, and next move together.</p></div><div className="editorial-product-grid"><article><div className="editorial-product-icon"><BriefcaseBusiness size={17} /></div><span>01</span><h3>Track the pipeline</h3><p>See every opportunity from saved to applied, interview, offer, or the lesson you carry forward.</p><div className="editorial-product-line"><i /><i /><i /><i /><i /></div></article><article className="editorial-product-dark"><div className="editorial-product-icon"><MessageCircle size={17} /></div><span>02</span><h3>Open the prep room</h3><p>Company research, role requirements, hiring clues, and questions stay scoped to the role in focus.</p><div className="editorial-channel-pills"><b># company</b><b># plan</b><b># mock</b></div></article><article><div className="editorial-product-icon"><BarChart3 size={17} /></div><span>03</span><h3>Know what to do next</h3><p>Use the dated plan, practice feedback, and garden health to spend your time where it matters.</p><div className="editorial-product-readout"><strong>68%</strong><small>readiness from real activity</small></div></article></div><div className="editorial-product-stats"><span><b>06</b><small>growth stages</small></span><span><b>01</b><small>private room per role</small></span><span><b>∞</b><small>lessons carried forward</small></span><span><b>24/7</b><small>next action clarity</small></span></div></section>
            <section className="editorial-dashboard-preview"><div className="editorial-dashboard-preview-head"><div><span className="editorial-section-kicker">07 / PRODUCT</span><h2>Your whole search.<br /><em>Growing in one place.</em></h2></div><p>The tracker stays simple. The detail appears when you need it: current stage, preparation progress, and the next useful move.</p></div><div className="editorial-dashboard-window"><div className="editorial-dashboard-topbar"><span className="editorial-dashboard-logo"><Sprout size={14} /></span><b>Career Garden</b><span className="editorial-dashboard-crumb">/ My garden / Overview</span><span className="editorial-dashboard-status"><i />Workspace synced</span></div><div className="editorial-dashboard-stats"><div><span>Applications</span><strong>18</strong><small>tracked roles</small></div><div><span>Interviews</span><strong>05</strong><small>in motion</small></div><div><span>Offers</span><strong>02</strong><small>fully bloomed</small></div><div><span>Garden health</span><strong>74%</strong><small>based on real activity</small></div></div><div className="editorial-dashboard-body"><div className="editorial-garden-map"><div className="editorial-map-head"><span>CAREER GARDEN MAP</span><small>6 stages · 18 plots</small></div><div className="editorial-map-canvas"><span className="editorial-map-sun" /><span className="editorial-map-path path-one" /><span className="editorial-map-path path-two" /><button type="button" className="editorial-map-plant map-google" onClick={() => navigate("/login")}><StageIcon stage={PLANT_STAGES[3]} size={26} /><b>Google</b><small>BRANCHING</small></button><button type="button" className="editorial-map-plant map-stripe" onClick={() => navigate("/login")}><StageIcon stage={PLANT_STAGES[2]} size={22} /><b>Stripe</b><small>SAPLING</small></button><button type="button" className="editorial-map-plant map-shopify" onClick={() => navigate("/login")}><StageIcon stage={PLANT_STAGES[4]} size={24} /><b>Shopify</b><small>BLOOM</small></button><button type="button" className="editorial-map-plant map-notion" onClick={() => navigate("/login")}><StageIcon stage={PLANT_STAGES[1]} size={21} /><b>Notion</b><small>SPROUT</small></button><button type="button" className="editorial-map-plant map-airbnb" onClick={() => navigate("/login")}><StageIcon stage={PLANT_STAGES[5]} size={20} /><b>Airbnb</b><small>DORMANT</small></button></div></div><div className="editorial-dashboard-recent"><div className="editorial-map-head"><span>RECENT APPLICATIONS</span><small>view all</small></div>{[["Google", "Senior Backend Engineer", "BRANCHING", PLANT_STAGES[3]], ["Stripe", "Backend Engineer", "SAPLING", PLANT_STAGES[2]], ["Notion", "Senior Software Engineer", "SPROUT", PLANT_STAGES[1]], ["Linear", "Senior Frontend Engineer", "SEED", PLANT_STAGES[0]], ["Airbnb", "Senior Engineer", "DORMANT", PLANT_STAGES[5]]].map(([company, role, state, stage]) => <button type="button" className="editorial-dashboard-role" key={company} onClick={() => navigate("/login")}><span className="editorial-dashboard-role-icon"><StageIcon stage={stage} size={16} /></span><span><b>{company}</b><small>{role}</small></span><em style={{ color: stage.color }}>{state}</em><ArrowRight size={13} /></button>)}</div></div></div></section>

            <section className="editorial-faq"><div><span className="editorial-section-kicker">07 · Clear by design</span><h2>Useful before<br /><em>it is urgent.</em></h2><p>Everything is designed to help you make progress without adding another noisy system to your week.</p></div><div className="editorial-faq-list"><details open><summary>What happens when I add a role?<ChevronDown size={16} /></summary><p>The role is saved, then its private prep room starts building a plan from the public job link, company signals, and your deadline.</p></details><details><summary>Can I use a Google Doc or Drive job description?<ChevronDown size={16} /></summary><p>Public Docs, Sheets, Drive files, and job pages can be read when accessible. Private, login-protected, or CAPTCHA-blocked content is never bypassed.</p></details><details><summary>Does the garden replace a normal tracker?<ChevronDown size={16} /></summary><p>No. The pipeline stays practical; the plant stages simply make the state and next move easier to remember.</p></details><details><summary>How does readiness get calculated?<ChevronDown size={16} /></summary><p>It grows from completed tasks, practice sessions, and role-specific preparation—not a random score.</p></details></div></section>

            <section className="editorial-final"><div><span className="editorial-section-kicker">08 · A place to begin</span><h2>Make space for<br /><em>the right work.</em></h2><p>Start with one role. Give it a next step. Let the system do the remembering.</p></div><button className="editorial-light-button" onClick={() => navigate("/login")}>Enter the garden <ArrowRight size={15} /></button></section>
        </main>
        <footer className="editorial-footer">
            <div className="editorial-footer-head"><a className="editorial-brand" href="#top" aria-label="Career Garden home"><span className="editorial-brand-mark"><Sprout size={18} /></span><span><b>Career Garden</b><small>your search, with roots</small></span></a><p>One calm home for every role, every signal, and the next useful move.</p><a className="editorial-footer-cta" href="#method">Start with one role <MoveUpRight size={15} /></a></div>
            <div className="editorial-footer-links"><div><span>Explore</span><a href="#method">Why it works</a><a href="#cycle">The growth cycle</a><a href="#practice">Practice</a></div><div><span>Six stages</span><a href="#cycle">Saved</a><a href="#cycle">Applied</a><a href="#cycle">Interview</a></div><div><span>Keep in mind</span><p>Progress is easier to trust when you can see the next small action.</p></div></div>
            <div className="editorial-footer-base"><span>Career Garden / 2026</span><span>Made for thoughtful candidates</span><a href="#top">Back to top <ArrowUp size={14} /></a></div>
        </footer>
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
