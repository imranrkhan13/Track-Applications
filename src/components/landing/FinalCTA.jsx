import React from "react";
import { ArrowRight, Sprout } from "lucide-react";
import SectionContainer from "./SectionContainer";

export default function FinalCTA({ onStart }) {
    return <SectionContainer id="start" variant="forest" className="landing-final-cta"><div className="landing-final-cta-inner"><div><span className="landing-eyebrow landing-eyebrow-light"><i />12 / START HERE</span><h2>Start with<br /><em>one role.</em></h2><p>Track it. Prepare. Grow.</p><button type="button" className="landing-primary-button landing-button-light" onClick={onStart}>Start free <ArrowRight size={15} /></button></div><div className="landing-final-plant"><span /><Sprout size={98} strokeWidth={1.1} /></div></div></SectionContainer>;
}
