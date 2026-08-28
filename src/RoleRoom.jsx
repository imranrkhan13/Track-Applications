import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowRight, BookOpen, BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, ClipboardCheck,
    Code2, ExternalLink, FileSearch, Flag, GitBranch, Hash, HeartHandshake, Lightbulb, Link2, LoaderCircle, MessageCircle,
    Mic, Network, PanelTop, RefreshCw, Search, Sparkles, Sprout, Target,
} from "lucide-react";
import { stageInfo } from "./lib/plantStages";
import { getResearchLinks, getRoleFamily, getRoleQuestions, getStackSignals, getStageTasks, readRoleRoom, saveRoleRoom } from "./lib/roleRoomData";
import { researchRole } from "./lib/roleResearch";
import StageIcon from "./StageIcon";

function SproutFallback() { return <span aria-hidden="true">🌱</span>; }

function dateLabel(value) {
    if (!value) return "a date you choose";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function EmptyRoleRoom() {
    return <div className="page-grid"><section className="panel"><div className="empty-state large"><div className="empty-icon"><SproutFallback /></div><b>Plant an application first</b><p>Your candidate room is built around one real role, so the research and practice stay specific.</p></div></section></div>;
}

function RoleSelector({ jobs, jobId, onChange }) {
    return <div className="role-room-selector"><div><span className="section-kicker">Prepare</span><h2>Research the company and build your interview plan.</h2><p>Start with the role in focus, then move from evidence to practice.</p></div><label><span>Role in focus</span><select value={jobId} onChange={event => onChange(event.target.value)}>{jobs.map(item => <option key={item.id} value={item.id}>{item.role || "Role not specified"} · {item.company || "Company not specified"} · {item.status}</option>)}</select></label></div>;
}

const PREP_CHANNEL_GROUPS = [
    { label: "Research", channels: [{ id: "company", label: "company", icon: Building2 }, { id: "job-description", label: "job-description", icon: FileSearch }, { id: "hiring-process", label: "hiring-process", icon: GitBranch }] },
    { label: "Preparation", channels: [{ id: "preparation-plan", label: "preparation-plan", icon: CalendarDays }, { id: "technical", label: "technical", icon: Code2 }, { id: "system-design", label: "system-design", icon: Network }, { id: "behavioral", label: "behavioral", icon: HeartHandshake }] },
    { label: "Practice", channels: [{ id: "questions", label: "questions", icon: Lightbulb }, { id: "mock-interviews", label: "mock-interviews", icon: Mic }] },
    { label: "Personal", channels: [{ id: "notes", label: "notes", icon: BookOpen }, { id: "resources", label: "resources", icon: Link2 }] },
];

const CHANNEL_META = {
    overview: { label: "overview", description: "The role context and the next useful move." },
    company: { label: "company", description: "Public company signals, products, values, and working style." },
    "job-description": { label: "job-description", description: "The saved role brief, requirements, and proof to prepare." },
    "hiring-process": { label: "hiring-process", description: "Reported process clues, clearly marked for verification." },
    "preparation-plan": { label: "preparation-plan", description: "A dated route from role research to interview-ready proof." },
    technical: { label: "technical", description: "Role-relevant technical topics and gap-closing practice." },
    coding: { label: "coding", description: "Coding patterns and a small project to make the concepts stick." },
    "system-design": { label: "system-design", description: "Architecture trade-offs to rehearse for this role." },
    behavioral: { label: "behavioral", description: "Stories, decisions, and measurable outcomes from your experience." },
    questions: { label: "questions", description: "Questions built from the role signal and public research." },
    "mock-interviews": { label: "mock-interviews", description: "Practice one question at a time and get coach notes." },
    notes: { label: "notes", description: "Your private evidence log for this application." },
    resources: { label: "resources", description: "Free resources and source trails attached to this role." },
};

const CHANNEL_TO_TAB = {
    overview: "research", company: "research", "job-description": "research", "hiring-process": "research", resources: "research",
    "preparation-plan": "plan", technical: "questions", coding: "questions", "system-design": "questions", behavioral: "questions", questions: "questions", notes: "notes",
};

function PrepChannelRail({ job, channel, onSelect, progress, interviewDate, onMock }) {
    return <aside className="prep-channel-rail" aria-label="Interview preparation channels"><div className="prep-channel-identity"><span className="prep-channel-mark"><Sprout size={17} /></span><div><span>Application</span><strong>{job.company || "Your company"}</strong><small>{job.role || "Your role"}</small></div><span className="prep-more" aria-hidden="true"><MoreHorizontalIcon /></span></div><div className="prep-channel-list"><button type="button" className={`prep-channel-item ${channel === "overview" ? "active" : ""}`} onClick={() => onSelect("overview")}><Hash size={14} /><span>overview</span></button>{PREP_CHANNEL_GROUPS.map(group => <div className="prep-channel-group" key={group.label}><span>{group.label}</span>{group.channels.map(item => { const Icon = item.icon; return <button type="button" className={`prep-channel-item ${channel === item.id ? "active" : ""}`} key={item.id} onClick={() => item.id === "mock-interviews" ? onMock(job) : onSelect(item.id)}><Icon size={14} /><span>{item.label}</span></button>; })}</div>)}</div><div className="prep-channel-footer"><div className="prep-progress-head"><span>Preparation progress</span><strong>{progress}%</strong></div><div className="prep-progress-bar"><i style={{ width: `${Math.max(2, progress)}%` }} /></div><small>{interviewDate ? `${Math.max(0, Math.ceil((new Date(interviewDate) - new Date()) / 86400000))} days to target` : "Add an interview date to focus the room"}</small></div></aside>;
}

function MoreHorizontalIcon() { return <span className="prep-more-icon">•••</span>; }

function ChannelHeader({ channel, analysis, job }) {
    const meta = CHANNEL_META[channel] || CHANNEL_META.overview;
    return <div className="prep-channel-header"><div><span className="prep-channel-breadcrumb"><span>Interview Prep</span><ChevronChannel /> <b>#{meta.label}</b></span><h2>{meta.label === "overview" ? `${job.company} · ${job.role}` : `#${meta.label}`}</h2><p>{meta.description}</p></div><span className={`prep-source-state ${analysis ? "ready" : "pending"}`}><i />{analysis ? "Role context ready" : "Research pending"}</span></div>;
}

function ChevronChannel() { return <span aria-hidden="true">/</span>; }

function RoomHero({ job, stage, taskCount, completedCount, onMock }) {
    const readiness = taskCount ? Math.round((completedCount / taskCount) * 100) : 0;
    return <section className="role-room-hero"><div className="role-room-hero-copy"><div className="role-room-kicker"><span className="role-room-step">{stage.step}</span><span>{stage.label} · {stage.title}</span></div><h1>Prepare like you already belong there.</h1><p>{job.role} at <strong>{job.company}</strong>. Turn the real job brief, public company signals, and your own evidence into a focused plan.</p><div className="role-room-meta"><span><BriefcaseBusiness size={14} />{job.location || "Location not set"}</span><span><ClipboardCheck size={14} />{completedCount}/{taskCount} tasks complete</span><span><Flag size={14} />6-stage journey</span>{job.deadline && <span><CalendarDays size={14} />Target {dateLabel(job.deadline)}</span>}</div></div><div className="role-room-hero-actions"><div className="role-room-readiness"><span>Readiness</span><strong>{readiness}<small>%</small></strong><i><em style={{ width: `${Math.max(4, readiness)}%` }} /></i><small>{completedCount ? "Momentum is visible" : "Start with one task"}</small></div><button type="button" className="primary-btn light" onClick={() => onMock(job)}><Mic size={15} />Practice out loud</button></div></section>;
}

function RoomTabs({ tab, setTab }) {
    return <div className="role-room-tabs" role="tablist" aria-label="Candidate room sections"><button type="button" role="tab" aria-selected={tab === "research"} className={tab === "research" ? "active" : ""} onClick={() => setTab("research")}><Search size={15} />Company research</button><button type="button" role="tab" aria-selected={tab === "plan"} className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}><PanelTop size={15} />Interview plan</button><button type="button" role="tab" aria-selected={tab === "questions"} className={tab === "questions" ? "active" : ""} onClick={() => setTab("questions")}><Lightbulb size={15} />Question lab</button><button type="button" role="tab" aria-selected={tab === "notes"} className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}><BookOpen size={15} />Notes</button></div>;
}

