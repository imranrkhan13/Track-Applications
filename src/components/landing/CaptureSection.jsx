import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { Reveal } from "./Motion";
import WorkflowIcon from "./WorkflowIcon";

const MotionDiv = motion.div;
const STEPS = ["Reading job description", "23 requirements identified", "Company research started", "Hiring process found", "Interview workspace created", "14-day plan generated"];

export default function CaptureSection({ onStart }) {
    const [url, setUrl] = useState("https://jobs.company.com/senior-backend-engineer");
    const [active, setActive] = useState(-1);
    const timers = useRef([]);
    const run = () => {
        timers.current.forEach(clearTimeout);
        setActive(0);
        timers.current = STEPS.slice(1).map((_, index) => setTimeout(() => setActive(index + 1), (index + 1) * 430));
    };
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    return <section className="cg-section cg-capture" id="capture"><div className="cg-shell cg-capture-grid">
        <Reveal className="cg-capture-copy"><span className="cg-kicker cg-kicker-light"><i />Step 01 · Add a role</span><h2>One link.<br /><em>Clear direction.</em></h2><p>Paste a public job link or the job description. Career Garden turns it into a role brief, company research and a plan that fits your interview date.</p><div className="cg-url-input"><input value={url} onChange={event => setUrl(event.target.value)} aria-label="Job URL" /><button type="button" onClick={run} disabled={!url.trim() || (active >= 0 && active < STEPS.length - 1)}>{active >= 0 && active < STEPS.length - 1 ? <LoaderCircle className="cg-spin" size={15} /> : <ArrowRight size={15} />}Add role</button></div><small>Nothing is saved until you review it.</small></Reveal>
        <div className="cg-capture-progress"><div className="cg-capture-progress-head"><span><i />ROLE INTELLIGENCE ENGINE</span><strong>{active < 0 ? "Waiting for a role" : active === STEPS.length - 1 ? "Workspace complete" : `Building · ${active + 1}/${STEPS.length}`}</strong></div><div className="cg-capture-steps">{STEPS.map((step, index) => <MotionDiv key={step} className={`${index <= active ? "is-active" : ""} ${index < active ? "is-done" : ""}`} animate={{ opacity: index <= active ? 1 : 0.38, x: index === active ? 4 : 0 }}><WorkflowIcon stage={index} label={step} /><div><small>0{index + 1}</small><b>{step}</b></div><i><em /></i><span className="cg-capture-state">{index < active || active === STEPS.length - 1 ? <Check size={12} /> : index === active ? <LoaderCircle className="cg-spin" size={12} /> : "Queued"}</span></MotionDiv>)}</div><AnimatePresence>{active === STEPS.length - 1 && <MotionDiv className="cg-capture-ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={16} /><div><strong>Your interview workspace is ready</strong><small>Role brief · company map · 14-day plan</small></div><button type="button" onClick={onStart}>Open workspace <ArrowRight size={13} /></button></MotionDiv>}</AnimatePresence></div>
    </div></section>;
}
