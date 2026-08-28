import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutGrid, List, Sprout, X } from "lucide-react";
import PlantSprite from "./PlantSprite";
import { ScaleReveal } from "./Motion";

const MotionDiv = motion.div;
const APPS = [
    { company: "Google", role: "Senior Backend Engineer", stage: "BRANCHING", status: "Interview", plant: 3, action: "Practice system design" },
    { company: "Stripe", role: "Platform Engineer", stage: "SPROUT", status: "Applied", plant: 1, action: "Follow up Friday" },
    { company: "Linear", role: "Senior Frontend Engineer", stage: "SEED", status: "Saved", plant: 0, action: "Review role brief" },
    { company: "Shopify", role: "Staff Engineer", stage: "BLOOM", status: "Offer", plant: 4, action: "Compare offer" },
    { company: "Airbnb", role: "Software Engineer", stage: "DORMANT", status: "Rejected", plant: 5, action: "Keep the lesson" },
];
const TABS = [["Garden", Sprout], ["Board", LayoutGrid], ["List", List]];

function Garden({ selected, setSelected }) {
    return <div className="cg-views-garden"><div className="cg-views-sky"><span className="cg-sun" /><i className="cg-hill hill-one" /><i className="cg-hill hill-two" />{APPS.map((app, index) => <button type="button" className={`cg-views-plot plot-${index + 1}`} key={app.company} onClick={() => setSelected(app)}><PlantSprite stage={app.plant} label={`${app.company} ${app.stage}`} /><span><b>{app.company}</b><small>{app.stage}</small></span></button>)}<AnimatePresence>{selected && <MotionDiv className="cg-garden-popover" initial={{ opacity: 0, scale: .95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }}><button type="button" aria-label="Close role preview" onClick={() => setSelected(null)}><X size={14} /></button><small>{selected.stage}</small><strong>{selected.company}</strong><span>{selected.role}</span><em>{selected.action}</em></MotionDiv>}</AnimatePresence></div></div>;
}

function Board() {
    const columns = [["Saved", 0], ["Applied", 1], ["Review", 2], ["Interview", 3], ["Offer", 4], ["Rejected", 5]];
    return <div className="cg-views-board">{columns.map(([label, stage]) => { const app = APPS.find(item => item.plant === stage) || { company: "Notion", role: "Product Engineer", stage: "SAPLING", plant: 2 }; return <div key={label}><header><span>{label}</span><small>{stage === 2 ? 3 : 1}</small></header><article><PlantSprite stage={app.plant} label="" /><strong>{app.company}</strong><small>{app.role}</small><em>{app.stage}</em></article></div>; })}</div>;
}

function ListView() {
    return <div className="cg-views-list"><div className="cg-views-list-row cg-views-list-head"><span>Company / role</span><span>Stage</span><span>Next action</span><span>Updated</span></div>{APPS.map(app => <button type="button" className="cg-views-list-row" key={app.company}><span><b>{app.company}</b><small>{app.role}</small></span><strong>{app.stage}</strong><span>{app.action}</span><small>Today</small><ArrowRight size={14} /></button>)}</div>;
}

export default function ApplicationViews() {
    const [view, setView] = useState("Garden");
    const [selected, setSelected] = useState(APPS[0]);
    return <section className="cg-section cg-views" id="views"><div className="cg-shell"><div className="cg-section-head cg-section-head-dark"><div><span className="cg-kicker cg-kicker-light"><i />Application views</span><h2>Work the way<br /><em>your search needs.</em></h2></div><p>One application record. Three useful views.</p></div><div className="cg-views-tabs" role="tablist" aria-label="Application views">{TABS.map(([label, Icon]) => <button type="button" role="tab" aria-selected={view === label} className={view === label ? "is-active" : ""} key={label} onClick={() => setView(label)}>{React.createElement(Icon, { size: 16 })}{label}</button>)}</div><ScaleReveal className="cg-views-frame"><AnimatePresence mode="wait"><MotionDiv key={view} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .34 }}>{view === "Garden" && <Garden selected={selected} setSelected={setSelected} />}{view === "Board" && <Board />}{view === "List" && <ListView />}</MotionDiv></AnimatePresence></ScaleReveal></div></section>;
}
