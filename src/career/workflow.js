import { workspaceFor } from './repository.js';
import { buildPreparation, planIsStale } from './planner.js';

// One transition shared by job edits, reviewed research and practice reviews.
// Planning failure must never prevent saving the user's job or answer.
export function synchronizePreparation(job, userId, now = new Date().toISOString()) {
    const w = workspaceFor(job);
    if (!w.deadline) return { job, message: 'Set a preparation deadline to create your plan.', status: 'needs-date' };
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
        { id: 'plan', label: 'Prepare', detail: !w.deadline ? 'Set your date' : !w.plan ? 'Create your plan' : planIsStale(job) ? 'Update your plan' : `${w.plan.scheduled.filter(t => !w.completed[t.id]?.done).length} scheduled tasks left`, complete: Boolean(w.plan && !planIsStale(job)) },
        { id: 'practice', label: 'Practice', detail: w.attempts.length ? `${w.attempts.length} saved rehearsals` : 'Try your first answer', complete: w.attempts.length > 0 },
    ];
}
