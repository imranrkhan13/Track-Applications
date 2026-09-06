import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowDownRight, ArrowRight, BriefcaseBusiness, CalendarRange, Check, LoaderCircle, Mic2, Play, Search } from "lucide-react";
import workspaceImage from "../../assets/career-garden-workspace-wide.png";
import workspaceImageSquare from "../../assets/career-garden-workspace.jpeg";
import { RevealLine } from "./Motion";

const PHASE_COPY = ["See it work", "Saving the role…", "Researching the company…", "Building your plan…", "Interview room ready"];
const PRODUCT_STEPS = [
    ["Role", BriefcaseBusiness],
    ["Research", Search],
    ["Plan", CalendarRange],
    ["Practise", Mic2],
];
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
            setTimeout(() => setPhase(0), 5200),
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
                <MotionDiv className="cg-kicker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}><i />Job tracker + interview coach</MotionDiv>
                <h1><RevealLine delay={0.36}>Track the role.</RevealLine><RevealLine delay={0.47} className="cg-serif">Own the interview.</RevealLine></h1>
                <MotionP initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.6 }}>Add a job once. Career Garden tracks the application, researches the company, builds a deadline-based plan and practises the interview with you.</MotionP>
                <MotionDiv className="cg-hero-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.55 }}>
                    <button type="button" className="cg-button cg-button-primary" onClick={onStart}>Add a job <ArrowRight size={16} /></button>
                    <a className="cg-button cg-button-ghost" href="#capture"><Play size={14} fill="currentColor" />See the process</a>
                </MotionDiv>
                <MotionDiv className="cg-trust-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>One role in <i /> A clear plan out</MotionDiv>
            </MotionDiv>

            <MotionDiv className="cg-hero-scene" style={{ x: roomX, y: roomY }} initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 1 }}>
                <picture className="cg-hero-room-media">
                    <source media="(max-width: 560px)" srcSet={workspaceImageSquare} />
                    <img className="cg-hero-room" src={workspaceImage} width="1672" height="941" alt="A warm botanical home office for focused career work" fetchPriority="high" />
                </picture>
                <span className="cg-hero-room-shade" />
                <MotionArticle className="cg-hero-product" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .84, duration: .62, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="cg-hero-product-head">
                        <span className="cg-hero-role-mark">L</span>
                        <div><small>ACTIVE ROLE</small><strong>Product Engineer</strong><em>Linear · Remote</em></div>
                        <span className="cg-hero-deadline">12 days</span>
                    </div>
                    <div className="cg-hero-product-flow" style={{ "--hero-progress": `${phase * 25}%` }}>
                        {PRODUCT_STEPS.map(([label, StepIcon], index) => {
                            const done = phase > index + 1 || phase === 4;
                            const active = phase > 0 && Math.min(phase - 1, 3) === index;
                            return <div className={`${done ? "is-done" : ""} ${active ? "is-active" : ""}`.trim()} key={label}>
                                <span>{done ? <Check size={14} /> : React.createElement(StepIcon, { size: 15 })}</span>
                                <small>{label}</small>
                            </div>;
                        })}
                    </div>
                    <div className="cg-hero-product-status">
                        <span>{phase > 0 && phase < 4 ? <LoaderCircle className="cg-spin" size={14} /> : phase === 4 ? <Check size={14} /> : <BriefcaseBusiness size={14} />}<b>{PHASE_COPY[phase]}</b></span>
                        <button type="button" onClick={runDemo} disabled={phase > 0 && phase < 4}>{phase === 4 ? "Replay" : "Build plan"}<ArrowRight size={13} /></button>
                    </div>
                </MotionArticle>
            </MotionDiv>
        </div>
        <a className="cg-scroll-cue" href="#capture"><span>Follow the full journey</span><ArrowDownRight size={15} /></a>
    </section>;
}
