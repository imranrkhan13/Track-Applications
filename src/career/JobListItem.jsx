import { ArrowRight, CalendarDays, Mic } from 'lucide-react';
import { STATUSES, workspaceFor } from './repository';

export default function JobListItem({ job, view, busy, onOpen, onStage }) {
    const w = workspaceFor(job);
    const tasks = w.plan?.tasks || [];
    const complete = tasks.filter(t => w.completed[t.id]?.done).length;
    const next = w.plan?.scheduled?.find(t => !w.completed[t.id]?.done);
    const lastAttempt = w.attempts.at(-1);
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const overdue = job.next_date && job.next_date < localDate && !['Offer', 'Rejected'].includes(job.status);
    return <article className={`cg-job-row cg-job-row-${view}`}>
        <span className="cg-company-mark" aria-hidden="true">{job.company.slice(0, 1)}</span>
        <div className="cg-job-identity"><button className="cg-role-link" onClick={onOpen}>{job.role}</button><p>{job.company}<span className="cg-dot-separator">·</span>{job.location || 'Location not set'}</p></div>
        {view === 'applications' ? <>
            <label className="cg-inline-stage" data-stage={job.status}><span className="cg-sr">Stage for {job.role} at {job.company}</span><select disabled={busy} value={job.status} onChange={e => onStage(e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
            <div className={`cg-next-cell ${overdue ? 'is-overdue' : ''}`}><span>{w.next_step || 'Choose a next step'}</span><small><CalendarDays />{job.next_date ? `${overdue ? 'Overdue · ' : ''}${job.next_date}` : 'No date set'}</small></div>
        </> : view === 'prep' ? <div className="cg-job-context"><span>{w.plan ? `${complete} of ${tasks.length} tasks complete` : 'No plan yet'}</span>{w.plan ? <><progress max={tasks.length || 1} value={complete} aria-label={`Preparation progress for ${job.company}`} /><small>{next ? `Next: ${next.title}` : complete === tasks.length ? 'Your planned work is complete' : 'Adjust availability for remaining tasks'}</small></> : <small>{w.deadline ? `Prepare by ${w.deadline}` : 'Choose a deadline and your study time'}</small>}</div> : <div className="cg-job-context"><span><Mic />{w.attempts.length ? `${w.attempts.length} saved ${w.attempts.length === 1 ? 'rehearsal' : 'rehearsals'}` : 'Ready for your first rehearsal'}</span><small>{lastAttempt ? `Last practised ${new Date(lastAttempt.createdAt).toLocaleDateString()}` : 'Role-specific prompts and a clear review rubric'}</small></div>}
        <button className="cg-row-action" onClick={onOpen} aria-label={`Open ${view === 'prep' ? 'preparation for' : view === 'mock' ? 'practice for' : ''} ${job.role} at ${job.company}`}><span>{view === 'prep' ? 'Open plan' : view === 'mock' ? 'Practise' : 'Open'}</span><ArrowRight /></button>
    </article>;
}
