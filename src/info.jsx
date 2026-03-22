/**
 * info.jsx — Career Garden help panel
 * Simple English · Clean design · Same green palette
 */
import React, { useState } from "react";

const CSS = `
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

.inf-bg {
  position:fixed; inset:0; background:rgba(0,0,0,.45);
  backdrop-filter:blur(10px); z-index:500;
  display:flex; align-items:flex-end; justify-content:center;
  animation:fadeIn .16s ease;
  padding:0;
}
@media(min-width:600px){
  .inf-bg { align-items:center; padding:16px; }
}

.inf-sheet {
  background:#fff;
  width:100%; max-width:540px;
  max-height:92vh; overflow:hidden;
  display:flex; flex-direction:column;
  border-radius:22px 22px 0 0;
  box-shadow:0 -8px 40px rgba(0,0,0,.12);
  animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);
}
@media(min-width:600px){
  .inf-sheet {
    border-radius:20px;
    box-shadow:0 20px 60px rgba(0,0,0,.14);
    animation:fadeIn .2s ease;
  }
}

.inf-handle {
  width:36px; height:4px; border-radius:99px;
  background:#e2e8f0; margin:10px auto 0;
  flex-shrink:0;
}
@media(min-width:600px){ .inf-handle { display:none; } }

.inf-top {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 20px 12px; flex-shrink:0; border-bottom:1px solid #f0fdf4;
}
.inf-logo { display:flex; align-items:center; gap:9px; }
.inf-logo-icon { width:32px; height:32px; border-radius:9px; background:#16a34a; display:flex; align-items:center; justify-content:center; font-size:17px; }
.inf-logo-name { font-size:15px; font-weight:800; color:#14532d; letter-spacing:-.03em; font-family:'Poppins',sans-serif; }
.inf-close {
  width:30px; height:30px; border-radius:8px; border:1px solid #dcfce7;
  background:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:#9ca3af; transition:all .14s;
}
.inf-close:hover { background:#f0fdf4; color:#16a34a; }

.inf-tabs {
  display:flex; padding:10px 20px 0; gap:0;
  border-bottom:1px solid #dcfce7; flex-shrink:0;
  overflow-x:auto; scrollbar-width:none;
}
.inf-tabs::-webkit-scrollbar { display:none; }
.inf-tab {
  padding:8px 16px; border:none; background:none;
  font-family:'Poppins',sans-serif; font-size:12.5px; font-weight:600;
  color:#9ca3af; cursor:pointer; white-space:nowrap;
  border-bottom:2px solid transparent; transition:all .16s;
}
.inf-tab:hover { color:#16a34a; }
.inf-tab.on { color:#14532d; border-bottom-color:#16a34a; }

.inf-body { flex:1; overflow-y:auto; padding:18px 20px 28px; }

/* content styles */
.inf-heading { font-size:14px; font-weight:700; color:#14532d; margin-bottom:12px; display:flex; align-items:center; gap:7px; font-family:'Poppins',sans-serif; }
.inf-text { font-size:12.5px; color:#4b5563; line-height:1.7; margin-bottom:14px; font-family:'Poppins',sans-serif; }
.inf-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
@media(max-width:420px){ .inf-grid { grid-template-columns:1fr; } }
.inf-card { background:#f0fdf4; border:1px solid #dcfce7; border-radius:12px; padding:13px; }
.inf-card-title { font-size:11.5px; font-weight:700; color:#15803d; margin-bottom:4px; font-family:'Poppins',sans-serif; display:flex; align-items:center; gap:5px; }
.inf-card-text { font-size:11px; color:#6b7280; line-height:1.6; font-family:'Poppins',sans-serif; }
.inf-stage { display:flex; align-items:flex-start; gap:11px; padding:12px 13px; border-radius:12px; border:1px solid #f1f5f9; margin-bottom:8px; transition:background .12s; }
.inf-stage:hover { background:#f8fafc; }
.inf-stage-icon { font-size:20px; flex-shrink:0; width:34px; text-align:center; }
.inf-stage-name { font-size:13px; font-weight:700; color:#1a2e1a; margin-bottom:2px; font-family:'Poppins',sans-serif; }
.inf-stage-desc { font-size:11.5px; color:#6b7280; line-height:1.6; font-family:'Poppins',sans-serif; }
.inf-tip { display:flex; align-items:flex-start; gap:9px; padding:9px 12px; border-radius:10px; background:#f0fdf4; border:1px solid #dcfce7; margin-bottom:7px; }
.inf-tip-text { font-size:12px; color:#374151; line-height:1.6; font-family:'Poppins',sans-serif; }
.inf-tip-text b { color:#14532d; }
.inf-shortcut { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-radius:10px; background:#f8fafc; border:1px solid #f1f5f9; margin-bottom:6px; }
.inf-shortcut-name { font-size:12.5px; color:#374151; font-weight:500; font-family:'Poppins',sans-serif; }
.inf-keys { display:flex; align-items:center; gap:4px; }
.inf-key { background:#fff; border:1.5px solid #e2e8f0; border-radius:5px; padding:2px 7px; font-size:10.5px; font-weight:700; color:#374151; font-family:'Poppins',sans-serif; box-shadow:0 1px 0 #e2e8f0; }
.inf-rule { height:1px; background:#f0fdf4; margin:14px 0; }
.inf-route { display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f0fdf4; }
.inf-route:last-child { border-bottom:none; }
.inf-route-name { font-size:12px; color:#374151; font-weight:500; font-family:'Poppins',sans-serif; }
.inf-route-url { font-size:10.5px; font-weight:600; color:#16a34a; background:#f0fdf4; border:1px solid #dcfce7; border-radius:5px; padding:2px 8px; font-family:monospace; }
`;

