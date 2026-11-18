import { useState } from 'react';
import { CalendarDays, Check, ArrowRight, RefreshCw, LayoutList, CalendarRange } from 'lucide-react';
import { workspaceFor } from './repository';
import { buildPreparation, FAMILIES, inferFamily, planIsStale } from './planner';
import { ExternalLink } from './UI';

// Calendar view: one column per day, tasks placed on their scheduled dates.
// Uses the plan's timezone so the grid matches the user's local dates.
function ScheduleCalendar({ tasks, completed, timezone, onToggle }) {
    if (!tasks.length) return <p className="cg-inline-note">Nothing scheduled yet. Create a plan to see your calendar.</p>;
    const byDay = new Map();
    for (const task of tasks) {
        const day = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(task.start));
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(task);
    }
    const days = [...byDay.keys()].sort();
    const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return <div className="cg-calendar" role="grid" aria-label="Scheduled preparation by day">
        {days.map(day => {
            const dayTasks = byDay.get(day);
            const isToday = day === todayKey;
            const date = new Date(`${day}T12:00:00Z`);
            return <section className={`cg-calendar-day ${isToday ? 'is-today' : ''}`} key={day} role="gridcell" aria-label={new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }).format(date)}>
                <header>
                    <b>{new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'short' }).format(date)}</b>
                    <span>{new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(date)}</span>
                </header>
                {dayTasks.map(task => <button key={task.id} className={`cg-calendar-task ${completed.has(task.id) ? 'is-done' : ''}`} onClick={() => onToggle(task)} title={task.title}>
                    <span className="cg-calendar-time">{new Intl.DateTimeFormat(undefined, { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(new Date(task.start))}</span>
                    <span className="cg-calendar-title">{task.title}</span>
                    <small>{task.minutes} min</small>
                </button>)}
            </section>;
        })}
    </div>;
}

