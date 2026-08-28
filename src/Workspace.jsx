import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Check, CircleHelp, Clock3,
    ClipboardList, FileText, Filter, LayoutDashboard, Leaf, LogOut, Mic, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Settings, Sprout, Target, Trash2, TrendingUp,
    Search, Upload, Users, X, Zap,
} from "lucide-react";
import { DEMO_USER, isSupabaseConfigured } from "./lib/supabase";
import { deleteJob, getJobs, saveJob } from "./lib/appData";
import { researchRole } from "./lib/roleResearch";
import { saveRoleRoom } from "./lib/roleRoomData";
import { PLANT_STAGES, stageInfo } from "./lib/plantStages";
import RoleRoom from "./RoleRoom";
import MockInterview from "./MockInterview";
import DashboardOverview from "./DashboardOverview";
import StageIcon from "./StageIcon";

const STAGES = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected"];
const STAGE_STYLE = {
    Saved: ["#e0e7ff", "#4338ca"], Applied: ["#dcfce7", "#15803d"], Screening: ["#fef3c7", "#b45309"],
    Interview: ["#ede9fe", "#6d28d9"], Offer: ["#cffafe", "#0e7490"], Rejected: ["#f1f5f9", "#64748b"],
};

const seedForm = { company: "", role: "", location: "", status: "Saved", salary: "", source: "Company site", next_step: "", next_date: "", deadline: "", url: "", notes: "" };

function displayName(user) { return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || user?.email?.split("@")[0] || "Account"; }
function initials(user) { return displayName(user).split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(); }
function dateLabel(value) { if (!value) return "No date"; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value)); }
function daysAway(value) { if (!value) return null; return Math.ceil((new Date(value) - new Date()) / 86400000); }
function Icon({ children }) { return <span className="icon-slot">{children}</span>; }

