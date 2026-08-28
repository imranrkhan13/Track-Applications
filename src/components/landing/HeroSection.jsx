import React from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Sprout } from "lucide-react";
import workspaceImage from "../../assets/career-garden-workspace.jpeg";

export default function HeroSection({ onStart }) {
    return <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-hero-media"><img src={workspaceImage} width="1600" height="1600" alt="Botanical workspace ready for focused career preparation" fetchPriority="high" /><span className="landing-hero-overlay" /></div>
        <div className="landing-hero-content landing-container"><div className="landing-hero-copy" data-reveal="hero"><span className="landing-eyebrow landing-eyebrow-light"><i />Career Garden</span><span className="landing-hero-index">01 / HERO</span><h1 id="hero-title">Track the role.<br /><em>Grow your career.</em></h1><p>Save a job. See the next step. Prepare with purpose.</p><div className="landing-hero-actions"><button type="button" className="landing-primary-button landing-button-light" onClick={onStart}>Start free <ArrowRight size={15} /></button><a className="landing-hero-secondary" href="#growth">See the six stages <ArrowRight size={14} /></a></div><div className="landing-hero-proof"><span><CheckCircle2 size={14} />One simple workspace</span><span><Sprout size={14} />Six clear stages</span></div></div></div>
        <div className="landing-float-card landing-float-health" data-reveal="float"><span>GARDEN HEALTH</span><strong>74%</strong><i><em /></i></div><div className="landing-float-card landing-float-next" data-reveal="float"><span><CalendarDays size={12} /> NEXT ACTION</span><strong>Practice now</strong><small>20 minutes</small></div>
    </section>;
}
