import React from "react";
import { ArrowRight, Check, Sprout } from "lucide-react";
import SectionContainer from "./SectionContainer";
import { SAMPLE_APPLICATIONS } from "./landingData";
import StageIcon from "../../StageIcon";

export default function ProductIntro({ onStart }) {
    return <SectionContainer id="product" variant="cream" className="landing-product-intro"><div className="landing-two-column landing-product-layout"><div className="landing-product-copy"><span className="landing-eyebrow">02 / YOUR CAREER GARDEN</span><h2>Every role<br /><em>in one place.</em></h2><p>Track the job. Find the next step. Keep moving.</p><div className="landing-check-list"><span><Check size={15} />Track the role</span><span><Check size={15} />Research the company</span><span><Check size={15} />Prepare for the interview</span></div><button type="button" className="landing-text-button" onClick={onStart}>Add a role <ArrowRight size={14} /></button></div><div className="landing-mini-garden"><div className="landing-mini-garden-head"><span><Sprout size={14} /> ACTIVE GARDEN</span><small>4 roles</small></div><div className="landing-mini-plots" data-stagger>{SAMPLE_APPLICATIONS.map(application => <button type="button" className="landing-mini-plot" key={application.company} onClick={onStart}><span className="landing-mini-plot-icon"><StageIcon stage={application.stage} size={22} /></span><span><strong>{application.company}</strong><small>{application.role}</small></span><em style={{ color: application.stage.color }}>{application.stage.gardenName}</em></button>)}</div><div className="landing-mini-ground"><i /><i /><i /><i /><i /></div></div></div></SectionContainer>;
}
