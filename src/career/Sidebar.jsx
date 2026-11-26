import { createElement, useRef, useState } from 'react';
import { Sprout, BriefcaseBusiness, CalendarCheck2, Mic, LogOut, Menu, X, Search, TrendingUp, Calendar, Clock } from 'lucide-react';

const sections = [
    { id: 'applications', label: 'My jobs', Icon: BriefcaseBusiness, desc: 'Track applications' },
    { id: 'prep', label: 'Preparation', Icon: CalendarCheck2, desc: 'Study plans' },
    { id: 'mock', label: 'Practice', Icon: Mic, desc: 'Interview prep' },
];

const QUICK_TOOLS = [
    { id: 'all', label: 'All jobs', Icon: Search, path: 'applications' },
    { id: 'active', label: 'Active only', Icon: TrendingUp, path: 'applications' },
    { id: 'upcoming', label: 'Upcoming', Icon: Calendar, path: 'prep' },
    { id: 'recent', label: 'Recent edits', Icon: Clock, path: 'applications' },
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
            <div className="cg-sidebar-stats">
                <div className="cg-stat-card" onClick={() => { onNavigate('applications'); if (open) close(); }}>
                    <span className="cg-stat-icon cg-stat-jobs"><BriefcaseBusiness /></span>
                    <strong className="cg-stat-num">—</strong>
                    <small>Applications</small>
                </div>
                <div className="cg-stat-card" onClick={() => { onNavigate('prep'); if (open) close(); }}>
                    <span className="cg-stat-icon cg-stat-prep"><CalendarCheck2 /></span>
                    <strong className="cg-stat-num">—</strong>
                    <small>In prep</small>
                </div>
                <div className="cg-stat-card" onClick={() => { onNavigate('mock'); if (open) close(); }}>
                    <span className="cg-stat-icon cg-stat-practice"><Mic /></span>
                    <strong className="cg-stat-num">—</strong>
                    <small>Practices</small>
                </div>
            </div>
            <nav aria-label="Workspace sections">
                <span className="cg-nav-label">Workspace</span>
                {sections.map(({ id, label, Icon, desc }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'selected' : ''} onClick={() => { onNavigate(id); if (open) close(); }}>{createElement(Icon, { 'aria-hidden': true })}<span><b>{label}</b><small>{desc}</small></span></button>)}
            </nav>
            <nav aria-label="Quick filters" className="cg-nav-secondary">
                <span className="cg-nav-label">Quick view</span>
                {QUICK_TOOLS.map(({ id, label, Icon, path }) => <button key={id} onClick={() => { onNavigate(path); if (open) close(); }}>{createElement(Icon, { 'aria-hidden': true })}<span><b>{label}</b></span></button>)}
            </nav>
            <div className="cg-side-foot">
                <span className="cg-account-mark" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                <span className="cg-user">{name}<small>Your workspace</small></span>
                <button className="cg-signout" disabled={busy} onClick={onSignOut}><LogOut aria-hidden="true" /> Sign out</button>
            </div>
        </div>
    </aside>;
}
