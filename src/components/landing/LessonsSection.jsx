import React from "react";
import { ArrowRight, Check, Leaf, Sprout } from "lucide-react";
import PlantSprite from "./PlantSprite";
import { Reveal, ScaleReveal } from "./Motion";

export default function LessonsSection({ onStart }) {
    return <section className="cg-section cg-lessons" id="lessons"><div className="cg-shell cg-lessons-grid"><ScaleReveal className="cg-lessons-visual"><div className="cg-lessons-role"><span><Leaf size={13} />DORMANT ROLE</span><small>Journey complete</small></div><PlantSprite stage={5} className="cg-lessons-plant" label="Dormant application plant with a new shoot" /><div className="cg-lessons-new-shoot"><Sprout size={14} />A new signal is already growing.</div></ScaleReveal><Reveal className="cg-lessons-copy"><span className="cg-kicker"><i />Lessons</span><h2>Some opportunities bloom.<br /><em>Others teach.</em></h2><div className="cg-lessons-job"><small>Airbnb</small><strong>Senior Software Engineer</strong><span>Reached: Technical Interview</span></div><ul><li><Check size={14} />System design answers need stronger tradeoffs.</li><li><Check size={14} />Use business impact metrics in leadership stories.</li><li><Check size={14} />Review distributed caching.</li></ul><button type="button" className="cg-button cg-button-primary" onClick={onStart}>Keep the lesson <ArrowRight size={14} /></button></Reveal></div></section>;
}
