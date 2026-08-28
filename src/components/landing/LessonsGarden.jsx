import React from "react";
import { ArrowRight, Leaf, Sprout } from "lucide-react";
import SectionContainer from "./SectionContainer";
import { stageFor } from "./landingData";
import StageIcon from "../../StageIcon";

export default function LessonsGarden({ onStart }) {
    return <SectionContainer id="lessons" variant="cream" className="landing-lessons-section" eyebrow="10 / LESSONS GARDEN" title={<>Nothing is<br /><em>wasted.</em></>} description="When an opportunity ends, keep what it taught you. A dormant role can still grow the next one."><div className="landing-lessons-layout"><div className="landing-dormant-card"><div className="landing-dormant-card-head"><span><Leaf size={14} /> DORMANT APPLICATION</span><small>journey completed</small></div><div className="landing-dormant-plant"><StageIcon stage={stageFor("Rejected")} size={80} strokeWidth={1.1} /><span><b>Airbnb</b><small>Senior Software Engineer</small></span></div><div className="landing-dormant-footer"><span>Reached: <b>Technical Interview</b></span><span className="landing-new-shoot"><Sprout size={14} /> New signal saved</span></div></div><div className="landing-lessons-copy"><h3>Keep the useful signal.</h3><p>Every application can make the next conversation stronger. Record the evidence while it is fresh, then carry it forward into a new role.</p><ul><li>Improve system design trade-off explanations.</li><li>Practice database sharding.</li><li>Give clearer impact metrics in leadership stories.</li></ul><button type="button" className="landing-outline-button" onClick={onStart}>View lessons <ArrowRight size={14} /></button></div></div></SectionContainer>;
}
