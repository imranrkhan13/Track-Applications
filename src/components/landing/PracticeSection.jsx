import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock3, Mic, RotateCcw, Send, Sparkles } from "lucide-react";
import { ScaleReveal } from "./Motion";

const MotionDiv = motion.div;
const SCORES = [["Technical depth", 8.2], ["Communication", 7.8], ["Tradeoffs", 6.4], ["System thinking", 7.1]];

export default function PracticeSection() {
    const [answer, setAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const submit = () => setSubmitted(true);
    const reset = () => { setAnswer(""); setSubmitted(false); };
    return <section className="cg-section cg-practice" id="practice"><div className="cg-shell"><div className="cg-section-head cg-section-head-dark"><div><span className="cg-kicker cg-kicker-light"><i />Step 06 · Mock interview</span><h2>Practise the moment<br /><em>before it matters.</em></h2></div><p>Answer in your own words, get specific feedback and try again until the answer feels natural.</p></div><ScaleReveal className="cg-interview-room"><header><div><span className="cg-live-dot" />Technical Interview <small>Google · Senior Backend Engineer</small></div><strong><Clock3 size={15} />32:18</strong></header><div className="cg-interview-layout"><main><div className="cg-interviewer"><span>AI</span><div><small>INTERVIEWER</small><p>“Your service suddenly receives 20× normal traffic. Walk me through how you would investigate and scale it.”</p></div></div><div className="cg-answer-box"><textarea value={answer} onChange={event => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Type your answer…" aria-label="Mock interview answer" /><div><button type="button"><Mic size={15} />Answer with voice</button><button type="button" className="cg-submit-answer" disabled={!answer.trim()} onClick={submit}><Send size={14} />Get feedback</button></div></div></main><aside><AnimatePresence mode="wait">{!submitted ? <MotionDiv key="waiting" className="cg-feedback-waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Sparkles size={22} /><strong>Your feedback will appear here.</strong><p>Answer the question, then submit when you are ready.</p></MotionDiv> : <MotionDiv key="scores" className="cg-feedback-scores" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}><span>COACH NOTES</span>{SCORES.map(([label, score]) => <div key={label}><small>{label}</small><strong>{score}</strong><i><em style={{ width: `${score * 10}%` }} /></i></div>)}<section><small>NEEDS WORK</small><b>Failure handling</b><b>Database partitioning</b></section><button type="button" onClick={reset}><RotateCcw size={13} />Try again</button></MotionDiv>}</AnimatePresence></aside></div></ScaleReveal></div></section>;
}
