import { createElement, useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Plus, ShieldCheck, Sparkles, Link2, AlertTriangle, Globe, FileText, CheckCircle2, Ban, RefreshCw } from 'lucide-react';
import { workspaceFor, safeLink } from './repository';
import { inferFamily, normalizeCompany, processFor } from './planner';
import { ExternalLink } from './UI';
import { supabase } from '../lib/supabase';

// Status badge for a discovered/read source.
const STATUS_META = {
    discovered: { label: 'Discovered', tone: 'neutral' },
    read: { label: 'Read', tone: 'good' },
    thin: { label: 'Thin page', tone: 'warn' },
    unavailable: { label: 'Unavailable', tone: 'bad' },
    disallowed: { label: 'Blocked by robots', tone: 'bad' },
};
const TIER_META = {
    catalogue: { label: 'Catalogue', icon: BookOpen },
    search: { label: 'Search result', icon: Search },
    crawler: { label: 'Crawled', icon: Link2 },
};
function SourceBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.discovered;
    return <span className={`cg-badge cg-badge-${meta.tone}`}>{meta.label}</span>;
}
function TierBadge({ tier }) {
    const meta = TIER_META[tier] || TIER_META.search;
    const Icon = meta.icon;
    return <span className="cg-badge cg-badge-tier"><Icon aria-hidden="true" />{meta.label}</span>;
}

// Reviewed accounts as a vertical evidence timeline.
function EvidenceTimeline({ variants, reports, onRemove, busy }) {
    if (!variants.length) return <p className="cg-inline-note">No reviewed accounts yet. Research the role, review an extracted account, or add your own notes.</p>;
    return <ol className="cg-timeline-list">{variants.map(v => {
        const report = reports.find(r => r.id === v.id);
        return <li key={v.id} className="cg-timeline-item">
            <span className="cg-timeline-dot" aria-hidden="true" />
            <div className="cg-timeline-body">
                <div className="cg-timeline-head">
                    <h3>{report?.title || 'Interview account'}</h3>
                    <span className="cg-badge cg-badge-good"><ShieldCheck aria-hidden="true" /> Reviewed by you</span>
                </div>
                <ExternalLink href={v.sourceUrl}>Original source</ExternalLink>
                <small>{v.sourceType === 'firsthand' ? 'Candidate report' : 'Source statement'} · {v.freshness.replaceAll('_', ' ')} · partial account</small>
                <ol className="cg-timeline-stages">{v.stages.map(s => <li key={s.key}>{s.evidenceSpan}</li>)}</ol>
                <button className="cg-text-btn" disabled={busy} onClick={() => onRemove(v.id)}>Remove this account</button>
            </div>
        </li>;
    })}</ol>;
}

// Visible progress while research runs. We cannot observe server-side stage
// completion, so this shows an honest elapsed timer and the real pipeline steps
// rather than a fabricated per-step percentage.
function ResearchProgress() {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, []);
    const steps = [
        { icon: Search, label: 'Search & catalogue discovery', detail: 'Finding official pages, engineering blogs and candidate accounts for this exact role.' },
        { icon: Globe, label: 'Reading permitted pages', detail: 'robots.txt is checked before every fetch; login-walled and paywalled pages are never read.' },
        { icon: FileText, label: 'Extracting with exact quotes', detail: 'A stage is kept only when the AI can quote the source word-for-word.' },
    ];
    return <section className="cg-surface cg-research-progress" role="status" aria-live="polite">
        <div className="cg-section-head">
            <div><span className="cg-label">RESEARCH IN PROGRESS</span><h2>Gathering sources for this role</h2></div>
            <span className="cg-badge cg-badge-neutral"><RefreshCw className="cg-spin" aria-hidden="true" /> {seconds}s</span>
        </div>
        <ol className="cg-progress-steps">{steps.map((s, i) => <li key={s.label} style={{ animationDelay: `${i * 1.4}s` }}><span className="cg-progress-icon">{createElement(s.icon, { 'aria-hidden': true })}</span><div><b>{s.label}</b><small>{s.detail}</small></div></li>)}</ol>
        <small className="cg-muted">This usually takes 15–60 seconds. Your job is already saved — you can leave this tab and return.</small>
    </section>;
}

