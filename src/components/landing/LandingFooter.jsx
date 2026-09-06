import React from "react";
import { ArrowUpRight, Sprout } from "lucide-react";

export default function LandingFooter({ onStart }) {
    return <footer className="cg-footer"><div className="cg-shell"><div className="cg-footer-top"><a className="cg-brand cg-footer-brand" href="#top"><span><Sprout size={18} /></span><strong>Career Garden</strong></a><p>Your job search, with roots.</p><button type="button" onClick={onStart}>Add a role <ArrowUpRight size={14} /></button></div><div className="cg-footer-links"><div><small>START</small><a href="#capture">Add a role</a><a href="#intelligence">Company research</a><a href="#dashboard">Your garden</a></div><div><small>PREPARE</small><a href="#plan">Your plan</a><a href="#interview-prep">Interview room</a><a href="#practice">Mock interview</a></div><div><small>JOURNEY</small><a href="#journey">Six stages</a><a href="#lessons">Saved lessons</a><a href="#top">Back to the start</a></div></div><div className="cg-footer-bottom"><span>Career Garden © 2026</span><span>Made for thoughtful candidates.</span><a href="#top">Back to top <ArrowUpRight size={13} /></a></div></div></footer>;
}