function ResearchAction({ job, analysis, analysisState, analysisError, onAnalyze }) {
    const ready = Boolean(analysis);
    return <section className={`role-research-action ${ready ? "is-ready" : ""}`}><div className="role-research-action-icon">{analysisState === "loading" ? <LoaderCircle className="spin" size={20} /> : <FileSearch size={20} />}</div><div className="role-research-action-copy"><span className="section-kicker">Role intelligence</span><h2>{analysisState === "loading" ? "Reading the role and company…" : ready ? "Your role brief is ready." : "Build the plan from the real role."}</h2><p>{analysisState === "loading" ? "Fetching the job link, public company signals, and hiring clues. This can take a few seconds." : ready ? `Research is saved for this role${analysis.targetDate ? ` through ${dateLabel(analysis.targetDate)}` : ""}. Refresh it whenever the job changes.` : `We’ll read ${job.url ? "the saved job link and " : "public company sources and "}build a dated preparation plan. Unknown details stay marked for verification.`}</p>{analysisState === "loading" && <div className="research-progress" aria-label="Research progress"><span><i />Read job source</span><span><i />Search public company signals</span><span><i />Build preparation route</span></div>}{analysisError && <small className="role-research-error">{analysisError}</small>}</div><button type="button" className="primary-btn" onClick={onAnalyze} disabled={analysisState === "loading"}>{analysisState === "loading" ? "Researching…" : ready ? <><RefreshCw size={14} />Refresh research</> : <><FileSearch size={14} />Research &amp; build plan</>}</button></section>;
}

