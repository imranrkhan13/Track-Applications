import React from "react";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";
import SectionContainer from "./SectionContainer";

const FEATURES = ["Company signals", "JD skills", "Hiring steps", "Practice questions", "Skill gaps", "Mock interviews", "Daily tasks", "Deadline plan"];

export default function InterviewPrep({ onStart }) {
    return <SectionContainer id="interview-prep" variant="cream" className="landing-interview-section"><div className="landing-two-column landing-interview-layout"><div className="landing-video-slot" data-reveal="video" aria-label="Video placeholder for your Career Garden walkthrough"><div className="landing-video-slot-glow" /><button type="button" className="landing-video-play" aria-label="Video placeholder" onClick={onStart}><Play size={23} fill="currentColor" /></button><div className="landing-video-slot-copy"><span>VIDEO / 01</span><strong>Your walkthrough</strong><small>Add your recording here</small></div><div className="landing-video-slot-corner">16:9</div></div><div className="landing-interview-copy"><span className="landing-eyebrow">05 / INTERVIEW PREP</span><h2>Prepare<br /><em>with a plan.</em></h2><p>Research, practice, and get ready for the exact role.</p><div className="landing-feature-list" data-stagger>{FEATURES.map(feature => <span key={feature}><CheckCircle2 size={15} />{feature}</span>)}</div><button type="button" className="landing-outline-button" onClick={onStart}>Open prep <ArrowRight size={14} /></button></div></div></SectionContainer>;
}
