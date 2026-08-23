/**
 * Career Garden v7 — maine.jsx
 * Full UI overhaul: icon-first (no emojis except tree), redesigned stats,
 * better responsiveness, plain English, more features. Same green Poppins theme.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";

import { supabase } from "./lib/supabase";
import Info from "./info";
import PrepPage from "./prepage";
// ─── ICONS ────────────────────────────────────────────────────────────────────
const SV = {
    home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    grid: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>`,
    list: `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/>`,
    columns: `<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>`,
    search: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
    trash: `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>`,
    x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    arrowL: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
    extLink: `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
    pin: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
    dollar: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
    barChart: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>`,
    pieChart: `<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>`,
    info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
    chevD: `<polyline points="6 9 12 15 18 9"/>`,
    chevL: `<polyline points="15 18 9 12 15 6"/>`,
    chevR: `<polyline points="9 18 15 12 9 6"/>`,
    menu: `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`,
    logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
    clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    check: `<polyline points="20 6 9 17 4 12"/>`,
    checkCircle: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    xCircle: `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
    alertCircle: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    activity: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
    target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    briefcase: `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
    copy: `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
    bell: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    book: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    trendUp: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
    award: `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>`,
    layers: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
    filter: `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
    mail: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,
    file: `<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>`,
    eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
    star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    chat: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    bookmark: `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`,
    send: `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
    clipboard: `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>`,
    mic: `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>`,
    gift: `<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
    brain: `<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>`,
    xSquare: `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>`,
};

function Ic({ n, size = 16, color = "currentColor", sx }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: "block", flexShrink: 0, ...sx }}
            dangerouslySetInnerHTML={{ __html: SV[n] || "" }} />
    );
}

// ─── STAGES ───────────────────────────────────────────────────────────────────
const STAGES = {
    Saved: { color: "#3b82f6", light: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", bar: "#3b82f6", icon: "bookmark", emoji: "🌱", desc: "Seed planted" },
    Applied: { color: "#22c55e", light: "#f0fdf4", text: "#15803d", border: "#86efac", bar: "#22c55e", icon: "send", emoji: "🪴", desc: "Growing" },
    Screening: { color: "#a855f7", light: "#faf5ff", text: "#6b21a8", border: "#d8b4fe", bar: "#a855f7", icon: "clipboard", emoji: "🌿", desc: "Taking root" },
    Interview: { color: "#f59e0b", light: "#fffbeb", text: "#a16207", border: "#fcd34d", bar: "#f59e0b", icon: "mic", emoji: "🌳", desc: "Branching out" },
    Offer: { color: "#10b981", light: "#ecfdf5", text: "#065f46", border: "#6ee7b7", bar: "#10b981", icon: "gift", emoji: "🎉", desc: "Fully bloomed" },
    Rejected: { color: "#94a3b8", light: "#f8fafc", text: "#64748b", border: "#e2e8f0", bar: "#cbd5e1", icon: "xSquare", emoji: "🍂", desc: "Fallen leaf" },
};
const ALL_STAGES = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected"];
function getS(s) { return STAGES[s] || (s === "Accepted" ? STAGES.Offer : STAGES.Applied); }

function niceDate(d) { if (!d) return "—"; try { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d)) } catch { return d } }
function shortDate(d) { if (!d) return "—"; try { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(d)) } catch { return d } }
function timeAgo(ts) { if (!ts) return ""; const s = Math.floor((Date.now() - new Date(ts)) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }
function daysUntil(d) { if (!d) return null; return Math.ceil((new Date(d) - Date.now()) / 86400000); }

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;height:100%}
body{font-family:'Poppins',sans-serif;background:#f0faf0;color:#0f1f0f;min-height:100%}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:#bbf7d0;border-radius:4px}
button,input,textarea,select{font-family:'Poppins',sans-serif}

:root{
  --g:#16a34a;--gd:#14532d;--gdd:#0d3b1e;
  --gl:#f0fdf4;--gm:#dcfce7;--gb:#bbf7d0;
  --card:#fff;--border:#e2ede2;
  --t:#0f1f0f;--t2:#4a6a4a;--t3:#8aaa8a;
  --sb:248px;
  --ease:cubic-bezier(.22,1,.36,1);
  --sp:cubic-bezier(.34,1.56,.64,1);
  --sh:0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.05);
  --sh2:0 8px 32px rgba(0,0,0,.1);
}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cardIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
@keyframes rowIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes shine{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes bobTree{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fillW{from{width:0}to{width:var(--w)}}

/* LAYOUT */
.shell{display:flex;min-height:100vh}
.main{flex:1;min-width:0;display:flex;flex-direction:column;margin-left:var(--sb);transition:margin-left .3s var(--ease)}
.main.full{margin-left:0}
.backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:98}
.backdrop.on{display:block;animation:fadeIn .2s ease}

/* SIDEBAR ───────────────────────────────── */
.sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--sb);z-index:99;display:flex;flex-direction:column;background:#fff;border-right:1.5px solid var(--border);box-shadow:4px 0 20px rgba(22,163,74,.06);transition:transform .3s var(--ease);overflow:hidden}
.sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#16a34a,#4ade80,#86efac,#4ade80,#16a34a);background-size:300% 100%;animation:shine 5s linear infinite;z-index:2}
.sidebar.off{transform:translateX(-100%)}
@media(max-width:768px){
  .sidebar{transform:translateX(-100%)}
  .sidebar.mob-on{transform:translateX(0)}
  .main,.main.full{margin-left:0!important}
}
.sb-hd{display:flex;align-items:center;gap:10px;padding:18px 16px 16px;border-bottom:1px solid var(--border);flex-shrink:0}
.sb-logo{width:36px;height:36px;border-radius:11px;flex-shrink:0;background:linear-gradient(135deg,#16a34a,#4ade80);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 3px 10px rgba(74,222,128,.3)}
.sb-brand{flex:1;min-width:0}
.sb-brand-name{font-size:14px;font-weight:800;color:var(--gd);letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-brand-sub{font-size:9px;font-weight:600;color:var(--g);letter-spacing:.08em;text-transform:uppercase;margin-top:1px}
.sb-close{width:28px;height:28px;border-radius:8px;border:1px solid var(--border);background:var(--gl);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t3);transition:all .15s;flex-shrink:0}
.sb-close:hover{background:var(--gm);color:var(--gd);border-color:var(--gb)}
.sb-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 10px;scrollbar-width:none}
.sb-nav::-webkit-scrollbar{display:none}
.sb-sec{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--t3);padding:12px 8px 4px;display:block}
.sb-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--t2);transition:all .15s;margin-bottom:2px;position:relative;user-select:none}
.sb-item:hover{background:var(--gl);color:var(--g)}
.sb-item.on{background:linear-gradient(90deg,var(--gl),#e8fdf0);color:var(--gd);border:1px solid var(--gm)}
.sb-item.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,var(--gd),var(--g))}
.sb-ic{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-lbl{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-badge{min-width:20px;height:18px;padding:0 6px;border-radius:99px;font-size:10px;font-weight:700;background:var(--gm);color:var(--gd);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-badge.amber{background:#fef9c3;color:#a16207}
.sb-badge.cmd{background:var(--gl);color:var(--t3);font-family:monospace;font-size:9px;border:1px solid var(--border)}
.sb-badge.offer-badge{background:#dcfce7;color:#065f46}
.sb-badge.muted{background:#f1f5f9;color:#94a3b8}
.sb-div{height:1px;background:var(--border);margin:6px 8px}
.sb-ft{padding:10px 10px 14px;border-top:1px solid var(--border);flex-shrink:0}
.sb-user{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer;transition:background .14s;position:relative}
.sb-user:hover{background:var(--gl)}
.sb-av{width:32px;height:32px;border-radius:9px;flex-shrink:0;overflow:hidden;background:linear-gradient(135deg,#14532d,#16a34a);border:1.5px solid rgba(74,222,128,.28);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#4ade80}
.sb-av img{width:100%;height:100%;object-fit:cover}
.sb-ui{flex:1;min-width:0}
.sb-uname{font-size:12px;font-weight:700;color:var(--t);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-uemail{font-size:10px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-ucaret{color:var(--t3);transition:transform .2s;flex-shrink:0}
.sb-ucaret.open{transform:rotate(180deg)}
.sb-popup{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:#fff;border:1.5px solid var(--border);border-radius:13px;overflow:hidden;box-shadow:0 -4px 24px rgba(0,0,0,.08),0 8px 32px rgba(0,0,0,.06);z-index:999;animation:slideUp .18s var(--sp)}
.sb-popup-hd{padding:10px 14px 9px;border-bottom:1px solid var(--border)}
.sb-popup-name{font-size:12.5px;font-weight:700;color:var(--t)}
.sb-popup-email{font-size:10px;color:var(--t3);word-break:break-all;margin-top:1px}
.sb-popup-btn{display:flex;align-items:center;gap:9px;width:100%;padding:9px 14px;background:none;border:none;text-align:left;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--t2);transition:background .12s}
.sb-popup-btn:hover{background:var(--gl);color:var(--t)}
.sb-popup-btn.red{color:#dc2626}
.sb-popup-btn.red:hover{background:#fef2f2}
.show-sb{position:fixed;top:50%;left:0;transform:translateY(-50%);z-index:90;width:20px;height:60px;background:var(--gd);border:none;border-radius:0 8px 8px 0;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.7);box-shadow:2px 0 12px rgba(0,0,0,.25);transition:all .2s var(--sp)}
.show-sb:hover{width:26px;color:#fff}

/* TOPBAR ──────────────────────────────── */
.topbar{height:56px;display:flex;align-items:center;gap:10px;padding:0 20px;background:rgba(240,250,240,.98);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;flex-shrink:0}
.tb-ham{display:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card);align-items:center;justify-content:center;cursor:pointer;color:var(--t2);flex-shrink:0;transition:all .14s}
.tb-ham:hover{background:var(--gl);color:var(--g)}
.tb-title{font-size:14px;font-weight:700;color:var(--t);letter-spacing:-.01em}
.tb-srch{flex:1;max-width:280px;display:flex;align-items:center;gap:8px;padding:8px 13px;border:1px solid var(--border);border-radius:12px;background:var(--card);cursor:pointer;color:var(--t3);font-size:12px;transition:all .14s}
.tb-srch:hover{border-color:var(--gb)}
.tb-sk{margin-left:auto;font-size:10px;font-weight:600;color:var(--t3);background:var(--gl);border:1px solid var(--border);padding:2px 6px;border-radius:5px}
.tb-r{display:flex;align-items:center;gap:6px;margin-left:auto}
.tb-btn{width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t2);transition:all .14s;flex-shrink:0}
.tb-btn:hover{background:var(--gl);color:var(--g);border-color:var(--gb)}
.tb-btn.on{background:var(--gm);color:var(--gd);border-color:var(--gb)}
.tb-rel{position:relative}
.tb-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:2px solid #f0faf0}
.add-btn{display:flex;align-items:center;gap:7px;padding:8px 18px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--gdd),var(--g));color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(20,83,45,.3);transition:all .2s var(--sp);white-space:nowrap}
.add-btn:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(20,83,45,.4)}
.add-lbl{white-space:nowrap}

/* PAGE ──────────────────────────────────── */
.page{padding:20px 22px 100px;max-width:1280px;width:100%}
.pg-hero{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;gap:12px;flex-wrap:wrap}
.pg-greet{font-size:clamp(18px,2.3vw,24px);font-weight:800;color:var(--t);letter-spacing:-.04em}
.pg-greet span{color:var(--g)}
.pg-sub{font-size:12.5px;color:var(--t3);margin-top:3px}
.pg-sub b{color:var(--t2);font-weight:600}

/* STAGE STRIP ───────────────────────────── */
.strip{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:22px;animation:fadeUp .4s var(--ease) both}
.scard{
  background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:16px 13px;cursor:pointer;
  transition:all .25s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.04);
  position:relative;overflow:hidden;
}
.scard::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0) 60%,rgba(255,255,255,.4) 100%);
  pointer-events:none;
}
.scard:hover{
  transform:translateY(-4px) scale(1.02);
  box-shadow:0 8px 28px rgba(0,0,0,.1);
  border-color:var(--gb);
}
.scard-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px}
.scard-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;line-height:1}
.scard-num{font-size:24px;font-weight:900;letter-spacing:-.06em;line-height:1;margin-top:1px}
.scard-lbl{font-size:11px;font-weight:700;margin-top:2px}
.scard-desc{font-size:9px;color:var(--t3);margin-top:1px;font-style:italic}
.scard-bar{height:3px;border-radius:99px;background:rgba(0,0,0,.06);margin-top:10px;overflow:hidden}
.scard-fill{height:100%;border-radius:99px;transition:width 1.2s var(--ease)}

/* TOOLBAR ───────────────────────────────── */
.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;animation:fadeUp .4s .05s var(--ease) both}
.tbl{display:flex;align-items:center;gap:6px;flex:1;flex-wrap:wrap;min-width:0}
.tbr{display:flex;align-items:center;gap:6px;flex-shrink:0}
.flt{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:99px;border:1.5px solid var(--border);background:var(--card);font-size:11.5px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .16s var(--sp);white-space:nowrap}
.flt:hover{border-color:var(--gb);color:var(--g);transform:translateY(-1px)}
.flt.on{background:var(--gdd);color:#fff;border-color:var(--gdd)}
.qs{position:relative;display:flex;align-items:center}
.qs-ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;display:flex}
.qs input{padding:7px 13px 7px 32px;border:1.5px solid var(--border);border-radius:12px;font-size:12px;background:var(--card);color:var(--t);outline:none;transition:all .18s;width:175px}
.qs input:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(22,163,74,.1);width:220px}
.qs input::placeholder{color:var(--t3)}
.sort-sel{padding:7px 12px;border:1.5px solid var(--border);border-radius:12px;font-size:12px;font-weight:600;color:var(--t2);background:var(--card);cursor:pointer;outline:none}
.vtabs{display:flex;gap:2px;background:var(--gl);border:1.5px solid var(--border);border-radius:10px;padding:2px}
.vtab{padding:5px 9px;border-radius:8px;border:none;background:none;cursor:pointer;color:var(--t3);transition:all .14s;display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600}
.vtab.on{background:var(--card);color:var(--gd);box-shadow:0 1px 4px rgba(0,0,0,.08)}