function ResearchSnapshot({ analysis }) {
    if (!analysis) return null;
    const research = analysis.companyResearch || {};
    const jd = analysis.jd || {};
    const cards = [["Company", research.overview], ["Hiring process", research.hiringProcess], ["Tech stack", research.techStack], ["How they work", research.culture]];
    const list = (items, fallback) => items?.length ? <ul>{items.slice(0, 6).map(item => <li key={item}><span /><span>{item}</span></li>)}</ul> : <p className="research-list-empty">{fallback}</p>;
    return <section className="role-research-snapshot"><div className="role-research-snapshot-head"><div><span className="section-kicker">Verified signals</span><h2>What the role is telling you.</h2></div><span className={`research-mode-pill ${analysis.mode === "researched-ai" ? "ai" : ""}`}><CheckCircle2 size={13} />{analysis.mode === "researched-ai" ? "AI synthesis" : "Source map"}</span></div><div className="role-jd-brief"><div><span>Job brief</span><strong>{jd.title || "Role source"}</strong><p>{jd.summary || "No summary was extracted from the supplied source."}</p></div><div><span>Signals extracted</span><b>{(jd.keywords || []).length || 0}</b><small>{(jd.keywords || []).slice(0, 5).join(" · ") || "Add a public JD for exact requirements"}</small></div></div><div className="role-jd-lists"><article><span>Must-have signals</span>{list(jd.requirements, "No requirements were extracted from this source.")}</article><article><span>Responsibilities</span>{list(jd.responsibilities, "No responsibilities were extracted from this source.")}</article></div><div className="role-research-signal-grid">{cards.map(([label, value]) => <article key={label}><span>{label}</span><p>{value || "Not verified yet."}</p></article>)}</div>{(research.sources || []).length > 0 && <div className="role-source-row"><span>Sources checked · each link is evidence</span>{research.sources.slice(0, 5).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><small>{source.sourceType || "Public source"}</small><strong>{source.title || "Open source"}</strong><ExternalLink size={11} /></a>)}</div>}<small className="role-research-disclaimer">{analysis.disclaimer || "Public sources can be incomplete. Verify important details with the official company or recruiter."}</small></section>;
}

function ResearchLinks({ job }) {
    return <div className="research-grid">{getResearchLinks(job).map((item, index) => <a className="research-card" href={item.url} target="_blank" rel="noreferrer" key={item.label}><span className="research-card-index">0{index + 1}</span><span className="research-card-icon">{index === 0 ? <Building2 size={17} /> : index === 1 ? <PanelTop size={17} /> : index === 2 ? <Link2 size={17} /> : <Sparkles size={17} />}</span><strong>{item.label}</strong><small>{item.detail}</small><ExternalLink size={14} /></a>)}</div>;
}

