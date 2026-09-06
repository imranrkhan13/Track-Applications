import React, { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Sprout, X } from "lucide-react";

const LINKS = [["How it works", "#capture"], ["Journey", "#journey"], ["Your plan", "#plan"], ["Practice", "#practice"]];

export default function LandingNavbar({ onStart, onSignIn }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const update = () => setScrolled(window.scrollY > 18);
        update();
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);
    const close = () => setOpen(false);
    return <header className={`cg-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="cg-shell cg-nav-inner">
            <a className="cg-brand" href="#top" onClick={close} aria-label="Career Garden home"><span><Sprout size={18} /></span><strong>Career Garden</strong></a>
            <nav className={`cg-nav-links ${open ? "is-open" : ""}`} aria-label="Primary navigation">{LINKS.map(([label, href]) => <a key={label} href={href} onClick={close}>{label}</a>)}<button type="button" onClick={() => { close(); onSignIn(); }}>Sign in</button></nav>
            <div className="cg-nav-actions"><button type="button" className="cg-nav-signin" onClick={onSignIn}>Sign in</button><button type="button" className="cg-button cg-button-nav" onClick={onStart}>Start your garden <ArrowUpRight size={14} /></button></div>
            <button type="button" className="cg-nav-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
    </header>;
}
