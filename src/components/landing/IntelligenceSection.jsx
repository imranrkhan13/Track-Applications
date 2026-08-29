import React from "react";
import { motion } from "framer-motion";
import { fadeUp, stagger, VIEWPORT } from "./Motion";
import WorkflowIcon from "./WorkflowIcon";

const MotionDiv = motion.div;
const NODES = [["CAPTURE", "Job link", "Source locked"], ["UNDERSTAND", "Role brief", "23 requirements"], ["RESEARCH", "Company map", "Public signals"], ["DECODE", "Hiring path", "Process patterns"], ["FOCUS", "Skill gaps", "Priority areas"], ["PREPARE", "Interview plan", "14 focused days"]];

export default function IntelligenceSection() {
    return <section className="cg-section cg-intelligence" id="intelligence"><div className="cg-shell"><div className="cg-section-head cg-intelligence-head"><div><span className="cg-kicker"><i />From link to plan</span><h2>One role in.<br /><em>A clear plan out.</em></h2></div><p>Review the extracted role, available company signals and preparation priorities before your schedule is created.</p></div>
        <MotionDiv className="cg-intelligence-frame" variants={stagger} initial="hidden" whileInView="visible" viewport={VIEWPORT}>
            <div className="cg-intelligence-signal"><span>JOB LINK</span><i><b /></i><strong>INTERVIEW-READY</strong></div>
            <div className="cg-intelligence-flow">{NODES.map(([eyebrow, label, detail], index) => <MotionDiv className="cg-intelligence-node" variants={fadeUp} key={label}><WorkflowIcon stage={index} label={`${label}: ${detail}`} /><small>0{index + 1} · {eyebrow}</small><strong>{label}</strong><em>{detail}</em></MotionDiv>)}</div>
            <div className="cg-intelligence-result"><span><i />Live transformation</span><strong>A role you understand. A plan you can follow.</strong><small>Demo flow · research is based on available public information</small></div>
        </MotionDiv>
    </div></section>;
}
