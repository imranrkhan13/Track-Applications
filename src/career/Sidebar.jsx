import { useRef, useState } from 'react';
import { Sprout, BriefcaseBusiness, CalendarCheck2, Mic, LogOut, Menu, X, ChevronRight, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ view, user, busy, onNavigate, onSignOut }) {
    const [open, setOpen] = useState(false);
    const toggle = useRef(null);
    const name = user.user_metadata?.full_name || user.email || 'Your account';
    const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const close = () => { setOpen(false); toggle.current?.focus(); };
    const go = (page) => { onNavigate(page); if (open) close(); };

    const isActive = id => view === id;
    const primaryItems = [
        { id: 'applications', label: 'Applications', icon: <LayoutDashboard /> },
        { id: 'prep', label: 'Preparation', icon: <CalendarCheck2 /> },
        { id: 'mock', label: 'Practice', icon: <Mic /> },
    ];
    const quickItems = [
        { id: 'all', label: 'All active', icon: <BriefcaseBusiness /> },
        { id: 'upcoming', label: 'Upcoming', icon: <CalendarCheck2 /> },
    ];

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
            <nav aria-label="Main sections">
                {primaryItems.map(item =>
                    <button key={item.id} aria-current={isActive(item.id) ? 'page' : undefined} className={isActive(item.id) ? 'selected' : ''} onClick={() => go(item.id)}>
                        <span className="cg-nav-icon">{item.icon}</span>
                        <span className="cg-nav-label">{item.label}</span>
                        {isActive(item.id) && <ChevronRight className="cg-nav-arrow" />}
                    </button>
                )}
            </nav>

            <nav aria-label="Quick actions" className="cg-nav-quick">
                <span className="cg-nav-section-title">Quick view</span>
                {quickItems.map(item =>
                    <button key={item.id} onClick={() => go('applications')}>
                        <span className="cg-nav-icon">{item.icon}</span>
                        <span className="cg-nav-label">{item.label}</span>
                    </button>
                )}
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
