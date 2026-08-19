import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowRight,
    Check,
    Clock3,
    Headphones,
    Lightbulb,
    MessageCircle,
    Mic,
    RotateCcw,
    ScanText,
    ShieldCheck,
    Square,
    Star,
    Volume2,
} from "lucide-react";
import { getSessions, saveSession } from "./lib/appData";
import { MOCK_QUESTIONS, getBrowserSpeechRecognition, providerStatus, rateAnswer, startBrowserRecognition } from "./lib/voiceInterview";

function scoreColor(score) {
    return score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
}

const questionLabels = {
    behavioral: "Behavioral",
    "role-specific": "Role signal",
    collaboration: "Collaboration",
};

export default function MockInterview({ jobs, selectedJob, setSelectedJob, userId = "demo-user" }) {
    const [jobId, setJobId] = useState(selectedJob?.id || jobs.find(job => job.status === "Interview")?.id || jobs[0]?.id || "");
    const job = jobs.find(item => item.id === jobId) || selectedJob || jobs[0];
    const [questionIndex, setQuestionIndex] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [live, setLive] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [provider, setProvider] = useState("deepgram");
    const [scoring, setScoring] = useState(false);
    const [error, setError] = useState("");
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const questions = useMemo(() => MOCK_QUESTIONS, []);
    const question = questions[questionIndex];
    const providers = providerStatus();
    const browserVoice = Boolean(getBrowserSpeechRecognition());
    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const providerLabel = providers.find(item => item.id === provider)?.label || "Deepgram";

    useEffect(() => {
        if (!job) return;
        setJobId(job.id);
        getSessions(job.id, userId).then(setHistory);
    }, [job?.id, userId]);

    useEffect(() => () => {
        recognitionRef.current?.stop?.();
        clearInterval(timerRef.current);
    }, []);

    const toggleRecording = () => {
        if (live) {
            recognitionRef.current?.stop?.();
            setLive(false);
            clearInterval(timerRef.current);
            return;
        }
        setLive(true);
        setElapsed(0);
        timerRef.current = setInterval(() => setElapsed(value => value + 1), 1000);
        if (!browserVoice) return;
        recognitionRef.current = startBrowserRecognition({
            onResult: text => setTranscript(text),
            onError: () => setLive(false),
            onEnd: () => setLive(false),
        });
    };

    const finishAnswer = async () => {
        recognitionRef.current?.stop?.();
        setLive(false);
        clearInterval(timerRef.current);
        setScoring(true);
        setError("");
        try {
            const scored = await rateAnswer({ question: question.text, answer: transcript, role: job?.role, provider });
            setResult(scored);
            const saved = await saveSession({
                jobId: job?.id,
                company: job?.company,
                role: job?.role,
                question: question.text,
                answer: transcript,
                provider,
                score: scored.overall,
                rubric: scored,
                duration: elapsed,
            }, userId);
            setHistory(current => [saved, ...current]);
        } catch (cause) {
            setError(cause?.message || "We could not rate this answer. Try again or keep practicing locally.");
        } finally {
            setScoring(false);
        }
    };

    const nextQuestion = () => {
        setQuestionIndex(value => (value + 1) % questions.length);
        setTranscript("");
        setResult(null);
        setError("");
        setElapsed(0);
    };

    const reset = () => {
        setQuestionIndex(0);
        setTranscript("");
        setResult(null);
        setError("");
        setElapsed(0);
        setLive(false);
        clearInterval(timerRef.current);
    };

    if (!jobs.length) {
        return (
            <div className="page-grid">
                <section className="panel">
                    <div className="empty-state large">
                        <div className="empty-icon"><Mic size={22} /></div>
                        <b>Add an application to start</b>
                        <p>Your mock interview questions should reflect the role you want.</p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="page-grid mock-page">
            <section className="practice-command-bar">
                <div className="practice-intro">
                    <div className="practice-mark"><span>04</span><i /></div>
                    <div>
                        <p className="eyebrow">Interview studio</p>
                        <h2>Make the next answer easier to say.</h2>
                        <p className="practice-subtitle">A quiet room to rehearse the moments that matter.</p>
                    </div>
                </div>
                <div className="practice-role-picker">
                    <label htmlFor="practice-role">Role in focus</label>
                    <select
                        id="practice-role"
                        value={jobId}
                        onChange={event => {
                            setJobId(event.target.value);
                            setSelectedJob(jobs.find(item => item.id === event.target.value));
                            reset();
                        }}
                    >
                        {jobs.map(item => <option key={item.id} value={item.id}>{item.company} · {item.role}</option>)}
                    </select>
                </div>
            </section>

            <div className="practice-session-bar">
                <div className="practice-session-context">
                    <span className={`practice-signal ${live ? "live" : ""}`} />
                    <b>{live ? "Session live" : "Ready when you are"}</b>
                    <span className="practice-separator">/</span>
                    <span>{job?.company} · {job?.role}</span>
                </div>
                <div className="practice-session-meta">
                    <span><Headphones size={13} /> {providerLabel} route</span>
                    <span><Clock3 size={13} /> {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span>
                </div>
            </div>

            <div className="practice-shell">
                <section className="panel practice-main">
                    <div className="practice-main-head">
                        <div>
                            <span className="practice-kicker">The question</span>
                            <span className="practice-question-type">{questionLabels[question.type] || question.type}</span>
                        </div>
                        <span className="practice-question-number">0{questionIndex + 1} <i>/ 0{questions.length}</i></span>
                    </div>

                    <div className="practice-progress" aria-label="Interview question progress">
                        <span className="practice-progress-line"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></span>
                        <div className="practice-progress-steps">
                            {questions.map((item, index) => (
                                <button
                                    className={index === questionIndex ? "current" : index < questionIndex ? "done" : ""}
                                    key={item.id}
                                    aria-label={`Question ${index + 1}`}
                                    onClick={() => {
                                        setQuestionIndex(index);
                                        setResult(null);
                                        setTranscript("");
                                        setError("");
                                    }}
                                >
                                    {index < questionIndex ? <Check size={12} /> : `0${index + 1}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="practice-question-block">
                        <div className="practice-question-marker"><MessageCircle size={17} /></div>
                        <div>
                            <span className="practice-question-label">Interviewer asks</span>
                            <h1>{question.text}</h1>
                            <p>Keep it specific. Start with the moment, make your decision clear, then land on what changed.</p>
                        </div>
                    </div>

                    <div className="practice-answer-stage">
                        <div className={`practice-mic-stage ${live ? "is-live" : ""}`}>
                            <div className="practice-mic-halo"><div className="practice-mic-core"><Mic size={24} /></div></div>
                            <div className="practice-waveform">
                                {Array.from({ length: 23 }).map((_, index) => <i key={index} style={{ "--delay": `${index * 35}ms`, "--height": `${18 + ((index * 17) % 42)}px` }} />)}
                            </div>
                            <b>{live ? "Listening" : "Voice answer"}</b>
                            <span>{live ? "Speak naturally. We are capturing your answer." : browserVoice ? "Tap start when you are ready · browser capture on" : "Tap start when you are ready · local fallback on"}</span>
                        </div>

                        <label className="practice-editor">
                            <div className="practice-editor-head">
                                <div><span className="practice-question-label">Working transcript</span><b>Say it naturally.</b></div>
                                <span>{wordCount} words</span>
                            </div>
                            <textarea value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Your spoken answer will appear here. You can also type while you practice." rows="7" />
                            <div className="practice-editor-foot"><span><MessageCircle size={13} /> Edit the transcript after you speak.</span><span>{wordCount > 0 ? `${Math.min(90, Math.max(1, Math.round(wordCount / 2.2)))} sec read` : "Aim for 60–90 sec"}</span></div>
                        </label>
                    </div>

                    <div className="practice-main-foot">
                        <div className="practice-privacy"><ShieldCheck size={15} /><span>Private practice<br /><b>Audio stays in this session.</b></span></div>
                        <div className="room-actions">
                            <button className={live ? "record-btn active" : "record-btn"} onClick={toggleRecording}>
                                {live ? <><Square size={15} fill="currentColor" /> Stop recording</> : <><Mic size={16} /> {transcript ? "Record again" : "Start answer"}</>}
                            </button>
                            {transcript.trim() && !result && <button className="primary-btn" onClick={finishAnswer} disabled={scoring}><ScanText size={15} /> {scoring ? "Reading answer…" : "Get coach notes"}</button>}
                            {result && <button className="secondary-btn" onClick={nextQuestion}>Next question <ArrowRight size={15} /></button>}
                            <button className="ghost-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
                        </div>
                    </div>
                    {error && <div className="voice-error" role="alert">{error}</div>}
                </section>

                <aside className="practice-rail">
                    <section className="panel coach-card">
                        <div className="practice-rail-head">
                            <div><span className="eyebrow">Coach notes</span><h2>{result ? "Your answer has a shape." : "Before you speak"}</h2></div>
                            <span className="coach-icon"><Lightbulb size={16} /></span>
                        </div>
                        {result ? (
                            <>
                                <div className="score-hero">
                                    <div className="score-circle" style={{ "--score": `${result.overall * 3.6}deg`, borderColor: scoreColor(result.overall) }}><strong>{result.overall}</strong><span>/100</span></div>
                                    <div><span className="score-eyebrow">Overall signal</span><b>{result.overall >= 80 ? "Strong signal" : result.overall >= 60 ? "Good foundation" : "Keep iterating"}</b><p>{result.coaching}</p></div>
                                </div>
                                <div className="rubric-grid">{[["Clarity", result.clarity], ["Relevance", result.relevance], ["Structure", result.structure], ["Confidence", result.confidence]].map(([label, score]) => <div key={label}><div><span>{label}</span><b>{score}</b></div><i><em style={{ width: `${score}%`, background: scoreColor(score) }} /></i></div>)}</div>
                                <div className="feedback-list"><div><b>What worked</b>{result.strengths.map(item => <span key={item}><Check size={13} />{item}</span>)}</div><div><b>Try next time</b>{result.improvements.map(item => <span key={item}><Star size={13} />{item}</span>)}</div></div>
                            </>
                        ) : (
                            <div className="coach-brief">
                                <p>Use the room like a rehearsal, not a test. Give the answer once, then use the notes to make the second version sharper.</p>
                                <div className="coach-sequence">
                                    <div><span>01</span><div><b>Lead with the moment</b><small>What was at stake?</small></div></div>
                                    <div><span>02</span><div><b>Name the decision</b><small>What did you choose?</small></div></div>
                                    <div><span>03</span><div><b>Land the change</b><small>What improved because of you?</small></div></div>
                                </div>
                                <div className="coach-tip"><span>Helpful cue</span><b>Use one concrete detail before you explain the lesson.</b></div>
                            </div>
                        )}
                    </section>

                    <section className="panel session-history">
                        <div className="practice-rail-head"><div><span className="eyebrow">Your reps</span><h2>Recent sessions</h2></div><span className="history-count">{history.length}</span></div>
                        {history.length ? history.slice(0, 4).map(session => <div className="session-row" key={session.id}><div><b>{session.question.slice(0, 38)}{session.question.length > 38 ? "…" : ""}</b><span>{session.provider} · {session.duration || 0}s</span></div><strong style={{ color: scoreColor(session.score) }}>{session.score}</strong></div>) : <p className="muted session-empty">Your rated answers will collect here.</p>}
                    </section>

                    <div className="practice-route-note"><Volume2 size={14} /><span><b>{providerLabel}</b> is your active voice route.<br />Fallbacks stay ready behind it.</span><select value={provider} onChange={event => setProvider(event.target.value)} aria-label="Voice provider">{providers.map(item => <option key={item.id} value={item.id}>{item.label}{item.configured ? " · configured" : " · endpoint ready"}</option>)}</select></div>
                </aside>
            </div>
        </div>
    );
}
