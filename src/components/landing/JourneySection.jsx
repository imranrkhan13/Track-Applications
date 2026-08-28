import React, { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Leaf, Sparkles } from "lucide-react";
import PlantSprite from "./PlantSprite";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const STAGES = [
    { name: "SEED", status: "Saved", copy: "You found a role worth exploring.", detail: "The opportunity has a place to grow.", color: "#c8ea72" },
    { name: "SPROUT", status: "Applied", copy: "Your application is in motion.", detail: "Track the date and your next move.", color: "#a9d986" },
    { name: "SAPLING", status: "Under Review", copy: "The team is taking a closer look.", detail: "Company signals and role requirements are ready.", color: "#8fc77f" },
    { name: "BRANCHING", status: "Interview", copy: "Conversations open new paths.", detail: "Your interview room and preparation plan are active.", color: "#e4bb6a" },
    { name: "BLOOM", status: "Offer", copy: "The opportunity bloomed.", detail: "Keep the proof that helped you get here.", color: "#f0d28e" },
    { name: "DORMANT", status: "Rejected", copy: "The opportunity ended. The experience remains.", detail: "Save the lesson and carry it forward.", color: "#b8ab80" },
];

export default function JourneySection({ onStart }) {
    const sectionRef = useRef(null);
    const [step, setStep] = useState(0);
    const [outcome, setOutcome] = useState("bloom");
    const reducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    useMotionValueEvent(scrollYProgress, "change", value => {
        if (reducedMotion) return;
        setStep(Math.min(4, Math.floor(value * 5)));
    });

    const activeIndex = step < 4 ? step : outcome === "bloom" ? 4 : 5;
    const active = STAGES[activeIndex];

    return <section className="cg-journey" id="journey" ref={sectionRef}>
        <div className="cg-journey-sticky">
            <div className="cg-shell cg-journey-heading">
                <div><span className="cg-kicker cg-kicker-light"><i />Your application journey</span><h2>One opportunity.<br /><em>A whole journey.</em></h2></div>
                <p>Scroll to grow the same opportunity from a saved role to an interview—and then to an outcome.</p>
            </div>

            <div className="cg-shell cg-journey-stage">
                <aside className="cg-journey-role">
                    <span className="cg-journey-index">ROLE / 01</span>
                    <div className="cg-journey-company"><span>G</span><div><strong>Senior Backend Engineer</strong><small>Google · Bengaluru</small></div></div>
                    <dl><div><dt><BriefcaseBusiness size={13} />Type</dt><dd>Full-time</dd></div><div><dt><CalendarDays size={13} />Interview</dt><dd>12 days</dd></div><div><dt><Sparkles size={13} />Readiness</dt><dd>74%</dd></div></dl>
                    <button type="button" onClick={onStart}>Open role <ArrowRight size={14} /></button>
                </aside>

                <div className="cg-journey-plant-wrap">
                    <span className="cg-journey-halo" />
                    <AnimatePresence mode="wait">
                        <MotionDiv key={activeIndex} initial={{ opacity: 0, scale: 0.92, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.04, y: -14 }} transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }} className="cg-journey-plant-motion">
                            <PlantSprite stage={activeIndex} className="cg-journey-plant" label={`${active.name}: ${active.status}`} />
                        </MotionDiv>
                    </AnimatePresence>
                    <span className="cg-journey-soil" />
                </div>

                <aside className="cg-journey-status">
                    <span className="cg-journey-index">0{activeIndex + 1} / 06</span>
                    <AnimatePresence mode="wait"><MotionDiv key={active.name} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.42 }}>
                        <small style={{ color: active.color }}>{active.name}</small><h3>{active.status}</h3><p>{active.copy}</p><span>{active.detail}</span>
                    </MotionDiv></AnimatePresence>
                    {step >= 4 && <div className="cg-outcome-switch" aria-label="Choose outcome"><MotionButton type="button" className={outcome === "bloom" ? "is-active" : ""} onClick={() => setOutcome("bloom")} whileTap={{ scale: 0.97 }}><Sparkles size={14} />Bloom <small>Offer</small></MotionButton><MotionButton type="button" className={outcome === "dormant" ? "is-active" : ""} onClick={() => setOutcome("dormant")} whileTap={{ scale: 0.97 }}><Leaf size={14} />Dormant <small>Rejected</small></MotionButton></div>}
                </aside>
            </div>

            <div className="cg-shell cg-stage-rail" aria-label="Application stages">{STAGES.slice(0, 4).map((stage, index) => <button type="button" key={stage.name} className={activeIndex === index ? "is-active" : ""} onClick={() => setStep(index)}><span>0{index + 1}</span><b>{stage.name}</b><small>{stage.status}</small></button>)}<span className="cg-stage-branch" /><button type="button" className={activeIndex === 4 ? "is-active" : ""} onClick={() => { setStep(4); setOutcome("bloom"); }}><span>05</span><b>BLOOM</b><small>Offer</small></button><button type="button" className={activeIndex === 5 ? "is-active" : ""} onClick={() => { setStep(4); setOutcome("dormant"); }}><span>06</span><b>DORMANT</b><small>Rejected</small></button></div>
        </div>
    </section>;
}
