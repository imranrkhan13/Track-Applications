import React, { useEffect, useState } from "react";
import { ArrowRight, Menu, Sprout, X } from "lucide-react";

const LINKS = [
    ["Product", "#product"],
    ["Growth", "#growth"],
    ["Interview Prep", "#interview-prep"],
    ["How it works", "#how-it-works"],
    ["Pricing", "#start"],
];

export default function LandingNavbar({ onStart, onSignIn }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    const handleLink = () => setOpen(false);
    return <header className={`landing-navbar ${scrolled ? "is-scrolled" : ""}`}>
        <div className="landing-container landing-navbar-inner">
            <a className="landing-logo" href="#top" onClick={handleLink} aria-label="Career Garden home"><span className="landing-logo-mark"><Sprout size={18} /></span><span><strong>Career Garden</strong><small>your search, with roots</small></span></a>
            <nav className={`landing-nav-links ${open ? "is-open" : ""}`} aria-label="Primary navigation">{LINKS.map(([label, href]) => <a key={label} href={href} onClick={handleLink}>{label}</a>)}<button type="button" className="landing-mobile-signin" onClick={() => { handleLink(); onSignIn(); }}>Sign in</button><button type="button" className="landing-mobile-start" onClick={() => { handleLink(); onStart(); }}>Start your garden <ArrowRight size={14} /></button></nav>
            <div className="landing-navbar-actions"><button type="button" className="landing-signin" onClick={onSignIn}>Sign in</button><button type="button" className="landing-primary-button landing-nav-button" onClick={onStart}>Start your garden <ArrowRight size={14} /></button></div>
            <button type="button" className="landing-menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
    </header>;
}
