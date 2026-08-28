import React from "react";
import { ArrowRight, Leaf, Sprout } from "lucide-react";
import SectionContainer from "./SectionContainer";
import { stageFor } from "./landingData";
import StageIcon from "../../StageIcon";

export default function LessonsGarden({ onStart }) {
    return <SectionContainer id="lessons" variant="cream" className="landing-lessons-section" eyebrow="10 / LESSONS GARDEN" title={<>Keep the<br /><em>lesson.</em></>} description="A closed role can still help."><div className="landing-lessons-layout"><div className="landing-dormant-card"><div className="landing-dormant-card-head"><span><Leaf size={14} /> DORMANT ROLE</span><small>journey complete</small></div><div className="landing-dormant-plant"><StageIcon stage={stageFor("Rejected")} size={80} strokeWidth={1.1} /><span><b>Airbnb</b><small>Senior Software Engineer</small></span></div><div className="landing-dormant-footer"><span>Reached: <b>Technical Interview</b></span><span className="landing-new-shoot"><Sprout size={14} /> Lesson saved</span></div></div><div className="landing-lessons-copy"><h3>Take it with you.</h3><p>Save what you learned. Use it in the next role.</p><ul><li>Clearer system design answers.</li><li>Better database practice.</li><li>Stronger impact stories.</li></ul><button type="button" className="landing-outline-button" onClick={onStart}>View lessons <ArrowRight size={14} /></button></div></div></SectionContainer>;
}
