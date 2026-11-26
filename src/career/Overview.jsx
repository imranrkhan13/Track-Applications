import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, CircleAlert, Flame, Mic, Target, TrendingUp } from 'lucide-react';
import { STATUSES, STAGE_NAMES, workspaceFor } from './repository';

// Dashboard overview: pipeline counts, the next action and interview
// readiness. Everything here is derived from the saved jobs — nothing new is
// persisted, so the panel never disagrees with the plan.
export default function Overview({ jobs, stage, onStage, nextJob, onOpen }) {
    const active = jobs.filter(j => !['Rejected', 'Offer'].includes(j.status));
    const interviews = jobs.filter(j => j.status === 'Interview');
    const offers = jobs.filter(j => j.status === 'Offer');
    const withPlan = jobs.filter(j => workspaceFor(j).plan);
    const overdue = active.filter(j => {
        if (!j.next_date) return false;
        const today = new Date();
        const local = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return j.next_date < local;
    });

    // Readiness is a plain count of the things that must exist before a round.
    const ready = interviews.filter(j => {
        const w = workspaceFor(j);
        return Boolean(w.plan && w.plan.scheduled?.length);
    });
    const needsPrep = interviews.length - ready.length;

    return <>
        <section className="cg-stats-bar" aria-label="Workspace summary">
            <div className="cg-stat is-primary">
                <span className="cg-stat-symbol cg-stat-jobs"><BriefcaseBusiness /></span>
                <span><b>{jobs.length}</b><small>Total roles</small></span>
            </div>
            <div className="cg-stat">
                <span className="cg-stat-symbol cg-stat-prep"><Target /></span>
                <span><b>{active.length}</b><small>Active</small></span>
            </div>
            <div className="cg-stat">
                <span className="cg-stat-symbol cg-stat-practice"><Mic /></span>
                <span><b>{interviews.length}</b><small>Interviews</small></span>
            </div>
            <div className="cg-stat">
                <span className="cg-stat-symbol cg-stat-offer"><TrendingUp /></span>
                <span><b>{offers.length}</b><small>Offers</small></span>
            </div>
        </section>

        <section className="cg-overview-grid">
            <div className="cg-pipeline" aria-label="Application pipeline">
                <header className="cg-panel-head">
                    <h2>Pipeline</h2>
                    <span className="cg-muted">{stage === 'All' ? 'All stages' : stage} · {withPlan.length} with a plan</span>
                </header>
                <ol className="cg-stage-strip">
                    {STATUSES.map((s, i) => {
                        const count = jobs.filter(j => j.status === s).length;
                        return <li key={s}>
                            <button className={stage === s ? 'active' : ''} aria-pressed={stage === s} onClick={() => onStage(stage === s ? 'All' : s)} data-stage={s}>
                                <span className="cg-stage-index">{String(i + 1).padStart(2, '0')}</span>
                                <span className="cg-stage-name">{s}</span>
                                <span className="cg-stage-alias">{STAGE_NAMES[i]}</span>
                                <b>{count}</b>
                            </button>
                        </li>;
                    })}
                </ol>
            </div>

            <div className="cg-readiness" aria-label="Interview readiness">
                <header className="cg-panel-head">
                    <h2>Interview readiness</h2>
                    {interviews.length > 0 && <span className="cg-badge cg-badge-neutral">{ready.length} of {interviews.length} ready</span>}
                </header>
                {interviews.length === 0 ? <p className="cg-muted">No interviews booked yet. When a role reaches the interview stage it appears here with its preparation status.</p> : <>
                    <ul className="cg-readiness-list">
                        {interviews.map(j => {
                            const w = workspaceFor(j);
                            const isReady = Boolean(w.plan && w.plan.scheduled?.length);
                            const done = (w.plan?.tasks || []).filter(t => w.completed[t.id]?.done).length;
                            const total = (w.plan?.tasks || []).length;
                            return <li key={j.id}>
                                <button onClick={() => onOpen(j)}>
                                    <span className="cg-company-mark" aria-hidden="true">{j.company.slice(0, 1)}</span>
                                    <span className="cg-readiness-body">
                                        <b>{j.role}</b>
                                        <small>{j.company}{j.next_date ? ` · ${j.next_date}` : ''}</small>
                                    </span>
                                    <span className="cg-readiness-state" data-state={isReady ? 'ready' : 'pending'}>
                                        {isReady ? <><Check /> {done}/{total} tasks</> : <><CircleAlert /> No plan</>}
                                    </span>
                                </button>
                            </li>;
                        })}
                    </ul>
                    {needsPrep > 0 && <p className="cg-readiness-note"><Flame /> {needsPrep} role{needsPrep === 1 ? '' : 's'} still need a plan before the next round.</p>}
                </>}
            </div>
        </section>

        {nextJob && <button className="cg-next-banner" onClick={() => onOpen(nextJob)}>
            <span className="cg-next-icon"><CalendarDays /></span>
            <span><small>NEXT ACTION · {nextJob.next_date}</small><b>{workspaceFor(nextJob).next_step || 'Follow up'} <span>at {nextJob.company}</span></b></span>
            <ArrowUpRight />
        </button>}

        {overdue.length > 0 && <p className="cg-overdue-note"><CircleAlert /> {overdue.length} next action{overdue.length === 1 ? '' : 's'} past {overdue.length === 1 ? 'its date' : 'their dates'}.</p>}
    </>;
}
