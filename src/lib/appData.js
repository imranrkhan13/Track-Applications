import { supabase } from "./supabase";

const STORAGE_KEY = "track-applications-v2";
const now = () => new Date().toISOString();

const seed = {
    jobs: [
        { id: "seed-1", company: "Notion", role: "Product Designer", location: "New York · Hybrid", status: "Interview", salary: "$145k–$175k", source: "Referral", created_at: "2026-08-09T10:00:00.000Z", next_step: "Portfolio deep dive", next_date: "2026-08-21", url: "https://notion.so/careers", notes: "Emphasize systems thinking and design critique." },
        { id: "seed-2", company: "Linear", role: "Senior Product Designer", location: "Remote · US", status: "Applied", salary: "$160k–$190k", source: "Company site", created_at: "2026-08-07T10:00:00.000Z", next_step: "Follow up with recruiter", next_date: "2026-08-25", url: "https://linear.app/careers", notes: "Strong match for zero-to-one product work." },
        { id: "seed-3", company: "Figma", role: "Product Design Lead", location: "San Francisco · Hybrid", status: "Screening", salary: "$180k–$220k", source: "LinkedIn", created_at: "2026-07-30T10:00:00.000Z", next_step: "Recruiter screen", next_date: "2026-08-19", url: "https://figma.com/careers", notes: "Prepare leadership stories using STAR." },
        { id: "seed-4", company: "Arc", role: "Design Engineer", location: "Remote · Worldwide", status: "Saved", salary: "$130k–$165k", source: "Job board", created_at: "2026-07-27T10:00:00.000Z", next_step: "Decide whether to apply", next_date: "2026-08-28", url: "https://arc.net/careers", notes: "Review the role requirements before applying." },
        { id: "seed-5", company: "Vercel", role: "Staff Product Designer", location: "Remote · US", status: "Offer", salary: "$210k–$250k", source: "Referral", created_at: "2026-07-18T10:00:00.000Z", next_step: "Review offer", next_date: "2026-08-23", url: "https://vercel.com/careers", notes: "Compare equity and scope." },
    ],
    roleBriefs: [{ id: "brief-1", jobId: "seed-1", company: "Notion", role: "Product Designer", focus: "Product thinking, collaboration, systems thinking", questions: ["Walk me through a product decision you changed your mind about.", "How do you turn ambiguous feedback into a clear design direction?", "Tell me about a cross-functional conflict and how you resolved it."], stories: ["Design system migration", "Reducing onboarding drop-off", "Mentoring a new designer"], created_at: now() }],
    sessions: [],
};

function readStore() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved ? { ...seed, ...saved } : seed;
    } catch { return seed; }
}

function writeStore(next) { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
function isRealUser(userId) { return Boolean(supabase && userId && userId !== "demo-user"); }
function requireRemote(result, resource) {
    if (result.error) throw new Error(`Could not load ${resource} from Supabase: ${result.error.message}`);
    return result.data;
}

export async function getJobs(userId = "demo-user") {
    if (isRealUser(userId)) {
        const result = await supabase.from("jobs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        return requireRemote(result, "applications") || [];
    }
    return readStore().jobs;
}

export async function saveJob(job, userId = "demo-user") {
    const payload = { ...job, user_id: userId, updated_at: now(), created_at: job.created_at || now() };
    if (isRealUser(userId)) {
        const result = await supabase.from("jobs").upsert(payload).select().single();
        return requireRemote(result, "application");
    }
    const store = readStore();
    const id = payload.id || `job-${Date.now()}`;
    const saved = { ...payload, id };
    writeStore({ ...store, jobs: [saved, ...store.jobs.filter(item => item.id !== id)] });
    return saved;
}

export async function deleteJob(id, userId = "demo-user") {
    if (isRealUser(userId)) {
        const result = await supabase.from("jobs").delete().eq("id", id).eq("user_id", userId);
        requireRemote(result, "application");
        return;
    }
    const store = readStore();
    writeStore({ ...store, jobs: store.jobs.filter(job => job.id !== id), roleBriefs: store.roleBriefs.filter(brief => brief.jobId !== id) });
}

export async function getRoleBriefs(jobId, userId = "demo-user") {
    if (isRealUser(userId)) {
        const result = await supabase.from("role_briefs").select("*").eq("job_id", jobId).eq("user_id", userId).order("created_at", { ascending: false });
        return requireRemote(result, "role preparation") || [];
    }
    return readStore().roleBriefs.filter(brief => brief.jobId === jobId);
}

export async function saveRoleBrief(brief, userId = "demo-user") {
    const payload = { ...brief, id: brief.id || `brief-${Date.now()}`, user_id: userId, created_at: brief.created_at || now() };
    if (isRealUser(userId)) {
        const { jobId, ...rest } = payload;
        const result = await supabase.from("role_briefs").upsert({ ...rest, job_id: jobId }).select().single();
        return requireRemote(result, "role preparation");
    }
    const store = readStore();
    writeStore({ ...store, roleBriefs: [payload, ...store.roleBriefs.filter(item => item.id !== payload.id)] });
    return payload;
}

function normalizeSession(row) { return { ...row, jobId: row.jobId || row.job_id }; }

export async function getSessions(jobId, userId = "demo-user") {
    if (isRealUser(userId)) {
        const result = await supabase.from("interview_sessions").select("*").eq("job_id", jobId).eq("user_id", userId).order("created_at", { ascending: false });
        return (requireRemote(result, "interview sessions") || []).map(normalizeSession);
    }
    return readStore().sessions.filter(session => session.jobId === jobId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function saveSession(session, userId = "demo-user") {
    const payload = { ...session, id: session.id || `session-${Date.now()}`, created_at: session.created_at || now() };
    if (isRealUser(userId)) {
        const { jobId, ...rest } = payload;
        const result = await supabase.from("interview_sessions").insert({ ...rest, user_id: userId, job_id: jobId }).select().single();
        return normalizeSession(requireRemote(result, "interview session"));
    }
    const store = readStore();
    writeStore({ ...store, sessions: [payload, ...store.sessions.filter(item => item.id !== payload.id)] });
    return payload;
}

export function resetDemoData() { localStorage.removeItem(STORAGE_KEY); }
