import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, FileSearch, LoaderCircle, Sparkles } from "lucide-react";
import { Reveal } from "./Motion";

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
        <Reveal className="cg-capture-copy"><span className="cg-kicker cg-kicker-light"><i />Capture</span><h2>Paste the role.<br /><em>We build the workspace.</em></h2><p>One link becomes a role brief, company research and a preparation plan.</p><div className="cg-url-input"><input value={url} onChange={event => setUrl(event.target.value)} aria-label="Job URL" /><button type="button" onClick={run} disabled={!url.trim() || (active >= 0 && active < STEPS.length - 1)}>{active >= 0 && active < STEPS.length - 1 ? <LoaderCircle className="cg-spin" size={15} /> : <ArrowRight size={15} />}Add to Garden</button></div><small>Use any public job link or paste the job description in the app.</small></Reveal>
        <div className="cg-capture-progress"><div className="cg-capture-progress-head"><span><FileSearch size={15} />ROLE CAPTURE</span><strong>{active < 0 ? "Ready" : active === STEPS.length - 1 ? "Complete" : `Step ${active + 1} of ${STEPS.length}`}</strong></div><div className="cg-capture-steps">{STEPS.map((step, index) => <MotionDiv key={step} className={`${index <= active ? "is-active" : ""} ${index < active ? "is-done" : ""}`} animate={{ opacity: index <= active ? 1 : 0.42 }}><span>{index < active || active === STEPS.length - 1 ? <Check size={13} /> : index === active ? <LoaderCircle className="cg-spin" size={13} /> : `0${index + 1}`}</span><b>{step}</b><i><em /></i></MotionDiv>)}</div><AnimatePresence>{active === STEPS.length - 1 && <MotionDiv className="cg-capture-ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={16} /><div><strong>Workspace ready</strong><small>Research · plan · practice</small></div><button type="button" onClick={onStart}>Open <ArrowRight size={13} /></button></MotionDiv>}</AnimatePresence></div>
    </div></section>;
}
