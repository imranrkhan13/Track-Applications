import React, { useMemo } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, Clock3, Leaf, Mic, Plus, Target, TrendingUp } from "lucide-react";
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

function Metric({ label, value, detail, icon: Icon, tone = "neutral", stage }) {
    return <article className={`metric-card metric-${tone}`}>
        <div className="metric-label"><span>{label}</span><span className="metric-icon">{stage ? <StageIcon stage={stage} size={17} /> : <Icon size={16} />}</span></div>
        <strong>{String(value).padStart(2, "0")}</strong>
        <span className="metric-detail">{detail}</span>
    </article>;
}

function GrowthHealth({ jobs, active, interviews, offers }) {
    const total = jobs.length || 1;
    const caredFor = jobs.filter(job => job.next_step || job.next_date || job.notes).length;
    const health = Math.round((caredFor / total) * 100);
    return <section className="garden-health-card">
        <div className="garden-health-copy">
            <span className="section-kicker">Garden health</span>
            <h2>{health}% <span>{health >= 70 ? "Growing steadily." : "Ready for a little care."}</span></h2>
            <p>Your score reflects how many roles have a clear next step, date, or note attached.</p>
            <div className="health-facts"><span><i className="health-seed" />{active} active {active === 1 ? "seed" : "seeds"}</span><span><i className="health-bud" />{interviews} {interviews === 1 ? "interview" : "interviews"} growing</span><span><i className="health-bloom" />{offers} {offers === 1 ? "offer" : "offers"} bloomed</span></div>
        </div>
        <div className="health-growth-visual" aria-label={`Garden health ${health} percent`}>
            <svg viewBox="0 0 150 100" role="img" aria-hidden="true">
                <path className="health-vine" d="M10 82 C38 78 44 55 70 61 C94 67 97 27 140 22" />
                <path className="health-leaf health-leaf-one" d="M45 61 C32 48 23 52 17 60 C27 66 36 66 45 61Z" />
                <path className="health-leaf health-leaf-two" d="M74 61 C77 45 89 41 99 45 C94 56 87 61 74 61Z" />
                <circle className="health-node health-node-one" cx="10" cy="82" r="5" />
                <circle className="health-node health-node-two" cx="70" cy="61" r="5" />
                <circle className="health-node health-node-three" cx="140" cy="22" r="7" />
            </svg>
            <strong>{health}%</strong>
            <span>steady growth</span>
        </div>
    </section>;
}

function Pipeline({ jobs, onApplications }) {
    const stages = PLANT_STAGES.slice(0, 5).map(stage => ({ ...stage, count: jobs.filter(job => job.status === stage.id).length }));
    const maxCount = Math.max(...stages.map(stage => stage.count), 1);
    const current = stages.find(stage => stage.count > 0) || stages[0];
    return <section className="dashboard-card pipeline-v2 growth-journey-card">
        <div className="dashboard-card-head"><div><span className="section-kicker">Growth journey</span><h2>Where your search stands</h2></div><button type="button" className="inline-action" onClick={onApplications}>View applications <ArrowRight size={14} /></button></div>
        <div className="growth-journey-subtitle"><Leaf size={14} /> Each opportunity moves from seed to bloom.</div>
        <div className="pipeline-v2-track" role="list" aria-label="Application pipeline">
            {stages.map((stage, index) => <button type="button" role="listitem" className={`pipeline-v2-stage ${stage.id === current.id ? "is-growing" : ""}`} key={stage.id} onClick={onApplications} title={`View ${stage.count} ${stage.label} applications`}>
                <div className="pipeline-v2-top"><span className="pipeline-v2-index">0{index + 1}</span><strong>{stage.count}</strong></div>
                <div className="pipeline-v2-bar"><span className="pipeline-v2-vine-dot"><StageIcon stage={stage} size={18} /></span><i style={{ height: `${Math.max(7, (stage.count / maxCount) * 100)}%` }} /></div>
                <span>{stage.label}</span>
                <small>{stage.title}</small>
            </button>)}
        </div>
        <div className="pipeline-v2-footer"><span><i className="stage-dot" />{current.title}</span><span>{jobs.filter(job => job.status !== "Rejected").length} roles in motion</span></div>
    </section>;
}

