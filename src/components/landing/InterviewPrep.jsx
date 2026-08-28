import React from "react";
import { ArrowRight, CheckCircle2, Search, Sparkles } from "lucide-react";
import SectionContainer from "./SectionContainer";
import workspaceImage from "../../assets/career-garden-workspace.jpeg";

const FEATURES = ["Company research", "Job description analysis", "Hiring process", "Reported interview questions", "Skill gap analysis", "Personalized practice", "Mock interviews", "1–3 week preparation plan"];

export default function InterviewPrep({ onStart }) {
    return <SectionContainer id="interview-prep" variant="cream" className="landing-interview-section"><div className="landing-two-column landing-interview-layout"><div className="landing-interview-visual"><img src={workspaceImage} width="1600" height="1600" alt="A calm botanical desk for interview preparation" loading="lazy" /><span className="landing-interview-visual-overlay" /><div className="landing-interview-label"><span>05 / INTERVIEW PREP</span><strong>Do the work<br />before the room.</strong></div><div className="landing-interview-readout"><span><Sparkles size={12} /> ROLE READINESS</span><strong>74%</strong><i><em /></i></div></div><div className="landing-interview-copy"><span className="landing-eyebrow">05 / INTERVIEW PREP</span><h2>Don’t just track the interview.<br /><em>Prepare for it.</em></h2><p>Every application gets a dedicated preparation workspace. Career Garden analyzes the job description, researches the company, studies public hiring information, and builds a plan around that exact role.</p><div className="landing-feature-list">{FEATURES.map(feature => <span key={feature}><CheckCircle2 size={15} />{feature}</span>)}</div><button type="button" className="landing-outline-button" onClick={onStart}>Explore Interview Prep <ArrowRight size={14} /></button></div></div></SectionContainer>;
}
