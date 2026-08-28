import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Building2, FileSearch, Route, SearchCheck, Target } from "lucide-react";
import { fadeUp, stagger, VIEWPORT } from "./Motion";

const MotionDiv = motion.div;
const NODES = [[FileSearch, "JOB URL", "Source captured"], [SearchCheck, "JD ANALYSIS", "23 requirements"], [Building2, "COMPANY RESEARCH", "Public signals"], [BrainCircuit, "HIRING INTELLIGENCE", "Process patterns"], [Target, "SKILL GAP", "Priority areas"], [Route, "INTERVIEW PLAN", "14 days"]];

export default function IntelligenceSection() {
    return <section className="cg-section cg-intelligence" id="intelligence"><div className="cg-shell"><div className="cg-section-head"><div><span className="cg-kicker"><i />Intelligence</span><h2>From job link<br /><em>to clear direction.</em></h2></div><p>Each step activates in order, using the role and demo data—not invented company claims.</p></div><MotionDiv className="cg-intelligence-flow" variants={stagger} initial="hidden" whileInView="visible" viewport={VIEWPORT}>{NODES.map(([Icon, label, detail], index) => <React.Fragment key={label}><MotionDiv className="cg-intelligence-node" variants={fadeUp}><span>{React.createElement(Icon, { size: 20 })}</span><small>0{index + 1}</small><strong>{label}</strong><em>{detail}</em></MotionDiv>{index < NODES.length - 1 && <MotionDiv className="cg-intelligence-line" variants={fadeUp}><i /></MotionDiv>}</React.Fragment>)}</MotionDiv></div></section>;
}
