import { workspaceFor } from './repository.js';
import { buildPreparation, jobDescriptionFor, planIsStale } from './planner.js';

// One transition shared by job edits, reviewed research and practice reviews.
// Planning failure must never prevent saving the user's job or answer.
export function synchronizePreparation(job, userId, now = new Date().toISOString()) {
    const w = workspaceFor(job);
    // Auto-plan: a job with a JD (pasted or from research) gets a default two-week
    // deadline so the plan builds itself instead of asking the user to configure it.
    if (!w.deadline) {
        const hasJd = Boolean(jobDescriptionFor(job).trim());
        if (!hasJd) return { job, message: 'Add the job description link or paste it to build your plan automatically.', status: 'needs-date' };
        const auto = new Date(Date.parse(now) + 14 * 86400000).toISOString().slice(0, 10);
        const workspace = { ...w, deadline: auto, preferences: { ...w.preferences, deadlineKind: w.preferences.deadlineKind === 'interview' ? 'unknown' : w.preferences.deadlineKind } };
        try {
            const plan = buildPreparation({ ...job, workspace }, userId, now);
            return { job: { ...job, workspace: { ...workspace, plan } }, status: 'planned', message: `Plan built from the job description for ${auto}. Adjust the deadline any time.` };
        } catch (error) {
            return { job: { ...job, workspace }, status: 'needs-attention', message: `Plan needs attention: ${error.message}` };
        }
    }
    if (w.plan && !planIsStale(job)) return { job, message: '', status: 'unchanged' };
    try {
        const plan = buildPreparation(job, userId, now);
        return { job: { ...job, workspace: { ...w, plan } }, status: 'planned', message: `${w.plan ? 'Remaining preparation updated' : 'Preparation plan created'}${plan.deferred.length ? '; some work needs more available time' : ''}.` };
    } catch (error) {
        return { job, status: 'needs-attention', message: `Preparation needs attention: ${error.message}` };
    }
}

export function recordPractice(workspace, attempt) {
    if (!attempt.answer?.trim()) throw new Error('Write or dictate an answer first.');
    if (!attempt.id || !attempt.skill) throw new Error('Practice answer is missing its question context.');
    const gaps = attempt.selfAssessment === 'needs-work'
        ? [...new Set([...workspace.preferences.gaps, attempt.skill])]
        : attempt.selfAssessment === 'comfortable'
            ? workspace.preferences.gaps.filter(skill => skill !== attempt.skill)
            : workspace.preferences.gaps;
    return { ...workspace, attempts: [...workspace.attempts.filter(a => a.id !== attempt.id), attempt], preferences: { ...workspace.preferences, gaps } };
}

export function workflowSteps(job) {
    const w = workspaceFor(job);
    return [
        { id: 'summary', label: 'Track', detail: job.status, complete: true },
        { id: 'research', label: 'Research', detail: w.reports.some(r => r.confirmed) ? 'Accounts reviewed' : w.research ? 'Review your sources' : 'Find the process', complete: w.reports.some(r => r.confirmed) },
        { id: 'plan', label: 'Prepare', detail: !w.plan ? (w.deadline ? 'Building your plan' : 'Add the JD to plan') : planIsStale(job) ? 'Update your plan' : `${w.plan.scheduled.filter(t => !w.completed[t.id]?.done).length} scheduled tasks left`, complete: Boolean(w.plan && !planIsStale(job)) },
        { id: 'practice', label: 'Practice', detail: w.attempts.length ? `${w.attempts.length} saved rehearsals` : 'Try your first answer', complete: w.attempts.length > 0 },
    ];
}