function ResearchPrompts({ job }) {
    const signals = getStackSignals(job.role);
    return <div className="research-signal-grid"><section className="panel research-checklist"><div className="panel-heading"><div><p className="eyebrow">What to bring back</p><h2>Four signals worth capturing</h2></div><BookOpen size={17} /></div><ul><li><span>01</span><div><b>How they hire</b><small>Recruiter screen, assessment, interview loop, decision timing.</small></div></li><li><span>02</span><div><b>What they build</b><small>Product, customers, current priorities, and the problem this role owns.</small></div></li><li><span>03</span><div><b>How they work</b><small>Team rituals, values, collaboration style, and what “good” looks like.</small></div></li><li><span>04</span><div><b>What they test</b><small>Technical or craft depth, communication, judgment, and evidence of impact.</small></div></li></ul></section><section className="panel research-stack"><div className="panel-heading"><div><p className="eyebrow">Role signals</p><h2>What to investigate for {getRoleFamily(job.role)}</h2></div><Target size={17} /></div><div className="stack-signal-list">{signals.map(signal => <div key={signal}><Check size={14} />{signal}</div>)}</div><p className="research-note">These are investigation prompts, not invented company facts. Confirm the details from the source trails above.</p></section></div>;
}

function EvidenceNotes({ job, notes, setNotes }) {
    const [saved, setSaved] = useState(false);
    const saveNotes = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
    return <section className="panel research-notes"><div className="panel-heading"><div><p className="eyebrow">Your evidence log</p><h2>Keep the useful details in one place.</h2></div><button type="button" className="secondary-btn" onClick={saveNotes}>{saved ? <><Check size={15} />Saved</> : <><ClipboardCheck size={15} />Save notes</>}</button></div><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder={`Paste hiring steps, tech stack notes, product signals, or questions you found about ${job.company}…`} rows="6" /><small>Saved in this browser for this role. Your application itself continues to save through the connected data source.</small></section>;
}

function ResearchTab({ job, notes, setNotes, analysis, analysisState, analysisError, onAnalyze }) {
    return <div className="role-room-research"><ResearchAction job={job} analysis={analysis} analysisState={analysisState} analysisError={analysisError} onAnalyze={onAnalyze} /><ResearchSnapshot analysis={analysis} /><div className="role-room-section-intro"><div><span className="section-kicker">01 · Verify the signal</span><h2>Research the company like a candidate.</h2><p>Start with these source trails, then write down what is actually useful for your application. The analyzer checks the saved link when it is accessible and adds public company sources around it.</p></div><span className="research-trust"><CheckCircle2 size={15} />Source-led</span></div><ResearchLinks job={job} /><ResearchPrompts job={job} /><EvidenceNotes job={job} notes={notes} setNotes={setNotes} /></div>;
}

function WeeklyCurriculum({ weeks }) {
    if (!weeks?.length) return null;
    return <section className="weekly-curriculum"><div className="weekly-curriculum-head"><div><span className="section-kicker">Learning route</span><h2>Learn it. Make it. Practice it.</h2><p>Every week turns the role requirements into free resources, one useful project, and a rehearsal you can carry into the interview.</p></div><span className="weekly-count">{weeks.length} {weeks.length === 1 ? "week" : "weeks"}</span></div><div className="weekly-curriculum-grid">{weeks.map(week => <article className="weekly-curriculum-card" key={week.week}><div className="weekly-card-head"><span className="weekly-card-number">{String(week.week).padStart(2, "0")}</span><div><h3>{week.label}</h3><small>{dateLabel(week.startDate)} – {dateLabel(week.endDate)}</small></div></div><p className="weekly-focus">{week.focus}</p><div className="weekly-card-columns"><div className="weekly-block"><span>Learn</span><ul>{(week.learn || []).map(resource => <li key={resource.url}><a href={resource.url} target="_blank" rel="noreferrer"><strong>{resource.title}</strong><small>{resource.type || "Resource"} · {resource.free === false ? "Check access" : "Free"}</small><ExternalLink size={11} /></a></li>)}</ul></div><div className="weekly-block weekly-project"><span>Make</span><strong>{week.project?.title || "Role project"}</strong><p>{week.project?.brief || "Build a small artifact that proves what you learned."}</p><small>{week.project?.deliverable || "Save the artifact and write down what you would improve next."}</small></div><div className="weekly-block"><span>Practice</span><ul>{(week.practice || []).map(item => <li className="weekly-practice-item" key={item}><i /><span>{item}</span></li>)}</ul></div></div></article>)}</div></section>;
}

