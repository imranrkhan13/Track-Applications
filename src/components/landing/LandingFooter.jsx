import React from "react";
import { ArrowUpRight, Sprout } from "lucide-react";

export default function LandingFooter({ onStart }) {
    return <footer className="cg-footer"><div className="cg-shell"><div className="cg-footer-top"><a className="cg-brand cg-footer-brand" href="#top"><span><Sprout size={18} /></span><strong>Career Garden</strong></a><p>Your job search, with roots.</p><button type="button" onClick={onStart}>Plant a role <ArrowUpRight size={14} /></button></div><div className="cg-footer-links"><div><small>PRODUCT</small><a href="#dashboard">Dashboard</a><a href="#capture">Role capture</a><a href="#views">Application views</a></div><div><small>PREPARE</small><a href="#interview-prep">Interview Prep</a><a href="#plan">Adaptive plan</a><a href="#practice">Mock interview</a></div><div><small>GROW</small><a href="#journey">Six stages</a><a href="#analytics">Analytics</a><a href="#lessons">Lessons</a></div></div><div className="cg-footer-bottom"><span>Career Garden © 2026</span><span>Made for thoughtful candidates.</span><a href="#top">Back to top <ArrowUpRight size={13} /></a></div></div></footer>;
}