// Scraping transparency: shows exactly where research data comes from.
// Pipeline stages + per-host chips colored by outcome (read / link-only / robots-blocked).
function ScrapeTransparency({ research, busy }) {
    if (!research) return null;
    const sources = research.sources || [];
    const documents = research.documents || [];
    const readUrls = new Set(documents.map(d => d.url).filter(Boolean));
    const hosts = new Map();
    for (const s of sources) {
        let hostname;
        try { hostname = new URL(s.url).hostname; } catch { continue; }
        const entry = hosts.get(hostname) || { hostname, count: 0, read: 0, blocked: 0 };
        entry.count++;
        if (readUrls.has(s.url) || s.status === 'read' || s.status === 'thin') entry.read++;
        if (s.status === 'disallowed' || s.note?.toLowerCase().includes('robots')) entry.blocked++;
        hosts.set(hostname, entry);
    }
    const readCount = [...hosts.values()].reduce((n, h) => n + h.read, 0);
    const blockedCount = [...hosts.values()].reduce((n, h) => n + h.blocked, 0);
    return <section className="cg-surface cg-scrape-panel" aria-label="Where this research comes from">
        <div className="cg-section-head">
            <div><span className="cg-label">RESEARCH TRANSPARENCY</span><h2>Where this data comes from</h2></div>
            {busy && <span className="cg-badge cg-badge-neutral"><RefreshCw className="cg-spin" aria-hidden="true" /> Working…</span>}
        </div>
        <p className="cg-muted">Every source below was collected for this role. Pages are only read when the site's robots.txt permits crawling and the operator has allowlisted the host — everything else stays a link for you to open yourself.</p>
        <div className="cg-scrape-pipeline">
            <div className="cg-scrape-step">
                <span className="cg-scrape-step-icon"><Search aria-hidden="true" /></span>
                <div><b>Search &amp; catalogue discovery</b><small>{sources.length} source{sources.length === 1 ? '' : 's'} found across {hosts.size} site{hosts.size === 1 ? '' : 's'} — official pages, the reviewed catalogue, and site-specific queries</small></div>
            </div>
            <div className="cg-scrape-step">
                <span className="cg-scrape-step-icon"><Globe aria-hidden="true" /></span>
                <div><b>Polite crawl of permitted hosts</b><small>{readCount} page{readCount === 1 ? '' : 's'} read · robots.txt checked before every fetch, rate-limited per host{blockedCount ? ` · ${blockedCount} blocked by robots.txt` : ''}</small></div>
            </div>
            <div className="cg-scrape-step">
                <span className="cg-scrape-step-icon"><FileText aria-hidden="true" /></span>
                <div><b>AI extraction with exact quotes</b><small>{documents.length} document{documents.length === 1 ? '' : 's'} processed — every extracted stage must quote the source text word-for-word; you review before it becomes evidence</small></div>
            </div>
        </div>
        {hosts.size > 0 && <div className="cg-scrape-hosts">
            {[...hosts.values()].map(h => <span key={h.hostname} className="cg-scrape-host" data-read={h.read > 0} data-blocked={h.blocked > 0} title={`${h.count} source${h.count === 1 ? '' : 's'} · ${h.read} read${h.blocked ? ` · ${h.blocked} robots-blocked` : ''}`}>
                {h.read > 0 && !h.blocked ? <CheckCircle2 aria-hidden="true" /> : h.blocked ? <Ban aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                {h.hostname}
            </span>)}
        </div>}
        <small className="cg-muted">X/Twitter is never scraped. Login-walled or paywalled pages are never bypassed — paste your own notes for those.</small>
    </section>;
}

// Synthesized brief panel: calls /api/career-brief with the user's reviewed claims.
function BriefPanel({ job, demo }) {
    const w = workspaceFor(job);
    const [brief, setBrief] = useState(w.brief || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const reviewedCount = w.reports.filter(r => r.confirmed).length;

    const synthesize = async () => {
        if (loading) return;
        setLoading(true); setError('');
        try {
            if (demo) throw new Error('Sign in to synthesize a brief. Your reviewed accounts remain available.');
            const session = await supabase?.auth.getSession();
            if (!session?.data?.session?.access_token) throw new Error('Sign in to synthesize a brief.');
            const claims = w.reports.filter(r => r.confirmed).flatMap(r => r.stages.map(s => ({ id: `${r.id}:${s.key}`, statement: s.evidenceSpan, sourceUrl: r.sourceUrl })));
            const response = await fetch('/api/career-brief', {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.data.session.access_token}` },
                body: JSON.stringify({ company: job.company, role: job.role, jdText: w.jdText, claims }),
                signal: AbortSignal.timeout(30000),
            });
            if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The brief endpoint is not deployed here.');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Synthesis failed.');
            setBrief(result);
        } catch (cause) { setError(cause.message); } finally { setLoading(false); }
    };

    return <section className="cg-surface cg-brief-panel">
        <div className="cg-section-head">
            <div><span className="cg-label">COMPANY BRIEF</span><h2>Synthesized brief</h2></div>
            <button className="cg-secondary" disabled={loading || !reviewedCount} onClick={synthesize}><Sparkles />{loading ? 'Synthesizing…' : 'Synthesize from reviewed accounts'}</button>
        </div>
        <p className="cg-muted">Combines your reviewed accounts into one grounded brief. Every line cites the account it rests on; disagreements and unknowns stay visible. This is unverified synthesis, not a confirmed hiring process.</p>
        {!reviewedCount && <div className="cg-notice">Review at least one interview account first. The brief only uses evidence you have checked.</div>}
        {error && <div className="cg-error" role="alert">{error}</div>}
        {brief && <div className="cg-brief-result" data-basis={brief.basis}>
            <div className="cg-brief-meta">
                <span className={`cg-badge ${brief.basis === 'evidence' ? 'cg-badge-good' : 'cg-badge-warn'}`}>{brief.basis === 'evidence' ? 'Evidence-based' : 'JD-based'}</span>
                <small>Generated {new Date(brief.generatedAt).toLocaleString()}</small>
            </div>
            {brief.summary && <p className="cg-brief-summary">{brief.summary}</p>}
            {brief.briefs?.length > 0 && <ul className="cg-brief-lines">{brief.briefs.map((b, i) => <li key={i}><span className="cg-brief-cite">{b.claimId}</span>{b.statement}</li>)}</ul>}
            {brief.unknowns?.length > 0 && <details className="cg-disclosure"><summary>Unknowns · {brief.unknowns.length}</summary><ul>{brief.unknowns.map((u, i) => <li key={i}>{u}</li>)}</ul></details>}
        </div>}
    </section>;
}

export default function Research({ job, userId, onUpdate, onResearch, busy, researching, demo }) {
    const w = workspaceFor(job);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const blank = { title: '', url: '', type: 'firsthand', eventDate: '', stages: '', level: '', location: '', channel: '', confirmed: false };
    const [draft, setDraft] = useState(blank);
    const process = useMemo(() => processFor(job, userId), [job, userId]);
    const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));

    const save = async e => {
        e.preventDefault(); setError('');
        try {
            if (draft.type !== 'recruiter_private' && !safeLink(draft.url)) throw new Error('Add the source URL so you can return to the account.');
            if (!draft.confirmed) throw new Error('Review the account before using it in your plan.');
            const stages = draft.stages.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8).map((line, index) => ({ key: `stage-${index}`, label: line.slice(0, 80), evidenceSpan: line, aiPolicy: 'unknown' }));
            if (!stages.length) throw new Error('Write at least one observed assessment or stage.');
            const report = { id: crypto.randomUUID(), title: draft.title, companyId: normalizeCompany(job.company), sourceUrl: draft.url || 'private-recruiter-note', sourceType: draft.type, access: 'read', rights: 'private_context', ownerId: userId, lifecycle: 'published', scope: { roleFamilies: [w.preferences.roleFamily || inferFamily(job.role)], level: draft.level, location: draft.location, channel: draft.channel }, independenceGroup: draft.url ? new URL(draft.url).origin + new URL(draft.url).pathname : `recruiter-${job.id}`, eventAt: draft.type === 'firsthand' && draft.eventDate ? `${draft.eventDate}T00:00:00Z` : null, effectiveAt: draft.type !== 'firsthand' && draft.eventDate ? `${draft.eventDate}T00:00:00Z` : null, coverage: 'partial', stages, confirmed: true };
            // Validate scope/dates before committing. An inapplicable account is kept
            // only if the user chooses matching context instead of silently using it.
            const candidate = { ...job, workspace: { ...w, reports: [...w.reports, report] } };
            const result = processFor(candidate, userId);
            const rejected = result.rejected.find(r => r.id === report.id);
            if (rejected && rejected.reason !== 'duplicate_event') throw new Error(`This account cannot inform this role: ${rejected.reason.replaceAll('_', ' ')}. Check the date and exact role context.`);
            await onUpdate(candidate.workspace, 'Added a reviewed interview account');
            setDraft(blank); setOpen(false);
        } catch (cause) { setError(cause.message); }
    };

    const review = account => { setDraft({ ...blank, title: account.title, url: account.sourceUrl, stages: account.stages.map(s => `${s.label}: ${s.evidenceSpan}`).join('\n') }); setOpen(true); };
    const removeVariant = id => onUpdate({ ...w, reports: w.reports.filter(r => r.id !== id) }, 'Removed an interview account').catch(e => setError(e.message));

    // Classify sources into tiers for badges.
    const tierFor = source => {
        if (source.note?.includes('Catalogue')) return 'catalogue';
        if (source.source === 'crawler' || source.status === 'read' || source.status === 'thin') return 'crawler';
        return 'search';
    };

    return <div className="cg-stack">
        <section className="cg-surface">
            <div className="cg-section-head">
                <div><span className="cg-label">COMPANY & INTERVIEW RESEARCH</span><h2>Research for {job.company}</h2></div>
                <button className="cg-primary" disabled={busy || demo} onClick={onResearch}><Search />{busy ? 'Working…' : w.research ? 'Refresh research' : 'Research this role'}</button>
            </div>
            <p className="cg-muted">We search official pages, the source catalogue and the configured crawl hosts for the exact role and location. One candidate's experience is not a company-wide promise. Search sends the company, role and location to the configured provider; readable sources may be processed by the configured AI provider.</p>
            {demo && <div className="cg-notice">Live research requires sign-in. You can paste a JD, add your own source notes and build a plan in this demo.</div>}
            {w.research?.warnings?.length > 0 && <details className="cg-disclosure"><summary><AlertTriangle aria-hidden="true" /> Research gaps · {w.research.warnings.length} to review</summary>{w.research.warnings.map(text => <p className="cg-inline-note" key={text}>{text}</p>)}</details>}
            {w.research && <small>Last researched {new Date(w.research.generatedAt).toLocaleString()} · {w.research.mode}</small>}
        </section>

        {researching && <ResearchProgress />}

        <ScrapeTransparency research={w.research} busy={busy} />

        <BriefPanel job={job} demo={demo} />

        <section className="cg-surface">
            <div className="cg-section-head">
                <h2>Interview process</h2>
                <button className="cg-secondary" onClick={() => setOpen(!open)}><Plus /> Add an account</button>
            </div>
            {process.confirmFormat && <div className="cg-notice">Confirm the current rounds, date and allowed tools with your recruiter. {process.variants.length ? 'These are separate reported experiences, not one combined interview loop.' : 'No reviewed company process yet. Your plan will be labeled role-based.'}</div>}
            {open && <form className="cg-form cg-inset" onSubmit={save}>
                <h3>Review an interview account</h3>
                <p className="cg-muted">Use your own concise notes. Keep one author and interview event per account; do not combine comments from different candidates.</p>
                <label>Account title<input required maxLength={180} value={draft.title} onChange={e => set('title', e.target.value)} placeholder="e.g. ML campus interview, December 2024" /></label>
                <label>Source link<input type="url" maxLength={2000} value={draft.url} onChange={e => set('url', e.target.value)} placeholder="https://…" /></label>
                <div className="cg-form-grid">
                    <label>Source type<select value={draft.type} onChange={e => set('type', e.target.value)}><option value="firsthand">Candidate's firsthand account</option><option value="official">Published employer guide</option><option value="recruiter_private">My recruiter's instructions</option></select></label>
                    <label>{draft.type === 'firsthand' ? 'Interview event date' : 'Effective / instruction date'}<input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.eventDate} onChange={e => set('eventDate', e.target.value)} /><small>Leave blank if unknown; a repost date is not an interview date.</small></label>
                    <label>Reported level<input maxLength={100} value={draft.level} onChange={e => set('level', e.target.value)} placeholder="Unknown" /></label>
                    <label>Reported job location<input maxLength={200} value={draft.location} onChange={e => set('location', e.target.value)} placeholder="Unknown" /></label>
                    <label>Reported hiring route<select value={draft.channel} onChange={e => set('channel', e.target.value)}><option value="">Unknown</option><option value="campus">Campus</option><option value="direct">Direct application</option><option value="referral">Referral</option></select></label>
                </div>
                <label>Observed stages / assessments<textarea required rows={5} maxLength={2000} value={draft.stages} onChange={e => set('stages', e.target.value)} placeholder="One observed stage per line. Include the task, duration and tool rules when stated." /></label>
                <label className="cg-check"><input type="checkbox" checked={draft.confirmed} onChange={e => set('confirmed', e.target.checked)} required /><span>I read this source, it concerns {job.company} and this role family, and my notes describe reported events or published guidance—not a proposed process. I can use these notes for my private preparation.</span></label>
                {error && <div className="cg-error" role="alert">{error}</div>}
                <div className="cg-actions"><button type="button" className="cg-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="cg-primary" disabled={busy}>Save reviewed account</button></div>
            </form>}
            <EvidenceTimeline variants={process.variants} reports={w.reports} onRemove={removeVariant} busy={busy} />
            {process.rejected.length > 0 && <p className="cg-muted">{process.rejected.length} saved account(s) excluded: {process.rejected.map(r => r.reason.replaceAll('_', ' ')).join(', ')}. Check role context and duplicate sources before using them.</p>}
            {!open && error && <div className="cg-error" role="alert">{error}</div>}
            {w.research?.accounts?.map(a => <article className="cg-account" key={a.id}>
                <span className="cg-label">EXTRACTED · NEEDS YOUR REVIEW</span>
                <h3>{a.title}</h3>
                <p>{a.reviewNote}</p>
                <ul>{a.stages.map(s => <li key={s.key}>{s.label}: “{s.evidenceSpan}”</li>)}</ul>
                <button className="cg-secondary" onClick={() => review(a)}>Review this account</button>
            </article>)}
        </section>

        <section className="cg-surface">
            <h2>Source library</h2>
            <p className="cg-muted">Discovery links are not evidence until the relevant account has been read and reviewed. Private or blocked pages need your own notes.</p>
            {w.research?.sources?.length
                ? <div className="cg-source-grid">{w.research.sources.map(s => <article className="cg-source-card" key={s.id} data-status={s.status}>
                    <div className="cg-source-card-head"><TierBadge tier={tierFor(s)} /><SourceBadge status={s.status} /></div>
                    <ExternalLink href={s.url}>{s.title}</ExternalLink>
                    <p>{s.note}</p>
                    <small>{s.status === 'read' ? 'Page read · applicability not verified' : s.status}</small>
                </article>)}</div>
                : <p className="cg-inline-note">No sources collected yet. Research the role or add a source you have read.</p>}
        </section>

        <section className="cg-surface">
            <h2>Job description</h2>
            <p className="cg-muted">Source status: {w.jdText ? 'Pasted by you' : w.research?.jd?.status || 'Not supplied'}</p>
            <details><summary>Read saved requirements</summary><p className="cg-prewrap">{w.jdText || w.research?.jd?.text || 'Edit this job to paste the exact description.'}</p></details>
        </section>
    </div>;
}
