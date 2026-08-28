import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowDownRight, ArrowRight, Check, LoaderCircle, Play, Sparkles } from "lucide-react";
import workspaceImage from "../../assets/career-garden-workspace.jpeg";
import PlantSprite from "./PlantSprite";
import { RevealLine } from "./Motion";

const PHASE_COPY = ["Plant opportunity", "Planting opportunity…", "Application added", "Researching company…", "Workspace ready"];
const MotionDiv = motion.div;
const MotionArticle = motion.article;
const MotionP = motion.p;

export default function HeroSection({ onStart }) {
    const [phase, setPhase] = useState(0);
    const timers = useRef([]);
    const prefersReduced = useReducedMotion();
    const xValue = useMotionValue(0);
    const yValue = useMotionValue(0);
    const roomX = useSpring(xValue, { stiffness: 80, damping: 24 });
    const roomY = useSpring(yValue, { stiffness: 80, damping: 24 });

    const runDemo = useCallback(() => {
        timers.current.forEach(clearTimeout);
        setPhase(1);
        if (prefersReduced) {
            setPhase(4);
            return;
        }
        timers.current = [
            setTimeout(() => setPhase(2), 500),
            setTimeout(() => setPhase(3), 900),
            setTimeout(() => setPhase(4), 1450),
        ];
    }, [prefersReduced]);

    useEffect(() => {
        const timer = setTimeout(runDemo, 800);
        return () => {
            clearTimeout(timer);
            timers.current.forEach(clearTimeout);
        };
    }, [runDemo]);

    const moveRoom = event => {
        if (prefersReduced || window.matchMedia("(max-width: 900px)").matches) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        xValue.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 10);
        yValue.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 7);
    };

    return <section className="cg-hero" id="hero" onPointerMove={moveRoom} onPointerLeave={() => { xValue.set(0); yValue.set(0); }}>
        <div className="cg-shell cg-hero-grid">
            <MotionDiv className="cg-hero-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.2 }}>
                <MotionDiv className="cg-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}><i />The career workspace</MotionDiv>
                <h1><RevealLine delay={0.36}>Plant the role.</RevealLine><RevealLine delay={0.47} className="cg-serif">Grow into it.</RevealLine></h1>
                <MotionP initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.6 }}>Save one job. Get the research, preparation plan and practice to walk into the interview ready.</MotionP>
                <MotionDiv className="cg-hero-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.55 }}>
                    <button type="button" className="cg-button cg-button-primary" onClick={onStart}>Add your first role <ArrowRight size={16} /></button>
                    <a className="cg-button cg-button-ghost" href="#journey"><Play size={14} fill="currentColor" />See it grow</a>
                </MotionDiv>
                <MotionDiv className="cg-trust-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>Track <i /> Research <i /> Prepare</MotionDiv>
            </MotionDiv>

            <MotionDiv className="cg-hero-scene" style={{ x: roomX, y: roomY }} initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 1 }}>
                <img className="cg-hero-room-backdrop" src={workspaceImage} width="2560" height="2560" alt="" aria-hidden="true" />
                <img className="cg-hero-room" src={workspaceImage} width="2560" height="2560" alt="A warm botanical home office for focused career work" fetchPriority="high" />
                <span className="cg-hero-room-shade" />
                <MotionArticle className="cg-demo-job" animate={phase === 1 ? { x: "125%", y: 190, scale: 0.5, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="cg-demo-job-head"><span>S</span><div><small>NEW OPPORTUNITY</small><strong>Senior Backend Engineer</strong><em>Stripe</em></div></div>
                    <div className="cg-demo-tags"><span>Django</span><span>PostgreSQL</span><span>AWS</span></div>
                    <div className="cg-demo-match"><span>Match</span><strong>82%</strong><i><b /></i></div>
                    <button type="button" onClick={runDemo} disabled={phase === 1}>{phase === 1 ? <LoaderCircle className="cg-spin" size={14} /> : phase >= 2 ? <Check size={14} /> : <ArrowDownRight size={14} />}{PHASE_COPY[phase]}</button>
                </MotionArticle>

                <div className={`cg-hero-plot phase-${phase}`}>
                    <span className="cg-hero-plot-label">YOUR GARDEN · 01</span>
                    <PlantSprite stage={phase >= 2 ? 1 : 0} className="cg-hero-plant" label={phase >= 2 ? "A newly planted job sprouting" : "A career opportunity seed"} eager />
                    <MotionDiv className="cg-hero-toast" animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }}><Check size={13} />Application added</MotionDiv>
                </div>

                <MotionArticle className="cg-demo-research" animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 18, scale: phase >= 3 ? 1 : 0.96 }} transition={{ duration: 0.5 }}>
                    <div><span><Sparkles size={13} />Interview Prep</span><strong>{phase === 3 ? "Researching company…" : "Workspace ready"}</strong></div>
                    <div className="cg-demo-research-steps"><span className={phase >= 3 ? "done" : ""}>JD analyzed</span><span className={phase >= 3 ? "done" : ""}>Company research</span><span className={phase >= 4 ? "done" : ""}>14-day plan</span></div>
                </MotionArticle>
                <div className="cg-hero-health"><span>GARDEN HEALTH</span><strong>74%</strong><i><b /></i></div>
            </MotionDiv>
        </div>
        <a className="cg-scroll-cue" href="#journey"><span>Scroll to grow</span><ArrowDownRight size={15} /></a>
    </section>;
}