function Tick() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function Close() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export default function Info({ onClose }) {
    const [tab, setTab] = useState("what");

    const tabs = [
        { id: "what", label: "What is this?" },
        { id: "stages", label: "The stages" },
        { id: "tips", label: "Tips" },
        { id: "shortcuts", label: "Shortcuts" },
    ];

    return (
        <>
            <style>{CSS}</style>
            <div className="inf-bg" onClick={e => e.target === e.currentTarget && onClose()}>
                <div className="inf-sheet">
                    <div className="inf-handle" />

                    <div className="inf-top">
                        <div className="inf-logo">
                            <div className="inf-logo-icon">🌳</div>
                            <span className="inf-logo-name">Career Garden</span>
                        </div>
                        <button className="inf-close" onClick={onClose}><Close /></button>
                    </div>

                    <div className="inf-tabs">
                        {tabs.map(t => (
                            <button key={t.id} className={`inf-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
                        ))}
                    </div>

                    <div className="inf-body">

                        {tab === "what" && <>
                            <div className="inf-text">
                                Career Garden is a simple way to keep track of every job you apply for. No more spreadsheets, no more forgotten follow-ups.
                            </div>
                            <div className="inf-grid">
                                {[
                                    { icon: "🌱", title: "Add jobs", text: "Save any job you've applied to or want to apply for." },
                                    { icon: "📋", title: "Move them along", text: "Update the stage as things progress — from saved to offer." },
                                    { icon: "🔍", title: "Search fast", text: "Press ⌘K to find any job or jump to any page instantly." },
                                    { icon: "📊", title: "See your stats", text: "Check how many jobs are at each stage and your reply rate." },
                                    { icon: "📱", title: "Works everywhere", text: "Looks good on your phone, tablet, and desktop." },
                                    { icon: "☁️", title: "Synced", text: "Your data is saved to the cloud. Log in from any device." },
                                ].map(c => (
                                    <div key={c.title} className="inf-card">
                                        <div className="inf-card-title"><span style={{ fontSize: 15 }}>{c.icon}</span>{c.title}</div>
                                        <div className="inf-card-text">{c.text}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="inf-rule" />
                            <div className="inf-heading">🔒 Your data is private</div>
                            {["Only you can see your jobs — we use secure cloud storage.", "We don't show ads or sell your information.", "You can delete everything at any time."].map(t => (
                                <div key={t} className="inf-tip"><Tick /><div className="inf-tip-text">{t}</div></div>
                            ))}
                        </>}

                        {tab === "stages" && <>
                            <div className="inf-text">Every job moves through stages as you go through the process. Update the stage whenever something changes.</div>
                            {[
                                { icon: "🔖", name: "Saved", color: "#1d4ed8", desc: "A job you've bookmarked or want to apply for later." },
                                { icon: "🌱", name: "Applied", color: "#15803d", desc: "You've sent in your application. The ball is in their court." },
                                { icon: "📋", name: "Screening", color: "#6b21a8", desc: "A recruiter reached out or you had a quick first chat." },
                                { icon: "🌿", name: "Interview", color: "#a16207", desc: "You have a real interview lined up or in progress. Make notes!" },
                                { icon: "🌳", name: "Offer", color: "#065f46", desc: "You got an offer! Compare it carefully before deciding." },
                                { icon: "🍂", name: "Rejected", color: "#64748b", desc: "This one didn't work out. That's okay — keep going." },
                            ].map(s => (
                                <div key={s.name} className="inf-stage">
                                    <div className="inf-stage-icon">{s.icon}</div>
                                    <div>
                                        <div className="inf-stage-name" style={{ color: s.color }}>{s.name}</div>
                                        <div className="inf-stage-desc">{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="inf-rule" />
                            <div className="inf-tip"><Tick /><div className="inf-tip-text"><b>To change the stage:</b> click Edit on any job card, then pick the new stage.</div></div>
                        </>}

                        {tab === "tips" && <>
                            <div className="inf-heading">Things that actually help</div>
                            {[
                                { title: "Add jobs right away", text: "Log a job as soon as you apply. Details are easy to forget." },
                                { title: "Use the notes field", text: "Write down who you talked to, what they asked, and what's next." },
                                { title: "Check in every few days", text: "Update stages as things happen so your board stays accurate." },
                                { title: "Watch your reply rate", text: "If under 15%, it might be time to tweak your CV or cover letter." },
                                { title: "Don't leave things in Applied too long", text: "If it's been 2 weeks with no reply, consider following up." },
                                { title: "Track the pay", text: "Add the salary to each job so you can compare offers side by side." },
                                { title: "Use the board view", text: "When you have multiple interviews going on, the board view makes it easy to see everything at a glance." },
                                { title: "Rejections are normal", text: "Most people apply to 20–50 jobs before landing one. Keep going." },
                            ].map(t => (
                                <div key={t.title} className="inf-tip">
                                    <Tick />
                                    <div className="inf-tip-text"><b>{t.title}.</b> {t.text}</div>
                                </div>
                            ))}
                        </>}

                        {tab === "shortcuts" && <>
                            <div className="inf-heading">Keyboard shortcuts</div>
                            {[
                                { name: "Open search / command bar", keys: ["⌘", "K"] },
                                { name: "Close any popup", keys: ["Esc"] },
                                { name: "Move in search results", keys: ["↑", "↓"] },
                                { name: "Pick a search result", keys: ["↵"] },
                            ].map(s => (
                                <div key={s.name} className="inf-shortcut">
                                    <span className="inf-shortcut-name">{s.name}</span>
                                    <div className="inf-keys">
                                        {s.keys.map((k, i) => (
                                            <React.Fragment key={i}>
                                                {i > 0 && <span style={{ color: "#c4d4c4", fontSize: 10, fontFamily: "'Poppins',sans-serif" }}>+</span>}
                                                <span className="inf-key">{k}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="inf-rule" />
                            <div className="inf-heading">Pages you can bookmark</div>
                            {[
                                { name: "All jobs", url: "/dashboard" },
                                { name: "Applied", url: "/dashboard/Applied" },
                                { name: "Interview", url: "/dashboard/Interview" },
                                { name: "Offer", url: "/dashboard/Offer" },
                                { name: "Stats", url: "/dashboard?stats=1" },
                            ].map(r => (
                                <div key={r.url} className="inf-route">
                                    <span className="inf-route-name">{r.name}</span>
                                    <span className="inf-route-url">{r.url}</span>
                                </div>
                            ))}
                        </>}
                    </div>
                </div>
            </div>
        </>
    );
}