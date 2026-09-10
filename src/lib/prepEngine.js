// Deterministic evidence and scheduling core. Does not fetch or assess source truth.
// Callers supply scoped, reviewed inputs; rankings are not probabilities.
const DAY_MS = 86400000;
const SCOPE_FIELDS = ['level', 'location', 'channel', 'team'];
const SOURCE_WEIGHTS = { official: 1, recruiter_private: 1, firsthand: 0.65 };

function timestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value)) throw new Error('An explicit timestamp and timezone are required');
    const result = Date.parse(value);
    const calendarDay = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(result) || !Number.isFinite(calendarDay) || new Date(calendarDay).toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error('Invalid timestamp');
    return result;
}

function uniqueIds(items) {
    if (items.some(item => !item.id) || new Set(items.map(item => item.id)).size !== items.length) throw new Error('Unique IDs are required');
}

/** Keeps process variants separate. Scores order evidence; they are not probabilities. */
export function assembleProcessMap({ target, reports, asOf, userId }) {
    const now = timestamp(asOf);
    if (!target.companyId || !target.roleFamily) throw new Error('Resolve company and role family first');
    uniqueIds(reports);
    const rejected = [];
    const eligible = [];
    for (const report of reports) {
        let reason = null;
        if (report.companyId !== target.companyId) reason = 'wrong_company';
        else if (report.access !== 'read') reason = 'body_not_read';
        else if (!['approved_retrieval', 'private_context'].includes(report.rights)) reason = 'rights_not_approved';
        else if ((report.rights === 'private_context' || report.sourceType === 'recruiter_private') && (!userId || report.ownerId !== userId)) reason = 'private_source_not_owned';
        else if (!Object.hasOwn(SOURCE_WEIGHTS, report.sourceType)) reason = 'unsupported_source_type';
        else if (report.lifecycle !== 'published') reason = 'not_an_adopted_or_reported_process';
        else if (!report.scope?.roleFamilies?.includes(target.roleFamily)) reason = 'wrong_role_family';
        else if (SCOPE_FIELDS.some(key => report.scope[key] && target[key] && report.scope[key] !== target[key])) reason = 'scope_mismatch';
        else if (!report.independenceGroup || !report.sourceUrl || !report.stages?.length || report.stages.some(stage => !stage.key || !stage.evidenceSpan)) reason = 'missing_provenance';
        if (reason) { rejected.push({ id: report.id, reason }); continue; }

        // Interviews age by event date. Fetching/reposting never refreshes them.
        const relevantDate = report.sourceType === 'firsthand' ? report.eventAt : report.effectiveAt;
        let age = null;
        if (relevantDate) {
            try { age = (now - timestamp(relevantDate)) / DAY_MS; }
            catch { rejected.push({ id: report.id, reason: 'invalid_evidence_date' }); continue; }
            if (age < 0) { rejected.push({ id: report.id, reason: 'future_evidence_date' }); continue; }
        }
        const needsConfirmation = SCOPE_FIELDS.filter(key => report.scope[key] && !target[key]);
        const freshness = age === null ? 0.25 : 2 ** (-age / 180);
        const fit = 1 - needsConfirmation.length / (SCOPE_FIELDS.length + 1);
        const score = 0.55 * fit + 0.25 * freshness + 0.20 * SOURCE_WEIGHTS[report.sourceType];
        eligible.push({
            id: report.id, independenceGroup: report.independenceGroup,
            sourceUrl: report.sourceUrl, sourceType: report.sourceType,
            scope: report.scope, score, needsConfirmation,
            freshness: age === null ? 'date_unknown' : age > 365 ? 'historical' : 'dated',
            attribution: report.sourceType === 'firsthand' ? 'candidate_report' : 'source_statement',
            coverage: report.coverage || 'partial',
            stages: report.stages.map(stage => ({ ...stage })),
        });
    }

    // Choose one representation of each event/document family; do not inflate support.
    eligible.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const byEvent = new Map();
    for (const item of eligible) {
        if (!byEvent.has(item.independenceGroup)) byEvent.set(item.independenceGroup, item);
        else rejected.push({ id: item.id, reason: 'duplicate_event' });
    }
    const variants = [...byEvent.values()];
    const signatures = new Set(variants.map(v => JSON.stringify(v.stages.map(s => [s.key, s.aiPolicy || 'unknown']))));
    return {
        status: variants.length ? 'evidence_available' : 'process_unknown',
        variants, rejected, independentSourceGroups: variants.length,
        // Differing formats are a question to resolve, not necessarily a contradiction.
        confirmFormat: !variants.length || variants.every(v => v.sourceType === 'firsthand') || signatures.size > 1 || variants.some(v => v.needsConfirmation.length || v.freshness !== 'dated' || v.coverage !== 'source_describes_full_loop'),
        inferredUniversalSequence: null,
    };
}

/** Deterministic greedy reference, not a globally optimal curriculum optimizer.
 * Tasks must already be atomized, evidence-linked and rubric-reviewed upstream.
 * All tasks are indivisible; an oversized mock is deferred, never silently split.
 */
