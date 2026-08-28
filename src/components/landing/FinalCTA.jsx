import React from "react";
import { ArrowRight, Play, Sprout } from "lucide-react";
import PlantSprite from "./PlantSprite";
import { Reveal } from "./Motion";

export default function FinalCTA({ onStart }) {
    return <section className="cg-final-cta" id="start"><div className="cg-shell cg-final-grid"><Reveal className="cg-final-copy"><span className="cg-kicker cg-kicker-light"><i />Plant your next opportunity</span><h2>Your next role<br /><em>starts as a seed.</em></h2><p>Track it. Understand it. Prepare for it.</p><div><button type="button" className="cg-button cg-button-light" onClick={onStart}>Start your garden <ArrowRight size={15} /></button><a className="cg-button cg-button-dark-ghost" href="#hero"><Play size={13} fill="currentColor" />Replay the story</a></div></Reveal><div className="cg-final-plant"><span /><PlantSprite stage={1} label="A new career opportunity sprout" /><i><Sprout size={14} />Ready to grow</i></div></div></section>;
}
