const JSON_HEADERS = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
};

const MAX_SOURCE_CHARS = 180000;
const TODAY = () => new Date().toISOString().slice(0, 10);

function json(statusCode, payload) {
    return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(payload) };
}

function decodeHtml(value = "") {
    return value.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function cleanText(value = "") {
    return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(value, base) {
    try { return new URL(value, base).toString(); } catch { return ""; }
}

function googleDocumentExport(rawUrl) {
    try {
        const url = new URL(rawUrl);
        const documentId = url.pathname.match(/\/document\/d\/([^/]+)/)?.[1];
        if (documentId && url.hostname.includes("docs.google.com")) return `https://docs.google.com/document/d/${documentId}/export?format=txt`;
        const sheetId = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
        if (sheetId && url.hostname.includes("docs.google.com")) return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const driveId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
        if (driveId && url.hostname.includes("drive.google.com")) return `https://drive.google.com/uc?export=download&id=${driveId}`;
    } catch { /* Leave malformed or non-Google URLs to the normal fetch path. */ }
    return rawUrl;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            redirect: "follow",
            signal: controller.signal,
            headers: {
                "user-agent": "CareerGardenResearch/1.0 (+https://career-garden.netlify.app)",
                accept: "text/html,text/plain,application/pdf,application/json;q=0.9,*/*;q=0.5",
                ...(options.headers || {}),
            },
        });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchRoleSource(rawUrl) {
    if (!rawUrl) return { url: "", title: "No job link supplied", text: "", status: "missing" };
    const url = googleDocumentExport(rawUrl);
    const response = await fetchWithTimeout(url);
    if (!response.ok) return { url: rawUrl, title: "Role link could not be opened", text: `The source returned HTTP ${response.status}.`, status: "unavailable" };
    const contentType = response.headers.get("content-type") || "";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
        return { url: response.url || rawUrl, title: "Job description PDF", text: "A PDF job description was found. If a server Gemini key is configured, the model will read the PDF directly to ground the plan.", status: "pdf", mimeType: "application/pdf", data: bytes.toString("base64") };
    }
    const raw = bytes.toString("utf8").slice(0, MAX_SOURCE_CHARS);
    const title = cleanText(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || raw.match(/^([^\n]{1,140})/)?.[1] || "Job description");
    const text = cleanText(raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")).slice(0, MAX_SOURCE_CHARS);
    return { url: response.url || rawUrl, title, text, status: text.length > 120 ? "read" : "thin" };
}

function searchResultLinks(html, query) {
    const results = [];
    const sourceType = /careers|company|official/i.test(query) ? "Official or public index" : /interview|candidate|reddit|leetcode|blind/i.test(query) ? "Candidate experience" : "Public source";
    const anchors = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    for (const [, rawHref, rawTitle] of anchors) {
        const title = cleanText(rawTitle);
        const absoluteHref = toAbsoluteUrl(rawHref.replace(/&amp;/g, "&"), "https://html.duckduckgo.com");
        let href = absoluteHref;
        try {
            const parsed = new URL(absoluteHref);
            if (parsed.searchParams.get("uddg")) href = decodeURIComponent(parsed.searchParams.get("uddg"));
        } catch { /* Ignore malformed result links. */ }
        if (!title || title.length < 8 || !href || href.includes("duckduckgo.com")) continue;
        if (/images|videos|maps|settings/i.test(title)) continue;
        if (!results.some(item => item.url === href)) results.push({ title, url: href, query, sourceType });
        if (results.length >= 4) break;
    }
    return results;
}

async function searchWeb(query) {
    try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetchWithTimeout(url, {}, 9000);
        if (!response.ok) return [];
        return searchResultLinks((await response.text()).slice(0, 120000), query);
    } catch { return []; }
}

