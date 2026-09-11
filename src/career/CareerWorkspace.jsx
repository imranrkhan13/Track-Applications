import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ArrowUpRight, ArrowLeft, Search, List, Columns3, Pencil, Trash2, RefreshCw, CalendarDays, Check } from 'lucide-react';
import { getJobs, roleMetaFor } from '../lib/appData';
import { supabase } from '../lib/supabase';
import { readRoleRoom } from '../lib/roleRoomData';
import PlantSprite from '../components/landing/PlantSprite';
import { createRepository, STATUSES, STAGE_NAMES, workspaceFor } from './repository';
import { inferFamily } from './planner';
import { synchronizePreparation, workflowSteps } from './workflow';
import { Empty, ExternalLink, JobEditor, Modal } from './UI';
import Preparation from './Preparation';
import Research from './Research';
import Practice from './Practice';
import JobListItem from './JobListItem';
import Sidebar from './Sidebar';


function JobSummary({ job, onUpdate, busy, onEdit }) {
    const w = workspaceFor(job);
    const [notes, setNotes] = useState(job.notes || '');
    const [nextStep, setNextStep] = useState(w.next_step);
    const [date, setDate] = useState(job.next_date || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const submit = async e => { e.preventDefault(); setError(''); setSuccess(false); try { await onUpdate({ ...job, notes, next_date: date, workspace: { ...w, next_step: nextStep } }, 'Updated notes and next action'); setSuccess(true); } catch (cause) { setError(cause.message); } };
    const legacy = readRoleRoom(job.user_id || 'demo-user', job.id);
    return <div className="cg-detail-grid"><section className="cg-surface"><div className="cg-section-head"><h2>The next step</h2><button className="cg-secondary" onClick={onEdit}><Pencil /> Edit job</button></div><form className="cg-form" onSubmit={submit}><label>What happens next?<input maxLength={300} value={nextStep} onChange={e => { setNextStep(e.target.value); setSuccess(false); }} placeholder="Send a follow-up, book a screen, submit an assessment…" /></label><label>Follow-up / interview date<input type="date" value={date} onChange={e => { setDate(e.target.value); setSuccess(false); }} /></label><label>Private notes<textarea rows={7} maxLength={10000} value={notes} onChange={e => { setNotes(e.target.value); setSuccess(false); }} placeholder="Recruiter details, questions and what you learned…" /></label><button className="cg-primary" disabled={busy}>Save next step</button>{success && <p role="status"><Check /> Saved</p>}{error && <div className="cg-error" role="alert">{error}</div>}</form></section><aside className="cg-stack"><section className="cg-surface cg-role-plant"><PlantSprite stage={STATUSES.indexOf(job.status)} label={`${STAGE_NAMES[STATUSES.indexOf(job.status)]}: ${job.status}`} /><div><span className="cg-label">{STAGE_NAMES[STATUSES.indexOf(job.status)]}</span><h2>{job.status}</h2><p>{job.status === 'Rejected' ? 'Keep the lesson. Your next opportunity is still ahead.' : job.status === 'Offer' ? 'An offer is here. Capture the details and your decision.' : 'One step closer to your next chapter.'}</p></div></section><section className="cg-surface"><h2>Role details</h2><dl className="cg-facts"><dt>Location</dt><dd>{job.location || 'Not set'}</dd><dt>Preparation deadline</dt><dd>{w.deadline || 'Not set'}</dd><dt>Salary / offer</dt><dd>{job.salary || 'Not set'}</dd><dt>Source</dt><dd>{w.source || 'Not set'}</dd></dl>{job.url && <ExternalLink href={job.url}>Open job description</ExternalLink>}</section><details className="cg-surface cg-activity"><summary>Activity history</summary><ol className="cg-timeline">{[...(w.activity || [])].reverse().slice(0, 15).map(a => <li key={a.id}><b>{a.label}</b><small>{new Date(a.at).toLocaleString()}</small></li>)}<li><b>Job added</b><small>{new Date(job.created_at).toLocaleDateString()}</small></li></ol></details>{(legacy.researchNotes || legacy.research) && <details className="cg-surface"><summary>Previous workspace notes (this device)</summary><p className="cg-prewrap">{legacy.researchNotes || legacy.research?.summary || 'Previous research is still preserved in this browser.'}</p><p className="cg-muted">Copy any useful notes into this workspace to save them with the job. Old plans are not treated as verified evidence.</p></details>}</aside></div>;
}

export default function CareerWorkspace({ user, onSignOut }) {
    const [params, setParams] = useSearchParams();
    const view = ['prep', 'mock'].includes(params.get('page')) ? params.get('page') : 'applications';
    const selectedId = params.get('job');
    const tab = ['summary', 'research', 'plan', 'practice'].includes(params.get('tab')) ? params.get('tab') : view === 'mock' ? 'practice' : view === 'prep' ? 'plan' : 'summary';
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const [editor, setEditor] = useState(null);
    const [removeTarget, setRemoveTarget] = useState(null);
    const [query, setQuery] = useState('');
    const [stage, setStage] = useState('All');
    const [layout, setLayout] = useState('list');
    const [sort, setSort] = useState('newest');
    const [retry, setRetry] = useState(0);
    const repo = useMemo(() => createRepository({ client: supabase, userId: user.id, storage: window.localStorage, loadLegacy: () => getJobs(user.id), legacyMeta: roleMetaFor }), [user.id]);
    useEffect(() => {
        let active = true;
        repo.list().then(rows => { if (active) { setJobs(rows); setError(''); } }).catch(cause => { if (active) setError(cause.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [repo, retry]);
    const selected = jobs.find(job => String(job.id) === selectedId);
    const navigate = (page, job, activeTab) => setParams({ page, ...(job ? { job: String(job.id), tab: activeTab || (page === 'prep' ? 'plan' : page === 'mock' ? 'practice' : 'summary') } : {}) });
    const replaceJob = saved => setJobs(rows => [saved, ...rows.filter(row => String(row.id) !== String(saved.id))]);
    const write = async (job, label) => {
        if (lock.current) throw new Error('Wait for the current save or research to finish.');
        lock.current = true; setBusy(true); setError(''); setNotice('');
        try {
            const transition = synchronizePreparation(job, user.id);
            const w = workspaceFor(transition.job);
            const saved = await repo.save({ ...transition.job, workspace: { ...w, activity: [...w.activity, { id: crypto.randomUUID(), at: new Date().toISOString(), label }] } });
            replaceJob(saved); setNotice(`${repo.demo ? 'Saved in this demo browser.' : 'Saved to your account.'} ${transition.message}`); return saved;
        } catch (cause) { setError(cause.message); throw cause; } finally { lock.current = false; setBusy(false); }
    };
    const research = async job => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError(''); setNotice('Researching public sources. Your job is already saved.');
        try {
            const { data } = await supabase.auth.getSession();
            if (!data.session?.access_token) throw new Error('Sign in to research live sources.');
            const w = workspaceFor(job);
            const response = await fetch('/api/career-research', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ company: job.company, role: job.role, location: job.location, url: job.url, jdText: w.jdText, roleFamily: w.preferences.roleFamily || inferFamily(job.role), language: w.preferences.language }), signal: AbortSignal.timeout(65000) });
            if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The research endpoint is not deployed here. Your job and manual preparation are available.');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Research failed. Try again later.');
            const transition = synchronizePreparation({ ...job, workspace: { ...w, research: result, activity: [...w.activity, { id: crypto.randomUUID(), at: new Date().toISOString(), label: 'Collected research sources' }] } }, user.id);
            const saved = await repo.save(transition.job);
            replaceJob(saved); setNotice(`Research saved${result.mode === 'partial' ? ' with gaps' : ''}. Review the accounts before treating them as evidence. ${transition.message}`);
        } catch (cause) { setError(`${cause.name === 'TimeoutError' ? 'Research timed out. Try again.' : cause.message} Your job is still saved.`); } finally { lock.current = false; setBusy(false); }
    };
    const saveEditor = async (job, autoResearch) => { const saved = await write(job, job.id ? 'Edited job details' : 'Captured a new opportunity'); setEditor(null); navigate('applications', saved, autoResearch ? 'research' : 'plan'); if (autoResearch && !repo.demo) void research(saved); };
    const updateWorkspace = (workspace, label) => write({ ...selected, workspace }, label);
    const deleteSelected = async () => {
        if (lock.current) return; lock.current = true; setBusy(true); setError('');
        try { await repo.remove(removeTarget); setJobs(rows => rows.filter(j => j.id !== removeTarget.id)); setRemoveTarget(null); navigate('applications'); setNotice('Job and its preparation were removed. This cannot be undone here.'); } catch (cause) { setError(cause.message); } finally { lock.current = false; setBusy(false); }
    };
    const filtered = jobs.filter(j => `${j.company} ${j.role} ${j.location}`.toLowerCase().includes(query.toLowerCase()) && (stage === 'All' || stage === j.status)).sort((a, b) => sort === 'company' ? a.company.localeCompare(b.company) : sort === 'next' ? (a.next_date || '9999').localeCompare(b.next_date || '9999') : new Date(b.created_at) - new Date(a.created_at));
    const activeJobs = jobs.filter(j => !['Rejected', 'Offer'].includes(j.status));
    const nextJob = [...activeJobs].filter(j => j.next_date).sort((a, b) => a.next_date.localeCompare(b.next_date))[0];
    const openJob = job => navigate(view, job);
    const displayJob = job => <JobListItem key={job.id} job={job} view={view} busy={busy} onOpen={() => openJob(job)} onStage={status => write({ ...job, status }, `Moved to ${status}`).catch(() => {})} />;
    return <div className="career-app"><a className="cg-skip" href="#career-content">Skip to workspace</a><Sidebar view={view} user={user} busy={busy} onNavigate={navigate} onSignOut={() => Promise.resolve(onSignOut()).catch(cause => setError(cause.message))} /><main className="cg-main" id="career-content"><header className={`cg-header ${selected ? 'is-role' : ''}`}><div><span className="cg-label">{selected ? selected.company : 'YOUR WORKSPACE'}</span><h1>{selected ? selected.role : view === 'prep' ? 'Preparation' : view === 'mock' ? 'Interview practice' : 'My jobs'}</h1><p>{selected ? selected.location || 'Location not set' : view === 'applications' ? 'Your roles, from first application to offer.' : view === 'prep' ? 'A focused plan for each opportunity.' : 'Prepare your answers. Find what to improve.'}</p></div><button className="cg-primary" disabled={busy} onClick={() => setEditor({})}><Plus /> Add a job</button></header>{repo.demo && <div className="cg-notice">Demo workspace · Saved on this device. Sign in for cloud storage and live research.</div>}{error && <div className="cg-error" role="alert">{error} <button className="cg-text-btn" disabled={busy} onClick={() => { setLoading(true); setRetry(r => r + 1); }}>Reload jobs</button></div>}{notice && <div className="cg-save-status" role="status">{busy ? <RefreshCw className="cg-spin" /> : <Check />}{notice}</div>}{loading ? <section className="cg-surface cg-loading" role="status" aria-live="polite"><p>Loading your jobs…</p><div aria-hidden="true"><i /><i /><i /></div></section> : selectedId && !selected ? <section className="cg-surface"><Empty title="Job not found" action="Back to jobs" onAction={() => navigate('applications')}>This link may point to a removed job or another account.</Empty></section> : selected ? <><div className="cg-detail-top"><button className="cg-text-btn" onClick={() => navigate(view)}><ArrowLeft /> All {view === 'applications' ? 'jobs' : view === 'prep' ? 'preparation' : 'practice'}</button><div className="cg-actions"><span className="cg-stage" data-stage={selected.status}>{selected.status}</span><button className="cg-icon-btn" disabled={busy} onClick={() => setEditor(selected)} aria-label="Edit job"><Pencil /></button><button className="cg-icon-btn" disabled={busy} onClick={() => setRemoveTarget(selected)} aria-label="Delete job"><Trash2 /></button></div></div><nav className="cg-workflow" aria-label="Job workspace">{workflowSteps(selected).map((step, i) => <button key={step.id} aria-current={tab === step.id ? 'page' : undefined} className={tab === step.id ? 'active' : ''} onClick={() => navigate(view, selected, step.id)}><span className="cg-workflow-number" aria-hidden="true">{step.complete ? <Check aria-hidden="true" /> : String(i + 1).padStart(2, '0')}</span><span><b>{step.label}</b><small>{step.detail}</small></span></button>)}</nav><div key={`${selected.id}-${tab}`} className="cg-view">{tab === 'summary' && <JobSummary job={selected} onUpdate={write} busy={busy} onEdit={() => setEditor(selected)} />}{tab === 'research' && <Research job={selected} userId={user.id} onUpdate={updateWorkspace} onResearch={() => research(selected)} busy={busy} demo={repo.demo} />}{tab === 'plan' && <Preparation job={selected} userId={user.id} onUpdate={updateWorkspace} busy={busy} onPractice={() => navigate('mock', selected, 'practice')} />}{tab === 'practice' && <Practice job={selected} onUpdate={updateWorkspace} busy={busy} onPlan={() => navigate('prep', selected, 'plan')} />}</div></> : <>{view === 'applications' && <><details className="cg-stage-overview"><summary>Application stages <span>{stage === 'All' ? 'Seed to bloom' : stage}</span></summary><section className="cg-stage-strip" aria-label="Filter by application stage">{STATUSES.map((s, i) => <button className={stage === s ? 'active' : ''} key={s} aria-pressed={stage === s} onClick={() => setStage(stage === s ? 'All' : s)} data-stage={s}><span>{String(i + 1).padStart(2, '0')} <b>{jobs.filter(j => j.status === s).length}</b></span><strong>{STAGE_NAMES[i]}</strong><small>{s}</small></button>)}</section></details>{nextJob && <button className="cg-next-banner" onClick={() => openJob(nextJob)}><CalendarDays /><span><small>NEXT ACTION · {nextJob.next_date}</small><b>{workspaceFor(nextJob).next_step || 'Follow up'} <span>at {nextJob.company}</span></b></span><ArrowUpRight /></button>}</>}<section className="cg-surface"><div className="cg-section-head"><h2>{view === 'applications' ? 'Your applications' : view === 'prep' ? 'Choose what to work on' : 'Choose your next rehearsal'}</h2><button className="cg-text-btn" disabled={busy} onClick={() => { setLoading(true); setRetry(r => r + 1); }}><RefreshCw /> Refresh</button></div><div className="cg-toolbar"><label className="cg-search"><Search /><input aria-label="Search jobs" placeholder="Find a role or company" value={query} onChange={e => setQuery(e.target.value)} /></label><label><span className="cg-sr">Filter stage</span><select value={stage} onChange={e => setStage(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label><span className="cg-sr">Sort jobs</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="next">Next date</option><option value="company">Company A–Z</option></select></label><div className="cg-segment"><button className={layout === 'list' ? 'active' : ''} aria-label="List view" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><List /></button><button className={layout === 'board' ? 'active' : ''} aria-label="Board view" aria-pressed={layout === 'board'} onClick={() => setLayout('board')}><Columns3 /></button></div></div>{!jobs.length ? <Empty title="Every next chapter starts with one role." action="Add your first job" onAction={() => setEditor({})}>Save a job, track its progress and make room to prepare.</Empty> : !filtered.length ? <Empty title="No matching jobs" action="Clear filters" onAction={() => { setQuery(''); setStage('All'); }}>Try another company, role or stage.</Empty> : layout === 'list' ? filtered.map(displayJob) : <div className="cg-board">{STATUSES.filter(s => stage === 'All' || stage === s).map((s) => <section key={s}><h3>{s} <span>{filtered.filter(j => j.status === s).length}</span></h3>{filtered.filter(j => j.status === s).map(job => <article className="cg-board-card" key={job.id}><button onClick={() => openJob(job)}><span className="cg-company-mark">{job.company.slice(0, 1)}</span><b>{job.role}</b><span>{job.company}</span></button><p>{workspaceFor(job).next_step || 'Set your next action'}</p><small>{job.next_date || 'No next date'}</small><label><span className="cg-sr">Stage for {job.company}</span><select disabled={busy} value={job.status} onChange={e => write({ ...job, status: e.target.value }, `Moved to ${e.target.value}`).catch(() => {})}>{STATUSES.map(st => <option key={st}>{st}</option>)}</select></label></article>)}</section>)}</div>}</section></>}{editor && <JobEditor key={editor.id || 'new'} job={editor.id ? editor : null} onSave={saveEditor} onClose={() => setEditor(null)} busy={busy} demo={repo.demo} />}{removeTarget && <Modal title="Remove this job?" onClose={() => setRemoveTarget(null)} busy={busy}><p>{removeTarget.role} at {removeTarget.company}, its plan, notes and practice history will be removed. This cannot be undone here.</p>{error && <p className="cg-error" role="alert">{error}</p>}<div className="cg-actions"><button className="cg-secondary" disabled={busy} onClick={() => setRemoveTarget(null)}>Keep job</button><button className="cg-danger" disabled={busy} onClick={deleteSelected}>Remove job</button></div></Modal>}</main></div>;
}