function NextAction({ job, onOpen, onPrep, onAdd }) {
    if (!job) return <section className="next-action-card empty-next"><div className="next-action-eyebrow"><span className="pulse-dot" />Next action</div><h2>Plant your first opportunity.</h2><p>Once you add an application, Career Garden will surface the next useful move here.</p><button type="button" className="next-action-button" onClick={onAdd}><Plus size={15} />Add application</button></section>;
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

function Lifecycle({ status }) {
    const stages = ["Saved", "Applied", "Screening", "Interview", "Offer"];
    const activeIndex = Math.max(0, stages.indexOf(status));
    return <span className="lifecycle" aria-label={`Progress: ${status}`}>
        {stages.map((stage, index) => <i key={stage} className={index <= activeIndex ? "is-complete" : ""} title={stage} />)}
    </span>;
}

function RecentApplications({ jobs, onOpen }) {
    const recent = jobs.slice(0, 5);
    return <section className="dashboard-card recent-v2 planted-opportunities"><div className="dashboard-card-head"><div><span className="section-kicker">Planted opportunities</span><h2>Latest applications</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>View all <ArrowRight size={14} /></button></div>
        {recent.length ? <div className="recent-list-v2">{recent.map(job => <button type="button" className="recent-row-v2" key={job.id} onClick={() => onOpen(job)}><span className="company-avatar small">{initials(job.company)}</span><span className="recent-role"><strong>{job.role}</strong><small>{job.company} · {job.location || "Location not set"}</small></span><span className="recent-growth"><Lifecycle status={job.status} /><small>{job.status}</small></span><span className="recent-next"><b>{job.next_step || "No next step"}</b><small>{job.next_date ? dateLabel(job.next_date) : "Keep nurturing this role"}</small></span><ChevronRight className="recent-arrow" size={16} /></button>)}</div> : <div className="compact-empty garden-empty"><SproutIcon /><span><strong>Your garden is ready for its first seed.</strong><small>Add your first opportunity and start growing your career journey.</small></span></div>}
    </section>;
}

function SproutIcon() { return <span className="empty-sprout"><Leaf size={17} /></span>; }

function GardenActivity({ jobs, onOpen }) {
    const upcoming = jobs.filter(job => job.next_date).sort((a, b) => new Date(a.next_date) - new Date(b.next_date)).slice(0, 4);
    return <section className="dashboard-card upcoming-v2 garden-activity"><div className="dashboard-card-head"><div><span className="section-kicker">Garden activity</span><h2>Recent growth in your journey</h2></div><button type="button" className="inline-action" onClick={() => onOpen("applications")}>Manage <ArrowRight size={14} /></button></div>
        {upcoming.length ? <div className="timeline-v2">{upcoming.map(job => <button type="button" key={job.id} className="timeline-item-v2" onClick={() => onOpen(job)}><span className="timeline-line" /><span className="timeline-marker"><Clock3 size={13} /></span><span className="timeline-copy"><strong>{job.next_step || "Follow up"}</strong><small>{job.company} · {job.role}</small></span><time>{dateLabel(job.next_date, true)}</time></button>)}</div> : <div className="compact-empty garden-empty"><span className="empty-bud"><Target size={17} /></span><span><strong>Nothing budding yet.</strong><small>Add a next step to keep momentum visible.</small></span></div>}
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
        <div className="dashboard-intro"><div><span className="section-kicker">Your garden</span><h2>Welcome back, {firstName}.</h2><p>Your search has a place to grow. Here is what deserves your attention next.</p></div><div className="dashboard-intro-status"><span className="status-orb" />{jobs.length ? `${jobs.filter(job => job.status !== "Rejected").length} opportunities in motion` : "Your garden is ready to plant"}</div></div>
        <GrowthHealth jobs={jobs} active={active} interviews={interviews} offers={offers} />
        <div className="metrics-strip"><Metric label="Active applications" value={active} detail={`${active ? active : "No"} opportunities growing`} icon={BriefcaseBusiness} stage="Saved" tone="active" /><Metric label="Interviews" value={interviews} detail={interviews ? `${interviews} conversation${interviews === 1 ? "" : "s"} ahead` : "Nothing budding yet"} icon={Mic} stage="Interview" tone="interview" /><Metric label="Offers" value={offers} detail={offers ? "Roles fully bloomed" : "Your next bloom is ahead"} icon={Target} stage="Offer" tone="offer" /><Metric label="Follow-ups" value={followUps} detail={followUps ? `${followUps} due in the next 3 days` : "Everything is cared for"} icon={TrendingUp} stage="Applied" tone="follow" /></div>
        <div className="dashboard-main-grid"><Pipeline jobs={jobs} onApplications={() => setPage("applications")} /><NextAction job={nextAction} onOpen={openJob} onPrep={job => { openJob(job); setPage("prep"); }} onAdd={addJob} /></div>
        <div className="dashboard-secondary-grid"><RecentApplications jobs={recent} onOpen={openJob} /><GardenActivity jobs={jobs} onOpen={openJob} /></div>
        <div className="dashboard-footnote"><CheckCircle2 size={15} /><span>Career Garden only shows actions and numbers from the applications you have actually saved.</span></div>
    </div>;
}

export { dateLabel, daysAway };
