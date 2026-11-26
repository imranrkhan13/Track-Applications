import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Sprout, X } from "lucide-react";

const LINKS = [["How it works", "#capture"], ["Journey", "#journey"], ["Your plan", "#plan"], ["Practice", "#practice"]];

export default function LandingNavbar({ onStart, onSignIn }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        const update = () => setScrolled(window.scrollY > 18);
        update();
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    // While the menu is open: close on Escape, on an outside click, or when the
    // viewport grows back to the desktop layout.
    useEffect(() => {
        if (!open) return;
        const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
        const onPointer = (event) => { if (headerRef.current && !headerRef.current.contains(event.target)) setOpen(false); };
        const onResize = () => { if (window.innerWidth > 820) setOpen(false); };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onPointer);
        window.addEventListener("resize", onResize);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onPointer);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);

    // Lock page scroll behind the open menu.
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [open]);

    const close = () => setOpen(false);
    const solid = scrolled || open;
    return <header ref={headerRef} className={`cg-nav ${solid ? "is-scrolled" : ""}`}>
        <div className="cg-shell cg-nav-inner">
            <a className="cg-brand" href="#top" onClick={close} aria-label="Career Garden home"><span><Sprout size={18} /></span><strong>Career Garden</strong></a>
            <nav id="cg-nav-menu" className={`cg-nav-links ${open ? "is-open" : ""}`} aria-label="Primary navigation">
                {LINKS.map(([label, href]) => <a key={label} href={href} onClick={close}>{label}</a>)}
                <button type="button" className="cg-nav-menu-cta" onClick={() => { close(); onStart(); }}>Start your garden <ArrowUpRight size={15} /></button>
                <button type="button" className="cg-nav-menu-signin" onClick={() => { close(); onSignIn(); }}>Sign in</button>
            </nav>
            <div className="cg-nav-actions"><button type="button" className="cg-nav-signin" onClick={onSignIn}>Sign in</button><button type="button" className="cg-button cg-button-nav" onClick={onStart}>Start your garden <ArrowUpRight size={14} /></button></div>
            <button type="button" className="cg-nav-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="cg-nav-menu" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
    </header>;
}
