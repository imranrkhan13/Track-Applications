import { createElement, useRef, useState } from 'react';
import { Sprout, BriefcaseBusiness, CalendarCheck2, Mic, LogOut, Menu, X } from 'lucide-react';

const sections = [
    ['applications', 'My jobs', BriefcaseBusiness],
    ['prep', 'Preparation', CalendarCheck2],
    ['mock', 'Practice', Mic],
];

export default function Sidebar({ view, user, busy, onNavigate, onSignOut }) {
    const [open, setOpen] = useState(false);
    const toggle = useRef(null);
    const name = user.user_metadata?.full_name || user.email || 'Your account';
    const close = () => { setOpen(false); toggle.current?.focus(); };
    return <aside className="cg-sidebar" onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
    }}>
        <div className="cg-sidebar-top">
            <a className="cg-brand" href="/" aria-label="Career Garden home"><Sprout aria-hidden="true" /><span>Career Garden<small>Your next chapter</small></span></a>
            <button ref={toggle} className="cg-menu-toggle" aria-expanded={open} aria-controls="career-navigation" onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}<span>{open ? 'Close' : 'Menu'}</span></button>
        </div>
        <div id="career-navigation" className={`cg-sidebar-panel ${open ? 'is-open' : ''}`}>
            <nav aria-label="Main navigation">
                {sections.map(([id, label, Icon]) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'selected' : ''} onClick={() => { onNavigate(id); if (open) close(); }}>{createElement(Icon, { 'aria-hidden': true })}<span>{label}</span></button>)}
            </nav>
            <div className="cg-side-foot">
                <span className="cg-account-mark" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                <span className="cg-user">{name}<small>Your workspace</small></span>
                <button className="cg-signout" disabled={busy} onClick={onSignOut}><LogOut aria-hidden="true" /> Sign out</button>
            </div>
        </div>
    </aside>;
}
