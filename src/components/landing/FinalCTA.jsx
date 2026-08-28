import React from "react";
import { ArrowRight, Sprout } from "lucide-react";
import SectionContainer from "./SectionContainer";

export default function FinalCTA({ onStart }) {
    return <SectionContainer id="start" variant="forest" className="landing-final-cta"><div className="landing-final-cta-inner"><div><span className="landing-eyebrow landing-eyebrow-light"><i />12 / START HERE</span><h2>Your next opportunity<br /><em>starts with one seed.</em></h2><p>Build a calmer, smarter system for your job search.</p><button type="button" className="landing-primary-button landing-button-light" onClick={onStart}>Start your garden <ArrowRight size={15} /></button></div><div className="landing-final-plant"><span /><Sprout size={98} strokeWidth={1.1} /></div></div></SectionContainer>;
}
