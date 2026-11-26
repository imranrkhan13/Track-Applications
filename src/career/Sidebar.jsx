import { createElement, useRef, useState } from 'react';
import { Sprout, BriefcaseBusiness, CalendarCheck2, Mic, LogOut, Menu, X, CalendarDays } from 'lucide-react';

const sections = [
    ['applications', 'My jobs', BriefcaseBusiness],
    ['prep', 'Preparation', CalendarCheck2],
    ['mock', 'Practice', Mic],
];

export default function Sidebar({ view, user, busy, onNavigate, onSignOut, stats }) {
    const [open, setOpen] = useState(false);
    const toggle = useRef(null);
    const name = user.user_metadata?.full_name || user.email || 'Your account';
    const close = () => { setOpen(false); toggle.current?.focus(); };
    // Workspace snapshot for the nav badges. Falls back to zeroed counts so the
    // layout is identical before the first job load finishes.
    const s = stats || { active: 0, interviewing: 0, offers: 0, next: null };
    const badgeFor = id => id === 'applications' ? s.active
        : id === 'mock' ? s.interviewing
        : id === 'prep' ? s.offers
        : 0;
    return <aside className="cg-sidebar" onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
    }}>
        <div className="cg-sidebar-top">
            <a className="cg-brand" href="/" aria-label="Career Garden home"><Sprout aria-hidden="true" /><span>Career Garden<small>Your next chapter</small></span></a>
            <button ref={toggle} className="cg-menu-toggle" aria-expanded={open} aria-controls="career-navigation" onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}<span>{open ? 'Close' : 'Menu'}</span></button>
        </div>
        <div id="career-navigation" className={`cg-sidebar-panel ${open ? 'is-open' : ''}`}>
            <nav aria-label="Main navigation">
                {sections.map(([id, label, Icon]) => {
                    const badge = badgeFor(id);
                    return <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'selected' : ''} onClick={() => { onNavigate(id); if (open) close(); }}>
                        {createElement(Icon, { 'aria-hidden': true })}
                        <span>{label}</span>
                        {badge > 0 && <span className="cg-nav-badge" aria-label={`${badge} ${label === 'My jobs' ? 'active applications' : label === 'Practice' ? 'in interview' : 'offers'}`}>{badge}</span>}
                    </button>;
                })}
            </nav>
            <div className="cg-side-metrics" aria-label="Workspace summary">
                <div className="cg-metric">
                    <span className="cg-metric-value">{s.active}</span>
                    <span className="cg-metric-label">Active</span>
                </div>
                <div className="cg-metric">
                    <span className="cg-metric-value">{s.interviewing}</span>
                    <span className="cg-metric-label">Interviewing</span>
                </div>
                <div className="cg-metric">
                    <span className="cg-metric-value">{s.offers}</span>
                    <span className="cg-metric-label">Offers</span>
                </div>
            </div>
            {s.next && <button className="cg-side-next" onClick={() => { onNavigate('applications'); if (open) close(); }}>
                <CalendarDays aria-hidden="true" />
                <span>
                    <small>Next action · {s.next.date}</small>
                    <b>{s.next.step}</b>
                    <small>at {s.next.company}</small>
                </span>
            </button>}
            <div className="cg-side-foot">
                <span className="cg-account-mark" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                <span className="cg-user">{name}<small>Your workspace</small></span>
                <button className="cg-signout" disabled={busy} onClick={onSignOut}><LogOut aria-hidden="true" /> Sign out</button>
            </div>
        </div>
    </aside>;
}