function uniqueSources(items) {
    const seen = new Set();
    return items.filter(item => {
        if (!item?.url || seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    }).slice(0, 14);
}

function roleFamily(role = "") {
    if (/(engineer|developer|software|frontend|backend|full.?stack|data|devops)/i.test(role)) return "engineering";
    if (/(design|ux|creative|research)/i.test(role)) return "design";
    if (/(product|program|project|strategy)/i.test(role)) return "product";
    if (/(market|growth|content|sales|customer|success)/i.test(role)) return "go-to-market";
    return "general";
}

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
    const today = TODAY();
    const requestedEnd = dateOnly(deadline);
    const end = requestedEnd && requestedEnd >= today ? requestedEnd : addDays(today, 14);
    const span = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000));
    const weekCount = Math.min(8, Math.max(1, Math.ceil((span + 1) / 7)));
    const topicPool = [`${role} fundamentals`, `${company} product and customers`, ...(keywords.length ? keywords.slice(0, 3).map(keyword => `${keyword} for ${role}`) : [`${role} interview skills`]), "behavioral interview stories"];
    const focus = ["Understand the brief and learn the core concepts", "Connect the company context to your role", "Build proof with a small project", "Close the gaps and rehearse the hard questions", "Polish your project and practice the conversation"];
    return Array.from({ length: weekCount }, (_, index) => {
        const startOffset = index * 7;
        const endOffset = Math.min(span, startOffset + 6);
        const topic = topicPool[index % topicPool.length];
        const project = index === 0 ? `Create a one-page ${role} role map for ${company}: outcomes, skills, customers, and open questions.` : index === weekCount - 1 ? `Present a small ${role} case study or project as if you were in the interview. Include decisions, trade-offs, and measurable impact.` : `Build a small ${role} project around ${topic}. Document the problem, your approach, and what you would improve next.`;
        return { week: index + 1, label: `Week ${index + 1}`, startDate: addDays(today, startOffset), endDate: addDays(today, endOffset), focus: focus[Math.min(index, focus.length - 1)], learn: freeResources(topic), project: { title: index === 0 ? "Role map" : index === weekCount - 1 ? "Interview-ready case study" : `${topic} mini project`, brief: project, deliverable: index === weekCount - 1 ? "A 5-minute walkthrough plus three proof points" : "A small public or private artifact with a short README" }, practice: ["Write what you learned in your own words", "Explain one concept without looking at notes", index === weekCount - 1 ? "Run a timed mock interview" : "Add one question to your interview bank"] };
    });
}

function fallbackPlan({ company, role, deadline }) {
    const today = TODAY();
    const requestedEnd = dateOnly(deadline);
    const end = requestedEnd && requestedEnd >= today ? requestedEnd : addDays(today, 14);
    const span = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000));
    const family = roleFamily(role);
    const skillTask = family === "engineering" ? "Complete one role-relevant technical exercise" : family === "design" ? "Review one product flow and explain your design trade-offs" : family === "product" ? "Write a one-page prioritization decision with a metric" : "Complete one small exercise that proves the role's core skill";
    const checkpoints = [
        [0, "Read the role like a brief", "Extract the outcomes, repeated skills, and proof the team is asking for.", ["Read the job description once without editing it", "Highlight the three outcomes this role owns", "Write down what is still unclear"]],
        [Math.round(span * 0.18), "Map the company", "Build a one-page view of the product, customer, hiring process, and team context.", ["Review the official company and careers pages", "Capture one recent product or company signal", "Write three questions about how this team works"]],
        [Math.round(span * 0.36), "Translate requirements into proof", "Match the role requirements to evidence from your own work.", ["Choose three projects that prove the core requirements", "Add one measurable outcome to each story", "Draft a concise why-this-role answer"]],
        [Math.round(span * 0.55), "Close the highest-risk gap", "Spend focused time on the skill most likely to be tested.", [skillTask, "Explain the concept or decision out loud in two minutes", "Save one artifact or example you can reference"]],
        [Math.round(span * 0.73), "Rehearse the hard questions", "Turn the role signals into answers you can deliver naturally.", ["Practice a role-specific question", "Practice one trade-off or failure story", "Prepare five questions for the interviewer"]],
        [Math.max(0, span - 1), "Run the final room check", "Review the evidence, logistics, and questions before the conversation.", ["Do one timed mock interview", "Review your role notes and job link", "Write the opening and closing you want to use"]],
        [span, "Show up ready", "Use the conversation to learn as well as to be evaluated.", ["Bring your strongest proof, not every detail", "Ask the questions that reveal how the team works", "Capture the next step immediately afterward"]],
    ];
    return checkpoints.map(([offset, title, focus, tasks], index) => ({ date: addDays(today, Math.min(span, offset)), title, focus, tasks, outcome: index === checkpoints.length - 1 ? "A clear conversation and a documented next move" : "One useful piece of evidence ready for the next step", durationMinutes: index === 0 ? 35 : 45 }));
}

