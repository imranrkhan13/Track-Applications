const PROVIDERS = [
    { id: "deepgram", label: "Deepgram", enabledFlag: "VITE_ENABLE_DEEPGRAM", endpoint: "/api/voice/transcribe" },
    { id: "whisper", label: "OpenAI Whisper", enabledFlag: "VITE_ENABLE_WHISPER", endpoint: "/api/voice/transcribe" },
    { id: "gradium", label: "Gradium AI", enabledFlag: "VITE_ENABLE_GRADIUM", endpoint: "/api/voice/transcribe" },
];

export function providerStatus() {
    return PROVIDERS.map(provider => ({ ...provider, configured: import.meta.env[provider.enabledFlag] === "true" }));
}

export function getBrowserSpeechRecognition() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function startBrowserRecognition({ onResult, onError, onEnd }) {
    const Recognition = getBrowserSpeechRecognition();
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = event => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join(" ");
        onResult(transcript, event.results[event.results.length - 1].isFinal);
    };
    recognition.onerror = onError;
    recognition.onend = onEnd;
    recognition.start();
    return recognition;
}

export async function transcribeAudio(blob, provider = "deepgram") {
    const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm", "X-Voice-Provider": provider },
        body: blob,
    });
    if (!response.ok) throw new Error(`Voice transcription failed (${response.status})`);
    const data = await response.json();
    return data.transcript || data.text || "";
}

export async function rateAnswer({ question, answer, role, provider = "deepgram" }) {
    try {
        const response = await fetch("/api/voice/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Voice-Provider": provider },
            body: JSON.stringify({ question, answer, role }),
        });
        if (response.ok) return response.json();
    } catch { /* use local rubric below */ }
    return localRateAnswer({ question, answer, role });
}

export function localRateAnswer({ answer = "", question = "", role = "" }) {
    const text = answer.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const hasStructure = /situation|context|task|action|result|impact|because|learned|measured/i.test(text);
    const hasEvidence = /\d+%?|\$\d+|increased|reduced|improved|launched|shipped|users|customers/i.test(text);
    const hasRoleSignal = role && text.toLowerCase().includes(role.toLowerCase().split(" ")[0]);
    const clarity = Math.min(92, Math.max(34, 48 + Math.min(words, 130) * 0.25 + (hasStructure ? 14 : 0)));
    const relevance = Math.min(94, Math.max(38, 48 + (hasRoleSignal ? 12 : 0) + (question.length > 20 ? 8 : 0) + (hasEvidence ? 8 : 0)));
    const structure = Math.min(95, Math.max(30, 45 + (hasStructure ? 28 : 0) + (hasEvidence ? 8 : 0)));
    const confidence = Math.min(93, Math.max(32, 44 + Math.min(words, 110) * 0.2 + (text ? 12 : 0)));
    const overall = Math.round((clarity + relevance + structure + confidence) / 4);
    return {
        overall,
        clarity: Math.round(clarity),
        relevance: Math.round(relevance),
        structure: Math.round(structure),
        confidence: Math.round(confidence),
        strengths: [hasStructure ? "Clear story structure" : "Direct answer", hasEvidence ? "Uses concrete evidence" : "Natural conversational tone"],
        improvements: [hasStructure ? "Tighten the opening context" : "Use a STAR structure", hasEvidence ? "Connect the metric to business impact" : "Add one measurable outcome"],
        coaching: `For ${role || "this role"}, make the first 15 seconds more specific, then close by naming what changed because of your work.`,
    };
}

export const MOCK_QUESTIONS = [
    { id: "q1", type: "behavioral", text: "Tell me about a time you had to make a difficult trade-off. What did you choose, and what was the outcome?" },
    { id: "q2", type: "role-specific", text: "Walk me through a project that best demonstrates your fit for this role." },
    { id: "q3", type: "collaboration", text: "Describe a moment when you disagreed with a partner. How did you move forward?" },
];
