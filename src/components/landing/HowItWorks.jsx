import React from "react";
import { ArrowRight, Brain, CheckCircle2, Sprout, Target } from "lucide-react";
import SectionContainer from "./SectionContainer";

const STEPS = [["01", "PLANT", "Paste the job.", "Save the role.", Sprout], ["02", "UNDERSTAND", "See what matters.", "Know the skills.", Brain], ["03", "PREPARE", "Practice the gaps.", "Follow your plan.", Target], ["04", "GROW", "Show up ready.", "Track your progress.", CheckCircle2]];

export default function HowItWorks({ onStart }) {
    return <SectionContainer id="how-it-works" variant="cream" className="landing-how-section" eyebrow="07 / HOW IT WORKS" title={<>From role<br /><em>to ready.</em></>} description="Four small steps."><div className="landing-how-grid" data-stagger>{STEPS.map(([number, name, title, copy, Icon]) => <article key={name}><div className="landing-how-top"><span>{number}</span>{React.createElement(Icon, { size: 20 })}</div><div className="landing-how-visual"><span /><i /><b /></div><small>{name}</small><h3>{title}</h3><p>{copy}</p></article>)}</div><button type="button" className="landing-text-button landing-how-cta" onClick={onStart}>Start with one role <ArrowRight size={14} /></button></SectionContainer>;
}
