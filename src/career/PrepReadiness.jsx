import { ArrowUpRight, CalendarClock, Check, CircleAlert, Target } from 'lucide-react';
import { workspaceFor } from './repository';

// Preparation readiness across every saved role: how many have a plan, how
// far those plans have progressed and which roles need one first. Derived
// from the stored plans only — nothing new is persisted here.
export default function PrepReadiness({ jobs, onOpen }) {
    const withPlan = jobs.filter(j => Boolean(workspaceFor(j).plan));
    const withoutPlan = jobs.filter(j => !workspaceFor(j).plan);
    const totalTasks = withPlan.reduce((sum, j) => sum + (workspaceFor(j).plan?.tasks?.length || 0), 0);
    const doneTasks = withPlan.reduce((sum, j) => {
        const w = workspaceFor(j);
        return sum + (w.plan?.tasks || []).filter(t => w.completed[t.id]?.done).length;
    }, 0);
    const interviews = jobs.filter(j => j.status === 'Interview');
    const ready = interviews.filter(j => {
        const w = workspaceFor(j);
        return Boolean(w.plan && w.plan.scheduled?.length);
    });
    const percent = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;

    if (!jobs.length) return null;

    // Without any plan there is no progress to report — point at the next role
    // to plan instead of showing empty counters.
    if (!withPlan.length) {
        const next = [...withoutPlan].sort((a, b) => (a.next_date || '9999').localeCompare(b.next_date || '9999'))[0];
        return <section className="cg-prep-ready" aria-label="Preparation readiness">
            <header className="cg-panel-head">
                <h2>Preparation readiness</h2>
                <span className="cg-badge cg-badge-neutral">0 of {jobs.length} with a plan</span>
            </header>
            <p className="cg-prep-empty">
                <Target />
                <span>No role has a study plan yet. Open a role below to set a deadline and your daily study time — the plan builds itself from there.</span>
            </p>
            {next && <button className="cg-prep-next" onClick={() => onOpen(next)}>
                <span className="cg-company-mark" aria-hidden="true">{next.company.slice(0, 1)}</span>
                <span><b>{next.role}</b><small>{next.company}{next.next_date ? ` · next step ${next.next_date}` : ''}</small></span>
                <ArrowUpRight />
            </button>}
        </section>;
    }

    return <section className="cg-prep-ready" aria-label="Preparation readiness">
        <header className="cg-panel-head">
            <h2>Preparation readiness</h2>
            <span className="cg-badge cg-badge-neutral">{withPlan.length} of {jobs.length} with a plan</span>
        </header>

        <div className="cg-prep-ready-grid">
            <div className="cg-prep-ready-stat">
                <span className="cg-stat-symbol cg-stat-prep"><Target /></span>
                <span><b>{percent}%</b><small>Tasks completed</small></span>
            </div>
            <div className="cg-prep-ready-stat">
                <span className="cg-stat-symbol cg-stat-jobs"><CalendarClock /></span>
                <span><b>{doneTasks}/{totalTasks}</b><small>Tasks done</small></span>
            </div>
            <div className="cg-prep-ready-stat">
                <span className="cg-stat-symbol cg-stat-practice"><Check /></span>
                <span><b>{ready.length}/{interviews.length}</b><small>Interviews ready</small></span>
            </div>
        </div>

        <div className="cg-prep-progress">
            <div className="cg-prep-progress-bar"><span style={{ width: `${percent}%` }} /></div>
            <small>{doneTasks} of {totalTasks} preparation tasks finished across {withPlan.length} role{withPlan.length === 1 ? '' : 's'}.</small>
        </div>

        {withoutPlan.length > 0 && <p className="cg-prep-gap-note"><CircleAlert /> {withoutPlan.length} role{withoutPlan.length === 1 ? '' : 's'} still need a plan{interviews.length > ready.length ? ', including an interview' : ''}.</p>}
    </section>;
}