export function schedulePreparation({ tasks, slots, now, deadline, completedIds = [], bufferFraction = 0.15 }) {
    const startsAt = timestamp(now);
    const endsAt = timestamp(deadline);
    if (endsAt <= startsAt) throw new Error('Deadline has passed; ask for a new date');
    if (!Number.isFinite(bufferFraction) || bufferFraction < 0 || bufferFraction >= 1) throw new Error('Invalid buffer fraction');
    uniqueIds(tasks);
    uniqueIds(slots);
    const done = new Set(completedIds);
    const byId = new Map(tasks.map(task => [task.id, task]));
    for (const task of tasks) {
        if (!Number.isInteger(task.minutes) || task.minutes <= 0 || !Number.isFinite(task.priority) || task.priority < 0) throw new Error('Invalid task duration or priority');
        if (!task.reason || !Array.isArray(task.evidenceIds) || (!task.evidenceIds.length && task.basis !== 'general_recommendation')) throw new Error('A task needs evidence or an explicit general recommendation');
        if (task.dueAt) timestamp(task.dueAt);
        if (task.availableAfter) timestamp(task.availableAfter);
        for (const dep of task.dependsOn || []) if (!byId.has(dep) && !done.has(dep)) throw new Error('Unknown prerequisite');
    }
    const visiting = new Set();
    const visited = new Set();
    function visit(id) {
        if (done.has(id) || visited.has(id)) return;
        if (visiting.has(id)) throw new Error('Cyclic prerequisites');
        visiting.add(id);
        for (const dep of byId.get(id).dependsOn || []) visit(dep);
        visiting.delete(id);
        visited.add(id);
    }
    for (const task of tasks) visit(task.id);

    const orderedSlots = slots.map(slot => ({ id: slot.id, start: timestamp(slot.start), end: timestamp(slot.end) })).sort((a, b) => a.start - b.start);
    for (let i = 0; i < orderedSlots.length; i++) {
        if (orderedSlots[i].end <= orderedSlots[i].start) throw new Error('Invalid availability slot');
        if (i && orderedSlots[i].start < orderedSlots[i - 1].end) throw new Error('Overlapping availability slots');
    }
    const usable = orderedSlots.map(s => ({ ...s, start: Math.max(s.start, startsAt), end: Math.min(s.end, endsAt) })).filter(s => s.end > s.start);
    const capacityMinutes = usable.reduce((sum, s) => sum + Math.floor((s.end - s.start) / 60000), 0);
    const budgetMinutes = Math.floor(capacityMinutes * (1 - bufferFraction));
    const pending = tasks.filter(task => !done.has(task.id));
    // Important downstream work raises its prerequisites' ordering priority.
    const priorities = new Map(tasks.map(t => [t.id, t.priority]));
    const propagated = new Map();
    function promote(id, priority) {
        if (done.has(id) || (propagated.has(id) && propagated.get(id) >= priority)) return;
        propagated.set(id, priority);
        priorities.set(id, Math.max(priority, priorities.get(id)));
        for (const dep of byId.get(id).dependsOn || []) promote(dep, priority);
    }
    for (const task of pending) promote(task.id, task.priority);
    let spent = 0;
    const scheduled = [];
    for (const slot of usable) {
        let cursor = slot.start;
        while (cursor < slot.end) {
            const candidates = pending.filter(task => !done.has(task.id)
                && (task.dependsOn || []).every(id => done.has(id))
                && task.minutes <= budgetMinutes - spent
                && Math.max(cursor, task.availableAfter ? timestamp(task.availableAfter) : cursor) + task.minutes * 60000 <= Math.min(slot.end, task.dueAt ? timestamp(task.dueAt) : endsAt));
            // Use currently available work before jumping ahead to a released task.
            // Otherwise a high-priority recall can waste the first half of a slot.
            const available = task => Math.max(cursor, task.availableAfter ? timestamp(task.availableAfter) : cursor);
            candidates.sort((a, b) => available(a) - available(b) || priorities.get(b.id) / b.minutes - priorities.get(a.id) / a.minutes || a.id.localeCompare(b.id));
            const next = candidates[0];
            if (!next) break;
            cursor = Math.max(cursor, next.availableAfter ? timestamp(next.availableAfter) : cursor);
            const end = cursor + next.minutes * 60000;
            scheduled.push({ ...next, slotId: slot.id, start: new Date(cursor).toISOString(), end: new Date(end).toISOString() });
            cursor = end;
            spent += next.minutes;
            done.add(next.id);
        }
    }
    return {
        capacityMinutes, budgetMinutes, scheduledMinutes: spent, scheduled,
        deferred: pending.filter(task => !done.has(task.id)).map(task => ({ id: task.id, reason: (task.dependsOn || []).some(id => !done.has(id)) ? 'prerequisite_not_scheduled' : 'no_feasible_slot_or_budget' })),
        status: pending.every(t => done.has(t.id)) ? 'scheduled' : 'partial',
        algorithm: 'dependency-aware-greedy-v1',
    };
}