function GeneratedPlan({ job, analysis }) {
    if (!analysis?.plan?.length) return <section className="role-plan-empty"><div><span className="section-kicker">Role timeline</span><h2>Build the dated plan first.</h2><p>Run role research and we’ll work backwards from your deadline or create a practical two-week plan.</p></div></section>;
    const target = analysis.targetDate || analysis.plan[analysis.plan.length - 1]?.date;
    return <><WeeklyCurriculum weeks={analysis.weeks} /><section className="generated-role-plan"><div className="generated-role-plan-head"><div><span className="section-kicker">Role timeline</span><h2>Work backwards from {dateLabel(target)}.</h2><p>{analysis.summary || analysis.whyThisRole || `A focused plan for ${job.role} at ${job.company}.`}</p></div><span className="generated-plan-target"><CalendarDays size={14} />{job.deadline ? "Your target date" : "14-day starter plan"}</span></div><div className="generated-plan-list">{analysis.plan.map((item, index) => <article className="generated-plan-item" key={`${item.date}-${item.title}-${index}`}><span className="generated-plan-index">{String(index + 1).padStart(2, "0")}</span><div className="generated-plan-date">{dateLabel(item.date)}</div><div className="generated-plan-copy"><h3>{item.title}</h3><p>{item.focus}</p><ul>{(item.tasks || []).map(task => <li key={task}><span />{task}</li>)}</ul><small>{item.durationMinutes || 45} min · {item.outcome || "Leave one useful proof ready"}</small></div></article>)}</div>{(analysis.questions || []).length > 0 && <div className="generated-plan-footer"><span>Questions to carry into practice</span><p>{analysis.questions.slice(0, 3).join(" · ")}</p></div>}</section></>;
}

function PlanTab({ job, completed, onToggle, analysis }) {
    const stages = useMemo(() => getStageTasks(job), [job]);
    return <div className="role-room-plan"><GeneratedPlan job={job} analysis={analysis} /><div className="role-room-section-intro"><div><span className="section-kicker">02 · Tend the journey</span><h2>Six stages. One candidate story.</h2><p>Use the same role record from the first seed to the final outcome. The plan keeps the small tasks visible so preparation does not start the night before.</p></div><span className="stage-count-badge">{Object.values(completed).filter(Boolean).length} tasks done</span></div><div className="stage-plan-list">{stages.map(stage => { const info = stageInfo(stage.id); const done = stage.tasks.filter(task => completed[task.id]).length; return <section className={`stage-plan-card ${job.status === stage.id ? "current" : ""}`} key={stage.id} style={{ "--stage-color": info.color, "--stage-tint": info.tint }}><div className="stage-plan-head"><div className="stage-plan-mark"><StageIcon stage={stage} size={21} /></div><div><span>{stage.step} · {stage.label}</span><h3>{stage.title}</h3><p>{stage.short}</p></div><b>{done}/{stage.tasks.length}</b></div><div className="stage-task-list">{stage.tasks.map(task => <label className={completed[task.id] ? "is-done" : ""} key={task.id}><input type="checkbox" checked={Boolean(completed[task.id])} onChange={() => onToggle(task.id)} /><span className="task-check"><Check size={12} /></span><span>{task.label}</span></label>)}</div></section>; })}</div></div>;
}

function QuestionsTab({ job, onMock, analysis }) {
    const questions = analysis?.questions?.length ? analysis.questions : getRoleQuestions(job);
    return <div className="role-room-questions"><div className="role-room-section-intro"><div><span className="section-kicker">03 · Rehearse the proof</span><h2>Questions to answer before they ask.</h2><p>Use the public signals you found to make your answer specific, then practice it out loud until the structure feels natural.</p></div><button type="button" className="primary-btn" onClick={() => onMock(job)}><Mic size={15} />Open mock interview</button></div><div className="question-lab-grid">{questions.slice(0, 6).map((question, index) => <article className="question-lab-card" key={question}><span>0{index + 1}</span><div><strong>{question}</strong><small>{index === 0 ? "Role signal" : index === 1 ? "Behavioral" : index === 2 ? "Company motivation" : "Collaboration"}</small></div><button type="button" onClick={() => onMock(job)} aria-label={`Practice question ${index + 1}`}><ArrowRight size={15} /></button></article>)}</div></div>;
}

