import React from "react";
import { ArrowRight, Brain, CheckCircle2, Sprout, Target } from "lucide-react";
import SectionContainer from "./SectionContainer";

const STEPS = [["01", "PLANT", "Paste a job URL.", "Career Garden captures the job description and company information.", Sprout], ["02", "UNDERSTAND", "Know what the role asks for.", "AI analyzes the role, requirements, and candidate fit.", Brain], ["03", "PREPARE", "Build a focused plan.", "Career Garden creates a personalized interview room and study plan.", Target], ["04", "GROW", "Move with confidence.", "Track interviews, practice the right questions, and record outcomes.", CheckCircle2]];

export default function HowItWorks({ onStart }) {
    return <SectionContainer id="how-it-works" variant="cream" className="landing-how-section" eyebrow="07 / HOW IT WORKS" title={<>A simple system<br /><em>for serious preparation.</em></>} description="One opportunity becomes one clear route: save it, understand it, prepare for it, and keep the lesson."><div className="landing-how-grid">{STEPS.map(([number, name, title, copy, Icon]) => <article key={name}><div className="landing-how-top"><span>{number}</span>{React.createElement(Icon, { size: 20 })}</div><div className="landing-how-visual"><span /><i /><b /></div><small>{name}</small><h3>{title}</h3><p>{copy}</p></article>)}</div><button type="button" className="landing-text-button landing-how-cta" onClick={onStart}>Start with one role <ArrowRight size={14} /></button></SectionContainer>;
}
