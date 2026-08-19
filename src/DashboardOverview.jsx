import React, { useMemo } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, Clock3, Mic, Plus, Target, TrendingUp } from "lucide-react";
import { PLANT_STAGES, stageInfo } from "./lib/plantStages";

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

function Metric({ label, value, detail, icon: Icon, tone = "neutral" }) {
    return <article className={`metric-card metric-${tone}`}>
        <div className="metric-label"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div>
        <strong>{String(value).padStart(2, "0")}</strong>
        <span className="metric-detail">{detail}</span>
    </article>;
}

function Pipeline({ jobs, onApplications }) {
    const stages = PLANT_STAGES.slice(0, 5).map(stage => ({ ...stage, count: jobs.filter(job => job.status === stage.id).length }));
    const maxCount = Math.max(...stages.map(stage => stage.count), 1);
    return <section className="dashboard-card pipeline-v2">
        <div className="dashboard-card-head"><div><span className="section-kicker">Pipeline</span><h2>Where your search stands</h2></div><button type="button" className="inline-action" onClick={onApplications}>View applications <ArrowRight size={14} /></button></div>
        <div className="pipeline-v2-track" role="list" aria-label="Application pipeline">
            {stages.map((stage, index) => <button type="button" role="listitem" className="pipeline-v2-stage" key={stage.id} onClick={onApplications} title={`View ${stage.count} ${stage.label} applications`}>
                <div className="pipeline-v2-top"><span className="pipeline-v2-index">{stage.step}</span><strong>{stage.count}</strong></div>
                <div className="pipeline-v2-bar"><i style={{ height: `${Math.max(7, (stage.count / maxCount) * 100)}%`, background: stage.color }} /></div>
                <span>{stage.label}</span>
                <small>{stage.title}</small>
            </button>)}
        </div>
        <div className="pipeline-v2-footer"><span><i className="stage-dot" />Active pipeline</span><span>{jobs.filter(job => job.status !== "Rejected").length} roles in motion</span></div>
    </section>;
}

function NextAction({ job, onOpen, onPrep, onAdd }) {
    if (!job) return <section className="next-action-card empty-next"><div className="next-action-eyebrow">Next action</div><h2>Plant your first opportunity.</h2><p>Once you add an application, Career Garden will surface the next useful move here.</p><button type="button" className="next-action-button" onClick={onAdd}><Plus size={15} />Add application</button></section>;
    const due = daysAway(job.next_date);
    const isInterview = job.status === "Interview";
    return <section className="next-action-card">
        <div className="next-action-eyebrow"><span className="pulse-dot" />Next action</div>
        <h2>{isInterview ? "Prepare for your interview" : job.next_step || "Keep this opportunity moving"}</h2>
        <div className="next-action-role"><div className="company-avatar">{initials(job.company)}</div><div><strong>{job.role}</strong><span>{job.company} · {job.location || "Location not set"}</span></div></div>
        <div className="next-action-meta"><CalendarClock size={15} /><span>{job.next_date ? `${due === 0 ? "Today" : due === 1 ? "Tomorrow" : dateLabel(job.next_date)} · ${dateLabel(job.next_date, true).split(", ").pop()}` : "No date set"}</span></div>
        <div className="prep-progress"><div><span>Preparation</span><strong>{isInterview ? "70%" : "Start"}</strong></div><div className="prep-progress-track"><i style={{ width: isInterview ? "70%" : "20%" }} /></div></div>
        <button type="button" className="next-action-button" onClick={() => isInterview ? onPrep(job) : onOpen(job)}>{isInterview ? "Continue preparation" : "Open application"}<ArrowRight size={15} /></button>
    </section>;
}

function RecentApplications({ jobs, onOpen }) {
    const recent = jobs.slice(0, 5);
    return <section className="dashboard-card recent-v2"><div className="dashboard-card-head"><div><span className="section-kicker">Recent</span><h2>Latest applications</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>View all <ArrowRight size={14} /></button></div>
        {recent.length ? <div className="recent-list-v2">{recent.map(job => <button type="button" className="recent-row-v2" key={job.id} onClick={() => onOpen(job)}><span className="company-avatar small">{initials(job.company)}</span><span className="recent-role"><strong>{job.company}</strong><small>{job.role}</small></span><span className="recent-stage" style={{ color: stageInfo(job.status).color, background: stageInfo(job.status).tint }}>{job.status}</span><span className="recent-next">{job.next_step || "No next step"}</span><ChevronRight className="recent-arrow" size={16} /></button>)}</div> : <div className="compact-empty"><BriefcaseBusiness size={17} /><span>No applications yet. Add your first role to begin tracking.</span></div>}
    </section>;
}

