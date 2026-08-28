import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, Code2, FileSearch, Hash, MessageSquareText, Network, Sparkles, Target } from "lucide-react";
import { ScaleReveal } from "./Motion";

const MotionSpan = motion.span;
const MESSAGE = "Your technical interview is in 12 days.\nBased on the role, system design should be your highest priority.";
const TOPICS = ["Distributed Systems", "Caching", "PostgreSQL", "AWS", "API Scaling"];
const CHANNELS = [["OVERVIEW", [[Hash, "overview"]]], ["RESEARCH", [[FileSearch, "company"], [FileSearch, "job-description"], [Network, "hiring-process"]]], ["PRACTICE", [[Code2, "coding"], [Target, "system-design"], [MessageSquareText, "behavioral"]]]];

export default function InterviewPrepSection({ onStart }) {
    const ref = useRef(null);
    const visible = useInView(ref, { once: true, amount: 0.3 });
    const [typed, setTyped] = useState("");
    useEffect(() => {
        if (!visible) return undefined;
        let index = 0;
        const interval = setInterval(() => {
            index += 2;
            setTyped(MESSAGE.slice(0, index));
            if (index >= MESSAGE.length) clearInterval(interval);
        }, 18);
        return () => clearInterval(interval);
    }, [visible]);

    return <section className="cg-section cg-prep" id="interview-prep" ref={ref}><div className="cg-shell"><div className="cg-section-head cg-section-head-dark"><div><span className="cg-kicker cg-kicker-light"><i />Interview Prep</span><h2>Know the room<br /><em>before you walk in.</em></h2></div><p>Research the role, find the gaps and practice what your interview will actually test.</p></div>
        <ScaleReveal className="cg-prep-frame"><header><div className="cg-prep-company"><span>G</span><div><strong>Google · Senior Backend Engineer</strong><small>Interview workspace · Demo data</small></div></div><div className="cg-prep-header-status"><span><i />Research complete</span><b>74% ready</b></div></header><div className="cg-prep-layout">
            <aside className="cg-prep-channels">{CHANNELS.map(([group, channels]) => <div key={group}><small>{group}</small>{channels.map(([Icon, label]) => <button type="button" className={label === "system-design" ? "is-active" : ""} key={label}>{React.createElement(Icon, { size: 14 })}{label}</button>)}</div>)}</aside>
            <main className="cg-prep-chat"><div className="cg-prep-chat-head"><span><Hash size={15} />system-design</span><small>Role-specific practice</small></div><div className="cg-coach-message"><span className="cg-coach-avatar"><Sparkles size={15} /></span><div><strong>Career Garden Coach <small>now</small></strong><p>{typed}{typed.length < MESSAGE.length && <i />}</p>{typed.length >= MESSAGE.length && <div className="cg-topic-chips">{TOPICS.map((topic, index) => <MotionSpan initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} key={topic}>{topic}</MotionSpan>)}</div>}<button type="button" onClick={onStart}>Start interview <ArrowRight size={14} /></button></div></div><div className="cg-prep-compose">Ask the coach or add a note… <kbd>⌘ ↵</kbd></div></main>
            <aside className="cg-prep-research"><div className="cg-prep-countdown"><small>INTERVIEW</small><strong>12 <em>days</em></strong><span>remaining</span></div>{[["JD analyzed", "100%"], ["Company profile", "100%"], ["Hiring process", "82%"], ["Interview topics", "27"], ["Question bank", "64"], ["14-day plan", "Ready"]].map(([label, value]) => <div className="cg-research-row" key={label}><span>{label}</span><b>{value}</b>{value.includes("%") && <i><em style={{ width: value }} /></i>}</div>)}<small className="cg-demo-disclaimer"><Check size={11} />Demo data only</small></aside>
        </div></ScaleReveal>
    </div></section>;
}
