const DEFAULT_PLAN_DAYS = 14;

function dateOnly(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function addDays(value, amount) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return date.toISOString().slice(0, 10);
}

function fallbackPlan({ deadline }) {
    const today = dateOnly(new Date()) || new Date().toISOString().slice(0, 10);
    const requestedEnd = dateOnly(deadline);
    const end = requestedEnd && requestedEnd >= today ? requestedEnd : addDays(today, DEFAULT_PLAN_DAYS);
    const span = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000));
    const checkpoints = [
        [0, "Read the role like a brief", "Extract the outcomes, repeated skills, and proof the team is asking for.", ["Read the job description once without editing it", "Highlight the three outcomes this role owns", "Write down what is still unclear"]],
        [Math.round(span * 0.18), "Map the company", "Build a one-page view of the product, customer, hiring process, and team context.", ["Review the official company and careers pages", "Capture one recent product or company signal", "Write three questions about how this team works"]],
        [Math.round(span * 0.36), "Translate the requirements into proof", "Match the role requirements to evidence from your own work.", ["Choose three projects that prove the core requirements", "Add one measurable outcome to each story", "Draft a concise why-this-role answer"]],
        [Math.round(span * 0.55), "Close the skill gaps", "Spend focused time on the highest-risk skill or topic in the brief.", ["Choose one technical, craft, or domain gap", "Complete one small practice task", "Explain the concept out loud in two minutes"]],
        [Math.round(span * 0.73), "Rehearse the hard questions", "Turn the role signals into answers you can deliver naturally.", ["Practice a role-specific question", "Practice one trade-off or failure story", "Prepare five questions for the interviewer"]],
        [Math.max(0, span - 1), "Run the final room check", "Review the evidence, logistics, and questions before the conversation.", ["Do one timed mock interview", "Review your role notes and job link", "Write the opening and closing you want to use"]],
        [span, "Show up ready", "Use the conversation to learn as well as to be evaluated.", ["Bring your strongest proof, not every detail", "Ask the questions that reveal how the team works", "Capture the next step immediately afterward"]],
    ];
    return checkpoints.map(([offset, title, focus, tasks], index) => ({ date: addDays(today, Math.min(span, offset)), title, focus, tasks, outcome: index === checkpoints.length - 1 ? "A clear conversation and a documented next move" : "One useful piece of evidence ready for the next step", durationMinutes: index === 0 ? 35 : 45 }));
}

export function makeLocalRolePlan(input) {
    const { company = "the company", role = "this role", url = "", deadline = "" } = input;
    return {
        version: 1,
        mode: "local-plan",
        generatedAt: new Date().toISOString(),
        targetDate: dateOnly(deadline) || addDays(dateOnly(new Date()), DEFAULT_PLAN_DAYS),
        companyResearch: {
            overview: `Start with ${company}'s official product, careers, and recent company pages. Confirm the details before using them in an interview.`,
            hiringProcess: `Look for the recruiter screen, assessment, interview loop, and decision timing for ${company}.`,
            techStack: `Search for the tools and working practices connected to ${role}. Treat public stack lists as signals, not guarantees.`,
            culture: `Collect two specific examples of how ${company} works, communicates, or measures impact.`,
            sources: [
                { title: "Official role or company page", url: url || `https://www.google.com/search?q=${encodeURIComponent(`${company} ${role} careers`)}` },
                { title: "Hiring process search", url: `https://www.google.com/search?q=${encodeURIComponent(`${company} ${role} interview process`)}` },
                { title: "Technology and team search", url: `https://www.google.com/search?q=${encodeURIComponent(`${company} engineering tech stack`)}` },
            ],
        },
        jd: {
            status: url ? "The role link is saved. Connect the research function to extract its content." : "No role link was provided.",
            summary: `Your plan is ready for ${role} at ${company}. Add a public job link to ground the plan in the exact requirements.`,
            requirements: ["Role outcomes", "Repeated skills", "Evidence from your work"],
            responsibilities: [],
            keywords: [role, company].filter(Boolean),
        },
        plan: fallbackPlan(input),
        disclaimer: "This local plan is a useful starting point. Verified company and job-description research appears when the server research function is available.",
    };
}

export async function researchRole(input) {
    const response = await fetch("/api/research-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) {
        if (response.status === 404 || response.status === 405) return makeLocalRolePlan(input);
        throw new Error("The research service could not be reached.");
    }
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "The role could not be researched.");
    return result;
}
