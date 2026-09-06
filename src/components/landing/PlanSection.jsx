import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowDown, ArrowUp, BookOpenCheck, BrainCircuit, CalendarRange, Hammer, MessagesSquare, RefreshCw, SearchCheck } from "lucide-react";
import { Reveal } from "./Motion";

const MotionDiv = motion.div;
const DAYS = ["Company + JD", "Python / Backend", "Django", "PostgreSQL", "Redis", "System Design", "Coding", "AWS", "Behavioral", "Technical Mock", "System Design Mock", "Final Review"];
const SKILLS = [["Python", 91, 76], ["Django", 88, 72], ["AWS", 51, 78], ["System Design", 59, 84]];
const METHODS = [
    { icon: SearchCheck, title: "Understand", copy: "Read the role, company and likely hiring process before deciding what to study.", output: "Role brief", items: ["JD requirements", "Company map", "Hiring stages"] },
    { icon: BrainCircuit, title: "Prioritise", copy: "Compare the role with your current skills and focus on the gaps most likely to be tested.", output: "Priority map", items: ["Skill-gap score", "Interview weight", "Daily targets"] },
    { icon: BookOpenCheck, title: "Learn", copy: "Follow short, free resources for the concepts that matter to this specific interview.", output: "Learning path", items: ["Official docs", "Short videos", "Practice sets"] },
    { icon: Hammer, title: "Build proof", copy: "Turn the important skills into a small role-matched project you can discuss with confidence.", output: "Proof project", items: ["Project brief", "Build checklist", "Talking points"] },
    { icon: MessagesSquare, title: "Practise", copy: "Rehearse coding, system design and behavioural rounds, then improve from feedback.", output: "Interview reps", items: ["Technical mock", "System design", "STAR stories"] },
];

export default function PlanSection() {
    const ref = useRef(null);
    const visible = useInView(ref, { once: true, amount: 0.2 });
    const [adapted, setAdapted] = useState(false);
    const [method, setMethod] = useState(0);
    const activeMethod = METHODS[method];

    useEffect(() => {
        if (!visible) return undefined;
        const timer = setTimeout(() => setAdapted(true), 1500);
        return () => clearTimeout(timer);
    }, [visible]);

    return <section className="cg-section cg-plan" id="plan" ref={ref}><div className="cg-shell">
        <div className="cg-section-head cg-plan-head"><div><span className="cg-kicker"><i />Step 04 · Your preparation method</span><h2>Know what to do.<br /><em>Every day until the interview.</em></h2></div><p>Career Garden turns one job into a practical route from research to confident interview practice.</p></div>

        <Reveal className="cg-method-frame">
            <nav aria-label="Preparation method">{METHODS.map((item, index) => { const Icon = item.icon; return <button type="button" key={item.title} className={method === index ? "is-active" : ""} onClick={() => setMethod(index)} aria-pressed={method === index}><span>0{index + 1}</span><Icon size={18} /><b>{item.title}</b></button>; })}</nav>
            <AnimatePresence mode="wait"><MotionDiv className="cg-method-detail" key={activeMethod.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <span className="cg-method-icon">{React.createElement(activeMethod.icon, { size: 24 })}</span>
                <div><small>METHOD {String(method + 1).padStart(2, "0")}</small><h3>{activeMethod.title}</h3><p>{activeMethod.copy}</p></div>
                <div className="cg-method-output"><small>YOU GET</small><strong>{activeMethod.output}</strong><ul>{activeMethod.items.map(item => <li key={item}>{item}</li>)}</ul></div>
            </MotionDiv></AnimatePresence>
        </Reveal>

        <div className="cg-plan-grid"><Reveal className="cg-plan-copy"><span className="cg-kicker"><i />Adapts with you</span><h3>Time goes where<br />it matters most.</h3><p>As you improve, weaker areas get more time and strong areas move into review.</p><div className="cg-plan-skills">{SKILLS.map(([skill, before, after]) => { const score = adapted ? after : before; const rises = after > before; return <div key={skill}><span>{skill}<b>{score}%</b></span><i><MotionDiv animate={{ width: `${score}%` }} transition={{ duration: 0.7 }} /></i><small className={rises ? "up" : "down"}>{adapted ? rises ? <><ArrowUp size={11} />more time</> : <><ArrowDown size={11} />less time</> : "Current confidence"}</small></div>; })}</div><button type="button" className="cg-plan-update" onClick={() => setAdapted(value => !value)}><RefreshCw size={14} />{adapted ? "Plan adapted" : "Adapt the plan"}</button><span className="cg-plan-message">The deadline stays fixed. The route adjusts.</span></Reveal>
            <div className="cg-plan-calendar"><header><div><span><CalendarRange size={15} />12 DAYS REMAINING</span><strong>Google interview plan</strong></div><small>AUG 29 — SEP 09</small></header><div className="cg-plan-line"><MotionDiv initial={{ scaleX: 0 }} animate={visible ? { scaleX: 1 } : {}} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} /></div><div className="cg-plan-days">{DAYS.map((item, index) => <MotionDiv key={item} initial={{ opacity: 0, y: 12 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.12 + index * 0.055 }} className={adapted && [5, 7, 10].includes(index) ? "is-priority" : ""}><span>DAY {String(index + 1).padStart(2, "0")}</span><b>{item}</b><small>{[5, 7, 10].includes(index) ? "Priority" : index > 8 ? "Practise" : "Learn"}</small></MotionDiv>)}</div></div>
        </div>
    </div></section>;
}
