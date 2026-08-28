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

function freeResources(topic) {
    const query = encodeURIComponent(topic);
    const normalized = topic.toLowerCase();
    const docs = normalized.includes("react") ? { title: "React Learn", url: "https://react.dev/learn" } : normalized.includes("python") ? { title: "Python tutorial", url: "https://docs.python.org/3/tutorial/" } : normalized.includes("javascript") || normalized.includes("typescript") ? { title: "MDN JavaScript guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" } : { title: `${topic} concepts and documentation`, url: `https://www.google.com/search?q=${query}+official+documentation` };
    return [
        { ...docs, type: "Concepts", free: true },
        { title: `${topic} free video lessons`, url: `https://www.youtube.com/results?search_query=${query}+free+tutorial`, type: "Video", free: true },
        { title: `${topic} free project ideas`, url: `https://github.com/search?q=${query}+project&type=repositories`, type: "Practice", free: true },
    ];
}

function buildWeeks({ company, role, deadline, keywords = [] }) {
    const today = dateOnly(new Date()) || new Date().toISOString().slice(0, 10);
    const requestedEnd = dateOnly(deadline);
    const end = requestedEnd && requestedEnd >= today ? requestedEnd : addDays(today, DEFAULT_PLAN_DAYS);
    const span = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000));
    const weekCount = Math.min(8, Math.max(1, Math.ceil((span + 1) / 7)));
    const topicPool = [
        `${role} fundamentals`,
        `${company} product and customers`,
        ...(keywords.length ? keywords.slice(0, 3).map(keyword => `${keyword} for ${role}`) : [`${role} interview skills`]),
        "behavioral interview stories",
    ];
    const focus = ["Understand the brief and learn the core concepts", "Connect the company context to your role", "Build proof with a small project", "Close the gaps and rehearse the hard questions", "Polish your project and practice the conversation"];
    return Array.from({ length: weekCount }, (_, index) => {
        const startOffset = index * 7;
        const endOffset = Math.min(span, startOffset + 6);
        const topic = topicPool[index % topicPool.length];
        const project = index === 0 ? `Create a one-page ${role} role map for ${company}: outcomes, skills, customers, and open questions.` : index === weekCount - 1 ? `Present a small ${role} case study or project as if you were in the interview. Include decisions, trade-offs, and measurable impact.` : `Build a small ${role} project around ${topic}. Document the problem, your approach, and what you would improve next.`;
        return { week: index + 1, label: `Week ${index + 1}`, startDate: addDays(today, startOffset), endDate: addDays(today, endOffset), focus: focus[Math.min(index, focus.length - 1)], learn: freeResources(topic), project: { title: index === 0 ? "Role map" : index === weekCount - 1 ? "Interview-ready case study" : `${topic} mini project`, brief: project, deliverable: index === weekCount - 1 ? "A 5-minute walkthrough plus three proof points" : "A small public or private artifact with a short README" }, practice: ["Write what you learned in your own words", "Explain one concept without looking at notes", index === weekCount - 1 ? "Run a timed mock interview" : "Add one question to your interview bank"] };
    });
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
                { title: "Official role or company page", sourceType: url ? "Job description source" : "Official search", url: url || `https://www.google.com/search?q=${encodeURIComponent(`${company} ${role} careers`)}` },
                { title: "Hiring process search", sourceType: "Candidate experience search", url: `https://www.google.com/search?q=${encodeURIComponent(`${company} ${role} interview process`)}` },
                { title: "Technology and team search", sourceType: "Public source search", url: `https://www.google.com/search?q=${encodeURIComponent(`${company} engineering tech stack`)}` },
            ],
        },
        jd: {
            status: url ? "The role link is saved. Connect the research function to extract its content." : "No role link was provided.",
            summary: `Your plan is ready for ${role} at ${company}. Add a public job link to ground the plan in the exact requirements.`,
            requirements: ["Role outcomes", "Repeated skills", "Evidence from your work"],
            responsibilities: [],
            keywords: [role, company].filter(Boolean),
        },
        weeks: buildWeeks({ company, role, deadline, keywords: [role] }),
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
    if (!contentType.includes("application/json")) return makeLocalRolePlan(input);
    if (!response.ok) throw new Error("The research service could not be reached.");
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "The role could not be researched.");
    return result;
}
