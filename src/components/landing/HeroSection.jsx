import React from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Sprout } from "lucide-react";
import workspaceImage from "../../assets/career-garden-workspace.jpeg";

export default function HeroSection({ onStart }) {
    return <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-hero-media"><img src={workspaceImage} width="1600" height="1600" alt="Botanical workspace ready for focused career preparation" fetchPriority="high" /><span className="landing-hero-overlay" /></div>
        <div className="landing-hero-content landing-container"><div className="landing-hero-copy"><span className="landing-eyebrow landing-eyebrow-light"><i />Career Garden</span><span className="landing-hero-index">01 / HERO</span><h1 id="hero-title">Plant the opportunity.<br /><em>Grow the career.</em></h1><p>Track every application, prepare for every interview, and turn your job search into a career system that keeps growing.</p><div className="landing-hero-actions"><button type="button" className="landing-primary-button landing-button-light" onClick={onStart}>Start your garden <ArrowRight size={15} /></button><a className="landing-hero-secondary" href="#growth">See how it works <ArrowRight size={14} /></a></div><div className="landing-hero-proof"><span><CheckCircle2 size={14} />One place for every role</span><span><Sprout size={14} />Six clear stages</span></div></div></div>
        <div className="landing-float-card landing-float-health"><span>GARDEN HEALTH</span><strong>74%</strong><i><em /></i></div><div className="landing-float-card landing-float-next"><span><CalendarDays size={12} /> NEXT ACTION</span><strong>Practice an answer</strong><small>20 minutes · Role prep</small></div>
    </section>;
}
