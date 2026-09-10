export const STATUSES = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
export const STAGE_NAMES = ['Seed', 'Sprout', 'Taking root', 'Growing', 'Bloom', 'New beginning'];
export function canonicalStatus(value) { return STATUSES.find(s => s.toLowerCase() === String(value).toLowerCase()) || ({ UNDER_REVIEW: 'Screening' })[value] || value; }
const DEMO_KEY = 'career-garden-workspace-v2';
export const emptyWorkspace = () => ({ version: 2, jdText: '', deadline: '', next_step: '', source: '', preferences: { dailyMinutes: 60, weekdays: [1, 2, 3, 4, 5], startTime: '18:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, roleFamily: '', level: '', channel: '', language: 'English', gaps: [] }, research: null, reports: [], plan: null, completed: {}, attempts: [], activity: [] });
export function workspaceFor(job) {
    const defaults = emptyWorkspace();
    const saved = job?.workspace || {};
    return { ...defaults, ...saved, deadline: saved.deadline ?? job?.deadline ?? '', next_step: saved.next_step ?? job?.next_step ?? '', preferences: { ...defaults.preferences, ...saved.preferences } };
}
export function safeLink(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; } }
export function jobPayload(job, userId) {
    if (!job.company?.trim() || !job.role?.trim()) throw new Error('Enter a company and job title.');
    if (!STATUSES.includes(job.status)) throw new Error('Choose a valid application stage.');
    if (job.url && !safeLink(job.url)) throw new Error('Use a complete http or https job link.');
    return { company: job.company.trim(), role: job.role.trim(), location: job.location?.trim() || '', status: job.status, salary: job.salary?.trim() || '', date: (job.next_date ?? job.date) || null, url: job.url?.trim() || '', notes: job.notes || '', user_id: userId, workspace: workspaceFor(job) };
}
function failure(error) {
    if (!error) return;
    if (['42703', 'PGRST204', '42P01'].includes(error.code)) throw new Error('Cloud workspace needs the Career Garden database migration. Your form is still here; nothing has been discarded.');
    if (error.code === '42501') throw new Error('Your account cannot save this job. Check the jobs table ownership policies in Supabase.');
    throw new Error(error.message || 'Could not save to the cloud. Your changes have not been saved.');
}
export function createRepository({ client, userId, storage, loadLegacy, legacyMeta = () => ({}) }) {
    const demo = userId === 'demo-user';
    function readDemo() { const raw = storage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : null; }
    async function list() {
        if (demo) { const stored = readDemo(); if (stored) return stored; const legacy = await loadLegacy(); return legacy.map(row => ({ ...row, workspace: workspaceFor(row), revision: 0 })); }
        if (!client) throw new Error('Supabase is not connected. Sign in again.');
        const result = await client.from('jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        failure(result.error);
        return result.data.map(row => { const hydrated = { ...legacyMeta(userId, row.id), ...row }; return { ...hydrated, status: canonicalStatus(row.status), next_date: row.date || hydrated.next_date || '', workspace: workspaceFor(hydrated) }; });
    }
    async function save(job) {
        const payload = jobPayload(job, userId);
        if (demo) {
            const rows = await list();
            const existing = rows.find(row => String(row.id) === String(job.id));
            if (existing && (existing.revision || 0) !== (job.revision || 0)) throw new Error('This job changed in another tab. Reload before editing it.');
            const saved = { ...job, ...payload, id: job.id || crypto.randomUUID(), next_date: payload.date || '', revision: (existing?.revision || 0) + 1, created_at: job.created_at || new Date().toISOString() };
            storage.setItem(DEMO_KEY, JSON.stringify([saved, ...rows.filter(row => String(row.id) !== String(saved.id))]));
            return saved;
        }
        let result;
        if (job.id != null) result = await client.from('jobs').update(payload).eq('id', job.id).eq('user_id', userId).eq('revision', job.revision ?? 0).select().maybeSingle();
        else result = await client.from('jobs').insert(payload).select().single();
        failure(result.error);
        if (!result.data) throw new Error('This job changed in another tab, or was removed. Reload before editing it.');
        return { ...result.data, next_date: result.data.date || '', workspace: workspaceFor(result.data) };
    }
    async function remove(job) {
        if (demo) {
            const rows = await list();
            const existing = rows.find(row => String(row.id) === String(job.id));
            if (!existing || (existing.revision || 0) !== (job.revision || 0)) throw new Error('This job changed in another tab. Reload before removing it.');
            storage.setItem(DEMO_KEY, JSON.stringify(rows.filter(row => String(row.id) !== String(job.id)))); return;
        }
        const result = await client.from('jobs').delete().eq('id', job.id).eq('user_id', userId).eq('revision', job.revision ?? 0).select('id');
        failure(result.error);
        if (!result.data?.length) throw new Error('This job changed in another tab. Reload before removing it.');
    }
    return { list, save, remove, demo };
}