function Sidebar({ page, setPage, jobs, user, onSignOut, collapsed, onToggle }) {
    const primary = [["overview", "My Garden", LayoutDashboard], ["applications", "Roles", BriefcaseBusiness], ["prep", "Prepare", ClipboardList], ["mock", "Practice", Mic], ["analytics", "Insights", BarChart3]];
    const [sidebarQuery, setSidebarQuery] = useState("");
    const visiblePrimary = primary.filter(([, label]) => !sidebarQuery.trim() || label.toLowerCase().includes(sidebarQuery.trim().toLowerCase()));
    const counts = { applications: jobs.filter(job => job.status !== "Rejected").length, mock: jobs.filter(job => job.status === "Interview").length };
    const currentJob = jobs.find(job => job.status !== "Rejected") || jobs[0];
    const currentStage = stageInfo(currentJob?.status || "Saved");
    const currentIndex = Math.max(0, PLANT_STAGES.findIndex(stage => stage.id === currentStage.id));
    const cycleProgress = currentStage.id === "Rejected" ? 100 : Math.round(((currentIndex + 1) / PLANT_STAGES.length) * 100);
    const renderItem = ([id, label, NavIcon]) => <button type="button" key={id} className={page === id ? "nav-item active" : "nav-item"} onClick={() => setPage(id)} aria-label={label}><Icon>{React.createElement(NavIcon, { size: 17 })}</Icon><span className="nav-label">{label}</span>{counts[id] ? <em>{counts[id]}</em> : null}</button>;
    const renderRailItem = ([id, label, NavIcon]) => <button type="button" key={id} className={page === id ? "sidebar-rail-item active" : "sidebar-rail-item"} onClick={() => setPage(id)} aria-label={label} title={label}>{React.createElement(NavIcon, { size: 17 })}{counts[id] ? <em>{counts[id]}</em> : null}</button>;
    return <aside className={`sidebar-new compact-sidebar sidebar-v4 ${collapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar-rail" aria-label="Quick navigation">
            <button type="button" className="sidebar-rail-brand" onClick={() => setPage("overview")} aria-label="Open My Garden" title="My Garden"><Sprout size={18} /></button>
            <div className="sidebar-rail-items">{primary.map(renderRailItem)}</div>
            <div className="sidebar-rail-bottom">
                <button type="button" className="sidebar-rail-item sidebar-rail-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
                <button type="button" className="sidebar-rail-item" onClick={() => setPage("settings")} aria-label="Open settings" title="Settings"><Settings size={17} /></button>
                <button type="button" className="sidebar-rail-item" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
            </div>
        </div>
        <div className="sidebar-panel">
            <div className="sidebar-top sidebar-panel-head sidebar-v4-top"><button type="button" className="sidebar-product" onClick={() => setPage("overview")} aria-label="Open My Garden"><span className="sidebar-product-mark"><Sprout size={17} /></span><span className="sidebar-product-copy"><strong>Career Garden</strong><small>Job search, cultivated</small></span><span className="sidebar-product-caret">⌄</span></button><button type="button" className="sidebar-collapse-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button></div>
            <label className="sidebar-search"><Search size={16} /><input value={sidebarQuery} onChange={event => setSidebarQuery(event.target.value)} placeholder="Search workspace" aria-label="Search workspace" /><kbd>/</kbd></label>
            <nav className="side-nav sidebar-v4-nav"><div className="nav-group"><p>Workspace</p>{visiblePrimary.length ? visiblePrimary.map(renderItem) : <span className="sidebar-no-results">No matching section</span>}</div><section className="sidebar-cycle-v4 sidebar-cycle-simple" aria-label="Current plant stage"><div className="sidebar-cycle-v4-head"><div><span>Plant cycle</span><b>{currentStage.label}</b></div><em>{currentStage.step} / 06</em></div><div className="sidebar-cycle-current"><span className="sidebar-cycle-v4-node" style={{ background: currentStage.tint, color: currentStage.color }}><StageIcon stage={currentStage} size={15} /></span><span><b>{currentStage.title}</b><small>{currentJob ? "Your next move is in motion" : "Add a role to begin"}</small></span></div><div className="sidebar-cycle-v4-foot"><span><i style={{ width: `${cycleProgress}%` }} /></span><small>{cycleProgress}% of the plant cycle</small></div></section></nav>
            <div className="sidebar-footer sidebar-v4-footer"><div className="account-card"><button type="button" className="account-identity" onClick={() => setPage("settings")} aria-label="Open account settings"><div className="avatar">{initials(user)}</div><span><b>{displayName(user)}</b><small>{user?.email || "No email connected"}</small></span><MoreHorizontal size={16} /></button><button type="button" className="account-signout" onClick={onSignOut}><LogOut size={15} /><span>Sign out</span></button></div></div>
        </div>
    </aside>;
}

function Topbar({ page, onAdd, user, setPage }) {
    const titles = { overview: ["Overview", "See the plant cycle, your next action, and the role that deserves attention."], applications: ["Roles", "Keep every opportunity in one focused place."], prep: ["Prepare", "Research the company, complete the plan, and rehearse the proof."], mock: ["Practice", "Build confidence out loud, one answer at a time."], analytics: ["Statistics", "Understand where your effort is taking root."], activity: ["Activity", "A clear history of the progress in your search."], settings: ["Settings", "Keep your workspace and integrations ready for the next move."] };
    const [title, subtitle] = titles[page] || titles.overview;
    return <header className="topbar-new compact-topbar"><div><div className="crumb"><span>Garden</span><ArrowRight size={12} /><b>{title}</b></div><h1>{title}</h1><p>{subtitle}</p></div><div className="top-actions"><button type="button" className="primary-btn" onClick={onAdd} aria-label="Add role"><Plus size={17} />Add role</button><button type="button" className="avatar top-avatar" onClick={() => setPage("settings")} aria-label="Account settings" title="Account settings">{initials(user)}</button></div></header>;
}

function MobileNav({ page, setPage, onAdd }) { const items = [["overview", "Garden", LayoutDashboard], ["applications", "Roles", BriefcaseBusiness], ["prep", "Prepare", ClipboardList], ["mock", "Practice", Mic], ["analytics", "Insights", BarChart3]]; return <nav className="mobile-nav" aria-label="Primary navigation"><div className="mobile-nav-items">{items.map(([id, label, NavIcon]) => <button type="button" key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>{React.createElement(NavIcon, { size: 17 })}<span>{label}</span></button>)}<button type="button" className="mobile-add" onClick={onAdd} aria-label="Add role"><Plus size={19} /></button></div></nav>; }

function CommandPalette({ open, onClose, onAdd, setPage }) {
    if (!open) return null;
    const actions = [["overview", "Open My Garden", "See your search at a glance", LayoutDashboard, "G"], ["applications", "View roles", "Manage your live pipeline", BriefcaseBusiness, "A"], ["prep", "Open preparation", "Research, plan, and prepare", ClipboardList, "P"], ["mock", "Start practice", "Practice an answer out loud", Mic, "M"]];
    const go = id => { setPage(id); onClose(); };
    return <div className="command-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Quick actions"><div className="command-head"><div><span className="eyebrow">Quick actions</span><h2>Jump back in</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close quick actions"><X size={17} /></button></div><div className="command-list"><button type="button" className="command-item command-primary" onClick={() => { onAdd(); onClose(); }}><span className="command-icon"><Plus size={17} /></span><span><b>Add role</b><small>Capture a new opportunity</small></span><kbd>N</kbd></button>{actions.map(([id, title, detail, ActionIcon, key]) => <button type="button" className="command-item" key={id} onClick={() => go(id)}><span className="command-icon">{React.createElement(ActionIcon, { size: 17 })}</span><span><b>{title}</b><small>{detail}</small></span><kbd>{key}</kbd></button>)}</div><p className="command-tip"><span>⌘ K</span> to open anytime <i>Esc</i> to close</p></section></div>;
}

function StatCard({ label, value, detail, trend, icon, tone = "green" }) { return <div className={`stat-card ${tone}`}><div className="stat-top"><span>{label}</span><Icon>{icon}</Icon></div><strong>{value}</strong><div className="stat-detail"><span className="trend"><TrendingUp size={13} />{trend}</span>{detail}</div></div>; }

function StagePill({ status }) { const stage = stageInfo(status); return <span className="stage-pill plant-stage-pill" style={{ background: stage.tint, color: stage.color }}><span className="stage-dot" />{status}</span>; }

function MiniPipeline({ jobs, onStage }) { const counts = PLANT_STAGES.map(stage => ({ ...stage, count: jobs.filter(job => job.status === stage.id).length })); const current = counts.find(item => item.count > 0 && item.id !== "Rejected") || counts[0]; return <section className="panel pipeline-panel plant-pipeline-panel"><div className="panel-heading"><div><p className="eyebrow">Your garden</p><h2>The search is growing</h2></div><button className="text-btn" onClick={() => onStage("applications")}>Tend all <ArrowRight size={14} /></button></div><div className="plant-pipeline-track">{counts.map(stage => <button className={`plant-pipeline-node ${stage.id === current.id ? "current" : ""}`} key={stage.id} onClick={() => onStage("applications")} title={`View ${stage.label} applications`}><span className="pipeline-plant">{React.createElement(StageIcon, { stage, size: 20 })}</span><span className="pipeline-node-line" /> <b>{stage.count}</b><small>{stage.label}</small><em>{stage.title}</em></button>)}</div><div className="pipeline-message"><span className="pipeline-message-icon">{React.createElement(StageIcon, { stage: current, size: 21 })}</span><div><b>{current.title}</b><small>{current.short}</small></div><button onClick={() => onStage(current.id === "Interview" ? "mock" : "applications")}>{current.id === "Interview" ? "Practice now" : "View this stage"} <ArrowRight size={13} /></button></div></section>; }

function Upcoming({ jobs, onOpen }) { const items = jobs.filter(job => job.next_date).sort((a, b) => new Date(a.next_date) - new Date(b.next_date)).slice(0, 4); return <section className="panel upcoming-panel"><div className="panel-heading"><div><p className="eyebrow">Stay ahead</p><h2>Upcoming actions</h2></div><button className="round-btn" onClick={() => onOpen("applications")}><ArrowRight size={15} /></button></div>{items.length ? <div className="upcoming-list">{items.map(job => <button className="upcoming-row" key={job.id} onClick={() => onOpen(job)}><div className="company-logo">{job.company.slice(0, 1)}</div><div className="upcoming-copy"><b>{job.next_step || "Follow up"}</b><span>{job.company} · {job.role}</span></div><div className={`due ${daysAway(job.next_date) < 0 ? "late" : ""}`}>{daysAway(job.next_date) === 0 ? "Today" : daysAway(job.next_date) < 0 ? `${Math.abs(daysAway(job.next_date))}d late` : `In ${daysAway(job.next_date)}d`}<small>{dateLabel(job.next_date)}</small></div></button>)}</div> : <EmptyState title="No upcoming actions" description="Add a next step to an application and it will show up here." />}</section>; }

function RecentApplications({ jobs, onOpen, onEdit }) { const recent = jobs.slice(0, 5); return <section className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">Latest movement</p><h2>Recent applications</h2></div><button className="text-btn" onClick={() => onOpen("applications")}>Manage <ArrowRight size={14} /></button></div><div className="table-wrap"><table><thead><tr><th>Role</th><th>Status</th><th>Next step</th><th>Added</th><th /></tr></thead><tbody>{recent.map(job => <tr key={job.id} onClick={() => onOpen(job)}><td><div className="role-cell"><div className="company-logo">{job.company.slice(0, 1)}</div><div><b>{job.role}</b><span>{job.company} · {job.location || "Location not set"}</span></div></div></td><td><StagePill status={job.status} /></td><td><span className="next-cell">{job.next_step || "—"}</span></td><td><span className="muted">{dateLabel(job.created_at)}</span></td><td><button className="row-edit" onClick={event => { event.stopPropagation(); onEdit(job); }}><Pencil size={14} /></button></td></tr>)}</tbody></table></div>{!recent.length && <EmptyState title="Your pipeline is ready" description="Add your first application to start building momentum." />}</section>; }

function EmptyState({ title, description, action, onAction }) { return <div className="empty-state"><div className="empty-icon"><Sprout size={22} /></div><b>{title}</b><p>{description}</p>{action && <button className="secondary-btn" onClick={onAction}>{action}</button>}</div>; }

function Overview({ jobs, setPage, openJob, editJob, addJob }) {
    const active = jobs.filter(job => !["Rejected", "Offer"].includes(job.status)).length;
    const interviews = jobs.filter(job => job.status === "Interview").length;
    const offers = jobs.filter(job => job.status === "Offer").length;
    const followUps = jobs.filter(job => job.next_date && job.status !== "Rejected" && daysAway(job.next_date) <= 3).length;
    const total = jobs.length || 1;
    const caredFor = jobs.filter(job => job.next_step || job.next_date || job.notes).length;
    const health = Math.round((caredFor / total) * 100);
    const nextCare = jobs.filter(job => job.next_date && job.status !== "Rejected").sort((a, b) => new Date(a.next_date) - new Date(b.next_date))[0] || jobs.find(job => job.status === "Interview") || jobs[0];
    return <div className="page-grid">
        <div className="stats-grid"><StatCard label="Active applications" value={active} detail="roles still in motion" trend="Your live garden" icon={<BriefcaseBusiness size={16} />} /><StatCard label="Interviews" value={interviews} detail="conversations ahead" trend="Prepare with intent" icon={<Mic size={16} />} tone="blue" /><StatCard label="Offers" value={offers} detail="keep the momentum" trend="On the board" icon={<Target size={16} />} tone="teal" /><StatCard label="Follow-ups due" value={followUps} detail="next three days" trend="Next care" icon={<Clock3 size={16} />} tone="purple" /></div>
        <section className="health-card"><div className="health-copy"><p className="eyebrow">Garden health</p><h2>{health}% <span>Your search is moving steadily.</span></h2><p>Health reflects how many roles have a written next step, date, or note.</p></div><div className="health-progress"><svg viewBox="0 0 120 120" role="img" aria-label={`Garden health ${health} percent`}><circle cx="60" cy="60" r="48" /><circle className="health-ring" cx="60" cy="60" r="48" pathLength="100" style={{ strokeDasharray: `${health} 100` }} /></svg><strong>{health}%</strong></div><div className="health-action"><span>Keep growing</span><b>{total - caredFor} {total - caredFor === 1 ? "role needs" : "roles need"} a next step.</b><button className="secondary-btn" onClick={() => setPage("applications")}>Tend applications <ArrowRight size={14} /></button></div></section>
        <div className="two-col"><MiniPipeline jobs={jobs} onStage={setPage} /><Upcoming jobs={jobs} onOpen={openJob} /></div>
        <div className="two-col lower"><RecentApplications jobs={jobs} onOpen={openJob} onEdit={editJob} /><section className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">Next care</p><h2>{nextCare ? `Practice for ${nextCare.company}` : "Plant your first seed"}</h2></div><div className="focus-badge"><Zap size={13} /> 20 min</div></div><div className="focus-hero"><div className="focus-orb"><Leaf size={21} /></div><div><b>{nextCare?.next_step || "Add an application to begin"}</b><p>{nextCare ? `${nextCare.role} · ${nextCare.company}` : "Your next focused action will appear here."}</p></div></div><div className="focus-checklist"><button onClick={() => nextCare && openJob(nextCare)}><span className="check-box"><Check size={12} /></span>Open the role details</button><button onClick={() => setPage("mock")}><span className="check-box" />Practice a 2-minute answer</button><button onClick={() => setPage("applications")}><span className="check-box" />Write down one measurable outcome</button></div><button className="primary-btn wide" onClick={() => nextCare ? setPage("mock") : addJob()}>{nextCare ? "Start focused practice" : "Add your first application"} <ArrowRight size={15} /></button></section></div>
        <div className="quote-strip"><div className="quote-mark">“</div><p>Confidence is not a feeling you wait for. It is evidence you collect through repetitions.</p><span>— Your next best search habit</span></div>
    </div>;
}

function Applications({ jobs, openJob, editJob, addJob }) {
    const [filter, setFilter] = useState("All");
    const [query, setQuery] = useState("");
    const filters = ["All", "Saved", "Applied", "Screening", "Interview", "Offer", "Rejected"];
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = jobs.filter(job => {
        const matchesFilter = filter === "All" || job.status === filter;
        const searchable = [job.role, job.company, job.location, job.notes, job.next_step].filter(Boolean).join(" ").toLowerCase();
        return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
    return <div className="page-grid applications-simple">
        <section className="applications-simple-head"><div><span className="section-kicker">Your roles</span><h2>Track every opportunity from saved to offer.</h2><p>Keep the next action visible, then move into research or practice when the conversation is close.</p></div><button className="primary-btn" onClick={addJob}><Plus size={16} />Add role</button></section>
        <div className="roles-toolbar"><label className="roles-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search roles, companies, notes" aria-label="Search roles, companies, and notes" /><kbd>/</kbd></label><span className="roles-result-count">{filtered.length} {filtered.length === 1 ? "role" : "roles"}</span></div>
        <div className="simple-filter-row" aria-label="Filter roles">{filters.map(item => <button type="button" key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}<span>{item === "All" ? jobs.length : jobs.filter(job => job.status === item).length}</span></button>)}</div>
        <section className="panel simple-roles-list" aria-label="Saved roles">
            {filtered.length ? <><div className="roles-list-head" aria-hidden="true"><span /><span>Role</span><span>Status</span><span>Next action</span><span>Stage</span><span /><span /></div>{filtered.map(job => <div role="button" tabIndex="0" className="simple-role-row" key={job.id} onClick={() => openJob(job)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openJob(job); } }}><span className="company-logo">{(job.company || "?").slice(0, 1)}</span><span className="simple-role-copy"><strong>{job.role || "Role not specified"}</strong><small>{job.company || "Company not specified"} · {job.location || "Location not provided"}</small></span><span className="simple-role-stage"><StagePill status={job.status} /><small>{job.updated_at ? `Updated ${dateLabel(job.updated_at)}` : `Added ${dateLabel(job.created_at)}`}</small></span><span className="simple-role-next"><b>{job.next_step || "No next action"}</b><small>{job.next_date ? dateLabel(job.next_date) : "Add a date when ready"}</small></span><select value={job.status} aria-label={`Change ${job.company || "role"} stage`} onClick={event => event.stopPropagation()} onChange={event => editJob({ ...job, status: event.target.value })}>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select><button type="button" className="simple-role-menu" onClick={event => { event.stopPropagation(); openJob(job); }} aria-label={`Open actions for ${job.company || "role"}`}><MoreHorizontal size={16} /></button><ArrowRight size={17} className="simple-role-arrow" /></div>)}</> : <EmptyState title={query ? "No roles match that search." : "No roles yet"} description={query ? "Try a different company, title, location, or note." : "Add your first opportunity and Career Garden will help you track and prepare for it."} action="Add your first role" onAction={addJob} />}
        </section>
    </div>;
}

function JobDrawer({ job, onClose, onSave, onDelete, error }) {
    const [draft, setDraft] = useState(job || seedForm);
    const [validation, setValidation] = useState("");
    if (!job) return null;
    const update = (key, value) => setDraft(current => ({ ...current, [key]: value }));
    const isNew = !draft.id;
    const handleSave = () => {
        if (!draft.company.trim() || !draft.role.trim()) {
            setValidation("Add the company and role to plant this opportunity.");
            return;
        }
        setValidation("");
        onSave(draft);
    };
    return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
        <aside className="job-drawer job-drawer-v5" aria-label={isNew ? "Add application" : "Edit application"}>
            <div className="drawer-head drawer-v5-head">
                <div><span className="drawer-kicker">{isNew ? "Plant a new role" : "Role details"}</span><h2>{draft.company || "Give this role a home"}</h2><p>{isNew ? "Add the essentials now. You can prepare for it next." : "Keep the details fresh so the next step stays visible."}</p></div>
                <button className="icon-btn" onClick={onClose} aria-label="Close application editor"><X size={18} /></button>
            </div>
            <div className="drawer-content drawer-v5-content">
                <div className="drawer-role drawer-v5-role"><div className="company-logo large">{(draft.company || "A").slice(0, 1)}</div><div><b>{draft.role || "Untitled role"}</b><span>{draft.location || "Location not set"}</span></div><span className="drawer-stage-preview">{draft.status}</span></div>
                <section className="drawer-section drawer-simple-section"><div className="drawer-section-head"><span>01</span><div><b>The essentials</b><small>Just enough to start the plant cycle.</small></div></div><div className="form-grid drawer-form-grid"><label className="full">Company<input autoFocus required value={draft.company} onChange={event => { setValidation(""); update("company", event.target.value); }} placeholder="e.g. Notion" /></label><label className="full">Role<input required value={draft.role} onChange={event => { setValidation(""); update("role", event.target.value); }} placeholder="e.g. Product Designer" /></label><label className="full">Location <span className="optional-label">optional</span><input value={draft.location} onChange={event => update("location", event.target.value)} placeholder="Remote · US" /></label><label className="full">Job link <span className="optional-label">optional</span><input value={draft.url} onChange={event => update("url", event.target.value)} placeholder="Paste the job link, Doc, or Drive file" /></label><label className="full">Deadline or interview date <span className="optional-label">optional</span><input type="date" value={draft.deadline || ""} onChange={event => update("deadline", event.target.value)} /></label></div></section>
                <div className="drawer-simple-note"><span className="drawer-simple-note-icon"><Leaf size={16} /></span><div><b>Next: grow the role</b><small>After saving, you can see its plant stage, research the company, and practice for the interview.</small></div></div>
                {(validation || error) && <div className="drawer-validation" role="alert"><CircleHelp size={15} /><span>{validation || error}</span></div>}
            </div>
            <div className="drawer-foot drawer-v5-foot"><button className="danger-btn" onClick={() => onDelete(draft.id)} disabled={isNew}><Trash2 size={14} />{isNew ? "Discard" : "Delete"}</button><div><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" onClick={handleSave}><Check size={15} />{isNew ? "Add role" : "Save changes"}</button></div></div>
        </aside>
    </div>;
}

function Analytics({ jobs }) {
    const total = jobs.length;
    const responded = jobs.filter(job => ["Screening", "Interview", "Offer"].includes(job.status)).length;
    const interviews = jobs.filter(job => ["Interview", "Offer"].includes(job.status)).length;
    const offers = jobs.filter(job => job.status === "Offer").length;
    const monthKey = new Date().toISOString().slice(0, 7);
    const thisMonth = jobs.filter(job => String(job.created_at || "").slice(0, 7) === monthKey).length;
    const avgAge = 0;
    const sourceCounts = jobs.reduce((result, job) => { result[job.source || "Other"] = (result[job.source || "Other"] || 0) + 1; return result; }, {});
    const maxSource = Math.max(...Object.values(sourceCounts), 1);
    return <div className="page-grid">
        <div className="stats-grid"><StatCard label="Applications" value={total} detail="tracked in your garden" trend={`${thisMonth} this month`} icon={<BriefcaseBusiness size={16} />} /><StatCard label="Response rate" value={`${total ? Math.round((responded / total) * 100) : 0}%`} detail="roles beyond application" trend="Based on your data" icon={<TrendingUp size={16} />} tone="blue" /><StatCard label="Interview rate" value={`${total ? Math.round((interviews / total) * 100) : 0}%`} detail="roles reaching a conversation" trend="Pipeline signal" icon={<Mic size={16} />} tone="purple" /><StatCard label="Offer rate" value={`${total ? Math.round((offers / total) * 100) : 0}%`} detail="roles fully bloomed" trend={`${avgAge}d average age`} icon={<Target size={16} />} tone="teal" /></div>
        {!jobs.length ? <section className="panel"><EmptyState title="Your insights will grow as you track applications." description="Add an opportunity to start seeing response, interview, and offer patterns." /></section> : <div className="analytics-grid"><section className="panel chart-panel funnel-panel"><div className="panel-heading"><div><p className="eyebrow">Pipeline funnel</p><h2>Where opportunities are growing</h2></div><span className="chart-period">{total} total roles</span></div><div className="funnel-list">{STAGES.slice(0, 5).map(stage => { const count = jobs.filter(job => job.status === stage).length; const info = stageInfo(stage); return <div className="funnel-row" key={stage}><div className="funnel-label"><span className="stage-marker" style={{ background: info.color }} aria-hidden="true" /><b>{stage}</b><small>{info.title}</small></div><div className="funnel-bar"><i style={{ width: `${total ? Math.max((count / total) * 100, count ? 8 : 0) : 0}%`, background: info.color }} /></div><strong>{count}</strong></div>; })}</div></section><section className="panel source-panel"><div className="panel-heading"><div><p className="eyebrow">Where roles come from</p><h2>Source mix</h2></div><Filter size={16} /></div><div className="source-list">{Object.entries(sourceCounts).map(([source, count]) => <div className="source-row" key={source}><div><b>{source}</b><span>{count} {count === 1 ? "role" : "roles"}</span></div><div className="source-bar"><i style={{ width: `${(count / maxSource) * 100}%` }} /></div><strong>{Math.round((count / total) * 100)}%</strong></div>)}</div></section></div>}
        <section className="panel insight-panel"><div className="insight-orb"><Leaf size={20} /></div><div><p className="eyebrow">A useful pattern</p><h2>{responded ? "Your pipeline has a response signal." : "Keep planting to reveal your signal."}</h2><p>{responded ? `${responded} ${responded === 1 ? "role has" : "roles have"} moved beyond application. Keep adding the next action so follow-through stays visible.` : "Once you track a few applications, this space will show where your effort compounds."}</p></div></section>
    </div>;
}

function ActivityPage({ jobs }) { const events = jobs.flatMap(job => [{ id: `${job.id}-added`, title: `Added ${job.role}`, body: `${job.company} entered your pipeline`, date: job.created_at, icon: BriefcaseBusiness }, job.status !== "Saved" ? { id: `${job.id}-status`, title: `${job.company} moved to ${job.status}`, body: job.next_step || "Keep the conversation moving", date: job.updated_at || job.created_at, icon: TrendingUp } : null]).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date)); return <div className="page-grid narrow-page"><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Your trail</p><h2>Search activity</h2></div><span className="muted">{events.length} events</span></div><div className="timeline">{events.map(event => <div className="timeline-row" key={event.id}><div className="timeline-icon"><event.icon size={15} /></div><div><b>{event.title}</b><p>{event.body}</p></div><span>{dateLabel(event.date)}</span></div>)}</div></section></div>; }

function SettingsPage({ user, onSignOut, dataSource }) { return <div className="page-grid narrow-page"><section className="panel settings-panel"><div className="panel-heading"><div><p className="eyebrow">Workspace preferences</p><h2>Settings</h2></div><Settings size={18} /></div><div className="settings-account"><div className="avatar large">{initials(user)}</div><div className="settings-account-copy"><p className="eyebrow">Signed in account</p><h3>{displayName(user)}</h3><span>{user?.email || "No email connected"}</span></div><button type="button" className="secondary-btn" onClick={onSignOut}><LogOut size={15} />Sign out</button></div><div className="settings-section"><div><b>Profile</b><p>Your workspace identity and defaults.</p></div><div className="settings-fields"><label>Display name<input defaultValue={displayName(user)} /></label><label>Target role<input defaultValue="Product Designer" /></label><label>Preferred location<input defaultValue="Remote · US" /></label><label>Weekly applications target<input type="number" defaultValue="4" /></label></div></div><div className="settings-section"><div><b>Voice interview providers</b><p>Voice keys belong on server-side environment variables, never in client code.</p></div><div className="provider-list"><div><span className="provider-dot green" /><b>Deepgram</b><small>Primary transcription provider</small><span className="provider-status">Configure the secure <code>/api/voice/transcribe</code> endpoint</span></div><div><span className="provider-dot blue" /><b>OpenAI Whisper</b><small>Fallback transcription provider</small><span className="provider-status">Configure as a server-side fallback endpoint</span></div><div><span className="provider-dot purple" /><b>Gradium AI</b><small>Additional fallback provider</small><span className="provider-status">Connect through <code>/api/voice/transcribe</code></span></div></div></div><div className="settings-footer"><span>{dataSource === "supabase" ? "Changes are saved to your Supabase workspace." : "Demo changes are saved in this browser only."}</span><button className="primary-btn"><Check size={15} />Save settings</button></div></section></div>; }

export default function Workspace({ user = DEMO_USER, onSignOut }) {
    const [searchParams] = useSearchParams(); const requestedView = searchParams.get("view"); const initialPage = requestedView === "stats" ? "analytics" : requestedView === "learn" ? "prep" : "overview";
    const [page, setPage] = useState(initialPage); const [sidebarCollapsed, setSidebarCollapsed] = useState(() => { try { return window.localStorage.getItem("career-garden-sidebar-collapsed-v2") === "true"; } catch { return false; } }); const [jobs, setJobs] = useState([]); const [drawer, setDrawer] = useState(null); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(""); const [actionError, setActionError] = useState(""); const [toast, setToast] = useState(""); const [prepJob, setPrepJob] = useState(null); const [mockJob, setMockJob] = useState(null);
    useEffect(() => { try { window.localStorage.setItem("career-garden-sidebar-collapsed-v2", String(sidebarCollapsed)); } catch { return; } }, [sidebarCollapsed]);
    useEffect(() => { getJobs(user.id).then(data => { setJobs(data); setLoading(false); }).catch(() => { setJobs([]); setLoadError("We couldn't load your roles right now. Check your connection and try again."); setLoading(false); }); }, [user.id]);
    const filteredJobs = jobs;
    const dataSource = isSupabaseConfigured && user.id !== DEMO_USER.id ? "supabase" : "demo";
    const addJob = () => { setActionError(""); setDrawer({ ...seedForm, id: null, created_at: new Date().toISOString() }); };
    const editJob = job => { setActionError(""); setDrawer(job); };
    const notify = message => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
    const save = async job => { const isNew = !job.id; if (!job.company?.trim() || !job.role?.trim()) { setActionError("Add the company and role to plant this opportunity."); return; } setActionError(""); try { const saved = await saveJob(job, user.id); setJobs(current => [saved, ...current.filter(item => item.id !== saved.id)]); setDrawer(null); notify(isNew ? "Role added — building your plan…" : "Role updated"); if (isNew) { setPage("overview"); researchRole({ company: saved.company, role: saved.role, location: saved.location, url: saved.url, deadline: saved.deadline }).then(result => { saveRoleRoom(user.id, saved.id, { researchNotes: "", completed: {}, analysis: result }); notify("Plan ready — open Prepare"); }).catch(() => notify("Role added — add a public link to improve the plan")); } } catch (error) { const message = String(error?.message || "").toLowerCase(); setActionError(message.includes("row-level security") ? "Your session cannot write this role yet. Sign out and sign back in, then try again." : "We couldn't save this role right now. Check your connection and try again."); } };
    const remove = async id => { if (!id) return; setActionError(""); try { await deleteJob(id, user.id); setJobs(current => current.filter(job => job.id !== id)); setDrawer(null); notify("Role removed"); } catch { setActionError("We couldn't delete this role right now. Try again."); } };
    const openJob = job => { if (typeof job === "string") { setPage(job === "applications" ? "applications" : job); return; } setDrawer(job); };
    const openPrep = job => { setDrawer(null); setPrepJob(job); setPage("prep"); };
    const openMock = job => { setDrawer(null); setMockJob(job); setPage("mock"); };
    const [commandOpen, setCommandOpen] = useState(false);
    useEffect(() => {
        const onKeyDown = event => {
            const target = event.target;
            const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(current => !current); return; }
            if (event.key === "Escape") { setCommandOpen(false); if (drawer) setDrawer(null); return; }
            if (!typing && event.key.toLowerCase() === "n") { event.preventDefault(); addJob(); return; }
            if (!typing && event.key.toLowerCase() === "g") { event.preventDefault(); setPage("overview"); return; }
            if (!typing && event.key.toLowerCase() === "a") { event.preventDefault(); setPage("applications"); return; }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [drawer]);
    const content = loading ? <div className="loading-state"><div className="spinner" /><b>Loading your workspace</b><span>{dataSource === "supabase" ? "Reading your applications from Supabase…" : "Getting your demo pipeline ready…"}</span></div> : loadError ? <div className="page-grid"><section className="panel data-error-panel"><div className="empty-icon"><CircleHelp size={22} /></div><p className="eyebrow">Data connection</p><h2>We could not load your garden.</h2><p>{loadError}</p><small>Check that your Supabase environment variables are set and that the <code>jobs</code> table has a user_id column with the required read policy.</small></section></div> : page === "overview" ? <DashboardOverview jobs={filteredJobs} setPage={setPage} openJob={openJob} onPrep={openPrep} onMock={openMock} addJob={addJob} user={user} /> : page === "applications" ? <Applications jobs={filteredJobs} openJob={openJob} editJob={editJob} addJob={addJob} removeJob={remove} setPage={setPage} /> : page === "prep" ? <RoleRoom jobs={filteredJobs} selectedJob={prepJob} setSelectedJob={setPrepJob} onMock={openMock} userId={user.id} /> : page === "mock" ? <MockInterview jobs={filteredJobs} selectedJob={mockJob} setSelectedJob={setMockJob} userId={user.id} /> : page === "analytics" ? <Analytics jobs={filteredJobs} /> : page === "activity" ? <ActivityPage jobs={filteredJobs} /> : <SettingsPage user={user} onSignOut={onSignOut} dataSource={dataSource} />;
    return <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}><Sidebar page={page} setPage={setPage} jobs={jobs} user={user} onSignOut={onSignOut} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(current => !current)} /><MobileNav page={page} setPage={setPage} onAdd={addJob} /><main className="main-new"><Topbar page={page} onAdd={addJob} user={user} setPage={setPage} />{actionError && !drawer && <div className="workspace-alert" role="alert"><CircleHelp size={15} />{actionError}<button type="button" onClick={() => setActionError("")} aria-label="Dismiss error"><X size={14} /></button></div>}{toast && <div className="workspace-toast" role="status"><Check size={15} />{toast}</div>}<div className="mobile-account-strip"><div className="mobile-account-copy"><div className="avatar">{initials(user)}</div><div><b>{displayName(user)}</b><small>{user?.email || "No email connected"}</small></div></div><button type="button" className="mobile-signout" onClick={onSignOut}><LogOut size={15} />Sign out</button></div><div className="content-new">{content}</div></main>{drawer && <JobDrawer key={drawer.id || "new"} job={drawer} onClose={() => setDrawer(null)} onSave={save} onDelete={remove} error={actionError} />}<CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onAdd={addJob} setPage={setPage} /></div>;
}
