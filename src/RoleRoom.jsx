import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowRight, BookOpen, BriefcaseBusiness, Building2, Check, CheckCircle2, ClipboardCheck,
    ExternalLink, Flag, Lightbulb, Link2, Mic, PanelTop, Search, Sparkles, Target,
} from "lucide-react";
import { stageInfo } from "./lib/plantStages";
import { getResearchLinks, getRoleFamily, getRoleQuestions, getStackSignals, getStageTasks, readRoleRoom, saveRoleRoom } from "./lib/roleRoomData";
import StageIcon from "./StageIcon";

function EmptyRoleRoom() {
    return <div className="page-grid"><section className="panel"><div className="empty-state large"><div className="empty-icon"><SproutFallback /></div><b>Plant an application first</b><p>Your candidate room is built around one real role, so the research and practice stay specific.</p></div></section></div>;
}

function SproutFallback() { return <span aria-hidden="true">🌱</span>; }

function RoleSelector({ jobs, jobId, onChange }) {
    return <div className="role-room-selector"><div><span className="section-kicker">Candidate room</span><h2>Everything you need for the next step.</h2><p>Research the company, complete the right tasks, then practice the conversation.</p></div><label><span>Role in focus</span><select value={jobId} onChange={event => onChange(event.target.value)}>{jobs.map(item => <option key={item.id} value={item.id}>{item.company} · {item.role}</option>)}</select></label></div>;
}

function RoomHero({ job, stage, taskCount, completedCount, onMock }) {
    return <section className="role-room-hero"><div className="role-room-hero-copy"><div className="role-room-kicker"><span className="role-room-step">{stage.step}</span><span>{stage.label} · {stage.title}</span></div><h1>Prepare like you already belong there.</h1><p>{job.role} at <strong>{job.company}</strong>. Turn public signals and your own evidence into a focused, repeatable plan.</p><div className="role-room-meta"><span><BriefcaseBusiness size={14} />{job.location || "Location not set"}</span><span><ClipboardCheck size={14} />{completedCount}/{taskCount} tasks complete</span><span><Flag size={14} />6-stage journey</span></div></div><div className="role-room-hero-actions"><div className="role-room-readiness"><span>Readiness</span><strong>{Math.round((completedCount / taskCount) * 100)}<small>%</small></strong><i><em style={{ width: `${Math.max(4, (completedCount / taskCount) * 100)}%` }} /></i><small>{completedCount ? "Momentum is visible" : "Start with one task"}</small></div><button type="button" className="primary-btn light" onClick={() => onMock(job)}><Mic size={15} />Practice out loud</button></div></section>;
}

function RoomTabs({ tab, setTab }) {
    return <div className="role-room-tabs" role="tablist" aria-label="Candidate room sections"><button type="button" role="tab" aria-selected={tab === "research"} className={tab === "research" ? "active" : ""} onClick={() => setTab("research")}><Search size={15} />Company research</button><button type="button" role="tab" aria-selected={tab === "plan"} className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}><PanelTop size={15} />Six-stage plan</button><button type="button" role="tab" aria-selected={tab === "questions"} className={tab === "questions" ? "active" : ""} onClick={() => setTab("questions")}><Lightbulb size={15} />Question lab</button></div>;
}

function ResearchTab({ job, notes, setNotes }) {
    const links = getResearchLinks(job);
    const signals = getStackSignals(job.role);
    const [saved, setSaved] = useState(false);
    const saveNotes = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
    return <div className="role-room-research"><div className="role-room-section-intro"><div><span className="section-kicker">01 · Verify the signal</span><h2>Research the company like a candidate.</h2><p>Start with these source trails, then write down what is actually useful for your application. Every link opens a separate source search so you can verify the detail yourself.</p></div><span className="research-trust"><CheckCircle2 size={15} />Source-led</span></div><div className="research-grid">{links.map((item, index) => <a className="research-card" href={item.url} target="_blank" rel="noreferrer" key={item.label}><span className="research-card-index">0{index + 1}</span><span className="research-card-icon">{index === 0 ? <Building2 size={17} /> : index === 1 ? <PanelTop size={17} /> : index === 2 ? <Link2 size={17} /> : <Sparkles size={17} />}</span><strong>{item.label}</strong><small>{item.detail}</small><ExternalLink size={14} /></a>)}</div><div className="research-signal-grid"><section className="panel research-checklist"><div className="panel-heading"><div><p className="eyebrow">What to bring back</p><h2>Four signals worth capturing</h2></div><BookOpen size={17} /></div><ul><li><span>01</span><div><b>How they hire</b><small>Recruiter screen, assessment, interview loop, decision timing.</small></div></li><li><span>02</span><div><b>What they build</b><small>Product, customers, current priorities, and the problem this role owns.</small></div></li><li><span>03</span><div><b>How they work</b><small>Team rituals, values, collaboration style, and what “good” looks like.</small></div></li><li><span>04</span><div><b>What they test</b><small>Technical or craft depth, communication, judgment, and evidence of impact.</small></div></li></ul></section><section className="panel research-stack"><div className="panel-heading"><div><p className="eyebrow">Role signals</p><h2>What to investigate for {getRoleFamily(job.role)}</h2></div><Target size={17} /></div><div className="stack-signal-list">{signals.map(signal => <div key={signal}><Check size={14} />{signal}</div>)}</div><p className="research-note">These are investigation prompts, not invented company facts. Confirm the details from the source trails above.</p></section></div><section className="panel research-notes"><div className="panel-heading"><div><p className="eyebrow">Your evidence log</p><h2>Keep the useful details in one place.</h2></div><button type="button" className="secondary-btn" onClick={saveNotes}>{saved ? <><Check size={15} />Saved</> : <><ClipboardCheck size={15} />Save notes</>}</button></div><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder={`Paste hiring steps, tech stack notes, product signals, or questions you found about ${job.company}…`} rows="6" /><small>Saved in this browser for this role. Your application itself continues to save through the connected data source.</small></section></div>;
}