function NotesTab({ job, notes, setNotes, onSave }) {
    const [saved, setSaved] = useState(false);
    const save = () => { onSave(); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
    return <div className="role-room-notes"><div className="role-room-section-intro"><div><span className="section-kicker">04 · Keep the signal</span><h2>Write down what you want to remember.</h2><p>Capture hiring steps, product details, technology signals, and questions while they are still fresh.</p></div><button type="button" className="secondary-btn" onClick={save}><ClipboardCheck size={15} />{saved ? "Saved" : "Save notes"}</button></div><section className="panel research-notes"><div className="panel-heading"><div><p className="eyebrow">Evidence log</p><h2>{job.company} · {job.role}</h2></div><span className="notes-status">Private to this role</span></div><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder={`Paste hiring steps, tech stack notes, product signals, or questions you found about ${job.company}…`} rows="12" /><small>Saved in this browser for this role. Your application continues to save through the connected data source.</small></section></div>;
}

export default function RoleRoom({ jobs, selectedJob, setSelectedJob, onMock, userId = "demo-user" }) {
    const [jobId, setJobId] = useState(selectedJob?.id || jobs.find(job => job.status === "Interview")?.id || jobs[0]?.id || "");
    const job = jobs.find(item => item.id === jobId) || selectedJob || jobs[0];
    const [tab, setTab] = useState("research");
    const [channel, setChannel] = useState("overview");
    const [notes, setNotes] = useState("");
    const [completed, setCompleted] = useState({});
    const [analysis, setAnalysis] = useState(null);
    const [analysisState, setAnalysisState] = useState("idle");
    const [analysisError, setAnalysisError] = useState("");
    const stages = useMemo(() => job ? getStageTasks(job) : [], [job]);
    const taskCount = stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
    const completedCount = Object.values(completed).filter(Boolean).length;

    useEffect(() => {
        if (!job) return undefined;
        const saved = readRoleRoom(userId, job.id);
        const timer = window.setTimeout(() => {
            setNotes(saved.researchNotes || "");
            setCompleted(saved.completed || {});
            setAnalysis(saved.analysis || null);
            setAnalysisState(saved.analysis ? "ready" : "idle");
            setAnalysisError("");
            setChannel("overview");
        }, 0);
        return () => window.clearTimeout(timer);
    }, [job, userId]);

    const update = value => { setCompleted(value); saveRoleRoom(userId, job.id, { researchNotes: notes, completed: value, analysis }); };
    const saveNotes = () => saveRoleRoom(userId, job.id, { researchNotes: notes, completed, analysis });
    const onNotesChange = value => { setNotes(value); saveRoleRoom(userId, job.id, { researchNotes: value, completed, analysis }); };
    const runAnalysis = async () => {
        setAnalysisState("loading");
        setAnalysisError("");
        try {
            const result = await researchRole({ company: job.company, role: job.role, location: job.location, url: job.url, deadline: job.deadline });
            setAnalysis(result);
            setAnalysisState("ready");
            saveRoleRoom(userId, job.id, { researchNotes: notes, completed, analysis: result });
        } catch (error) {
            setAnalysisState(analysis ? "ready" : "idle");
            setAnalysisError(error?.message || "Research could not be completed. Try again with a public role link.");
        }
    };

    if (!jobs.length || !job) return <EmptyRoleRoom />;
    const stage = stageInfo(job.status);
    return <div className="page-grid role-room-page"><RoleSelector jobs={jobs} jobId={jobId} onChange={value => { setJobId(value); setSelectedJob(jobs.find(item => item.id === value)); }} /><RoomHero job={job} stage={stage} taskCount={taskCount} completedCount={completedCount} onMock={onMock} /><div className="prep-channel-shell"><PrepChannelRail job={job} channel={channel} onSelect={id => { setChannel(id); setTab(CHANNEL_TO_TAB[id] || "research"); }} progress={taskCount ? Math.round((completedCount / taskCount) * 100) : 0} interviewDate={job.deadline} onMock={onMock} /><div className="prep-channel-main"><ChannelHeader channel={channel} analysis={analysis} job={job} /><RoomTabs tab={tab} setTab={next => { setTab(next); setChannel(next === "plan" ? "preparation-plan" : next === "questions" ? "questions" : next === "notes" ? "notes" : "company"); }} />{tab === "research" && <ResearchTab job={job} notes={notes} setNotes={onNotesChange} analysis={analysis} analysisState={analysisState} analysisError={analysisError} onAnalyze={runAnalysis} />}{tab === "plan" && <PlanTab job={job} completed={completed} onToggle={id => update({ ...completed, [id]: !completed[id] })} analysis={analysis} />}{tab === "questions" && <QuestionsTab job={job} onMock={onMock} analysis={analysis} />}{tab === "notes" && <NotesTab job={job} notes={notes} setNotes={onNotesChange} onSave={saveNotes} />}</div></div></div>;
}
