import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Check, ArrowRight } from 'lucide-react';
import { workspaceFor } from './repository';
import { practiceQuestions } from './planner';
import { recordPractice } from './workflow';
import { ExternalLink } from './UI';
import { supabase } from '../lib/supabase';

export default function Practice({ job, onUpdate, busy, onPlan }) {
    const w = workspaceFor(job);
    const [questions] = useState(() => practiceQuestions(job));
    const [index, setIndex] = useState(0);
    const question = questions[index] || questions[0];
    const [answer, setAnswer] = useState('');
    const [checks, setChecks] = useState([]);
    const [reflection, setReflection] = useState('');
    const [difficulty, setDifficulty] = useState('unassessed');
    const [elapsed, setElapsed] = useState(0);
    const [running, setRunning] = useState(false);
    const [recording, setRecording] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [coaching, setCoaching] = useState(false);
    const [coach, setCoach] = useState(null);
    const recognition = useRef(null);
    const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    useEffect(() => { if (!running) return; const start = Date.now() - elapsed * 1000; const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(timer); /* start value captured only when timer starts */ }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => recognition.current?.stop(), []);
    const stop = () => { recognition.current?.stop(); setRecording(false); setRunning(false); };
    const dictate = () => {
        if (recording) { stop(); return; }
        setError('');
        if (!SpeechRecognition) { setError('Dictation is not supported here. Type your answer instead.'); return; }
        const engine = new SpeechRecognition();
        engine.continuous = true; engine.interimResults = false;
        engine.lang = navigator.language || 'en-US';
        const previous = answer.trim();
        engine.onresult = event => { const text = Array.from(event.results).map(r => r[0].transcript).join(' '); setAnswer(`${previous} ${text}`.trim()); setSaved(false); };
        engine.onerror = () => { setError('Dictation stopped. Your transcript is preserved; you can continue typing.'); setRecording(false); setRunning(false); };
        engine.onend = () => { setRecording(false); setRunning(false); };
        recognition.current = engine;
        try { engine.start(); setRecording(true); setRunning(true); } catch { setError('Microphone could not start. Check browser permission or type your answer.'); }
    };
    const save = async () => {
        stop(); setError('');
        if (!answer.trim()) { setError('Write or dictate an answer first.'); return; }
        try {
            const attempt = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), question: question.title, questionId: question.id, skill: question.skill, answer, duration: elapsed, rubric: question.rubric, checks, reflection, selfAssessment: difficulty, assessmentMethod: 'user-self-review', coach: coach?.answer === answer ? coach.result : null };
            await onUpdate(recordPractice(w, attempt), 'Saved an interview practice answer');
            setSaved(true);
        } catch (cause) { setError(cause.message); }
    };
    const next = nextIndex => { stop(); setIndex(nextIndex); setAnswer(''); setReflection(''); setChecks([]); setDifficulty('unassessed'); setElapsed(0); setReviewing(false); setSaved(false); setError(''); setCoach(null); };
    const askCoach = async () => {
        if (coaching) return; setCoaching(true); setError(''); stop();
        const submitted = answer;
        try {
            const session = await supabase?.auth.getSession();
            if (!session?.data?.session?.access_token) throw new Error('Sign in for AI coaching. Your self-review remains available.');
            const response = await fetch('/api/career-coach', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.data.session.access_token}` }, body: JSON.stringify({ answer: submitted, question: question.title, rubric: question.rubric }), signal: AbortSignal.timeout(30000) });
            if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The coach endpoint is not deployed here. Self-review is still available.');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Coaching unavailable.');
            setCoach({ answer: submitted, result }); setSaved(false);
        } catch (cause) { setError(cause.message); } finally { setCoaching(false); }
    };
    return <div className="cg-stack"><section className="cg-surface"><div className="cg-section-head"><div><span className="cg-label">INTERVIEW PRACTICE</span><h2>Practise for {job.company}</h2></div><span className="cg-stage">{index + 1} / {questions.length}</span></div><p className="cg-muted">Answer a role-specific prompt, review your response, then work on the gaps. These are practice questions, not guaranteed interview questions.</p></section><div className="cg-detail-grid"><section className="cg-surface cg-practice"><span className="cg-label">{question.skill}</span><h2>{question.title}</h2>{question.origin && <p className="cg-muted">{question.origin}</p>}{question.sourceUrl && <ExternalLink href={question.sourceUrl}>Based on this reviewed account</ExternalLink>}<div className="cg-timer"><span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span><button className="cg-secondary" onClick={() => setRunning(!running)}>{running ? 'Pause timer' : 'Start timer'}</button></div><label>Your answer<textarea rows={10} maxLength={12000} value={answer} onChange={e => { setAnswer(e.target.value); setSaved(false); }} placeholder="Explain your approach, alternatives and the result. You can also write code or paste a project link." /></label><div className="cg-actions"><button className="cg-secondary" onClick={dictate} disabled={!SpeechRecognition || reviewing}>{recording ? <><Square /> Stop dictation</> : <><Mic /> Dictate answer</>}</button><button className="cg-primary" disabled={!answer.trim()} onClick={() => { stop(); setReviewing(true); }}>Review answer <ArrowRight /></button></div><p className="cg-muted cg-small">Optional dictation uses your browser’s speech service, which may process audio remotely. Career Garden saves the transcript, not an audio recording. Typing works without microphone access.</p>{error && <div className="cg-error" role="alert">{error}</div>}{reviewing && <div className="cg-self-review"><div className="cg-coach-box"><h3>Optional AI coach</h3><p className="cg-muted">This sends this answer, question and rubric to the configured AI provider. Remove confidential details first. Feedback can be wrong; no hiring score is produced.</p><button className="cg-secondary" disabled={coaching || !answer.trim()} onClick={askCoach}>{coaching ? 'Reading your answer…' : 'Send answer for AI feedback'}</button>{coach?.answer === answer && <><p className="cg-label">AI FEEDBACK · REVIEW BEFORE RELYING ON IT</p>{coach.result.criteria.map(c => <div key={c.criterion}><b>{c.criterion}: {c.verdict}</b>{c.quote && <blockquote>{c.quote}</blockquote>}<p>{c.reason}</p></div>)}<p><b>Follow-up:</b> {coach.result.followUp}</p></>}{coach && coach.answer !== answer && <p className="cg-muted">You edited your answer. Request feedback again for this version.</p>}</div><h3>Review against the rubric</h3><p className="cg-muted">This is your self-assessment, not an AI score or hiring prediction.</p>{question.rubric.map((criterion, i) => <label className="cg-check" key={criterion}><input type="checkbox" checked={checks.includes(i)} onChange={e => { setChecks(e.target.checked ? [...checks, i] : checks.filter(c => c !== i)); setSaved(false); }} />{criterion}</label>)}<label>What would you improve?<textarea rows={3} maxLength={2000} value={reflection} onChange={e => { setReflection(e.target.value); setSaved(false); }} /></label><label>How did this skill feel?<select value={difficulty} onChange={e => { setDifficulty(e.target.value); setSaved(false); }}><option value="unassessed">Not assessed yet</option><option value="needs-work">Needs more practice</option><option value="comfortable">Comfortable in this attempt</option></select></label><div className="cg-actions"><button className="cg-primary" disabled={busy || saved || coaching} onClick={save}>{saved ? <><Check /> Saved</> : 'Save answer & review'}</button><button className="cg-secondary" disabled={!saved || coaching} onClick={() => next((index + 1) % questions.length)}>Next question <ArrowRight /></button></div>{saved && <div role="status" className="cg-muted"><p>Answer saved. Your dated preparation plan uses this review; check any planning notice above.</p><button className="cg-secondary" onClick={onPlan}>See my next preparation task <ArrowRight /></button></div>}</div>}</section><aside className="cg-stack"><section className="cg-surface"><h2>Your practice history</h2>{w.attempts.length ? [...w.attempts].reverse().map(a => <details className="cg-attempt" key={a.id}><summary><b>{a.question}</b><small>{new Date(a.createdAt).toLocaleDateString()} · {a.selfAssessment.replaceAll('-', ' ')}</small></summary><p className="cg-prewrap">{a.answer}</p><p className="cg-muted">Reflection: {a.reflection || 'Not added'}</p>{a.coach && <p className="cg-muted">Coach follow-up: {a.coach.followUp}</p>}<small>Self-review · {a.duration}s · {a.checks.length}/{a.rubric.length} criteria checked</small></details>) : <p className="cg-inline-note">Your saved answers and reflections will appear here.</p>}</section><section className="cg-surface"><span className="cg-label">A USEFUL FOLLOW-UP</span><p>What assumption could make your answer wrong? What would you test before committing to it?</p></section></aside></div></div>;
}
