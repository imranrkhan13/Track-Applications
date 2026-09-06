import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, CalendarCheck, ListChecks, Search, Sprout } from "lucide-react";
import PlantSprite from "./PlantSprite";
import { ScaleReveal } from "./Motion";

const MotionDiv = motion.div;
const NAV = [["Garden", Sprout], ["Applications", ListChecks], ["Interviews", CalendarCheck], ["Analytics", BarChart3]];
const APPLICATIONS = [
    { company: "Stripe", role: "Senior Backend Engineer", status: "SPROUT", stage: 1, next: "Follow up Friday" },
    { company: "Google", role: "Backend Engineer", status: "BRANCHING", stage: 3, next: "System design mock" },
    { company: "Linear", role: "Frontend Engineer", status: "SEED", stage: 0, next: "Review role" },
    { company: "Shopify", role: "Staff Engineer", status: "BLOOM", stage: 4, next: "Compare offer" },
    { company: "Airbnb", role: "Software Engineer", status: "DORMANT", stage: 5, next: "Keep lessons" },
];

function GardenView() {
    return <div className="cg-demo-garden"><div className="cg-demo-garden-copy"><span>YOUR GARDEN</span><h4>Five roles.<br />One clear next move.</h4><p>Select a plant to open its workspace.</p></div><div className="cg-garden-landscape">{APPLICATIONS.map((app, index) => <button type="button" className={`cg-garden-plot plot-${index + 1}`} key={app.company}><PlantSprite stage={app.stage} label={`${app.company} ${app.status}`} /><span><b>{app.company}</b><small>{app.status}</small></span></button>)}</div></div>;
}

function ApplicationsView() {
    return <div className="cg-demo-table"><div className="cg-demo-table-row cg-demo-table-head"><span>Company / role</span><span>Stage</span><span>Next action</span><span>Readiness</span></div>{APPLICATIONS.map((app, index) => <button type="button" className="cg-demo-table-row" key={app.company}><span><b>{app.company}</b><small>{app.role}</small></span><strong>{app.status}</strong><span>{app.next}</span><em>{[62, 74, 45, 92, 68][index]}%</em><ArrowRight size={14} /></button>)}</div>;
}

function InterviewsView() {
    return <div className="cg-demo-interviews"><div className="cg-demo-calendar"><span>AUGUST</span><strong>28</strong><small>Wednesday</small></div><div className="cg-demo-interview-list"><article><span>10:30</span><div><b>Google · System Design</b><small>Senior Backend Engineer · Round 2</small></div><em>74% ready</em></article><article><span>15:00</span><div><b>Stripe · Hiring Manager</b><small>Platform Engineering · Round 1</small></div><em>68% ready</em></article><article><span>FRI</span><div><b>Practice session</b><small>Behavioral stories · 30 min</small></div><em>3 tasks</em></article></div></div>;
}

function AnalyticsView() {
    return <div className="cg-demo-analytics"><div><span>APPLICATION → RESPONSE</span><strong>68%</strong><i><b style={{ width: "68%" }} /></i></div><div><span>RESPONSE → INTERVIEW</span><strong>42%</strong><i><b style={{ width: "42%" }} /></i></div><div><span>INTERVIEW → OFFER</span><strong>18%</strong><i><b style={{ width: "18%" }} /></i></div><article><small>READINESS</small><b>74%</b><span>+12% this month</span></article></div>;
}

export default function DashboardDemo({ onStart }) {
    const [view, setView] = useState("Garden");
    return <section className="cg-section cg-dashboard-section" id="dashboard">
        <div className="cg-shell"><div className="cg-section-head cg-section-head-wide"><div><span className="cg-kicker"><i />Your garden</span><h2>Every role.<br /><em>One clear next move.</em></h2></div><p>Open a role to see its stage, preparation and the one action that matters next.</p></div>
            <ScaleReveal className="cg-dashboard-frame">
                <aside className="cg-dashboard-sidebar"><div className="cg-dashboard-logo"><span><Sprout size={17} /></span><strong>Career Garden</strong></div><div className="cg-dashboard-search"><Search size={14} />Search <kbd>/</kbd></div><nav>{NAV.map(([label, Icon]) => <button type="button" className={view === label ? "is-active" : ""} key={label} onClick={() => setView(label)}>{React.createElement(Icon, { size: 16 })}{label}</button>)}</nav><div className="cg-dashboard-health"><small>GARDEN HEALTH</small><strong>74%</strong><i><b /></i><span>Steady growth</span></div></aside>
                <main className="cg-dashboard-main"><header><div><span>Garden / {view}</span><h3>Good morning, Alex.</h3><p>Your next useful move is waiting.</p></div><button type="button" onClick={onStart}>Add role <ArrowRight size={14} /></button></header><div className="cg-dashboard-kpis">{[["Applications", "24"], ["Interviews", "06"], ["Offers", "02"], ["Garden health", "74%"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><AnimatePresence mode="wait"><MotionDiv key={view} className="cg-dashboard-view" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32 }}>{view === "Garden" && <GardenView />}{view === "Applications" && <ApplicationsView />}{view === "Interviews" && <InterviewsView />}{view === "Analytics" && <AnalyticsView />}</MotionDiv></AnimatePresence></main>
            </ScaleReveal>
        </div>
    </section>;
}
