import { useRef, useState } from 'react';
import { Sprout, BriefcaseBusiness, CalendarCheck2, Mic, LogOut, Menu, X, ChevronRight, LayoutDashboard, CalendarDays } from 'lucide-react';

export default function Sidebar({ view, user, busy, onNavigate, onSignOut, stats }) {
    const [open, setOpen] = useState(false);
    const toggle = useRef(null);
    const name = user.user_metadata?.full_name || user.email || 'Your account';
    const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const close = () => { setOpen(false); toggle.current?.focus(); };
    const go = (page) => { onNavigate(page); if (open) close(); };

    const isActive = id => view === id;
    const s = stats || { active: 0, interviewing: 0, offers: 0, next: null };

    const primaryItems = [
        { id: 'applications', label: 'Applications', icon: <LayoutDashboard /> },
        { id: 'prep', label: 'Preparation', icon: <CalendarCheck2 /> },
        { id: 'mock', label: 'Practice', icon: <Mic /> },
    ];

    const badgeFor = id => id === 'applications' ? s.active
        : id === 'mock' ? s.interviewing
        : id === 'prep' ? s.offers
        : 0;

    return <aside className="cg-sidebar" onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
    }}>
        <div className="cg-sidebar-top">
            <a className="cg-brand" href="/" aria-label="Career Garden home">
                <span className="cg-brand-icon"><Sprout /></span>
                <span className="cg-brand-text"><strong>Career Garden</strong><span>Workspace</span></span>
            </a>
            <button ref={toggle} className="cg-menu-toggle" aria-expanded={open} aria-controls="career-navigation" onClick={() => setOpen(v => !v)}>
                {open ? <X /> : <Menu />}<span>{open ? 'Close' : 'Menu'}</span>
            </button>
        </div>

        <div id="career-navigation" className={`cg-sidebar-panel ${open ? 'is-open' : ''}`}>
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

            {s.next && <button className="cg-side-next" onClick={() => { go('applications'); }}>
                <CalendarDays aria-hidden="true" />
                <span>
                    <small>Next action · {s.next.date}</small>
                    <b>{s.next.step}</b>
                    <small>at {s.next.company}</small>
                </span>
            </button>}

            <nav aria-label="Main sections">
                {primaryItems.map(item => {
                    const badge = badgeFor(item.id);
                    return <button key={item.id} aria-current={isActive(item.id) ? 'page' : undefined} className={isActive(item.id) ? 'selected' : ''} onClick={() => go(item.id)}>
                        <span className="cg-nav-icon">{item.icon}</span>
                        <span className="cg-nav-label">{item.label}</span>
                        {badge > 0 && <span className="cg-nav-badge" aria-label={`${badge} ${item.label === 'Applications' ? 'active applications' : item.label === 'Practice' ? 'in interview' : 'offers'}`}>{badge}</span>}
                        {isActive(item.id) && <ChevronRight className="cg-nav-arrow" />}
                    </button>;
                })}
            </nav>

            <div className="cg-sidebar-spacer" />

            <div className="cg-sidebar-user">
                <button className="cg-user-card" onClick={() => {}}>
                    <span className="cg-user-avatar">{initials}</span>
                    <span className="cg-user-info">
                        <strong>{name}</strong>
                        <small>{user.email || 'Signed in'}</small>
                    </span>
                </button>
                <button className="cg-signout-btn" disabled={busy} onClick={onSignOut}>
                    <LogOut /><span>Sign out</span>
                </button>
            </div>
        </div>
    </aside>;
}