/* SECTION HEADER ──────────────────────── */
.sec-hd{display:flex;align-items:center;gap:8px;margin:20px 0 10px}
.sec-hd-lbl{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:var(--t);background:var(--card);border:1px solid var(--border);padding:4px 12px 4px 8px;border-radius:99px;box-shadow:var(--sh)}
.sec-hd-n{font-size:11.5px;color:var(--t3);font-weight:500}
.sec-hd-line{flex:1;height:1px;background:var(--border)}

/* JOB CARDS ─────────────────────────────── */
.jgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.jcard{
  background:var(--card);border:1px solid var(--border);border-radius:20px;
  overflow:hidden;cursor:pointer;
  transition:all .25s cubic-bezier(.34,1.56,.64,1);
  display:flex;flex-direction:column;
  box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.04);
  position:relative;
}
.jcard:hover{
  transform:translateY(-6px) scale(1.015);
  box-shadow:0 12px 40px rgba(0,0,0,.1),0 4px 12px rgba(0,0,0,.06);
  border-color:var(--gb);
}
.jcard-accent{
  position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--jc-from,#16a34a),var(--jc-to,#4ade80));
  opacity:.85;
}
.jcard-body{padding:16px;flex:1}
.jcard-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:11px}
.jcard-pill{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:99px;
  font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  border:1px solid transparent;
}
.jcard-time{font-size:10px;color:var(--t3);font-weight:500;white-space:nowrap}
.jcard-co{
  font-size:15px;font-weight:800;color:var(--t);
  letter-spacing:-.025em;margin-bottom:3px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.jcard-role{
  font-size:12px;color:var(--t2);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  margin-bottom:12px;font-weight:500;
}
.jcard-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;border-radius:8px;
  background:var(--gl);border:1px solid var(--border);
  font-size:10px;font-weight:500;color:var(--t2);white-space:nowrap;
}
.chip.warn{background:#fff7ed;border-color:#fed7aa;color:#c2410c}
.jcard-note{
  font-size:10.5px;color:var(--t3);line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  background:var(--gl);border-radius:8px;padding:8px 10px;border:1px solid var(--border);
}
.jcard-ft{
  display:flex;gap:7px;padding:10px 14px 13px;
  border-top:1px solid var(--gl);background:linear-gradient(to bottom,#fff,var(--gl));
}
.jcard-ebtn{
  flex:1;padding:8px;border-radius:10px;border:1px solid var(--border);
  background:#fff;font-size:11.5px;font-weight:600;cursor:pointer;
  color:var(--t2);transition:all .14s;
  display:flex;align-items:center;justify-content:center;gap:5px;
}
.jcard-ebtn:hover{background:var(--gm);border-color:var(--gb);color:var(--gd)}
.jcard-dbtn{
  padding:8px 10px;border-radius:10px;border:1px solid #fee2e2;
  background:#fff;color:#dc2626;cursor:pointer;
  transition:all .14s;display:flex;align-items:center;justify-content:center;
}
.jcard-dbtn:hover{background:#fef2f2;border-color:#fca5a5}

/* LIST VIEW ─────────────────────────────── */
.jlist{display:flex;flex-direction:column;gap:6px}
.jrow{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:12px 15px;cursor:pointer;transition:all .18s var(--sp);box-shadow:var(--sh)}
.jrow:hover{transform:translateX(3px);box-shadow:var(--sh2);border-color:var(--gb)}
.jrow-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.jrow-co{font-size:13.5px;font-weight:700;color:var(--t);min-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}
.jrow-role{font-size:12.5px;color:var(--t2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.jrow-loc{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:3px;white-space:nowrap}
.jrow-pill{padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap;display:flex;align-items:center;gap:4px;flex-shrink:0}
.jrow-date{font-size:11px;color:var(--t3);white-space:nowrap;display:flex;align-items:center;gap:4px;flex-shrink:0}
.jrow-acts{display:flex;gap:5px;flex-shrink:0}
.jrow-e{padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .12s}
.jrow-e:hover{background:var(--gl);border-color:var(--gb)}
.jrow-d{padding:5px 7px;border-radius:8px;border:1px solid #fee2e2;background:#fff;color:#dc2626;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s}
.jrow-d:hover{background:#fef2f2}

/* BOARD VIEW ────────────────────────────── */
.board-scroll{overflow-x:auto;padding-bottom:10px}
.board{display:flex;gap:12px;align-items:flex-start;min-width:max-content}
.bcol{width:218px;flex-shrink:0;background:var(--gl);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.bcol-hd{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.bcol-ic{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bcol-name{font-size:12px;font-weight:700;color:var(--t);flex:1}
.bcol-n{background:var(--card);border:1px solid var(--border);border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--t3)}
.bcol-body{padding:9px;display:flex;flex-direction:column;gap:7px;min-height:60px}
.bitem{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:11px;cursor:pointer;transition:all .2s var(--sp);box-shadow:var(--sh)}
.bitem:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
.bitem-co{font-size:13px;font-weight:700;color:var(--t);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
.bitem-role{font-size:11px;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:9px;font-weight:500}
.bitem-ft{display:flex;align-items:center;justify-content:space-between}
.bitem-date{font-size:9.5px;color:var(--t3);display:flex;align-items:center;gap:3px}
.bitem-sal{font-size:10px;font-weight:600;color:var(--g);background:var(--gl);padding:2px 7px;border-radius:6px}
.bcol-empty{text-align:center;padding:18px 8px;font-size:11.5px;color:var(--t3)}

/* REMINDERS ─────────────────────────────── */
.reminders{background:linear-gradient(135deg,#fffbeb,#fef9c3);border:1.5px solid #fcd34d;border-radius:14px;padding:14px 16px;margin-bottom:18px;animation:fadeUp .35s var(--ease) both}
.rem-title{font-size:12.5px;font-weight:700;color:#a16207;margin-bottom:10px;display:flex;align-items:center;gap:7px}
.rem-item{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(252,211,77,.38);cursor:pointer;transition:opacity .14s}
.rem-item:last-child{border-bottom:none;padding-bottom:0}
.rem-item:hover{opacity:.75}
.rem-ic{width:28px;height:28px;border-radius:8px;background:#fef9c3;border:1px solid #fcd34d;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rem-txt{font-size:12.5px;color:var(--t);flex:1;font-weight:500}
.rem-txt b{font-weight:700}
.rem-days{font-size:11px;font-weight:700;color:#d97706}

/* DETAIL PAGE ───────────────────────────── */
.detail{animation:fadeUp .3s var(--ease) both}
.det-back{display:inline-flex;align-items:center;gap:7px;color:var(--g);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:18px;background:var(--card);border:1px solid var(--border);padding:7px 14px;border-radius:99px;transition:all .15s var(--sp);box-shadow:var(--sh)}
.det-back:hover{background:var(--gl);border-color:var(--gb);transform:translateX(-2px)}
.det-card{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--sh2)}
.det-banner{padding:24px 26px 20px;border-bottom:1px solid var(--gl);display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.det-co{font-size:clamp(18px,2.5vw,26px);font-weight:900;color:var(--t);letter-spacing:-.04em;margin-bottom:4px}
.det-role{font-size:14px;color:var(--g);font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.det-pills{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.det-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:99px;font-size:11.5px;font-weight:700;border:1.5px solid}
.det-pdot{width:6px;height:6px;border-radius:50%}
.det-acts{display:flex;gap:7px;flex-wrap:wrap}
.det-act{padding:8px 14px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;transition:all .16s;display:flex;align-items:center;gap:6px}
.a-e{background:var(--card);border:1px solid var(--border);color:var(--t2)}.a-e:hover{background:var(--gl)}
.a-l{background:var(--gl);border:1px solid var(--border);color:var(--gd)}.a-l:hover{background:var(--gm)}
.a-d{background:#fff;border:1px solid #fee2e2;color:#dc2626}.a-d:hover{background:#fef2f2}
.a-p{background:linear-gradient(135deg,var(--gdd),var(--g));color:#fff;border:none;box-shadow:0 2px 8px rgba(20,83,45,.25)}.a-p:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(20,83,45,.38)}
.det-stage-row{padding:14px 26px;border-bottom:1px solid var(--gl)}
.det-stage-lbl{font-size:10.5px;font-weight:700;color:var(--t3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:9px}
.det-stage-btns{display:flex;gap:7px;flex-wrap:wrap}
.det-sgbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;transition:all .16s}
.det-grid{padding:20px 26px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.df label{display:block;font-size:10px;font-weight:700;color:var(--g);letter-spacing:.09em;text-transform:uppercase;margin-bottom:5px}
.df p{font-size:13.5px;color:var(--t);font-weight:500;display:flex;align-items:center;gap:6px}
.df a{color:var(--g);text-decoration:underline;text-underline-offset:3px;word-break:break-all}
.df.wide{grid-column:1/-1}
.notes-box{background:var(--gl);border:1px solid var(--border);border-radius:12px;padding:14px 16px;font-size:13px;color:var(--t);line-height:1.75;min-height:64px;white-space:pre-wrap}
.copy-row{display:flex;align-items:center;gap:8px}
.copy-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;transition:all .13s;flex-shrink:0}
.copy-btn:hover{background:var(--gl)}
.copy-btn.ok{background:var(--gm);color:var(--gd);border-color:var(--gb)}
.timeline{display:flex;flex-direction:column}
.tl-row{display:flex;gap:12px;position:relative;padding-bottom:14px}
.tl-row:last-child{padding-bottom:0}
.tl-row::before{content:'';position:absolute;left:7px;top:14px;bottom:0;width:1px;background:var(--border)}
.tl-row:last-child::before{display:none}
.tl-dot{width:15px;height:15px;border-radius:50%;border:2px solid var(--gb);background:var(--card);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;z-index:1}
.tl-main{font-size:12.5px;font-weight:600;color:var(--t);margin-bottom:2px}
.tl-when{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:4px}

/* ─── STATS PAGE ────────────────────────── */
.stats{animation:fadeUp .35s var(--ease) both}
.stats-hd{margin-bottom:20px}
.stats-ttl{font-size:clamp(18px,2.2vw,24px);font-weight:900;color:var(--t);letter-spacing:-.04em}
.stats-sub2{font-size:12.5px;color:var(--t3);margin-top:3px}

/* pipeline tracker */
.pipeline{background:linear-gradient(135deg,var(--gdd) 0%,#1a4a1a 100%);border-radius:16px;padding:22px 24px;box-shadow:var(--sh2);margin-bottom:20px}
.pipe-ttl{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px}
.pipe-sub{font-size:11.5px;color:rgba(255,255,255,.45);margin-bottom:20px}
.pipe-steps{display:flex;align-items:flex-start;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.pipe-steps::-webkit-scrollbar{display:none}
.pipe-step{flex:1;min-width:62px;display:flex;flex-direction:column;align-items:center;position:relative}
.pipe-step::after{content:'';position:absolute;top:15px;left:calc(50% + 16px);right:calc(-50% + 16px);height:2px;background:rgba(255,255,255,.1)}
.pipe-step:last-child::after{display:none}
.pipe-node{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);margin-bottom:6px;position:relative;z-index:1;transition:all .3s}
.pipe-node.has{background:rgba(22,163,74,.35);border-color:#4ade80}
.pipe-node.top{background:#16a34a;border-color:#4ade80;box-shadow:0 2px 12px rgba(22,163,74,.5)}
.pipe-name{font-size:9.5px;font-weight:600;color:rgba(255,255,255,.38);text-align:center}
.pipe-name.has{color:rgba(255,255,255,.72)}
.pipe-name.top{color:#fff}
.pipe-cnt{font-size:10px;font-weight:700;color:#4ade80;margin-top:2px}

/* kpi cards */
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;position:relative;overflow:hidden;box-shadow:var(--sh);transition:all .22s var(--sp)}
.kpi:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
.kpi-top-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0}
.kpi-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.kpi-val{font-size:28px;font-weight:900;letter-spacing:-.06em;line-height:1;margin-bottom:4px}
.kpi-lbl{font-size:12px;font-weight:600;color:var(--t2)}
.kpi-sub{font-size:10.5px;color:var(--t3);margin-top:2px}

/* charts grid */
.charts-g{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:14px;margin-bottom:20px}
.cbox{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:var(--sh)}
.cbox-ttl{font-size:13.5px;font-weight:700;color:var(--t);margin-bottom:2px;display:flex;align-items:center;gap:7px}
.cbox-sub{font-size:11.5px;color:var(--t3);margin-bottom:16px}
.donut-wrap{display:flex;align-items:center;gap:18px}
.donut-legend{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.dleg{display:flex;align-items:center;gap:7px;font-size:11.5px}
.dleg-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.dleg-lbl{flex:1;color:var(--t2);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dleg-n{font-weight:700;color:var(--t)}
.funnel{display:flex;flex-direction:column;gap:9px}
.funnel-row{display:flex;align-items:center;gap:10px}
.funnel-ic{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.funnel-lbl{font-size:11.5px;font-weight:600;color:var(--t2);width:72px;flex-shrink:0}
.funnel-track{flex:1;height:9px;background:var(--gl);border-radius:99px;overflow:hidden}
.funnel-fill{height:100%;border-radius:99px;transition:width 1.2s var(--ease)}
.funnel-n{font-size:12px;font-weight:700;color:var(--t);width:20px;text-align:right}
.funnel-pct{font-size:10.5px;color:var(--t3);width:32px;text-align:right}
.bars{display:flex;align-items:flex-end;gap:8px;height:110px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.bar-val{font-size:10px;font-weight:700}
.bar-body{width:100%;border-radius:5px 5px 0 0;min-height:4px;transition:height 1.1s var(--ease)}
.bar-lbl{font-size:9px;color:var(--t3);text-align:center;font-weight:600}
.spark-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
.sbox{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:var(--sh)}
.spark-bars{display:flex;align-items:flex-end;gap:5px;height:72px;margin-top:12px}
.spark-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.spark-bar{width:100%;border-radius:4px 4px 0 0;background:var(--gm);min-height:3px;transition:height .9s var(--ease)}
.spark-bar.now{background:var(--g)}
.spark-lbl{font-size:8.5px;color:var(--t3);font-weight:600}
.activity-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:var(--sh)}
.act-ttl{font-size:13.5px;font-weight:700;color:var(--t);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.act-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--gl)}
.act-item:last-child{border-bottom:none;padding-bottom:0}
.act-ic{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--border)}
.act-txt{font-size:12.5px;color:var(--t2);line-height:1.5}
.act-txt b{color:var(--t);font-weight:700}
.act-when{font-size:10.5px;color:var(--t3);margin-top:2px;display:flex;align-items:center;gap:3px}

/* ─── LEARN PAGE ──────────────────────── */
.learn{animation:fadeUp .35s var(--ease) both}
.learn-hd{margin-bottom:20px}
.learn-ttl{font-size:clamp(18px,2.2vw,24px);font-weight:900;color:var(--t);letter-spacing:-.04em}
.learn-sub{font-size:12.5px;color:var(--t3);margin-top:3px}
.learn-bar{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px 14px;box-shadow:var(--sh)}
.learn-iw{position:relative;flex:1;min-width:200px}
.learn-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t3);display:flex;pointer-events:none}
.learn-inp{width:100%;padding:9px 14px 9px 36px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;background:var(--gl);color:var(--t);outline:none;transition:all .16s}
.learn-inp:focus{border-color:var(--g);background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
.learn-inp::placeholder{color:var(--t3)}
.learn-cats{display:flex;gap:6px;flex-wrap:wrap}
.lcat{padding:6px 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--card);font-size:11.5px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .15s var(--sp)}
.lcat:hover{border-color:var(--gb);color:var(--g);transform:translateY(-1px)}
.lcat.on{background:var(--gdd);color:#fff;border-color:var(--gdd)}
.learn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.lcard{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .22s var(--sp);display:flex;flex-direction:column;text-decoration:none;box-shadow:var(--sh)}
.lcard:hover{transform:translateY(-4px);box-shadow:var(--sh2);border-color:var(--gb)}
.lcard-img{height:96px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.lcard-img-ic{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.9);box-shadow:0 4px 16px rgba(0,0,0,.1)}
.lcard-badge{position:absolute;top:9px;right:9px;padding:3px 9px;border-radius:99px;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.lcard-body{padding:14px;flex:1;display:flex;flex-direction:column}
.lcard-cat{font-size:9.5px;font-weight:700;color:var(--g);letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
.lcard-ttl{font-size:13.5px;font-weight:700;color:var(--t);line-height:1.4;margin-bottom:6px;flex:1}
.lcard-desc{font-size:11.5px;color:var(--t3);line-height:1.6;margin-bottom:11px}
.lcard-ft{display:flex;align-items:center;justify-content:space-between}
.lcard-src{font-size:10.5px;color:var(--t3);font-weight:600}
.lcard-time{font-size:10.5px;color:var(--t3);display:flex;align-items:center;gap:4px}
.learn-empty{text-align:center;padding:56px 20px;color:var(--t3);font-size:13.5px}
.learn-sug{background:linear-gradient(135deg,var(--gl),#e8fde8);border:1px solid var(--border);border-radius:13px;padding:12px 16px;margin-bottom:18px;font-size:12.5px;color:var(--t2);display:flex;align-items:center;gap:8px}
.learn-sug b{color:var(--gd)}

/* EMPTY ─────────────────────────────────── */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:45vh;text-align:center;gap:10px;animation:fadeUp .4s var(--ease) both}
.empty-tree{font-size:64px;animation:bobTree 5s ease-in-out infinite;line-height:1;margin-bottom:4px}
.empty-ttl{font-size:22px;font-weight:800;color:var(--t);letter-spacing:-.03em}
.empty-desc{font-size:13.5px;color:var(--t3);max-width:300px;line-height:1.65}
.empty-btn{display:flex;align-items:center;gap:7px;padding:12px 28px;background:linear-gradient(135deg,var(--gdd),var(--g));color:#fff;border:none;border-radius:99px;font-size:13.5px;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 4px 16px rgba(20,83,45,.3);transition:all .22s var(--sp)}
.empty-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(20,83,45,.42)}

/* TOASTS ──────────────────────────────── */
.toasts{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:6px;z-index:9999;pointer-events:none}
.toast{display:flex;align-items:center;gap:8px;padding:10px 16px 10px 12px;border-radius:12px;font-size:13px;font-weight:600;min-width:200px;max-width:320px;box-shadow:0 8px 24px rgba(0,0,0,.14);animation:toastIn .3s var(--sp) both}
.toast.ok{background:var(--gdd);color:#fff}
.toast.err{background:#dc2626;color:#fff}
.toast.info{background:#1a2e1a;color:#fff}
.toast.warn{background:#d97706;color:#fff}

/* COMMAND PALETTE ─────────────────────── */
.cp-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1001;display:flex;align-items:flex-start;justify-content:center;padding-top:clamp(60px,10vh,120px);animation:fadeIn .16s ease}
.cp-box{background:#fff;border-radius:18px;width:calc(100% - 32px);max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,.2);border:1.5px solid var(--border);overflow:hidden;animation:pop .22s var(--sp)}
.cp-row{display:flex;align-items:center;gap:9px;padding:14px 16px;border-bottom:1px solid var(--border)}
.cp-inp{flex:1;border:none;font-size:14.5px;font-weight:500;color:var(--t);outline:none;background:none}
.cp-inp::placeholder{color:var(--t3)}
.cp-esc{background:var(--gl);border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:10.5px;font-weight:700;color:var(--g);cursor:pointer}
.cp-list{max-height:320px;overflow-y:auto}
.cp-sec{padding:8px 14px 3px;font-size:9.5px;font-weight:700;color:var(--t3);letter-spacing:.1em;text-transform:uppercase}
.cp-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s}
.cp-item:hover,.cp-item.hi{background:var(--gl)}
.cp-ic{width:30px;height:30px;border-radius:9px;background:var(--gl);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cp-main{font-size:13.5px;font-weight:700;color:var(--t)}
.cp-sub{font-size:11px;color:var(--t3)}
.cp-tag{margin-left:auto;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700}
.cp-empty{padding:28px;text-align:center;color:var(--t3);font-size:13.5px}
.cp-ft{padding:9px 14px;border-top:1px solid var(--gl);display:flex;gap:14px}
.cp-hint{font-size:10.5px;color:var(--t3);display:flex;align-items:center;gap:4px}
.cp-hint kbd{background:var(--gl);border:1px solid var(--border);border-radius:5px;padding:2px 6px;font-size:9.5px;font-weight:700;color:var(--g)}

/* MODAL ───────────────────────────────── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .18s ease}
.modal{background:#fff;border-radius:22px;padding:28px 24px;width:100%;max-width:500px;box-shadow:0 20px 56px rgba(0,0,0,.16);border:1.5px solid var(--border);animation:pop .28s var(--sp);max-height:94vh;overflow-y:auto}
.modal-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
.modal-ttl{font-size:18px;font-weight:800;color:var(--t);letter-spacing:-.03em}
.modal-sub{font-size:11.5px;color:var(--t3);margin-top:2px}
.modal-cls{background:none;border:none;cursor:pointer;color:var(--t3);display:flex;padding:2px;transition:color .12s}
.modal-cls:hover{color:var(--t)}
.m-tabs{display:flex;background:var(--gl);border-radius:11px;padding:3px;gap:2px;margin-bottom:18px;border:1px solid var(--border)}
.m-tab{flex:1;padding:8px;border-radius:9px;border:none;font-size:12.5px;font-weight:600;cursor:pointer;background:none;color:var(--t3);transition:all .14s}
.m-tab.on{background:#fff;color:var(--gd);box-shadow:0 2px 6px rgba(0,0,0,.08)}
.m-form{display:flex;flex-direction:column;gap:14px}
.fl{display:block;font-size:10px;font-weight:700;color:var(--g);letter-spacing:.09em;text-transform:uppercase;margin-bottom:5px}
.fi{width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:11px;font-size:13.5px;background:#fafffe;color:var(--t);outline:none;transition:all .16s}
.fi:focus{border-color:var(--g);background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
.fi::placeholder{color:var(--t3)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stages-g{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.sg-btn{padding:10px 7px;border-radius:11px;border:1.5px solid var(--border);background:#fff;font-size:11.5px;font-weight:600;cursor:pointer;color:var(--t3);display:flex;align-items:center;justify-content:center;gap:6px;transition:all .17s var(--sp)}
.sg-btn:hover{transform:scale(1.03)}
.sg-btn.on{transform:scale(1.04)}
.tips-box{background:var(--gl);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
.tips-ttl{font-size:10px;font-weight:700;color:var(--g);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px}
.tips-row{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--t2);margin-bottom:5px}
.m-ft{display:flex;gap:9px;margin-top:20px}
.m-cancel{flex:1;padding:11px;border-radius:12px;border:1.5px solid var(--border);background:#fff;color:var(--t2);font-size:13.5px;font-weight:600;cursor:pointer;transition:all .14s}
.m-cancel:hover{background:var(--gl)}
.m-save{flex:2;padding:11px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--gdd),var(--g));color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:all .22s var(--sp);box-shadow:0 3px 12px rgba(20,83,45,.28)}
.m-save:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(20,83,45,.4)}
.m-save:disabled{opacity:.4;pointer-events:none}

/* MOBILE BOTTOM NAV ─────────────────── */
.bnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:#fff;border-top:1px solid var(--border);height:60px;padding:0 8px env(safe-area-inset-bottom,0);box-shadow:0 -2px 12px rgba(0,0,0,.06)}
.bnav-inner{display:flex;align-items:center;justify-content:space-around;height:100%}
.bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 8px;border-radius:11px;cursor:pointer;font-size:9.5px;font-weight:600;color:var(--t3);background:none;border:none;transition:all .14s;position:relative;min-width:46px}
.bnav-btn.on{color:var(--gd)}
.bnav-add{background:linear-gradient(135deg,var(--gdd),var(--g))!important;color:#fff!important;border-radius:14px;padding:9px 16px;box-shadow:0 4px 12px rgba(20,83,45,.35)}
.bnav-badge{position:absolute;top:2px;right:4px;min-width:15px;height:15px;background:var(--g);color:#fff;border-radius:99px;font-size:8.5px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 3px}

/* RESPONSIVE ────────────────────────── */
@media(max-width:1200px){.kpi-row{grid-template-columns:repeat(2,1fr)}.charts-g{grid-template-columns:1fr 1fr}}
@media(max-width:1024px){.charts-g{grid-template-columns:1fr}.spark-row{grid-template-columns:1fr}}
@media(max-width:900px){.kpi-row{grid-template-columns:repeat(2,1fr)}.strip{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){
  .tb-ham{display:flex}.bnav{display:block}.add-lbl{display:none}.add-btn{padding:8px 12px}
  .topbar{padding:0 14px}.page{padding:16px 14px 80px}
  .strip{grid-template-columns:repeat(3,1fr)}.det-grid{grid-template-columns:1fr}
  .det-banner{padding:18px 18px 16px}.frow{grid-template-columns:1fr}
  .tb-srch{max-width:220px}.learn-grid{grid-template-columns:1fr}
  .pipe-steps{gap:2px}
}
@media(max-width:600px){
  .kpi-row{grid-template-columns:1fr 1fr}.strip{grid-template-columns:repeat(2,1fr)}
  .jgrid{grid-template-columns:1fr 1fr}.tb-srch{display:none}
  .modal{padding:22px 18px}.stages-g{grid-template-columns:1fr 1fr}
  .spark-row{grid-template-columns:1fr}
}
@media(max-width:400px){
  .jgrid{grid-template-columns:1fr}.strip{grid-template-columns:repeat(3,1fr);gap:6px}
  .scard-num{font-size:18px}.scard{padding:10px 9px}
}
`;

// ─── LEARN RESOURCES ─────────────────────────────────────────────────────────
function getLearnResources(jobs) {
    const roles = [...new Set(jobs.map(j => j.role).filter(Boolean))];
    const top = roles[0] || "";
    const isEng = /engineer|developer|software|fullstack|backend|frontend|data/i.test(top);
    const isDesign = /design|ux|ui/i.test(top);
    const isMgmt = /manager|lead|director|head|vp/i.test(top);
    return [
        { id: 1, type: "article", cat: "Interview Prep", ttl: "How to answer 'Tell me about yourself'", desc: "A simple 3-part answer that works for any job.", src: "Career advice", time: "5 min read", icon: "chat", color: "#dbeafe", tc: { bg: "#dbeafe", t: "#1d4ed8" }, url: "https://www.themuse.com/advice/tell-me-about-yourself-interview-question-answer-examples" },
        { id: 2, type: "video", cat: "Interview Prep", ttl: "STAR method: answer any interview question", desc: "Use Situation→Task→Action→Result every time.", src: "YouTube", time: "8 min", icon: "star", color: "#fef9c3", tc: { bg: "#fef9c3", t: "#a16207" }, url: "https://www.youtube.com/results?search_query=STAR+method+interview+answers" },
        { id: 3, type: "article", cat: "Interview Prep", ttl: "25 questions interviewers always ask", desc: "What they're really testing — and what to say.", src: "Indeed", time: "12 min read", icon: "clipboard", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://www.indeed.com/career-advice/interviewing/top-interview-questions-and-answers" },
        { id: 4, type: "article", cat: "Interview Prep", ttl: "Good questions to ask at the end", desc: "Show you're interested — these leave a strong impression.", src: "LinkedIn", time: "4 min read", icon: "chat", color: "#f3e8ff", tc: { bg: "#f3e8ff", t: "#6b21a8" }, url: "https://www.linkedin.com/pulse/20-smart-questions-ask-end-interview-jeff-haden" },
        { id: 5, type: "article", cat: "Resume & CV", ttl: "Make your CV pass software screening", desc: "Most CVs are filtered by software before a human sees them.", src: "Jobscan", time: "8 min read", icon: "file", color: "#fef9c3", tc: { bg: "#fef9c3", t: "#a16207" }, url: "https://www.jobscan.co/blog/beat-the-ats" },
        { id: 6, type: "tool", cat: "Resume & CV", ttl: "Jobscan — compare your CV to the job post", desc: "Paste your CV + job description. It tells you exactly what to fix.", src: "Free tool", time: "Tool", icon: "search", color: "#dbeafe", tc: { bg: "#dbeafe", t: "#1d4ed8" }, url: "https://www.jobscan.co" },
        { id: 7, type: "article", cat: "Resume & CV", ttl: "Writing a cover letter people actually read", desc: "Most are skipped. Here's what makes yours different.", src: "HBR", time: "6 min read", icon: "file", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://hbr.org/2014/02/how-to-write-a-cover-letter" },
        { id: 8, type: "article", cat: "Networking", ttl: "How to message someone on LinkedIn", desc: "Message templates that get real replies.", src: "LinkedIn", time: "6 min read", icon: "mail", color: "#dbeafe", tc: { bg: "#dbeafe", t: "#1d4ed8" }, url: "https://www.linkedin.com/business/talent/blog/talent-acquisition/how-to-connect-with-someone-on-linkedin" },
        { id: 9, type: "article", cat: "Networking", ttl: "How to follow up after an interview", desc: "A short polite message that shows you're still interested.", src: "Indeed", time: "4 min read", icon: "send", color: "#fef9c3", tc: { bg: "#fef9c3", t: "#a16207" }, url: "https://www.indeed.com/career-advice/interviewing/follow-up-email-after-interview" },
        { id: 10, type: "article", cat: "Salary", ttl: "How to ask for more money without losing the offer", desc: "Step-by-step negotiation that works for everyone.", src: "Glassdoor", time: "7 min read", icon: "dollar", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://www.glassdoor.com/blog/guide/how-to-negotiate-your-salary" },
        { id: 11, type: "tool", cat: "Salary", ttl: "Levels.fyi — see what companies really pay", desc: "Real salary data from real employees. Know your worth.", src: "Free tool", time: "Tool", icon: "barChart", color: "#f3e8ff", tc: { bg: "#f3e8ff", t: "#6b21a8" }, url: "https://www.levels.fyi" },
        { id: 12, type: "tool", cat: "Salary", ttl: "Glassdoor salary search", desc: "Search any job title and see what others earn.", src: "Free tool", time: "Tool", icon: "search", color: "#dbeafe", tc: { bg: "#dbeafe", t: "#1d4ed8" }, url: "https://www.glassdoor.com/Salaries" },
        { id: 13, type: "article", cat: "Mindset", ttl: "How to keep going when job hunting feels hard", desc: "Real advice for staying motivated through rejection.", src: "Medium", time: "5 min read", icon: "zap", color: "#fff7ed", tc: { bg: "#fff7ed", t: "#c2410c" }, url: "https://medium.com/career-advice" },
        { id: 14, type: "article", cat: "Mindset", ttl: "How to handle rejection without losing confidence", desc: "Every rejection is one step closer to the right job.", src: "Indeed", time: "5 min read", icon: "award", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://www.indeed.com/career-advice/finding-a-job/dealing-with-job-rejection" },
        ...(isEng ? [
            { id: 20, type: "course", cat: "Skills", ttl: "Practice coding problems — free", desc: "LeetCode has hundreds of real interview questions.", src: "LeetCode", time: "Ongoing", icon: "layers", color: "#dbeafe", tc: { bg: "#dbeafe", t: "#1d4ed8" }, url: "https://www.leetcode.com" },
            { id: 21, type: "article", cat: "Skills", ttl: "System design interviews — how to prepare", desc: "What big companies test and how to structure answers.", src: "GitHub", time: "10 min read", icon: "layers", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://github.com/donnemartin/system-design-primer" },
        ] : []),
        ...(isDesign ? [
            { id: 22, type: "article", cat: "Skills", ttl: "How to walk through your design portfolio", desc: "What hiring managers look for and what to say.", src: "UX Collective", time: "7 min read", icon: "eye", color: "#f3e8ff", tc: { bg: "#f3e8ff", t: "#6b21a8" }, url: "https://uxdesign.cc/how-to-present-your-portfolio" },
        ] : []),
        ...(isMgmt ? [
            { id: 24, type: "article", cat: "Skills", ttl: "How to answer management interview questions", desc: "'How do you manage people?' — here's what they want to hear.", src: "Indeed", time: "8 min read", icon: "briefcase", color: "#dcfce7", tc: { bg: "#dcfce7", t: "#15803d" }, url: "https://www.indeed.com/career-advice/interviewing/management-interview-questions" },
        ] : []),
    ];
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function DonutChart({ counts, total }) {
    const size = 118, r = 40, cx = 59, cy = 59, circ = 2 * Math.PI * r;
    const visibleStages = ALL_STAGES.filter(s => counts[s] > 0);
    const arcs = visibleStages.map((s, index) => {
        const d = counts[s] / total * circ;
        const off = visibleStages.slice(0, index).reduce((sum, stage) => sum + (counts[stage] / total * circ), 0);
        return { stage: s, d, off, color: STAGES[s].color };
    });
    return (
        <div className="donut-wrap">
            <svg width={size} height={size} style={{ flexShrink: 0 }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f9f0" strokeWidth="15" />
                {arcs.map(a => <circle key={a.stage} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="15" strokeDasharray={`${a.d} ${circ - a.d}`} strokeDashoffset={-a.off + circ / 4} />)}
                <text x={cx} y={cy - 7} textAnchor="middle" fill="#0f1f0f" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 24 }}>{total}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#8aaa8a" style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 10 }}>total jobs</text>
            </svg>
            <div className="donut-legend">
                {ALL_STAGES.filter(s => counts[s] > 0).map(s => (
                    <div key={s} className="dleg">
                        <div className="dleg-dot" style={{ background: STAGES[s].color }} />
                        <span className="dleg-lbl">{s}</span>
                        <span className="dleg-n">{counts[s]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── TOASTS ───────────────────────────────────────────────────────────────────
function useToasts() {
    const [list, setList] = useState([]);
    const add = useCallback((msg, type = "ok") => { const id = Date.now() + Math.random(); setList(l => [...l, { id, msg, type }]); setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3200); }, []);
    const ICONS = { ok: "checkCircle", err: "xCircle", info: "info", warn: "alertCircle" };
    const Stack = () => <div className="toasts">{list.map(t => <div key={t.id} className={`toast ${t.type}`}><Ic n={ICONS[t.type]} size={15} color="#fff" />{t.msg}</div>)}</div>;
    return { add, Stack };
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────
function AddModal({ editing, initialStage = "Applied", onClose, onSave }) {
    const [tab, setTab] = useState("basics");
    const [co, setCo] = useState(editing?.company || "");
    const [role, setRole] = useState(editing?.role || "");
    const [stage, setStage] = useState(editing?.status || initialStage);
    const [day, setDay] = useState(editing?.date || new Date().toISOString().split("T")[0]);
    const [pay, setPay] = useState(editing?.salary || "");
    const [loc, setLoc] = useState(editing?.location || "");
    const [url, setUrl] = useState(editing?.url || "");
    const [note, setNote] = useState(editing?.notes || "");
    const [deadline, setDL] = useState(editing?.deadline || "");
    const [busy, setBusy] = useState(false);

    // Close on Escape
    useEffect(() => {
        const fn = e => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [onClose]);

    async function save() {
        if (!co.trim() || !role.trim()) return;
        setBusy(true);
        await onSave({ id: editing?.id, company: co.trim(), role: role.trim(), status: stage, date: day, salary: pay, location: loc, url, notes: note, deadline });
        setBusy(false);
    }

    const MODAL_CSS = `
    @keyframes cgModalIn{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes cgBgIn{from{opacity:0}to{opacity:1}}
    .cg-modal-bg{
      position:fixed;inset:0;
      background:rgba(0,0,0,.58);
      backdrop-filter:blur(3px);
      z-index:99999;
      display:flex;align-items:center;justify-content:center;
      padding:16px;
      animation:cgBgIn .18s ease both;
      font-family:'Poppins',sans-serif;
    }
    .cg-modal{
      background:#fff;
      border-radius:24px;
      width:100%;max-width:480px;
      box-shadow:0 24px 80px rgba(0,0,0,.22),0 4px 16px rgba(0,0,0,.08);
      border:1.5px solid #e6f5e6;
      animation:cgModalIn .28s cubic-bezier(.34,1.56,.64,1) both;
      max-height:92vh;
      overflow:hidden;
      display:flex;flex-direction:column;
    }
    .cg-mhd{
      padding:22px 24px 18px;
      display:flex;align-items:flex-start;justify-content:space-between;
      background:linear-gradient(135deg,#f0fdf4,#e8fdf0);
      border-bottom:1.5px solid #d1fae5;
      flex-shrink:0;
    }
    .cg-mttl{font-size:19px;font-weight:800;color:#052e16;letter-spacing:-.03em}
    .cg-msub{font-size:12px;color:#4b7a5c;margin-top:2px;font-weight:500}
    .cg-mcls{
      background:rgba(255,255,255,.7);border:1px solid #d1fae5;
      width:30px;height:30px;border-radius:9px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:#4b7a5c;transition:all .14s;flex-shrink:0;
    }
    .cg-mcls:hover{background:#fff;color:#052e16;border-color:#86efac}
    .cg-tabs{
      display:flex;background:#f9fafb;border-bottom:1.5px solid #e6f5e6;
      flex-shrink:0;
    }
    .cg-tab{
      flex:1;padding:13px 8px;background:none;border:none;border-bottom:2.5px solid transparent;
      font-family:'Poppins',sans-serif;font-size:12.5px;font-weight:600;
      color:#9ca3af;cursor:pointer;transition:all .16s;
      display:flex;align-items:center;justify-content:center;gap:6px;
    }
    .cg-tab:hover{color:#16a34a;background:#f0fdf4}
    .cg-tab.on{color:#14532d;border-bottom-color:#16a34a;background:#fff}
    .cg-body{
      padding:22px 24px;
      overflow-y:auto;
      display:flex;flex-direction:column;gap:16px;
      flex:1;
    }
    .cg-lbl{
      display:block;font-size:10px;font-weight:700;
      color:#16a34a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;
    }
    .cg-inp{
      width:100%;padding:12px 14px;
      border:1.5px solid #e2ede2;border-radius:12px;
      font-family:'Poppins',sans-serif;font-size:13.5px;
      background:#fafffe;color:#0f1f0f;outline:none;
      transition:all .18s;
    }
    .cg-inp:focus{border-color:#16a34a;background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
    .cg-inp::placeholder{color:#b4c8b4}
    .cg-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .cg-stages{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .cg-sg{
      padding:10px 6px;border-radius:12px;border:1.5px solid #e2ede2;
      background:#fff;font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;
      cursor:pointer;color:#8aaa8a;
      display:flex;flex-direction:column;align-items:center;gap:4px;
      transition:all .18s cubic-bezier(.34,1.56,.64,1);
    }
    .cg-sg:hover{transform:scale(1.04);border-color:#bbf7d0}
    .cg-sg.on{transform:scale(1.06)}
    .cg-tips{
      background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;
      padding:14px 16px;
    }
    .cg-tips-ttl{font-size:10px;font-weight:800;color:#14532d;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px}
    .cg-tip{display:flex;align-items:center;gap:8px;font-size:12px;color:#166534;margin-bottom:6px;font-weight:500}
    .cg-tip:last-child{margin-bottom:0}
    .cg-ft{
      padding:16px 24px;
      background:#f9fafb;border-top:1.5px solid #e6f5e6;
      display:flex;gap:10px;flex-shrink:0;
    }
    .cg-cancel{
      flex:1;padding:12px;border-radius:12px;
      border:1.5px solid #e2ede2;background:#fff;
      font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;
      color:#4b6a4b;cursor:pointer;transition:all .14s;
    }
    .cg-cancel:hover{background:#f0fdf4;border-color:#bbf7d0}
    .cg-save{
      flex:2;padding:12px;border-radius:12px;border:none;
      background:linear-gradient(135deg,#0d3b1e,#16a34a);
      font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;
      color:#fff;cursor:pointer;
      box-shadow:0 4px 14px rgba(20,83,45,.3);
      transition:all .22s cubic-bezier(.34,1.56,.64,1);
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .cg-save:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(20,83,45,.42)}
    .cg-save:disabled{opacity:.4;pointer-events:none;transform:none}
    `;

    const TAB_ICONS = { basics: "briefcase", more: "dollar", notes: "book" };

    const modal = (
        <>
            <style>{MODAL_CSS}</style>
            <div className="cg-modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="cg-modal" onMouseDown={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="cg-mhd">
                        <div>
                            <div className="cg-mttl">{editing ? "✏️ Edit job" : "🌱 Add a job"}</div>
                            <div className="cg-msub">{editing ? "Update the details below" : "Start tracking a new opportunity"}</div>
                        </div>
                        <button className="cg-mcls" onClick={onClose}><Ic n="x" size={15} /></button>
                    </div>

                    {/* Tabs */}
                    <div className="cg-tabs">
                        {[["basics", "Basics", "briefcase"], ["more", "Details", "dollar"], ["notes", "Notes", "book"]].map(([id, lbl, ic]) => (
                            <button key={id} className={`cg-tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
                                <Ic n={ic} size={13} />{lbl}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="cg-body">
                        {tab === "basics" && <>
                            <div>
                                <label className="cg-lbl">Company name *</label>
                                <input className="cg-inp" placeholder="e.g. Google, Stripe, Notion" value={co} onChange={e => setCo(e.target.value)} autoFocus />
                            </div>
                            <div>
                                <label className="cg-lbl">Job title *</label>
                                <input className="cg-inp" placeholder="e.g. Product Designer, SWE" value={role} onChange={e => setRole(e.target.value)} />
                            </div>
                            <div>
                                <label className="cg-lbl">Current stage</label>
                                <div className="cg-stages">
                                    {Object.entries(STAGES).map(([k, s]) => (
                                        <button key={k} className={`cg-sg${stage === k ? " on" : ""}`} onClick={() => setStage(k)}
                                            style={stage === k ? { borderColor: s.color, background: s.light, color: s.text } : {}}>
                                            <span style={{ fontSize: 20 }}>{s.emoji}</span>
                                            <span>{k}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="cg-2col">
                                <div>
                                    <label className="cg-lbl">Date applied</label>
                                    <input className="cg-inp" type="date" value={day} onChange={e => setDay(e.target.value)} />
                                </div>
                                <div>
                                    <label className="cg-lbl">Remind me</label>
                                    <input className="cg-inp" type="date" value={deadline} onChange={e => setDL(e.target.value)} />
                                </div>
                            </div>
                        </>}
                        {tab === "more" && <>
                            <div>
                                <label className="cg-lbl">Pay / salary</label>
                                <input className="cg-inp" placeholder="e.g. $90,000 / year or £60k" value={pay} onChange={e => setPay(e.target.value)} />
                            </div>
                            <div>
                                <label className="cg-lbl">Location</label>
                                <input className="cg-inp" placeholder="e.g. Remote · London · Hybrid" value={loc} onChange={e => setLoc(e.target.value)} />
                            </div>
                            <div>
                                <label className="cg-lbl">Link to job post</label>
                                <input className="cg-inp" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                            </div>
                        </>}
                        {tab === "notes" && <>
                            <div>
                                <label className="cg-lbl">Your notes</label>
                                <textarea className="cg-inp" style={{ height: 130, resize: "none", lineHeight: 1.7 }}
                                    placeholder="Who did you speak to? What questions came up? What's next?" value={note} onChange={e => setNote(e.target.value)} />
                            </div>
                            <div className="cg-tips">
                                <div className="cg-tips-ttl">Good things to write down</div>
                                {["Name of the person you spoke to", "Questions they asked you", "What you need to do next", "How you felt about the role"].map(t => (
                                    <div key={t} className="cg-tip"><Ic n="check" size={12} color="#16a34a" />{t}</div>
                                ))}
                            </div>
                        </>}
                    </div>

                    {/* Footer */}
                    <div className="cg-ft">
                        <button className="cg-cancel" onClick={onClose}>Cancel</button>
                        <button className="cg-save" onClick={save} disabled={busy || !co.trim() || !role.trim()}>
                            {busy
                                ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />Saving…</>
                                : <><Ic n={editing ? "check" : "plus"} size={14} />{editing ? "Save changes" : "Add job"}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    // Portal renders directly on document.body — bypasses ALL stacking contexts
    return createPortal(modal, document.body);
}

// ─── COMMAND PALETTE ─────────────────────────────────────────────────────────
function Palette({ jobs, onClose, onAdd, navigate }) {
    const [q, setQ] = useState(""); const [hi, setHi] = useState(0); const ref = useRef(null);
    useEffect(() => ref.current?.focus(), []);
    const ACTIONS = [
        { ic: "plus", main: "Add a job", sub: "Start tracking a new job", action: () => { onClose(); onAdd() } },
        { ic: "home", main: "Home", sub: "See all your jobs", action: () => { onClose(); navigate("/dashboard") } },
        { ic: "send", main: "Applied", sub: "Jobs you have applied for", action: () => { onClose(); navigate("/dashboard/Applied") } },
        { ic: "mic", main: "Interview", sub: "Jobs at interview stage", action: () => { onClose(); navigate("/dashboard/Interview") } },
        { ic: "gift", main: "Offers", sub: "Jobs where you have an offer", action: () => { onClose(); navigate("/dashboard/Offer") } },
        { ic: "barChart", main: "Stats", sub: "See how your search is going", action: () => { onClose(); navigate("/dashboard?view=stats") } },
        { ic: "book", main: "Learn", sub: "Articles and tools to help you", action: () => { onClose(); navigate("/dashboard?view=learn") } },
    ];
    const hits = q.length >= 1 ? jobs.filter(j => j.company.toLowerCase().includes(q.toLowerCase()) || j.role.toLowerCase().includes(q.toLowerCase())).slice(0, 6).map(j => ({ ic: STAGES[j.status]?.icon || "briefcase", main: j.company, sub: `${j.role} · ${j.status}`, tag: j.status, action: () => { onClose(); navigate(`/job/${j.id}`) } })) : [];
    const acts = q.length < 1 ? ACTIONS : ACTIONS.filter(a => a.main.toLowerCase().includes(q.toLowerCase()) || a.sub.toLowerCase().includes(q.toLowerCase()));
    const all = [...hits, ...acts];
    function onKey(e) { if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, all.length - 1)) } if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) } if (e.key === "Enter" && all[hi]) all[hi].action(); if (e.key === "Escape") onClose(); }
    return (
        <div className="cp-bg" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cp-box">
            <div className="cp-row"><Ic n="search" size={17} color="var(--gb)" /><input ref={ref} className="cp-inp" placeholder="Search your jobs or go to a page…" value={q} onChange={e => { setQ(e.target.value); setHi(0); }} onKeyDown={onKey} /><button className="cp-esc" onClick={onClose}>Esc</button></div>
                <div className="cp-list">
                    {all.length === 0 ? <div className="cp-empty">No results for "{q}"</div> : <>
                        {hits.length > 0 && <div className="cp-sec">Your jobs</div>}
                        {hits.map((r, i) => <div key={i} className={`cp-item${hi === i ? " hi" : ""}`} onMouseEnter={() => setHi(i)} onClick={r.action}><div className="cp-ic"><Ic n={r.ic} size={14} color="var(--g)" /></div><div style={{ flex: 1 }}><div className="cp-main">{r.main}</div><div className="cp-sub">{r.sub}</div></div>{r.tag && <div className="cp-tag" style={{ background: getS(r.tag).light, color: getS(r.tag).text }}>{r.tag}</div>}</div>)}
                        {acts.length > 0 && <div className="cp-sec">Go to</div>}
                        {acts.map((r, i) => { const idx = hits.length + i; return <div key={idx} className={`cp-item${hi === idx ? " hi" : ""}`} onMouseEnter={() => setHi(idx)} onClick={r.action}><div className="cp-ic"><Ic n={r.ic} size={14} color="var(--g)" /></div><div><div className="cp-main">{r.main}</div><div className="cp-sub">{r.sub}</div></div></div>; })}
                    </>}
                </div>
                <div className="cp-ft"><div className="cp-hint"><kbd>↑↓</kbd>move</div><div className="cp-hint"><kbd>↵</kbd>open</div><div className="cp-hint"><kbd>Esc</kbd>close</div></div>
            </div>
        </div>
    );
}

// ─── JOB DETAIL ──────────────────────────────────────────────────────────────
function JobDetail({ job, onEdit, onDelete, onBack, onStageChange, onPrep }) {
    const s = getS(job.status);
    const [copied, setCopied] = useState(false);
    function copy() { navigator.clipboard.writeText(job.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }) }
    const dl = job.deadline ? daysUntil(job.deadline) : null;
    return (
        <div className="detail">
            <button className="det-back" onClick={onBack}><Ic n="arrowL" size={14} />Back to all jobs</button>
            <div className="det-card">
                <div className="det-banner">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="det-co">{job.company}</div>
                        <div className="det-role"><Ic n="briefcase" size={15} color="var(--g)" />{job.role}</div>
                        <div className="det-pills">
                            <div className="det-pill" style={{ background: s.light, color: s.text, borderColor: s.border }}>
                                <span className="det-pdot" style={{ background: s.color }} /><span style={{ fontSize: 14 }}>{s.emoji}</span>{job.status}
                            </div>
                            {dl !== null && dl <= 7 && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, background: "#fff7ed", border: "1.5px solid #fed7aa", fontSize: 11, fontWeight: 700, color: "#c2410c" }}>
                                    <Ic n="bell" size={12} color="#c2410c" />
                                    {dl <= 0 ? "Follow-up is overdue" : dl === 1 ? "Follow up tomorrow" : `Follow up in ${dl} days`}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="det-acts">
                        <button className="det-act a-p" onClick={() => onPrep(job)}><Ic n="brain" size={13} />Interview Prep</button>
                        <button className="det-act a-e" onClick={() => onEdit(job)}><Ic n="edit" size={13} />Edit</button>
                        {job.url && <button className="det-act a-l" onClick={() => window.open(job.url, "_blank")}><Ic n="extLink" size={13} />View job post</button>}
                        <button className="det-act a-d" onClick={() => onDelete(job.id)}><Ic n="trash" size={13} />Remove</button>
                    </div>
                </div>
                <div className="det-stage-row">
                    <div className="det-stage-lbl">Move to a different stage</div>
                    <div className="det-stage-btns">
                        {ALL_STAGES.map(st => (
                            <button key={st} className="det-sgbtn" onClick={() => onStageChange(job.id, st)} style={{ border: `1.5px solid ${job.status === st ? STAGES[st].color : STAGES[st].border}`, background: job.status === st ? STAGES[st].light : "#fff", color: job.status === st ? STAGES[st].text : "var(--t3)" }}>
                                <span style={{ fontSize: 14 }}>{STAGES[st].emoji}</span>{st}
                                {job.status === st && <Ic n="check" size={12} color={STAGES[st].text} />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="det-grid">
                    <div className="df"><label>Company</label><p>{job.company}</p></div>
                    <div className="df"><label>Job title</label><p>{job.role}</p></div>
                    <div className="df"><label>Date applied</label><p><Ic n="calendar" size={13} />{niceDate(job.date)}</p></div>
                    <div className="df"><label>Current stage</label><p><span style={{ fontSize: 14 }}>{s.emoji}</span>{job.status}</p></div>
                    {job.salary && <div className="df"><label>Pay</label><p><Ic n="dollar" size={13} />{job.salary}</p></div>}
                    {job.location && <div className="df"><label>Location</label><p><Ic n="pin" size={13} />{job.location}</p></div>}
                    {job.deadline && <div className="df"><label>Reminder date</label><p><Ic n="bell" size={13} />{niceDate(job.deadline)}</p></div>}
                    {job.url && <div className="df wide"><label>Job post link</label><div className="copy-row"><a href={job.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: "var(--g)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.url}</a><button className={`copy-btn${copied ? " ok" : ""}`} onClick={copy}><Ic n={copied ? "check" : "copy"} size={12} />{copied ? "Copied!" : "Copy"}</button></div></div>}
                    {job.notes && <div className="df wide"><label>Notes</label><div className="notes-box">{job.notes}</div></div>}
                    <div className="df wide"><label>Timeline</label>
                        <div className="timeline">
                            <div className="tl-row"><div className="tl-dot"><Ic n="plus" size={9} color="var(--g)" /></div><div><div className="tl-main">Added to Career Garden</div><div className="tl-when"><Ic n="calendar" size={11} />{niceDate(job.date)}</div></div></div>
                            {job.status !== "Applied" && job.status !== "Saved" && <div className="tl-row"><div className="tl-dot" style={{ borderColor: s.color }}><span style={{ fontSize: 10 }}>{s.emoji}</span></div><div><div className="tl-main">Moved to {job.status}</div><div className="tl-when"><Ic n="clock" size={11} />{timeAgo(job.updated_at)}</div></div></div>}
                            <div className="tl-row"><div className="tl-dot"><Ic n="clock" size={9} color="var(--t3)" /></div><div><div className="tl-main">Last updated</div><div className="tl-when"><Ic n="clock" size={11} />{timeAgo(job.updated_at || job.created_at)}</div></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
function StatsPage({ jobs }) {
    const total = jobs.length;
    const cnt = Object.fromEntries(ALL_STAGES.map(s => [s, 0]));
    jobs.forEach(j => { const k = j.status === "Accepted" ? "Offer" : j.status; if (cnt[k] !== undefined) cnt[k]++; });
    const replied = cnt.Screening + cnt.Interview + cnt.Offer;
    const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;
    const offerRate = (cnt.Interview + cnt.Screening) > 0 ? Math.round((cnt.Offer / (cnt.Interview + cnt.Screening)) * 100) : 0;
    const active = total - cnt.Rejected;
    const oldest = jobs.length ? jobs.reduce((a, b) => new Date(a.created_at || 0) < new Date(b.created_at || 0) ? a : b, jobs[0]) : null;
    const [now] = useState(() => Date.now());
    const daysSince = oldest ? Math.floor((now - new Date(oldest.created_at)) / 86400000) : 0;
    const weeks = useMemo(() => { const w = Array(8).fill(0); jobs.forEach(j => { if (!j.created_at) return; const i = Math.floor((now - new Date(j.created_at)) / 86400000 / 7); if (i < 8) w[7 - i]++; }); return w; }, [jobs, now]);
    const wMax = Math.max(...weeks, 1);
    const barMax = Math.max(...ALL_STAGES.map(s => cnt[s]), 1);
    const recent = [...jobs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 7);
    const KPIS = [
        { ic: "activity", bg: "#dcfce7", fg: "#16a34a", val: `${replyRate}%`, lbl: "Reply rate", sub: `${replied} of ${total} heard back` },
        { ic: "award", bg: "#fef9c3", fg: "#a16207", val: `${offerRate}%`, lbl: "Offer rate", sub: `From ${cnt.Interview + cnt.Screening} interviews` },
        { ic: "target", bg: "#dbeafe", fg: "#2563eb", val: active, lbl: "Active now", sub: `${cnt.Rejected} rejected so far` },
        { ic: "calendar", bg: "#f3e8ff", fg: "#7c3aed", val: daysSince, lbl: "Days searching", sub: `${total} total jobs tracked` },
    ];
    return (
        <div className="stats">
            <div className="stats-hd">
                <div className="stats-ttl">Your Job Search Stats</div>
                <div className="stats-sub2">A clear view of how things are going — updated every time you add or change a job.</div>
            </div>
            {/* Pipeline */}
            <div className="pipeline">
                <div className="pipe-ttl">Your pipeline — where are most of your jobs?</div>
                <div className="pipe-sub">Each step shows how many jobs are at that stage</div>
                <div className="pipe-steps">
                    {ALL_STAGES.map(st => {
                        const isTop = cnt[st] > 0 && cnt[st] === Math.max(...ALL_STAGES.map(s => cnt[s]));
                        const has = cnt[st] > 0;
                        return (
                            <div key={st} className="pipe-step">
                                <div className={`pipe-node${isTop ? " top" : has ? " has" : ""}`}>
                                    <span style={{ fontSize: 13 }}>{STAGES[st].emoji}</span>
                                </div>
                                <div className={`pipe-name${isTop ? " top" : has ? " has" : ""}`}>{st}</div>
                                {has && <div className="pipe-cnt">{cnt[st]}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* KPIs */}
            <div className="kpi-row">
                {KPIS.map((k, i) => (
                    <div key={i} className="kpi">
                        <div className="kpi-top-bar" style={{ background: k.fg }} />
                        <div className="kpi-ic" style={{ background: k.bg }}><Ic n={k.ic} size={18} color={k.fg} /></div>
                        <div className="kpi-val" style={{ color: k.fg }}>{k.val}</div>
                        <div className="kpi-lbl">{k.lbl}</div>
                        <div className="kpi-sub">{k.sub}</div>
                    </div>
                ))}
            </div>
            {/* Charts */}
            <div className="charts-g">
                <div className="cbox">
                    <div className="cbox-ttl"><Ic n="pieChart" size={15} color="var(--g)" />Job breakdown</div>
                    <div className="cbox-sub">How your jobs split across each stage</div>
                    {total === 0 ? <div style={{ color: "var(--t3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No jobs yet</div> : <DonutChart counts={cnt} total={total} />}
                </div>
                <div className="cbox">
                    <div className="cbox-ttl"><Ic n="barChart" size={15} color="var(--g)" />Jobs per stage</div>
                    <div className="cbox-sub">How many jobs at each point</div>
                    <div className="bars">
                        {ALL_STAGES.map(st => {
                            const h = barMax > 0 ? Math.max((cnt[st] / barMax) * 98, cnt[st] > 0 ? 8 : 0) : 0; return (
                                <div key={st} className="bar-col">
                                    <div className="bar-val" style={{ color: STAGES[st].color }}>{cnt[st]}</div>
                                    <div className="bar-body" style={{ height: `${h}px`, background: STAGES[st].bar }} />
                                    <div className="bar-lbl">{st.slice(0, 3)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="cbox">
                    <div className="cbox-ttl"><Ic n="filter" size={15} color="var(--g)" />Funnel — % at each stage</div>
                    <div className="cbox-sub">Out of all jobs, how many reached each stage</div>
                    <div className="funnel">
                        {ALL_STAGES.map(st => {
                            const pct = total ? Math.round((cnt[st] / total) * 100) : 0; return (
                                <div key={st} className="funnel-row">
                                    <div className="funnel-ic" style={{ background: STAGES[st].light }}><span style={{ fontSize: 14 }}>{STAGES[st].emoji}</span></div>
                                    <div className="funnel-lbl">{st}</div>
                                    <div className="funnel-track"><div className="funnel-fill" style={{ width: `${pct}%`, background: STAGES[st].bar }} /></div>
                                    <div className="funnel-n">{cnt[st]}</div>
                                    <div className="funnel-pct">{pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Sparkline + key numbers */}
            <div className="spark-row">
                <div className="sbox">
                    <div className="cbox-ttl"><Ic n="trendUp" size={15} color="var(--g)" />Jobs added each week</div>
                    <div className="cbox-sub">Last 8 weeks — this week is green</div>
                    <div className="spark-bars">
                        {weeks.map((c, i) => (
                            <div key={i} className="spark-col" title={`${c} job${c !== 1 ? "s" : ""}`}>
                                <div className={`spark-bar${i === 7 ? " now" : ""}`} style={{ height: `${Math.max(3, (c / wMax) * 68)}px` }} />
                                <div className="spark-lbl">{i === 7 ? "Now" : `W${i + 1}`}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="sbox">
                    <div className="cbox-ttl"><Ic n="target" size={15} color="var(--g)" />Key numbers</div>
                    <div className="cbox-sub">The most important things at a glance</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                        {[{ n: `${replyRate}%`, l: "Got a reply", c: "#16a34a" }, { n: `${offerRate}%`, l: "Got an offer", c: "#10b981" }, { n: active, l: "Still active", c: "#f59e0b" }, { n: total, l: "All time total", c: "#64748b" }].map(m => (
                            <div key={m.l} style={{ background: "var(--gl)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 14px", textAlign: "center" }}>
                                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.05em", color: m.c }}>{m.n}</div>
                                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3, fontWeight: 600 }}>{m.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Activity */}
            <div className="activity-box">
                <div className="act-ttl"><Ic n="activity" size={16} color="var(--g)" />Recent activity</div>
                {recent.length === 0
                    ? <div style={{ color: "var(--t3)", fontSize: 13, textAlign: "center", padding: "14px 0" }}>Nothing yet. Add your first job to start.</div>
                    : recent.map(j => {
                        const s = getS(j.status); return (
                            <div key={j.id} className="act-item">
                                <div className="act-ic" style={{ background: s.light, borderColor: s.border }}><span style={{ fontSize: 15 }}>{s.emoji}</span></div>
                                <div><div className="act-txt">Added <b>{j.company}</b> — {j.role} &middot; <b style={{ color: s.text }}>{j.status}</b></div><div className="act-when"><Ic n="clock" size={11} />{timeAgo(j.created_at)}</div></div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

// ─── LEARN PAGE ───────────────────────────────────────────────────────────────
function LearnPage({ jobs }) {
    const [q, setQ] = useState(""); const [cat, setCat] = useState("All");
    const resources = useMemo(() => getLearnResources(jobs), [jobs]);
    const topRole = jobs[0]?.role || "";
    const CATS = ["All", "Interview Prep", "Resume & CV", "Networking", "Salary", "Mindset", "Skills"];
    const filtered = resources.filter(r => { const mQ = !q || r.ttl.toLowerCase().includes(q.toLowerCase()) || r.desc.toLowerCase().includes(q.toLowerCase()); const mC = cat === "All" || r.cat === cat; return mQ && mC; });
    return (
        <div className="learn">
            <div className="learn-hd"><div className="learn-ttl">Learn &amp; Prepare</div><div className="learn-sub">Hand-picked free resources to help you get the job.</div></div>
            {topRole && <div className="learn-sug"><Ic n="zap" size={15} color="var(--g)" />Showing resources matched to your roles — <b>{topRole}</b> and others.</div>}
            <div className="learn-bar">
                <div className="learn-iw"><span className="learn-ic"><Ic n="search" size={15} /></span><input className="learn-inp" placeholder="Search articles, tools, courses…" value={q} onChange={e => setQ(e.target.value)} /></div>
                <div className="learn-cats">{CATS.map(c => <button key={c} className={`lcat${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
            </div>
            {filtered.length === 0
                ? <div className="learn-empty"><Ic n="search" size={40} color="var(--t3)" sx={{ margin: "0 auto 12px" }} /><div style={{ fontWeight: 700, color: "var(--t)", marginBottom: 4, fontSize: 15 }}>Nothing found</div><div>Try different words or a different category.</div></div>
                : <div className="learn-grid">{filtered.map(r => <a key={r.id} className="lcard" href={r.url} target="_blank" rel="noopener noreferrer">
                    <div className="lcard-img" style={{ background: r.color }}><div className="lcard-img-ic"><Ic n={r.icon} size={22} color={r.tc.t} /></div><div className="lcard-badge" style={{ background: r.tc.bg, color: r.tc.t }}>{r.type}</div></div>
                    <div className="lcard-body"><div className="lcard-cat">{r.cat}</div><div className="lcard-ttl">{r.ttl}</div><div className="lcard-desc">{r.desc}</div><div className="lcard-ft"><span className="lcard-src">{r.src}</span><span className="lcard-time"><Ic n="clock" size={11} />{r.time}</span></div></div>
                </a>)}
                </div>}
        </div>
    );
}

// ─── JOB CARD ─────────────────────────────────────────────────────────────────
function JobCard({ job, idx, onEdit, onDel, onClick }) {
    const s = getS(job.status);
    const dl = job.deadline ? daysUntil(job.deadline) : null;
    const dlWarn = dl !== null && dl <= 3;

    // Gradient colours per stage for the top accent bar
    const gradients = {
        Saved: ["#3b82f6", "#93c5fd"],
        Applied: ["#16a34a", "#4ade80"],
        Screening: ["#a855f7", "#d8b4fe"],
        Interview: ["#f59e0b", "#fcd34d"],
        Offer: ["#10b981", "#6ee7b7"],
        Rejected: ["#94a3b8", "#cbd5e1"],
    };
    const [gFrom, gTo] = gradients[job.status] || gradients.Applied;

    return (
        <div className="jcard" style={{ animation: `cardIn .38s ${idx * 28}ms var(--ease) both` }} onClick={onClick}>
            {/* Gradient accent bar */}
            <div className="jcard-accent" style={{ "--jc-from": gFrom, "--jc-to": gTo }} />

            <div className="jcard-body">
                {/* Stage pill + date */}
                <div className="jcard-header">
                    <div className="jcard-pill" style={{ background: s.light, color: s.text, borderColor: s.border }}>
                        <span style={{ fontSize: 12 }}>{s.emoji}</span>
                        {job.status}
                    </div>
                    <span className="jcard-time">{shortDate(job.date)}</span>
                </div>

                {/* Company + role */}
                <div className="jcard-co">{job.company}</div>
                <div className="jcard-role">{job.role}</div>

                {/* Chips */}
                <div className="jcard-chips">
                    {job.location && <span className="chip"><Ic n="pin" size={10} />{job.location}</span>}
                    {job.salary && <span className="chip"><Ic n="dollar" size={10} />{job.salary}</span>}
                    {!job.location && !job.salary && (
                        <span className="chip"><Ic n="calendar" size={10} />Added {shortDate(job.date)}</span>
                    )}
                    {dlWarn && (
                        <span className="chip warn">
                            <Ic n="bell" size={10} />
                            {dl <= 0 ? "Overdue!" : dl === 1 ? "Due tomorrow" : `${dl}d left`}
                        </span>
                    )}
                </div>

                {/* Notes preview */}
                {job.notes && <div className="jcard-note">{job.notes}</div>}
            </div>

            <div className="jcard-ft" onClick={e => e.stopPropagation()}>
                <button className="jcard-ebtn" onClick={() => onEdit(job)}>
                    <Ic n="edit" size={12} />Edit
                </button>
                <button className="jcard-dbtn" onClick={() => onDel(job.id)} title="Remove">
                    <Ic n="trash" size={13} />
                </button>
            </div>
        </div>
    );
}
export default function Main({ user }) {
    const navigate = useNavigate();
    const loc = useLocation();
    const { status: paramStage, id: paramId } = useParams();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [modal, setModal] = useState(false);
    const [view, setView] = useState("grid");
    const [q, setQ] = useState("");
    const [sort, setSort] = useState("newest");
    const [palette, setPalette] = useState(false);
    const [info, setInfo] = useState(false);
    const [prepJob, setPrepJob] = useState(null);
    const [userPop, setUserPop] = useState(false);
    const [sbOpen, setSbOpen] = useState(true);
    const [sbMobile, setSbMobile] = useState(false);
    const [addStage, setAddStage] = useState("Applied");
    const upRef = useRef(null);
    const { add: toast, Stack: Toasts } = useToasts();

    const qp = new URLSearchParams(loc.search);
    const showStats = qp.get("view") === "stats";
    const showLearn = qp.get("view") === "learn";

    const meta = user?.user_metadata || {};
    const name = meta.full_name || meta.name || user?.email?.split("@")[0] || "there";
    const email = user?.email || "";
    const pic = meta.avatar_url || meta.picture || null;
    const first = name.split(" ")[0];
    const initials = name.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase() || "U";
    const hr = new Date().getHours();
    const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from("jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (error) toast("Could not load jobs", "err");
        else setJobs(data || []);
        setLoading(false);
    }, [toast, user.id]);

    // Initial data hydration is intentionally triggered after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const fn = e => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPalette(p => !p); }
            if (e.key === "Escape") { setPalette(false); setSbMobile(false); setUserPop(false); }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);
    useEffect(() => {
        const fn = e => { if (upRef.current && !upRef.current.contains(e.target)) setUserPop(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    async function save(d) {
        const p = { company: d.company, role: d.role, status: d.status, date: d.date, salary: d.salary, location: d.location, url: d.url, notes: d.notes, deadline: d.deadline || null, user_id: user.id };
        if (d.id) {
            const { data, error } = await supabase.from("jobs").update({ ...p, updated_at: new Date().toISOString() }).eq("id", d.id).select().single();
            if (error) { toast("Could not save", "err"); return; }
            setJobs(j => j.map(x => x.id === d.id ? data : x));
            toast("Saved!");
        } else {
            const { data, error } = await supabase.from("jobs").insert([p]).select().single();
            if (error) { toast("Could not add job", "err"); return; }
            setJobs(j => [data, ...j]);
            toast("Job added!");
        }
        setModal(false); setEditing(null);
    }

    async function remove(id) {
        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) { toast("Could not remove", "err"); return; }
        setJobs(j => j.filter(x => x.id !== id));
        toast("Removed");
        if (activeJobId === id) navigate("/dashboard");
    }

    async function changeStage(id, newStage) {
        const { data, error } = await supabase.from("jobs").update({ status: newStage, updated_at: new Date().toISOString() }).eq("id", id).select().single();
        if (error) { toast("Could not update", "err"); return; }
        setJobs(j => j.map(x => x.id === id ? data : x));
        toast(`Moved to ${newStage}`);
    }

    function openAdd() { setEditing(null); setAddStage(activeStage || "Applied"); setModal(true); }
    function openEdit(j) { setEditing(j); setModal(true); }
    async function logout() { await supabase.auth.signOut(); navigate("/"); }

    const activeStage = paramStage || null;
    const activeJobId = paramId ? Number(paramId) : null;
    const activeJob = activeJobId ? jobs.find(j => j.id === activeJobId) : null;

    const counts = useMemo(() => {
        const c = Object.fromEntries(ALL_STAGES.map(s => [s, 0]));
        jobs.forEach(j => { const k = j.status === "Accepted" ? "Offer" : j.status; if (c[k] !== undefined) c[k]++; });
        return c;
    }, [jobs]);

    const upcoming = useMemo(() =>
        jobs.filter(j => {
            if (!j.deadline || j.status === "Rejected" || j.status === "Offer") return false;
            const d = daysUntil(j.deadline);
            return d !== null && d <= 5;
        }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        , [jobs]);

    const filtered = useMemo(() => {
        const sq = q.trim().toLowerCase();
        return jobs.filter(j => {
            const normS = j.status === "Accepted" ? "Offer" : j.status;
            const ms = !activeStage || normS === activeStage || j.status === activeStage;
            const mq = !sq || j.company.toLowerCase().includes(sq) || j.role.toLowerCase().includes(sq) || (j.notes || "").toLowerCase().includes(sq);
            return ms && mq;
        }).sort((a, b) => {
            if (sort === "newest") return new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0);
            if (sort === "oldest") return new Date(a.created_at || a.date || 0) - new Date(b.created_at || b.date || 0);
            if (sort === "a-z") return a.company.localeCompare(b.company);
            if (sort === "stage") return ALL_STAGES.indexOf(a.status) - ALL_STAGES.indexOf(b.status);
            return 0;
        });
    }, [jobs, activeStage, q, sort]);

    function navOn(path, exact = false) {
        if (exact) return loc.pathname === "/dashboard" && !paramStage && !showStats && !showLearn && !prepJob;
        return loc.pathname.startsWith(path);
    }
    function go(path) { navigate(path); setSbMobile(false); setPrepJob(null); }

    const pageTitle = prepJob ? `Prep: ${prepJob.role}` : activeJob ? activeJob.company : activeStage || (showStats ? "Stats" : showLearn ? "Learn" : "Home");
    const sbClass = ["sidebar", !sbOpen ? "off" : "", sbMobile ? "mob-on" : ""].filter(Boolean).join(" ");
    const mainClass = ["main", !sbOpen ? "full" : ""].filter(Boolean).join(" ");

    return (
        <>
            <style>{CSS}</style>
            <div className={`backdrop${sbMobile ? " on" : ""}`} onClick={() => setSbMobile(false)} />

            <div className="shell">
                {/* ─── SIDEBAR ─────────────────────── */}
                <aside className={sbClass}>
                    <div className="sb-hd">
                        <div className="sb-logo">🌳</div>
                        <div className="sb-brand">
                            <div className="sb-brand-name">Career Garden</div>
                            <div className="sb-brand-sub">Track · Apply · Land</div>
                        </div>
                        <button className="sb-close" onClick={() => { setSbOpen(false); setSbMobile(false); }} title="Hide sidebar">
                            <Ic n="chevL" size={13} />
                        </button>
                    </div>

                    <nav className="sb-nav">
                        <span className="sb-sec">Pages</span>
                        <div className={`sb-item${navOn("/dashboard", true) ? " on" : ""}`} onClick={() => go("/dashboard")}>
                            <span className="sb-ic"><Ic n="home" size={16} /></span>
                            <span className="sb-lbl">Home</span>
                        </div>
                        {ALL_STAGES.map(st => (
                            <div key={st} className={`sb-item${navOn(`/dashboard/${st}`) ? " on" : ""}`} onClick={() => go(`/dashboard/${st}`)}>
                                <span className="sb-ic" style={{ fontSize: 16, lineHeight: 1 }}>{STAGES[st].emoji}</span>
                                <span className="sb-lbl">{st}</span>
                                <span className={`sb-badge${st === "Interview" ? " amber" : st === "Offer" ? " offer-badge" : st === "Rejected" ? " muted" : ""}`}>{counts[st]}</span>
                            </div>
                        ))}
                        <div className="sb-div" />
                        <span className="sb-sec">Tools</span>
                        <div className={`sb-item${showStats ? " on" : ""}`} onClick={() => go("/dashboard?view=stats")}>
                            <span className="sb-ic"><Ic n="barChart" size={16} /></span>
                            <span className="sb-lbl">Stats</span>
                        </div>
                        <div className={`sb-item${showLearn ? " on" : ""}`} onClick={() => go("/dashboard?view=learn")}>
                            <span className="sb-ic"><Ic n="book" size={16} /></span>
                            <span className="sb-lbl">Learn</span>
                        </div>
                        <div className={`sb-item${prepJob ? " on" : ""}`} onClick={() => {
                            setSbMobile(false);
                            if (prepJob) {
                                navigate("/dashboard");
                            } else {
                                // Auto-pick the most relevant job (interview stage first, then applied)
                                const best = jobs.find(j => j.status === "Interview") || jobs.find(j => j.status === "Screening") || jobs.find(j => j.status === "Applied") || jobs[0];
                                if (best) { setPrepJob(best); navigate("/dashboard"); }
                                else toast("Add a job first, then use Interview Prep", "info");
                            }
                        }}>
                            <span className="sb-ic"><Ic n="brain" size={16} /></span>
                            <span className="sb-lbl">Interview Prep</span>
                            {prepJob && <span className="sb-badge" style={{ fontSize: 9, letterSpacing: ".02em", whiteSpace: "nowrap", overflow: "hidden", maxWidth: 60, textOverflow: "ellipsis" }}>{prepJob.role.split(" ")[0]}</span>}
                        </div>
                        <div className="sb-item" onClick={() => { setPalette(true); setSbMobile(false); }}>
                            <span className="sb-ic"><Ic n="search" size={16} /></span>
                            <span className="sb-lbl">Search</span>
                            <span className="sb-badge cmd">⌘K</span>
                        </div>
                        <div className="sb-item" onClick={() => { setInfo(true); setSbMobile(false); }}>
                            <span className="sb-ic"><Ic n="info" size={16} /></span>
                            <span className="sb-lbl">Help</span>
                        </div>
                    </nav>

                    <div className="sb-ft">
                        <div className="sb-user" ref={upRef} onClick={() => setUserPop(p => !p)}>
                            <div className="sb-av">{pic ? <img src={pic} alt="" /> : initials}</div>
                            <div className="sb-ui">
                                <div className="sb-uname">{name}</div>
                                <div className="sb-uemail">{email}</div>
                            </div>
                            <span className={`sb-ucaret${userPop ? " open" : ""}`}><Ic n="chevD" size={13} /></span>
                            {userPop && (
                                <div className="sb-popup" onClick={e => e.stopPropagation()}>
                                    <div className="sb-popup-hd">
                                        <div className="sb-popup-name">{name}</div>
                                        <div className="sb-popup-email">{email}</div>
                                    </div>
                                    <button className="sb-popup-btn" onClick={() => { setInfo(true); setUserPop(false); }}>
                                        <Ic n="info" size={14} />Help &amp; info
                                    </button>
                                    <button className="sb-popup-btn red" onClick={logout}>
                                        <Ic n="logout" size={14} />Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Show sidebar tab when hidden */}
                {!sbOpen && (
                    <button className="show-sb" onClick={() => setSbOpen(true)} title="Show sidebar">
                        <Ic n="chevR" size={14} />
                    </button>
                )}

                {/* ─── MAIN CONTENT ─────────────── */}
                <div className={mainClass}>
                    {/* Topbar */}
                    <header className="topbar">
                        <button className="tb-ham" onClick={() => setSbMobile(m => !m)}>
                            <Ic n="menu" size={17} />
                        </button>
                        <span className="tb-title">{pageTitle}</span>
                        <div className="tb-srch" onClick={() => setPalette(true)}>
                            <Ic n="search" size={13} />&nbsp;Search…
                            <span className="tb-sk">⌘K</span>
                        </div>
                        <div className="tb-r">
                            {upcoming.length > 0 && (
                                <button className="tb-btn tb-rel" onClick={() => navigate("/dashboard")} title={`${upcoming.length} reminder${upcoming.length > 1 ? "s" : ""} due soon`}>
                                    <Ic n="bell" size={15} /><span className="tb-dot" />
                                </button>
                            )}
                            <button className={`tb-btn${showStats ? " on" : ""}`} onClick={() => navigate(showStats ? "/dashboard" : "/dashboard?view=stats")} title="Stats">
                                <Ic n="barChart" size={15} />
                            </button>
                            <button className={`tb-btn${showLearn ? " on" : ""}`} onClick={() => navigate(showLearn ? "/dashboard" : "/dashboard?view=learn")} title="Learn">
                                <Ic n="book" size={15} />
                            </button>
                            <button className="tb-btn" onClick={() => setInfo(true)} title="Help"><Ic n="info" size={15} /></button>
                            <button className="add-btn" onClick={openAdd}>
                                <Ic n="plus" size={14} /><span className="add-lbl">Add job</span>
                            </button>
                        </div>
                    </header>

                    {/* Page content */}
                    <div className="page">
                        {prepJob ? (
                            <PrepPage job={prepJob} onBack={() => { setPrepJob(null); if (activeJob) navigate(`/job/${activeJob.id}`); else navigate("/dashboard"); }} />
                        ) : activeJob ? (
                            <JobDetail job={activeJob} onEdit={openEdit} onDelete={remove} onBack={() => navigate("/dashboard")} onStageChange={changeStage} onPrep={j => { setPrepJob(j); navigate("/dashboard"); }} />
                        ) : showStats ? (
                            <StatsPage jobs={jobs} />
                        ) : showLearn ? (
                            <LearnPage jobs={jobs} />
                        ) : (
                            <>
                                {!activeStage && (
                                    <div className="pg-hero">
                                        <div>
                                            <div className="pg-greet">{greeting}, <span>{first}</span> 👋</div>
                                            <div className="pg-sub">
                                                {jobs.length === 0
                                                    ? "Add your first job to start tracking your search."
                                                    : <> You have <b>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</b> tracked &middot; <b>{counts.Interview}</b> at interview stage &middot; <b>{counts.Offer}</b> with offers </>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reminders */}
                                {!activeStage && upcoming.length > 0 && (
                                    <div className="reminders">
                                        <div className="rem-title"><Ic n="bell" size={14} color="#a16207" />Reminders — follow up on these soon</div>
                                        {upcoming.slice(0, 3).map(j => {
                                            const dl = daysUntil(j.deadline);
                                            const s = getS(j.status);
                                            return (
                                                <div key={j.id} className="rem-item" onClick={() => navigate(`/job/${j.id}`)}>
                                                    <div className="rem-ic"><span style={{ fontSize: 15 }}>{s.emoji}</span></div>
                                                    <span className="rem-txt"><b>{j.company}</b> — {j.role}</span>
                                                    <span className="rem-days">{dl <= 0 ? "Overdue" : dl === 1 ? "Tomorrow" : `${dl} days left`}</span>
                                                    <Ic n="chevR" size={13} color="#d97706" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Stage strip */}
                                {!activeStage && jobs.length > 0 && (
                                    <div className="strip">
                                        {ALL_STAGES.map(st => {
                                            const s = STAGES[st];
                                            const pct = jobs.length ? (counts[st] / jobs.length) * 100 : 0;
                                            return (
                                                <div key={st} className="scard" style={{ borderTop: `3px solid ${s.color}` }} onClick={() => navigate(`/dashboard/${st}`)}>
                                                    <div className="scard-top">
                                                        <div className="scard-ic" style={{ background: s.light, fontSize: 18, lineHeight: 1 }}>
                                                            {s.emoji}
                                                        </div>
                                                        <div className="scard-num" style={{ color: s.color }}>{counts[st]}</div>
                                                    </div>
                                                    <div className="scard-lbl" style={{ fontWeight: 700, color: s.text, fontSize: "10.5px" }}>{st}</div>
                                                    <div style={{ fontSize: "9px", color: "var(--t3)", marginTop: 1, fontStyle: "italic" }}>{s.desc}</div>
                                                    <div className="scard-bar"><div className="scard-fill" style={{ width: `${pct}%`, background: s.bar }} /></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Toolbar */}
                                {!loading && jobs.length > 0 && (
                                    <div className="toolbar">
                                        <div className="tbl">
                                            {!activeStage && (
                                                <>
                                                    <button className="flt on" onClick={() => navigate("/dashboard")}>
                                                        <Ic n="layers" size={12} />All ({jobs.length})
                                                    </button>
                                                    {ALL_STAGES.map(st => (
                                                        <button key={st} className="flt"
                                                            style={{ background: STAGES[st].light, color: STAGES[st].text, borderColor: STAGES[st].border }}
                                                            onClick={() => navigate(`/dashboard/${st}`)}>
                                                            <span style={{ fontSize: 13 }}>{STAGES[st].emoji}</span>
                                                            {st} {counts[st]}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            <div className="qs">
                                                <span className="qs-ic"><Ic n="search" size={13} /></span>
                                                <input placeholder={`Search${activeStage ? " " + activeStage : ""}…`} value={q} onChange={e => setQ(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="tbr">
                                            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
                                                <option value="newest">Newest first</option>
                                                <option value="oldest">Oldest first</option>
                                                <option value="a-z">A to Z</option>
                                                <option value="stage">By stage</option>
                                            </select>
                                            <div className="vtabs">
                                                {[{ v: "grid", n: "grid", l: "Grid" }, { v: "list", n: "list", l: "List" }, { v: "board", n: "columns", l: "Board" }].map(m => (
                                                    <button key={m.v} className={`vtab${view === m.v ? " on" : ""}`} onClick={() => setView(m.v)}>
                                                        <Ic n={m.n} size={12} />{view === m.v && <span>{m.l}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stage page header */}
                                {activeStage && jobs.length > 0 && (
                                    <div className="sec-hd" style={{ marginTop: 0, marginBottom: 14 }}>
                                        <div className="sec-hd-lbl">
                                            <span style={{ fontSize: 15 }}>{STAGES[activeStage]?.emoji}</span>
                                            {activeStage}
                                        </div>
                                        <span className="sec-hd-n">{filtered.length} job{filtered.length !== 1 ? "s" : ""}</span>
                                        <div className="sec-hd-line" />
                                    </div>
                                )}

                                {/* Content */}
                                {loading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "70px 0" }}>
                                        <div style={{ width: 34, height: 34, border: "2.5px solid var(--gm)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="empty">
                                        <div className="empty-tree">🌳</div>
                                        <div className="empty-ttl">Your garden is empty</div>
                                        <div className="empty-desc">Add your first job to start tracking applications, interviews, and offers — all in one place.</div>
                                        <button className="empty-btn" onClick={openAdd}><Ic n="plus" size={15} />Add your first job</button>
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="empty" style={{ minHeight: "32vh" }}>
                                        <Ic n="search" size={44} color="var(--t3)" sx={{ marginBottom: 8 }} />
                                        <div className="empty-ttl" style={{ fontSize: 18 }}>No jobs found</div>
                                        <div className="empty-desc">Try different search words or choose a different stage.</div>
                                    </div>
                                ) : view === "board" && !activeStage ? (
                                    <div className="board-scroll">
                                        <div className="board">
                                            {ALL_STAGES.map(st => {
                                                const col = filtered.filter(j => (j.status === "Accepted" ? "Offer" : j.status) === st);
                                                const s = STAGES[st];
                                                return (
                                                    <div key={st} className="bcol" style={{ borderTop: `3px solid ${s.color}` }}>
                                                        <div className="bcol-hd">
                                                            <div className="bcol-ic" style={{ background: s.light, fontSize: 16, lineHeight: 1 }}>{s.emoji}</div>
                                                            <span className="bcol-name">{st}</span>
                                                            <span className="bcol-n">{col.length}</span>
                                                        </div>
                                                        <div className="bcol-body">
                                                            {col.length === 0
                                                                ? <div className="bcol-empty">Nothing here yet</div>
                                                                : col.map(j => (
                                                                    <div key={j.id} className="bitem" style={{ borderLeft: `2.5px solid ${s.border}` }} onClick={() => navigate(`/job/${j.id}`)}>
                                                                        <div className="bitem-co">{j.company}</div>
                                                                        <div className="bitem-role">{j.role}</div>
                                                                        <div className="bitem-ft">
                                                                            <span className="bitem-date"><Ic n="calendar" size={10} />{shortDate(j.date)}</span>
                                                                            {j.salary && <span className="bitem-sal">{j.salary}</span>}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : view === "list" ? (
                                    <div className="jlist">
                                        {filtered.map((j, i) => {
                                            const s = getS(j.status);
                                            return (
                                                <div key={j.id} className="jrow" style={{ animation: `rowIn .25s ${i * 16}ms var(--ease) both` }} onClick={() => navigate(`/job/${j.id}`)}>
                                                    <div className="jrow-dot" style={{ background: s.color }} />
                                                    <div className="jrow-co">{j.company}</div>
                                                    <div className="jrow-role">{j.role}</div>
                                                    {j.location && <div className="jrow-loc"><Ic n="pin" size={11} />{j.location}</div>}
                                                    <div className="jrow-pill" style={{ background: s.light, color: s.text }}><span style={{ fontSize: 13 }}>{s.emoji}</span>{j.status}</div>
                                                    <div className="jrow-date"><Ic n="calendar" size={11} />{shortDate(j.date)}</div>
                                                    <div className="jrow-acts" onClick={e => e.stopPropagation()}>
                                                        <button className="jrow-e" onClick={() => openEdit(j)}><Ic n="edit" size={12} />Edit</button>
                                                        <button className="jrow-d" onClick={() => remove(j.id)}><Ic n="trash" size={13} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    activeStage ? (
                                        <div className="jgrid">
                                            {filtered.map((j, i) => <JobCard key={j.id} job={j} idx={i} onEdit={openEdit} onDel={remove} onClick={() => navigate(`/job/${j.id}`)} />)}
                                        </div>
                                    ) : (
                                        ALL_STAGES.map(st => {
                                            const grp = filtered.filter(j => (j.status === "Accepted" ? "Offer" : j.status) === st);
                                            if (!grp.length) return null;
                                            return (
                                                <div key={st} style={{ marginBottom: 26 }}>
                                                    <div className="sec-hd">
                                                        <div className="sec-hd-lbl">
                                                            <span style={{ fontSize: 15 }}>{STAGES[st].emoji}</span>
                                                            {st}
                                                        </div>
                                                        <span className="sec-hd-n">{grp.length} job{grp.length !== 1 ? "s" : ""}</span>
                                                        <div className="sec-hd-line" />
                                                    </div>
                                                    <div className="jgrid">
                                                        {grp.map((j, i) => <JobCard key={j.id} job={j} idx={i} onEdit={openEdit} onDel={remove} onClick={() => navigate(`/job/${j.id}`)} />)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile bottom nav */}
            <nav className="bnav">
                <div className="bnav-inner">
                    {[
                        { icon: "home", label: "Home", action: () => navigate("/dashboard"), on: !activeStage && !showStats && !showLearn && !activeJob },
                        { icon: "mic", label: "Interview", action: () => navigate("/dashboard/Interview"), on: activeStage === "Interview", badge: counts.Interview || null },
                        { icon: "plus", label: "Add", action: openAdd, add: true },
                        { icon: "barChart", label: "Stats", action: () => navigate("/dashboard?view=stats"), on: showStats },
                        { icon: "book", label: "Learn", action: () => navigate("/dashboard?view=learn"), on: showLearn },
                    ].map((item, i) => (
                        <button key={i} className={`bnav-btn${item.on ? " on" : ""}${item.add ? " bnav-add" : ""}`} onClick={item.action}>
                            {item.badge && <span className="bnav-badge">{item.badge}</span>}
                            <Ic n={item.icon} size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {modal && <AddModal editing={editing} initialStage={addStage} onClose={() => { setModal(false); setEditing(null); }} onSave={save} />}
            {info && <Info onClose={() => setInfo(false)} />}
            {palette && <Palette jobs={jobs} onClose={() => setPalette(false)} onAdd={openAdd} navigate={navigate} />}
            <Toasts />
        </>
    );
}
