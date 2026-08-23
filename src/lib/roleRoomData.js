import { PLANT_STAGES } from "./plantStages";

const STORAGE_KEY = "career-garden-role-room-v1";

function roleFamily(role = "") {
    const text = role.toLowerCase();
    if (/(engineer|developer|software|frontend|backend|full.?stack|data|devops)/.test(text)) return "engineering";
    if (/(design|ux|creative|research)/.test(text)) return "design";
    if (/(product|program|project|strategy)/.test(text)) return "product";
    if (/(market|growth|content|sales|customer|success)/.test(text)) return "go-to-market";
    return "general";
}

const TASKS = {
    Saved: ["Read the job description once without editing it", "Write down the three signals that made you save it", "Open the company career page and note one thing you learned"],
    Applied: ["Save the exact job link and application date", "Tailor one resume bullet to the role's top requirement", "Write a two-sentence follow-up you can send in five days"],
    Screening: ["Prepare a 60-second introduction for this role", "Find one recent company or product signal to mention", "Draft five questions for the recruiter"],
    Interview: ["Build three STAR stories with measurable outcomes", "Practice the highest-risk role question out loud", "Write your closing question and a thank-you note"],
    Offer: ["List the offer details you need to compare", "Write your negotiation questions before the call", "Decide what a great first 90 days would look like"],
    Rejected: ["Record what you learned while the process is fresh", "Capture one skill or signal to carry into the next role", "Choose the next seed to tend this week"],
};

const STACK_SIGNALS = {
    engineering: ["Read the engineering blog and open-source repositories", "Look for the language, framework, cloud, and observability signals in the role", "Prepare one system or debugging story with clear trade-offs"],
    design: ["Study the product surface and recent design changes", "Look for the design team's craft, research, and collaboration language", "Prepare one critique, one shipped outcome, and one decision you changed"],
    product: ["Map the product, customer, and business problem in one page", "Look for how the team measures impact and makes trade-offs", "Prepare a prioritization story with a metric and a decision"],
    "go-to-market": ["Read the company's positioning, audience, and latest launch", "Look for the funnel, lifecycle, and customer signals named in the role", "Prepare an experiment or customer story with a measurable result"],
    general: ["Read the company career page and latest public updates", "Highlight the skills and outcomes repeated in the job description", "Prepare one story that proves judgment, learning, and follow-through"],
};

function readStore() {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function writeStore(next) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function readRoleRoom(userId, jobId) {
    const entry = readStore()[`${userId}:${jobId}`];
    return entry || { researchNotes: "", completed: {} };
}

export function saveRoleRoom(userId, jobId, value) {
    const store = readStore();
    const next = { ...store, [`${userId}:${jobId}`]: value };
    writeStore(next);
    return value;
}

export function getRoleFamily(role) { return roleFamily(role); }

export function getStackSignals(role) { return STACK_SIGNALS[roleFamily(role)] || STACK_SIGNALS.general; }

export function getStageTasks(job) {
    return PLANT_STAGES.map(stage => ({
        ...stage,
        tasks: (TASKS[stage.id] || TASKS.Saved).map((task, index) => ({ id: `${job?.id || "role"}-${stage.id}-${index}`, label: task })),
    }));
}

function searchLink(query) { return `https://www.google.com/search?q=${encodeURIComponent(query)}`; }

export function getResearchLinks(job) {
    const company = job?.company || "the company";
    const role = job?.role || "this role";
    return [
        { label: "Career page / job post", detail: "Official role context", url: job?.url || searchLink(`${company} careers ${role}`) },
        { label: "Hiring process", detail: "Interview stages and candidate reports", url: searchLink(`${company} ${role} interview process`) },
        { label: "Tech stack & tools", detail: "Engineering and product signals", url: searchLink(`${company} engineering tech stack`) },
        { label: "Company signals", detail: "News, product, values, and strategy", url: searchLink(`${company} latest product company values`) },
    ];
}

export function getRoleQuestions(job) {
    const company = job?.company || "this company";
    const role = job?.role || "this role";
    const family = roleFamily(role);
    const roleQuestion = family === "engineering"
        ? `Walk me through a technical decision you made for a system similar to ${company}'s product.`
        : family === "design"
            ? `Show me how you would improve one part of ${company}'s product experience.`
            : family === "product"
                ? `How would you choose what to build next for ${company}'s customers?`
                : `What would you try first to create impact in this ${role} role at ${company}?`;
    return [
        roleQuestion,
        `Tell me about a time you made a difficult trade-off and what changed because of it.`,
        `Why ${company}, and why is this the right next step for you?`,
        "Tell me about a time feedback changed the way you worked.",
    ];
}
