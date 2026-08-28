import React, { useMemo } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, Leaf, Mic, Plus } from "lucide-react";
import { PLANT_STAGES, stageInfo } from "./lib/plantStages";
import StageIcon from "./StageIcon";

function daysAway(value) {
    if (!value) return null;
    return Math.ceil((new Date(value) - new Date()) / 86400000);
}

function dateLabel(value, withTime = false) {
    if (!value) return "No date set";
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", withTime ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" }).format(date);
}

function initials(company) { return String(company || "?").trim().slice(0, 1).toUpperCase(); }

function DashboardMetric({ label, value, detail }) {
    return <div className="dashboard-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function PlantCycle({ jobs, onApplications }) {
    const stages = PLANT_STAGES.map(stage => ({ ...stage, count: jobs.filter(job => job.status === stage.id).length }));
    const current = stages.find(stage => stage.count > 0 && stage.id !== "Rejected") || stages[0];
    return <section className="dashboard-card plant-cycle-card">
        <div className="dashboard-card-head"><div><span className="section-kicker">Plant cycle</span><h2>See the role grow.</h2></div><button type="button" className="inline-action" onClick={onApplications}>View roles <ArrowRight size={14} /></button></div>
        <p className="plant-cycle-intro"><Leaf size={14} /> Every role moves through six small stages. Right now, your garden is in <strong>{(current.gardenName || current.title).toLowerCase()}</strong>.</p>
        <div className="plant-cycle-steps" role="list" aria-label="Six plant stages">{stages.map((stage, index) => <button type="button" role="listitem" className={`plant-cycle-step ${stage.id === current.id ? "is-current" : ""}`} key={stage.id} onClick={onApplications}><span className="plant-cycle-index">0{index + 1}</span><span className="plant-cycle-icon" style={{ color: stage.color, background: stage.tint }}><StageIcon stage={stage} size={17} /></span><strong>{stage.gardenName || stage.label}</strong><small>{stage.count ? `${stage.count} role${stage.count === 1 ? "" : "s"}` : stage.statusText || stage.label}</small></button>)}</div>
        <div className="plant-cycle-foot"><span><i style={{ width: `${Math.max(16, ((stages.findIndex(stage => stage.id === current.id) + 1) / PLANT_STAGES.length) * 100)}%` }} /></span><small>Current stage: {current.gardenName || current.title}</small></div>
    </section>;
}

function NextAction({ job, onOpen, onPrep, onMock, onAdd }) {
    if (!job) return <section className="next-action-card empty-next"><div className="next-action-eyebrow"><span className="pulse-dot" />Next action</div><h2>Plant your first role.</h2><p>Add one opportunity and we will show you the next useful thing to do.</p><button type="button" className="next-action-button" onClick={onAdd}><Plus size={15} />Add role</button></section>;
    const due = daysAway(job.next_date);
    const isInterview = job.status === "Interview";
    return <section className="next-action-card"><div className="next-action-eyebrow"><span className="pulse-dot" />Next action</div><h2>{isInterview ? "Prepare for your upcoming interview" : "Give this role a next move"}</h2><div className="next-action-role"><div className="company-avatar">{initials(job.company)}</div><div><strong>{job.role}</strong><span>{job.company} · {job.location || "Location not set"}</span></div></div><div className="next-action-meta"><CalendarClock size={15} /><span>{job.next_date ? `${isInterview ? "Interview · " : "Next step · "}${due === 0 ? "Today" : due === 1 ? "Tomorrow" : dateLabel(job.next_date)} · ${dateLabel(job.next_date, true).split(", ").pop()}` : isInterview ? "Interview date not scheduled" : "No next step date added"}</span></div><p className="next-action-copy">{isInterview ? "Rehearse the role-specific story, then get a clear coaching note before the conversation." : "Open the role room to research the company and define the next useful step."}</p><button type="button" className="next-action-button" onClick={() => isInterview ? onMock(job) : onPrep(job)}>{isInterview ? "Prepare now" : "Open role plan"}<ArrowRight size={15} /></button><button type="button" className="next-action-secondary" onClick={() => onOpen(job)}>View role</button></section>;
}

function RecentRoles({ jobs, onOpen }) {
    const recent = jobs.filter(job => job.status !== "Rejected").slice(0, 5);
    return <section className="dashboard-card recent-v2 planted-opportunities"><div className="dashboard-card-head"><div><span className="section-kicker">Your roles</span><h2>Recently planted</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>View all <ArrowRight size={14} /></button></div>{recent.length ? <div className="recent-list-v2">{recent.map(job => { const stage = stageInfo(job.status); return <button type="button" className="recent-row-v2" key={job.id} onClick={() => onOpen(job)}><span className="company-avatar small">{initials(job.company)}</span><span className="recent-role"><strong>{job.role}</strong><small>{job.company} · {job.location || "Location not set"}</small></span><span className="recent-growth"><span className="simple-status-dot" style={{ background: stage.color }} /><small>{stage.gardenName || job.status}</small></span><span className="recent-next"><b>{job.next_step || "Ready for the next move"}</b><small>{job.next_date ? dateLabel(job.next_date) : "Keep growing this role"}</small></span><ChevronRight className="recent-arrow" size={16} /></button>; })}</div> : <div className="compact-empty garden-empty"><span className="empty-sprout"><Leaf size={17} /></span><span><strong>Your garden is ready for its first role.</strong><small>Add the company and role to start the cycle.</small></span></div>}</section>;
}