function extractList(text, patterns) {
    const found = [];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) continue;
        const values = match[1].split(/[•|·]|\s{2,}/).map(cleanText).filter(value => value.length > 3 && value.length < 180);
        found.push(...values.slice(0, 6));
    }
    return [...new Set(found)].slice(0, 8);
}

function buildResearch({ company, role, source, sources }) {
    const combined = [source.text, ...sources.map(item => item.title)].filter(Boolean).join(" ");
    const requirements = extractList(source.text, [/(?:requirements|qualifications|what you(?:'|’)ll bring)[\s:—-]+([\s\S]{0,700})/i]);
    const responsibilities = extractList(source.text, [/(?:responsibilities|what you(?:'|’)ll do|the role)[\s:—-]+([\s\S]{0,700})/i]);
    const keywords = [...new Set((combined.match(/\b(?:React|TypeScript|JavaScript|Python|SQL|AWS|GCP|Azure|Figma|Notion|Linear|Tableau|Salesforce|Kubernetes|Node(?:\.js)?|Next\.js|Git|REST|GraphQL|research|analytics|strategy|communication|leadership|collaboration)\b/gi) || []).map(item => item.toLowerCase()))].slice(0, 14);
    return {
        overview: source.text ? `The linked role source was read as “${source.title}”. Use the extracted requirements below as the role-specific source of truth, then verify important details on the official page.` : `Public source trails were collected for ${company}. Verify the details before using them as facts in an interview.`,
        hiringProcess: `Search results were collected for ${company} ${role} interview process. Look for repeated evidence about recruiter screens, assessments, interview loops, and decision timing.`,
        techStack: keywords.length ? `The role source and public signals mention: ${keywords.join(", ")}. Confirm which tools belong to this team rather than assuming the whole company uses them.` : `No reliable stack was extracted from the available source. Search the engineering blog, team pages, and public repositories for role-relevant signals.`,
        culture: `Use the company values, product announcements, and team pages as prompts. Bring back two specific examples of how ${company} works and measures impact.`,
        sources,
        sourceStatus: source.status,
        extractedAt: new Date().toISOString(),
        jd: {
            status: source.status,
            title: source.title,
            summary: source.text ? source.text.slice(0, 520) : `No readable job description text was available for ${role}.`,
            requirements,
            responsibilities,
            keywords,
        },
    };
}

function parseJson(text) {
    try { return JSON.parse(text); } catch { /* Try the common fenced JSON response shape. */ }
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

async function generateWithGemini(input, research, basePlan, source, weeks) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) return null;
    const prompt = `You are a careful career-preparation planner. Return JSON only, with no markdown.

Create a full preparation plan for this candidate role. Use only source-backed company claims from the supplied research. If something is unknown, say "Not verified" rather than inventing it. Make the plan practical and dated. Every plan item must have a date on or before the target date. Organize the learning into week-by-week curriculum. Each week must tell the candidate what to learn, which free resources to use, what project to build, and how to practice it.

Role: ${input.role}
Company: ${input.company}
Target date: ${input.deadline || "No deadline supplied; use the next 14 days"}
Location: ${input.location || "Not provided"}

JOB SOURCE:
${research.jd.summary}
Requirements: ${research.jd.requirements.join(" | ") || "Not extracted"}
Responsibilities: ${research.jd.responsibilities.join(" | ") || "Not extracted"}
Keywords: ${research.jd.keywords.join(", ") || "Not extracted"}

COMPANY RESEARCH:
Overview: ${research.overview}
Hiring process: ${research.hiringProcess}
Tech stack: ${research.techStack}
Culture: ${research.culture}

AVAILABLE FREE RESOURCE LINKS (use these URLs only; do not invent resource URLs):
${JSON.stringify(weeks.flatMap(week => week.learn), null, 2)}

Return this exact shape:
{"summary":"short candidate-facing summary","whyThisRole":"specific preparation angle","companyResearch":{"overview":"...","hiringProcess":"...","techStack":"...","culture":"..."},"weeks":[{"week":1,"label":"Week 1","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","focus":"...","learn":[{"title":"...","url":"one supplied URL","type":"Concepts|Video|Practice","free":true}],"project":{"title":"...","brief":"...","deliverable":"..."},"practice":["..."]}],"plan":[{"date":"YYYY-MM-DD","title":"...","focus":"...","tasks":["...","..."],"outcome":"...","durationMinutes":45}],"questions":["..."],"risks":["..."],"finalChecklist":["..."]}`;
    try {
        const sourcePart = source?.mimeType && source?.data ? { inline_data: { mime_type: source.mimeType, data: source.data } } : null;
        const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [sourcePart, { text: prompt }].filter(Boolean) }] }),
        }, 20000);
        if (!response.ok) return null;
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = parseJson(text);
        if (!parsed?.plan?.length || !parsed?.weeks?.length) return null;
        return { ...parsed, weeks: parsed.weeks.map((week, index) => ({ ...weeks[index], ...week, learn: Array.isArray(week.learn) && week.learn.length ? week.learn.slice(0, 4) : weeks[index]?.learn || [], practice: Array.isArray(week.practice) && week.practice.length ? week.practice.slice(0, 4) : weeks[index]?.practice || [] })), plan: parsed.plan.map((item, index) => ({ ...item, date: dateOnly(item.date) || basePlan[index]?.date || basePlan[basePlan.length - 1].date, tasks: Array.isArray(item.tasks) ? item.tasks.slice(0, 5) : [] })) };
    } catch { return null; }
}

export async function handler(event) {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: JSON_HEADERS, body: "" };
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
    try {
        const input = JSON.parse(event.body || "{}");
        const company = String(input.company || "").trim();
        const role = String(input.role || "").trim();
        if (!company || !role) return json(400, { error: "Company and role are required." });
        const source = await fetchRoleSource(String(input.url || "").trim());
        const queries = [
            `${company} ${role} interview process`,
            `${company} careers hiring process`,
            `${company} engineering tech stack`,
            `${company} product news values strategy`,
            `${company} ${role} interview experience candidate report`,
            `${company} ${role} technical interview questions public`,
            `${company} ${role} reddit interview discussion`,
        ];
        const searched = (await Promise.all(queries.map(searchWeb))).flat();
        const sources = uniqueSources([{ title: source.title, url: source.url, sourceType: source.status === "missing" ? "No job link" : "Job description source" }, ...searched]);
        const research = buildResearch({ company, role, source, sources });
        const basePlan = fallbackPlan({ company, role, deadline: input.deadline });
        const weeks = buildWeeks({ company, role, deadline: input.deadline, keywords: research.jd.keywords });
        const aiPlan = await generateWithGemini({ ...input, company, role }, research, basePlan, source, weeks);
        const plan = aiPlan || { summary: `A focused preparation path for ${role} at ${company}.`, whyThisRole: "Collect evidence from the role brief, connect it to your own work, then practice the highest-risk conversation before the target date.", weeks, plan: basePlan, questions: [], risks: [], finalChecklist: ["Review the exact job description", "Prepare three proof stories", "Practice one role-specific answer", "Write down the next step after the conversation"] };
        return json(200, {
            version: 1,
            mode: aiPlan ? "researched-ai" : "researched-template",
            generatedAt: new Date().toISOString(),
            targetDate: dateOnly(input.deadline) || basePlan[basePlan.length - 1].date,
            companyResearch: { ...research, ...(aiPlan?.companyResearch || {}) },
            jd: research.jd,
            resources: [...new Map((plan.weeks || weeks).flatMap(week => week.learn || []).map(resource => [resource.url, resource])).values()],
            ...plan,
            disclaimer: "Public sources can be incomplete or outdated. Verify important hiring and technology details with the official company or recruiter.",
        });
    } catch (error) {
        return json(500, { error: error?.name === "AbortError" ? "The research took too long. Try the role again." : "The role could not be researched right now. Try again with a public job link." });
    }
}
