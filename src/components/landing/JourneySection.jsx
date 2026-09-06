import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, CirclePause, CirclePlay, Sparkles } from "lucide-react";
import PlantSprite from "./PlantSprite";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const STAGES = [
    { name: "SEED", status: "Saved", copy: "A role worth exploring is now in one place.", detail: "Link, deadline and job description stay together.", action: "Check the fit before you apply.", color: "#c8ea72" },
    { name: "SPROUT", status: "Applied", copy: "Your application is in motion.", detail: "The date is tracked and the follow-up is clear.", action: "Prepare while the application grows.", color: "#a9d986" },
    { name: "SAPLING", status: "Under review", copy: "The company is taking a closer look.", detail: "Hiring process, role signals and likely skills are mapped.", action: "Learn the gaps in your role plan.", color: "#8fc77f" },
    { name: "BRANCH", status: "Interview", copy: "It is time to turn research into answers.", detail: "Your preparation plan and mock interview room are ready.", action: "Practise the next interview round.", color: "#e4bb6a" },
    { name: "BLOOM", status: "Offer", copy: "The opportunity bloomed.", detail: "Compare the offer and keep the proof that worked.", action: "Review the decision with clarity.", color: "#f0d28e" },
    { name: "DORMANT", status: "Closed", copy: "This role ended. The progress did not.", detail: "Feedback and lessons stay ready for the next role.", action: "Carry the learning forward.", color: "#b8ab80" },
];

export default function JourneySection({ onStart }) {
    const sectionRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = useReducedMotion();
    const isInView = useInView(sectionRef, { amount: 0.35 });

    useEffect(() => {
        if (!isInView || reducedMotion || paused) return undefined;
        const timer = window.setInterval(() => setActiveIndex(current => (current + 1) % STAGES.length), 2400);
        return () => window.clearInterval(timer);
    }, [isInView, paused, reducedMotion]);

    const active = STAGES[activeIndex];
    const selectStage = index => {
        setActiveIndex(index);
        setPaused(true);
    };

    return <section className="cg-journey" id="journey" ref={sectionRef}>
        <div className="cg-journey-sticky">
            <div className="cg-shell cg-journey-heading">
                <div><span className="cg-kicker cg-kicker-light"><i />The application journey</span><h2>See where it is.<br /><em>Know what comes next.</em></h2></div>
                <div className="cg-journey-heading-side"><p>Every role moves through six clear stages. Career Garden changes the plan as the role grows.</p><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play plant animation" : "Pause plant animation"}>{paused ? <CirclePlay size={15} /> : <CirclePause size={15} />}{paused ? "Play the journey" : "Pause animation"}</button></div>
            </div>

            <div className="cg-shell cg-journey-board">
                <div className="cg-journey-progress" aria-hidden="true"><MotionDiv animate={{ width: `${((activeIndex + 1) / STAGES.length) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} /></div>
                <div className="cg-journey-stage">
                    <aside className="cg-journey-role">
                        <span className="cg-journey-index">YOUR ROLE</span>
                        <div className="cg-journey-company"><span>N</span><div><strong>Product Engineer</strong><small>Northstar Labs · Remote</small></div></div>
                        <dl><div><dt><BriefcaseBusiness size={13} />Job type</dt><dd>Full-time</dd></div><div><dt><CalendarDays size={13} />Deadline</dt><dd>12 days</dd></div><div><dt><Sparkles size={13} />Plan</dt><dd>Ready</dd></div></dl>
                        <button type="button" onClick={onStart}>Add your first role <ArrowRight size={14} /></button>
                    </aside>

                    <div className="cg-journey-plant-wrap" aria-live="polite">
                        <span className="cg-journey-halo" />
                        <AnimatePresence initial={false}>
                            <MotionDiv key={activeIndex} initial={{ opacity: 0, scale: 0.93, y: 22, filter: "blur(5px)" }} animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.04, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }} className="cg-journey-plant-motion">
                                <PlantSprite stage={activeIndex} className="cg-journey-plant" label={`${active.name}: ${active.status}`} />
                            </MotionDiv>
                        </AnimatePresence>
                        <span className="cg-journey-soil" />
                    </div>

                    <aside className="cg-journey-status">
                        <span className="cg-journey-index">STAGE 0{activeIndex + 1} / 06</span>
                        <AnimatePresence mode="wait"><MotionDiv key={active.name} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.38 }}>
                            <small style={{ color: active.color }}>{active.name}</small><h3>{active.status}</h3><p>{active.copy}</p><span>{active.detail}</span>
                            <div className="cg-journey-next"><Check size={14} /><div><small>YOUR NEXT MOVE</small><strong>{active.action}</strong></div></div>
                        </MotionDiv></AnimatePresence>
                    </aside>
                </div>

                <div className="cg-stage-rail" aria-label="Application stages">{STAGES.map((stage, index) => <MotionButton type="button" key={stage.name} className={activeIndex === index ? "is-active" : ""} onClick={() => selectStage(index)} whileTap={{ scale: 0.98 }} aria-pressed={activeIndex === index}><span>0{index + 1}</span><b>{stage.name}</b><small>{stage.status}</small></MotionButton>)}</div>
            </div>
        </div>
    </section>;
}