function GardenView({ jobs, onOpen }) {
    const plots = jobs.slice(0, 6);
    return <section className="dashboard-card garden-overview-card"><div className="dashboard-card-head"><div><span className="section-kicker">Garden view</span><h2>See your opportunities growing.</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>Open tracker <ArrowRight size={14} /></button></div>{plots.length ? <div className="garden-plots">{plots.map(job => { const stage = stageInfo(job.status); return <button type="button" className="garden-plot" key={job.id} onClick={() => onOpen(job)}><span className="garden-plot-ground"><StageIcon stage={stage} size={30} /></span><span className="garden-plot-copy"><strong>{job.company}</strong><small>{job.role}</small><em style={{ color: stage.color }}><i style={{ background: stage.color }} />{stage.gardenName || stage.label}</em></span><ChevronRight size={15} /></button>; })}</div> : <div className="compact-empty garden-empty"><span className="empty-sprout"><Leaf size={17} /></span><span><strong>Your garden is waiting for its first seed.</strong><small>Add an application and it will appear here.</small></span></div>}</section>;
}

function PreparationPath({ job, onPrep, onMock }) {
    if (!job) return null;
    return <section className="dashboard-card preparation-path"><div className="dashboard-card-head"><div><span className="section-kicker">Candidate path</span><h2>From role to ready.</h2></div><span className="preparation-path-badge"><Leaf size={13} /> simple by design</span></div><div className="preparation-path-steps"><span><b>01</b><strong>Research</strong><small>Company, hiring process, and stack.</small></span><span><b>02</b><strong>Grow</strong><small>Six small tasks for this role.</small></span><span><b>03</b><strong>Practice</strong><small>Mock interview and clear proof.</small></span></div><div className="preparation-path-actions"><button type="button" className="secondary-btn" onClick={() => onPrep(job)}>Open role plan <ArrowRight size={14} /></button><button type="button" className="primary-btn" onClick={() => onMock(job)}><Mic size={14} />Practice interview</button></div></section>;
}

export default function DashboardOverview({ jobs, setPage, openJob, onPrep, onMock, addJob, user }) {
    const nextAction = useMemo(() => jobs.filter(job => job.next_date && job.status !== "Rejected").sort((a, b) => new Date(a.next_date) - new Date(b.next_date))[0] || jobs.find(job => job.status === "Interview") || jobs.find(job => job.status !== "Rejected") || null, [jobs]);
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || user?.email?.split("@")[0] || "there";
    const firstName = displayName.trim().split(/\s+/)[0] || "there";
    const active = jobs.filter(job => !["Rejected", "Offer"].includes(job.status)).length;
    const interviews = jobs.filter(job => job.status === "Interview").length;
    const offers = jobs.filter(job => job.status === "Offer").length;
    const upcoming = jobs.filter(job => job.next_date && job.status !== "Rejected").length;
    return <div className="dashboard-v2 account-aware-dashboard simple-dashboard">
        <div className="dashboard-intro"><div><span className="section-kicker">Your garden</span><h2>Welcome back, {firstName}.</h2><p>Add one role, see where it is growing, then prepare with intent.</p></div><div className="dashboard-intro-status"><span className="status-orb" />{jobs.length ? `${jobs.filter(job => job.status !== "Rejected").length} roles in motion` : "Ready for your first role"}</div></div>
        <div className="dashboard-metrics" aria-label="Application overview"><DashboardMetric label="Active roles" value={active} detail="still in motion" /><DashboardMetric label="Applications" value={jobs.length} detail="tracked in your garden" /><DashboardMetric label="Interviews" value={interviews} detail={upcoming ? `${upcoming} next dates set` : "none scheduled"} /><DashboardMetric label="Offers" value={offers} detail="fully bloomed" /></div>
        <div className="dashboard-main-grid"><PlantCycle jobs={jobs} onApplications={() => setPage("applications")} /><NextAction job={nextAction} onOpen={openJob} onPrep={onPrep} onMock={onMock} onAdd={addJob} /></div>
        <GardenView jobs={jobs} onOpen={openJob} />
        <div className="dashboard-secondary-grid"><RecentRoles jobs={jobs} onOpen={openJob} /><PreparationPath job={nextAction} onPrep={onPrep} onMock={onMock} /></div>
        <div className="dashboard-footnote"><CheckCircle2 size={15} /><span>Career Garden keeps the workflow small: add a role, grow it through the stages, and practice when the conversation is close.</span></div>
    </div>;
}