function Upcoming({ jobs, onOpen }) {
    const upcoming = jobs.filter(job => job.next_date).sort((a, b) => new Date(a.next_date) - new Date(b.next_date)).slice(0, 4);
    return <section className="dashboard-card upcoming-v2"><div className="dashboard-card-head"><div><span className="section-kicker">Calendar</span><h2>Upcoming</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>Manage <ArrowRight size={14} /></button></div>
        {upcoming.length ? <div className="timeline-v2">{upcoming.map(job => <button type="button" key={job.id} className="timeline-item-v2" onClick={() => onOpen(job)}><span className="timeline-line" /><span className="timeline-marker"><Clock3 size={13} /></span><span className="timeline-copy"><strong>{job.next_step || "Follow up"}</strong><small>{job.company} · {job.role}</small></span><time>{dateLabel(job.next_date, true)}</time></button>)}</div> : <div className="compact-empty"><CalendarClock size={17} /><span>No upcoming actions. Add a next step to keep momentum visible.</span></div>}
    </section>;
}

export default function DashboardOverview({ jobs, setPage, openJob, addJob, user }) {
    const active = jobs.filter(job => !["Rejected", "Offer"].includes(job.status)).length;
    const interviews = jobs.filter(job => job.status === "Interview").length;
    const offers = jobs.filter(job => job.status === "Offer").length;
    const followUps = jobs.filter(job => job.next_date && job.status !== "Rejected" && daysAway(job.next_date) <= 3).length;
    const nextAction = useMemo(() => jobs.filter(job => job.next_date && job.status !== "Rejected").sort((a, b) => new Date(a.next_date) - new Date(b.next_date))[0] || jobs.find(job => job.status === "Interview") || null, [jobs]);
    const recent = jobs.filter(job => job.status !== "Rejected").slice(0, 5);
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || user?.email?.split("@")[0] || "there";
    const firstName = displayName.trim().split(/\s+/)[0] || "there";
    return <div className="dashboard-v2 account-aware-dashboard">
        <div className="dashboard-intro"><div><span className="section-kicker">Your garden</span><h2>Welcome back, {firstName}.</h2><p>A clear view of what is moving in your search.</p></div><div className="dashboard-intro-status"><span className="status-orb" />{jobs.length ? `${jobs.length} opportunities in your garden` : "Your garden is ready to plant"}</div></div>
        <div className="metrics-strip"><Metric label="Active applications" value={active} detail={`${active ? active : "No"} roles still in motion`} icon={BriefcaseBusiness} tone="active" /><Metric label="Interviews" value={interviews} detail={interviews ? `${interviews} conversation${interviews === 1 ? "" : "s"} ahead` : "Nothing scheduled yet"} icon={Mic} tone="interview" /><Metric label="Offers" value={offers} detail={offers ? "Roles fully bloomed" : "Keep the momentum"} icon={Target} tone="offer" /><Metric label="Follow-ups" value={followUps} detail={followUps ? `${followUps} due in the next 3 days` : "No follow-ups due"} icon={TrendingUp} tone="follow" /></div>
        <div className="dashboard-main-grid"><Pipeline jobs={jobs} onApplications={() => setPage("applications")} /><NextAction job={nextAction} onOpen={openJob} onPrep={job => { openJob(job); setPage("prep"); }} onAdd={addJob} /></div>
        <div className="dashboard-secondary-grid"><RecentApplications jobs={recent} onOpen={openJob} /><Upcoming jobs={jobs} onOpen={openJob} /></div>
        <div className="dashboard-footnote"><CheckCircle2 size={15} /><span>Career Garden only shows actions and numbers from the applications you have actually saved.</span></div>
    </div>;
}

export { dateLabel, daysAway };

// Keep the imported icon names intentionally explicit so the dashboard remains easy to scan and edit.
void CalendarClock;
void CheckCircle2;
void Target;
void TrendingUp;
void Mic;
void BriefcaseBusiness;
void ArrowRight;
void Plus;
void ChevronRight;
void Clock3;