function PlanTab({ job, completed, onToggle }) {
    const stages = useMemo(() => getStageTasks(job), [job]);
    return <div className="role-room-plan"><div className="role-room-section-intro"><div><span className="section-kicker">02 · Tend the journey</span><h2>Six stages. One candidate story.</h2><p>Use the same role record from the first seed to the final outcome. The plan keeps the small tasks visible so preparation does not start the night before.</p></div><span className="stage-count-badge">{Object.values(completed).filter(Boolean).length} tasks done</span></div><div className="stage-plan-list">{stages.map(stage => { const info = stageInfo(stage.id); const done = stage.tasks.filter(task => completed[task.id]).length; return <section className={`stage-plan-card ${job.status === stage.id ? "current" : ""}`} key={stage.id} style={{ "--stage-color": info.color, "--stage-tint": info.tint }}><div className="stage-plan-head"><div className="stage-plan-mark"><StageIcon stage={stage} size={21} /></div><div><span>{stage.step} · {stage.label}</span><h3>{stage.title}</h3><p>{stage.short}</p></div><b>{done}/{stage.tasks.length}</b></div><div className="stage-task-list">{stage.tasks.map(task => <label className={completed[task.id] ? "is-done" : ""} key={task.id}><input type="checkbox" checked={Boolean(completed[task.id])} onChange={() => onToggle(task.id)} /><span className="task-check"><Check size={12} /></span><span>{task.label}</span></label>)}</div></section>; })}</div></div>;
}

function QuestionsTab({ job, onMock }) {
    const questions = getRoleQuestions(job);
    return <div className="role-room-questions"><div className="role-room-section-intro"><div><span className="section-kicker">03 · Rehearse the proof</span><h2>Questions to answer before they ask.</h2><p>Use the public signals you found to make your answer specific, then practice it out loud until the structure feels natural.</p></div><button type="button" className="primary-btn" onClick={() => onMock(job)}><Mic size={15} />Open mock interview</button></div><div className="question-lab-grid">{questions.map((question, index) => <article className="question-lab-card" key={question}><span>0{index + 1}</span><div><strong>{question}</strong><small>{index === 0 ? "Role signal" : index === 1 ? "Behavioral" : index === 2 ? "Company motivation" : "Collaboration"}</small></div><button type="button" onClick={() => onMock(job)} aria-label={`Practice question ${index + 1}`}><ArrowRight size={15} /></button></article>)}</div></div>;
}

export default function RoleRoom({ jobs, selectedJob, setSelectedJob, onMock, userId = "demo-user" }) {
    const [jobId, setJobId] = useState(selectedJob?.id || jobs.find(job => job.status === "Interview")?.id || jobs[0]?.id || "");
    const job = jobs.find(item => item.id === jobId) || selectedJob || jobs[0];
    const [tab, setTab] = useState("research");
    const [notes, setNotes] = useState("");
    const [completed, setCompleted] = useState({});
    const stages = useMemo(() => job ? getStageTasks(job) : [], [job]);
    const taskCount = stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
    const completedCount = Object.values(completed).filter(Boolean).length;

    useEffect(() => {
        if (!job) return;
        const saved = readRoleRoom(userId, job.id);
        const timer = window.setTimeout(() => {
            setNotes(saved.researchNotes || "");
            setCompleted(saved.completed || {});
        }, 0);
        return () => window.clearTimeout(timer);
    }, [job, userId]);

    const update = value => { setCompleted(value); saveRoleRoom(userId, job.id, { researchNotes: notes, completed: value }); };
    const onNotesChange = value => { setNotes(value); saveRoleRoom(userId, job.id, { researchNotes: value, completed }); };
    if (!jobs.length || !job) return <EmptyRoleRoom />;
    const stage = stageInfo(job.status);
    return <div className="page-grid role-room-page"><RoleSelector jobs={jobs} jobId={jobId} onChange={value => { setJobId(value); setSelectedJob(jobs.find(item => item.id === value)); }} /><RoomHero job={job} stage={stage} taskCount={taskCount} completedCount={completedCount} onMock={onMock} /><RoomTabs tab={tab} setTab={setTab} />{tab === "research" && <ResearchTab job={job} notes={notes} setNotes={onNotesChange} />}{tab === "plan" && <PlanTab job={job} completed={completed} onToggle={id => update({ ...completed, [id]: !completed[id] })} />}{tab === "questions" && <QuestionsTab job={job} onMock={onMock} />}</div>;
}
