import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDown, ArrowUp, CalendarRange, RefreshCw } from "lucide-react";
import { Reveal } from "./Motion";

const MotionDiv = motion.div;
const DAYS = ["Company + JD", "Python / Backend", "Django", "PostgreSQL", "Redis", "System Design", "Coding", "AWS", "Behavioral", "Technical Mock", "System Design Mock", "Final Review"];
const SKILLS = [["Python", 91, 76], ["Django", 88, 72], ["AWS", 51, 78], ["System Design", 59, 84]];

export default function PlanSection() {
    const ref = useRef(null);
    const visible = useInView(ref, { once: true, amount: 0.3 });
    const [adapted, setAdapted] = useState(false);
    useEffect(() => {
        if (!visible) return undefined;
        const timer = setTimeout(() => setAdapted(true), 1500);
        return () => clearTimeout(timer);
    }, [visible]);
    return <section className="cg-section cg-plan" id="plan" ref={ref}><div className="cg-shell cg-plan-grid"><Reveal className="cg-plan-copy"><span className="cg-kicker"><i />Adaptive plan</span><h2>A plan built around<br /><em>your interview date.</em></h2><p>Career Garden shifts time toward the skills that need it most.</p><div className="cg-plan-skills">{SKILLS.map(([skill, before, after]) => { const score = adapted ? after : before; const rises = after > before; return <div key={skill}><span>{skill}<b>{score}%</b></span><i><MotionDiv animate={{ width: `${score}%` }} transition={{ duration: 0.7 }} /></i><small className={rises ? "up" : "down"}>{adapted ? rises ? <><ArrowUp size={11} />more time</> : <><ArrowDown size={11} />less time</> : "Current confidence"}</small></div>; })}</div><button type="button" className="cg-plan-update" onClick={() => setAdapted(value => !value)}><RefreshCw size={14} />{adapted ? "Plan updated" : "Adapt plan"}</button><span className="cg-plan-message">Your plan adapts as you improve.</span></Reveal>
        <div className="cg-plan-calendar"><header><div><span><CalendarRange size={15} />12 DAYS REMAINING</span><strong>Google interview plan</strong></div><small>AUG 29 — SEP 09</small></header><div className="cg-plan-line"><MotionDiv initial={{ scaleX: 0 }} animate={visible ? { scaleX: 1 } : {}} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} /></div><div className="cg-plan-days">{DAYS.map((item, index) => <MotionDiv key={item} initial={{ opacity: 0, y: 12 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.12 + index * 0.055 }} className={adapted && [5, 7, 10].includes(index) ? "is-priority" : ""}><span>DAY {String(index + 1).padStart(2, "0")}</span><b>{item}</b><small>{[5, 7, 10].includes(index) ? "Priority" : index > 8 ? "Practice" : "Learn"}</small></MotionDiv>)}</div></div>
    </div></section>;
}