function Task({ task, completion, onSave, busy, timezone, onPractice }) {
    const [note, setNote] = useState(completion?.note || '');
    const [error, setError] = useState('');
    const complete = async done => {
        setError('');
        if (done && !note.trim()) { setError('Add a short result, project link or what you learned before completing this task.'); return; }
        try { await onSave(task.id, { done, note, completedAt: done ? new Date().toISOString() : null }); } catch (cause) { setError(cause.message); }
    };
    return <details className={`cg-task ${completion?.done ? 'is-done' : ''}`}><summary><span className="cg-task-check">{completion?.done ? <Check /> : <CalendarDays />}</span><span><b>{task.title}</b><small>{task.minutes} min · {completion?.done ? 'Completed' : task.start ? new Intl.DateTimeFormat(undefined, { timeZone: timezone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(task.start)) : 'Not scheduled'}</small></span><span className="cg-task-tag">{task.basis === 'general_recommendation' ? 'Role practice' : task.basis === 'self_review' ? 'Your feedback' : 'Source-linked'}</span></summary><div className="cg-task-body"><p>{task.brief}</p><div className="cg-output"><span className="cg-label">YOUR DELIVERABLE</span><p>{task.artifact}</p></div><p className="cg-muted">Why: {task.reason}</p>{task.evidenceIds?.length > 0 && <small>{task.basis === 'self_review' ? 'Based on your saved practice review.' : task.basis === 'jd_requirement' ? 'Based on your job description.' : 'Based on a reviewed interview account in Research.'}</small>}<ul>{task.rubric.map(line => <li key={line}>{line}</li>)}</ul>{task.resources?.map(r => <div className="cg-resource" key={r.url}><ExternalLink href={r.url}>{r.title}</ExternalLink><p>{r.section}</p><small>{r.access} · checked {r.checkedOn} · access may change</small></div>)}{task.id === 'mock' && <button className="cg-secondary" onClick={onPractice}>Open practice <ArrowRight /></button>}<label>Your result or artifact<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={4000} rows={3} placeholder="What did you learn? Add a project link or a short explanation." /></label>{error && <div className="cg-error" role="alert">{error}</div>}<div className="cg-actions"><button className="cg-secondary" disabled={busy} onClick={() => complete(Boolean(completion?.done))}>Save notes</button><button className="cg-primary" disabled={busy} onClick={() => complete(!completion?.done)}>{completion?.done ? 'Mark incomplete' : 'Complete task'}</button></div></div></details>;
}
export default function Preparation({ job, userId, onUpdate, busy, onPractice }) {
    const w = workspaceFor(job);
    const [preferences, setPreferences] = useState(() => ({ ...w.preferences, roleFamily: w.preferences.roleFamily || inferFamily(job.role) }));
    const [deadline, setDeadline] = useState(w.deadline);
    const [error, setError] = useState('');
    const [showSettings, setShowSettings] = useState(!w.plan);
    const set = (key, value) => setPreferences(p => ({ ...p, [key]: value }));
    const generate = async e => {
        e.preventDefault(); setError('');
        try {
            const enteredDeadline = new FormData(e.currentTarget).get('deadline');
            const next = { ...w, deadline: enteredDeadline, preferences };
            const plan = buildPreparation({ ...job, workspace: next }, userId);
            await onUpdate({ ...next, plan }, w.plan ? 'Replanned remaining preparation' : 'Created preparation plan');
            setDeadline(enteredDeadline); setShowSettings(false);
        } catch (cause) { setError(cause.message); }
    };
    const complete = (id, completion) => onUpdate({ ...w, completed: { ...w.completed, [id]: completion } }, completion.done ? 'Completed a preparation task' : 'Updated task notes');
    const [layout, setLayout] = useState('list');
    const schedule = w.plan?.scheduled || [];
    const completedIds = new Set(Object.keys(w.completed).filter(id => w.completed[id]?.done));
    const groups = new Map();
    const planStart = w.plan ? Date.parse(w.plan.generatedAt) : 0;
    for (const task of schedule.filter(t => !completedIds.has(t.id))) {
        const week = Math.max(1, Math.floor((Date.parse(task.start) - planStart) / (7 * 86400000)) + 1);
        if (!groups.has(week)) groups.set(week, []);
        groups.get(week).push(task);
    }
    const toggleFromCalendar = task => {
        const done = completedIds.has(task.id);
        if (!done && !(w.completed[task.id]?.note || '').trim()) {
            // Completing from the calendar needs a note like the list view.
            // Open the task in the list instead of silently completing it.
            setLayout('list');
            return;
        }
        complete(task.id, { ...(w.completed[task.id] || {}), done: !done, completedAt: !done ? new Date().toISOString() : null });
    };
    return <div className="cg-stack"><section className="cg-surface"><div className="cg-section-head"><div><span className="cg-label">YOUR STUDY PLAN</span><h2>{w.plan ? 'Your preparation plan' : 'Make a plan for this role'}</h2></div><button className="cg-secondary" onClick={() => setShowSettings(!showSettings)}><RefreshCw />{showSettings ? 'Hide settings' : 'Adjust & replan'}</button></div>{planIsStale(job) && <div className="cg-notice">The role, research or your skill gaps have changed. Replan to use the latest information; completed work will stay.</div>}{showSettings && <form className="cg-form" onSubmit={generate}><div className="cg-form-grid"><label>Prepare by<input required name="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></label><label>Role family<select value={preferences.roleFamily} onChange={e => set('roleFamily', e.target.value)}>{FAMILIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Study minutes per day<input type="number" min="20" max="240" required value={preferences.dailyMinutes} onChange={e => set('dailyMinutes', Number(e.target.value))} /></label><label>Start time<input type="time" required value={preferences.startTime} onChange={e => set('startTime', e.target.value)} /></label><label>Timezone<input required value={preferences.timezone} onChange={e => set('timezone', e.target.value)} placeholder="Asia/Kolkata" /></label><label>Preferred research language<input maxLength={60} value={preferences.language} onChange={e => set('language', e.target.value)} /></label><label>Level <small>Use the employer’s exact label</small><input maxLength={100} value={preferences.level} onChange={e => set('level', e.target.value)} placeholder="e.g. SDE II" /></label><label>Hiring route<select value={preferences.channel} onChange={e => set('channel', e.target.value)}><option value="">Not known</option><option value="campus">Campus</option><option value="direct">Direct application</option><option value="referral">Referral</option></select></label></div><fieldset className="cg-days"><legend>Study days</legend>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => <label key={day}><input type="checkbox" checked={preferences.weekdays.includes(index)} onChange={e => set('weekdays', e.target.checked ? [...preferences.weekdays, index] : preferences.weekdays.filter(d => d !== index))} /><span>{day}</span></label>)}</fieldset><p className="cg-muted">15% stays free for catch-up. Dates are in your selected timezone. A long exercise needs one uninterrupted block.</p><button className="cg-primary" disabled={busy}>{busy ? 'Saving…' : w.plan ? 'Replan remaining work' : 'Create my plan'}</button></form>}{error && <div className="cg-error" role="alert">{error}</div>}{w.plan && <><div className="cg-plan-summary"><span><b>{w.plan.tasks.filter(t => completedIds.has(t.id)).length}/{w.plan.tasks.length}</b> tasks completed</span><span><b>{Math.round(w.plan.scheduledMinutes / 60 * 10) / 10}h</b> scheduled at generation</span><span>By <b>{new Intl.DateTimeFormat(undefined, { timeZone: w.plan.timezone, year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(w.plan.deadline))}</b></span></div><progress max={w.plan.tasks.length || 1} value={w.plan.tasks.filter(t => completedIds.has(t.id)).length} aria-label="Preparation tasks completed" /><details className="cg-disclosure"><summary>How this plan is made</summary><p className="cg-muted">{w.plan.assumptions.join(' ')}</p></details></>}</section>{w.plan && schedule.length > 0 && <section className="cg-surface"><div className="cg-section-head"><h2>Schedule</h2><div className="cg-segment" role="group" aria-label="Schedule layout"><button className={layout === 'list' ? 'active' : ''} aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><LayoutList aria-hidden="true" /><span className="cg-sr">List view</span></button><button className={layout === 'calendar' ? 'active' : ''} aria-pressed={layout === 'calendar'} onClick={() => setLayout('calendar')}><CalendarRange aria-hidden="true" /><span className="cg-sr">Calendar view</span></button></div></div>{layout === 'calendar' ? <ScheduleCalendar tasks={schedule.filter(t => !completedIds.has(t.id))} completed={completedIds} timezone={w.plan.timezone} onToggle={toggleFromCalendar} /> : <p className="cg-muted">Switch to the calendar for a day-by-day view, or work through the weekly sections below.</p>}</section>}{[...groups].map(([week, tasks]) => <section className="cg-surface" key={week}><div className="cg-section-head"><h2>Week {week}</h2><span className="cg-muted">{tasks.length} tasks · {w.plan.timezone}</span></div>{tasks.map(t => <Task key={t.id} task={t} completion={w.completed[t.id]} onSave={complete} busy={busy} timezone={w.plan.timezone} onPractice={onPractice} />)}</section>)}{w.plan?.deferred.length > 0 && <section className="cg-surface"><h2>Unscheduled work</h2><p className="cg-muted">These tasks are not scheduled. Increase availability, choose a shorter exercise, or prioritize what matters for the next round.</p>{w.plan.deferred.map(item => <div className="cg-deferred" key={item.id}><b>{w.plan.tasks.find(t => t.id === item.id)?.title}</b><small>{item.reason === 'prerequisite_not_scheduled' ? 'Needs an earlier task first' : 'Not enough uninterrupted time or remaining budget'}</small></div>)}</section>}{completedIds.size > 0 && w.plan && <section className="cg-surface"><h2>Completed work</h2>{w.plan.tasks.filter(t => completedIds.has(t.id)).map(t => <Task key={t.id} task={t} completion={w.completed[t.id]} onSave={complete} busy={busy} timezone={w.plan.timezone} onPractice={onPractice} />)}</section>}</div>;
}
