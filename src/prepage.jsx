/**
 * PrepPageAI.jsx — Career Garden · AI Interview Prep + Supabase
 *
 * Features:
 *  - List of all saved preps for this user (with two-step confirm delete)
 *  - Generate new plan → auto-saved to interview_preps table
 *  - Load any saved prep and continue where you left off
 *  - q_answers + done_projects auto-saved to DB on every change (debounced)
 *  - Gemini 1.5 Flash · VITE_GEMINI_KEY · 2 parallel calls
 *
 * Changes in this pass (colors/theme untouched — same --g/--gl/--gb/--gd/--gm vars):
 *  - Fixed unmount leaks: debounce timer + progress ticker are now cleared on unmount
 *    and async setState calls are guarded so they no-op after unmount
 *  - generate() now checks for an authenticated user before insert instead of
 *    crashing on user.id when auth.getUser() returns null
 *  - Delete is now a two-step "click again to confirm" instead of instant/irreversible
 *  - fetchPreps() and openPrep() now surface errors instead of silently swallowing them
 *  - Expandable rows (phase headers, question headers, prep rows) are keyboard
 *    accessible: role="button", tabIndex, Enter/Space handling
 *  - Icon-only buttons (back, view, delete, refresh) have aria-labels
 *  - NOTE: VITE_GEMINI_KEY is a client-exposed env var — it ships in the public JS
 *    bundle and anyone can read it from devtools/network tab. Flagging again since
 *    this has come up before in your other projects. Worth proxying through a
 *    server/edge function before this goes anywhere near production traffic.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { supabase } from "./lib/supabase";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SVI = {
    arrowL: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    check: `<polyline points="20 6 9 17 4 12"/>`,
    checkCircle: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    chevR: `<polyline points="9 18 15 12 9 6"/>`,
    star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    briefcase: `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
    calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
    book: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
    code: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
    refresh: `<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>`,
    trash: `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>`,
    plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`,
    eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
    building: `<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M8 10h.01M8 14h.01M16 10h.01M16 14h.01"/>`,
    trendUp: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
    map: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`,
    clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
};

function Pi({ n, size = 16, color = "currentColor", style: s }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: "block", flexShrink: 0, ...s }}
            dangerouslySetInnerHTML={{ __html: SVI[n] || "" }} />
    );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes pop    { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }

.pp-root{max-width:920px;width:100%;animation:fadeUp .4s ease both}

.pp-back{display:inline-flex;align-items:center;gap:7px;color:var(--g);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:20px;background:#fff;border:1px solid var(--border);padding:7px 14px;border-radius:99px;transition:all .15s;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.pp-back:hover{background:var(--gl);border-color:var(--gb);transform:translateX(-2px)}
.pp-back:focus-visible{outline:2px solid var(--g);outline-offset:2px}

.pp-hero{background:linear-gradient(135deg,#0a2e14 0%,#14532d 55%,#16a34a 100%);border-radius:22px;padding:30px 32px 26px;margin-bottom:22px;color:#fff;position:relative;overflow:hidden}
.pp-hero::before{content:'';position:absolute;top:-70px;right:-70px;width:260px;height:260px;border-radius:50%;background:rgba(74,222,128,.08);pointer-events:none}
.pp-hero::after{content:'';position:absolute;bottom:-50px;left:60px;width:180px;height:180px;border-radius:50%;background:rgba(74,222,128,.05);pointer-events:none}
.pp-hero-ey{font-size:10px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}
.pp-hero-t{font-size:clamp(21px,3vw,29px);font-weight:900;letter-spacing:-.04em;line-height:1.2;margin-bottom:7px;position:relative;z-index:1}
.pp-hero-s{font-size:13px;color:rgba(255,255,255,.6);line-height:1.55;position:relative;z-index:1}

.pp-card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:26px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,0,0,.04)}
.pp-card-ttl{font-size:15px;font-weight:800;color:var(--t);margin-bottom:4px;display:flex;align-items:center;gap:8px}
.pp-card-sub{font-size:12.5px;color:var(--t3);margin-bottom:20px;line-height:1.55}

/* ── SAVED PREPS LIST ── */
.preps-list{display:flex;flex-direction:column;gap:10px}
.prep-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--border);border-radius:14px;background:#fff;transition:all .16s;cursor:pointer}
.prep-row:hover{border-color:var(--gb);background:var(--gl);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.06)}
.prep-row:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.prep-row-ic{width:40px;height:40px;border-radius:11px;background:var(--gl);border:1.5px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.prep-row-company{font-size:13.5px;font-weight:800;color:var(--t)}
.prep-row-role{font-size:12px;color:var(--t3);margin-top:1px}
.prep-row-meta{display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap}
.prep-row-pill{font-size:10px;font-weight:700;padding:2px 9px;border-radius:99px}
.prep-row-pill.beginner{background:#dcfce7;color:#15803d}
.prep-row-pill.intermediate{background:#fef9c3;color:#a16207}
.prep-row-pill.advanced{background:#fee2e2;color:#dc2626}
.prep-row-date{font-size:11px;color:var(--t3);display:flex;align-items:center;gap:4px}
.prep-row-actions{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
.prep-row-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .14s;color:var(--t3)}
.prep-row-btn:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.prep-row-btn:hover.view{border-color:var(--gb);color:var(--g);background:var(--gl)}
.prep-row-btn:hover.del{border-color:#fca5a5;color:#dc2626;background:#fff5f5}
.prep-row-btn.del.confirm{border-color:#dc2626;background:#fee2e2;color:#dc2626;width:auto;padding:0 10px;font-size:11px;font-weight:700;font-family:'Poppins',sans-serif;gap:5px}
.prep-empty{text-align:center;padding:40px 20px;color:var(--t3)}
.prep-empty-icon{font-size:40px;margin-bottom:12px}
.prep-empty-t{font-size:14px;font-weight:700;color:var(--t2);margin-bottom:6px}
.prep-empty-s{font-size:12.5px;line-height:1.6}

/* ── FORM ── */
.lbl{font-size:10px;font-weight:700;color:var(--g);letter-spacing:.09em;text-transform:uppercase;margin-bottom:5px;display:block}
.inp{width:100%;padding:11px 14px;border:2px solid var(--border);border-radius:12px;font-family:'Poppins',sans-serif;font-size:13px;color:var(--t);outline:none;transition:all .18s;background:#fafffe}
.inp:focus{border-color:var(--g);background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
.inp::placeholder{color:var(--t3)}
.inp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.ta{width:100%;min-height:120px;padding:13px 15px;border:2px solid var(--border);border-radius:12px;font-family:'Poppins',sans-serif;font-size:13px;line-height:1.7;color:var(--t);resize:vertical;outline:none;transition:all .18s;background:#fafffe;margin-bottom:14px}
.ta:focus{border-color:var(--g);background:#fff;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
.ta::placeholder{color:var(--t3)}
.lvl-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}
.lvl-btn{padding:7px 16px;border-radius:10px;border:2px solid var(--border);background:#fff;font-family:'Poppins',sans-serif;font-size:12.5px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .16s}
.lvl-btn:hover{border-color:var(--gb);background:var(--gl)}
.lvl-btn:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.lvl-btn.on{border-color:var(--g);background:var(--gl);color:var(--gd)}
.gen-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,#0a2e14,#16a34a);color:#fff;font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(20,83,45,.3);transition:all .2s;margin-top:6px}
.gen-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(20,83,45,.4)}
.gen-btn:disabled{opacity:.5;pointer-events:none}
.gen-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}

/* ── LOADER ── */
.loader-wrap{text-align:center;padding:56px 24px}
.loader-spin{width:52px;height:52px;border:3.5px solid var(--gm);border-top-color:var(--g);border-radius:50%;animation:spin .75s linear infinite;margin:0 auto 22px}
.loader-ttl{font-size:17px;font-weight:800;color:var(--t);margin-bottom:8px}
.loader-sub{font-size:13px;color:var(--t3);line-height:1.65;margin-bottom:22px}
.loader-prog{width:100%;max-width:340px;margin:0 auto 20px}
.loader-prog-bar{height:6px;background:var(--gm);border-radius:99px;overflow:hidden}
.loader-prog-fill{height:100%;background:linear-gradient(90deg,#14532d,#16a34a);border-radius:99px;transition:width 1.2s ease}
.loader-steps{display:flex;flex-direction:column;gap:7px;align-items:center}
.loader-step{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:7px}
.loader-step.active{color:var(--g);font-weight:600}
.loader-step.done{color:#86efac}

/* ── SAVE BADGE ── */
.save-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--g);background:var(--gl);border:1px solid var(--gb);padding:4px 10px;border-radius:99px}
.save-badge.saving{color:var(--t3);border-color:var(--border);background:#f8fafc}
.save-badge.err{color:#dc2626;border-color:#fca5a5;background:#fff5f5}

/* ── PLAN SECTIONS ── */
.sec-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.sec-ico{width:38px;height:38px;border-radius:11px;background:var(--gl);border:1.5px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.sec-ttl{font-size:15px;font-weight:800;color:var(--t)}
.sec-sub{font-size:12px;color:var(--t3);margin-top:2px}
.ov-summary{font-size:13.5px;color:var(--t2);line-height:1.75;padding:16px;background:var(--gl);border-radius:12px;border:1px solid var(--border);margin-bottom:16px}
.process-list{display:flex;flex-direction:column;gap:6px}
.process-item{display:flex;align-items:flex-start;gap:10px;padding:10px 13px;background:#fff;border:1px solid var(--border);border-radius:10px}
.process-n{width:22px;height:22px;border-radius:6px;background:var(--gd);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.process-t{font-size:12.5px;color:var(--t2);line-height:1.45}
.info-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.info-pill{padding:6px 13px;border-radius:10px;background:var(--gl);border:1.5px solid var(--gb);font-size:12px;font-weight:600;color:var(--gd)}
.skill-list{display:flex;flex-direction:column;gap:9px}
.skill-row{display:flex;align-items:flex-start;gap:12px;padding:14px 15px;background:var(--gl);border:1.5px solid var(--border);border-radius:13px;transition:border-color .15s}
.skill-row:hover{border-color:var(--gb)}
.skill-em{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.skill-name{font-size:13px;font-weight:700;color:var(--t)}
.skill-note{font-size:11.5px;color:var(--t3);margin-top:3px;line-height:1.45}
.skill-topics{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.skill-topic{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:6px;background:#fff;border:1px solid var(--border);color:var(--t2)}
.skill-lvl{font-size:9.5px;font-weight:800;padding:3px 10px;border-radius:99px;flex-shrink:0;margin-top:1px}
.skill-lvl.must{background:#fee2e2;color:#dc2626}
.skill-lvl.core{background:#fef9c3;color:#a16207}
.skill-lvl.good{background:#dcfce7;color:#15803d}
.phase-list{display:flex;flex-direction:column;gap:10px}
.phase{border:1.5px solid var(--border);border-radius:14px;overflow:hidden}
.phase-hd{display:flex;align-items:center;gap:10px;padding:15px 17px;background:var(--gl);cursor:pointer;user-select:none}
.phase-hd:focus-visible{outline:2px solid var(--g);outline-offset:-2px}
.phase-num{width:28px;height:28px;border-radius:8px;background:var(--gd);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
.phase-ttl{font-size:13.5px;font-weight:700;color:var(--t);flex:1}
.phase-goal{font-size:11px;color:var(--t3);margin-top:2px}
.phase-wks{font-size:11px;color:var(--t3);margin-right:4px;flex-shrink:0}
.phase-badge{font-size:9px;font-weight:800;padding:3px 9px;border-radius:99px;letter-spacing:.06em;text-transform:uppercase;flex-shrink:0}
.phase-badge.p1{background:#dbeafe;color:#1e40af}
.phase-badge.p2{background:#fef9c3;color:#a16207}
.phase-badge.p3{background:#f3e8ff;color:#6b21a8}
.phase-body{max-height:0;overflow:hidden;transition:max-height .42s ease}
.phase.open .phase-body{max-height:2000px}
.phase-items{padding:6px 17px 17px;display:flex;flex-direction:column;gap:9px}
.pitem{display:flex;gap:11px;padding:12px 13px;background:#fff;border:1px solid var(--border);border-radius:11px}
.pitem-n{width:22px;height:22px;border-radius:6px;background:var(--gd);color:#fff;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.pitem-topic{font-size:13px;font-weight:700;color:var(--t)}
.pitem-why{font-size:11.5px;color:var(--t3);margin-top:3px;line-height:1.5}
.pitem-out{font-size:11px;color:var(--g);font-weight:600;margin-top:5px;display:flex;align-items:center;gap:4px}
.pitem-res{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
.pitem-res-a{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:7px;background:#f0fdf4;border:1px solid var(--gb);color:var(--gd);text-decoration:none;display:flex;align-items:center;gap:4px;transition:all .14s}
.pitem-res-a:hover{background:var(--gm)}
.iq-tabs{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.iq-tab{padding:7px 14px;border-radius:10px;border:2px solid var(--border);background:#fff;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .15s}
.iq-tab:hover{border-color:var(--gb);background:var(--gl)}
.iq-tab:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.iq-tab.on{border-color:var(--g);background:var(--gl);color:var(--gd)}
.iq-list{display:flex;flex-direction:column;gap:8px}
.iq-item{border:1.5px solid var(--border);border-radius:13px;overflow:hidden;transition:border-color .18s}
.iq-item:hover{border-color:var(--gb)}
.iq-item.open{border-color:var(--g)}
.iq-hd{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;cursor:pointer;background:var(--gl);user-select:none}
.iq-hd:focus-visible{outline:2px solid var(--g);outline-offset:-2px}
.iq-n{width:26px;height:26px;border-radius:7px;background:var(--gd);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;margin-top:1px}
.iq-q{flex:1;font-size:13px;font-weight:600;color:var(--t);line-height:1.5}
.iq-diff{font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:99px;flex-shrink:0;margin-top:1px}
.iq-diff.easy{background:#dcfce7;color:#15803d}
.iq-diff.medium{background:#fef9c3;color:#a16207}
.iq-diff.hard{background:#fee2e2;color:#dc2626}
.iq-body{max-height:0;overflow:hidden;transition:max-height .35s ease}
.iq-item.open .iq-body{max-height:600px}
.iq-inner{padding:0 16px 16px}
.iq-hint{font-size:12.5px;color:var(--t2);line-height:1.65;background:#f8fafc;border-radius:10px;padding:12px 14px;margin-top:14px;border:1px solid var(--border)}
.iq-hint-lbl{font-size:10px;font-weight:700;color:var(--g);letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
.iq-kps{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.iq-kp{font-size:11px;font-weight:600;padding:3px 9px;border-radius:7px;background:#fff;border:1px solid var(--border);color:var(--t2)}
.iq-ta{width:100%;min-height:82px;padding:11px 13px;border:2px solid var(--border);border-radius:10px;font-family:'Poppins',sans-serif;font-size:13px;resize:vertical;outline:none;transition:all .16s;line-height:1.65;color:var(--t);margin-top:12px}
.iq-ta:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(22,163,74,.1)}
.iq-ta::placeholder{color:var(--t3)}
.iq-saved{display:flex;align-items:center;gap:5px;font-size:12px;color:#15803d;font-weight:600;margin-top:6px}
.proj-list{display:flex;flex-direction:column;gap:14px}
.proj-card{border:1.5px solid var(--border);border-radius:16px;overflow:hidden;transition:all .18s}
.proj-card:hover{border-color:var(--gb);box-shadow:0 6px 20px rgba(0,0,0,.07)}
.proj-top{padding:18px 18px 14px;background:var(--gl)}
.proj-body{padding:14px 18px 18px}
.proj-hdr{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.proj-em{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:#fff;border:1.5px solid var(--border)}
.proj-name{font-size:15px;font-weight:800;color:var(--t)}
.proj-dp{font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:99px;margin-top:3px;display:inline-flex}
.proj-dp.beginner{background:#dcfce7;color:#15803d}
.proj-dp.intermediate{background:#fef9c3;color:#a16207}
.proj-dp.advanced{background:#fee2e2;color:#dc2626}
.proj-tagline{font-size:12px;color:var(--t3);margin-top:3px;font-style:italic}
.proj-desc{font-size:13px;color:var(--t2);line-height:1.7}
.proj-slbl{font-size:10px;font-weight:700;color:var(--g);letter-spacing:.08em;text-transform:uppercase;margin:12px 0 6px}
.proj-feats{display:flex;flex-direction:column;gap:5px}
.proj-feat{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:var(--t2);line-height:1.5}
.proj-fdot{width:5px;height:5px;border-radius:50%;background:var(--g);flex-shrink:0;margin-top:6px}
.proj-steps{display:flex;flex-direction:column;gap:6px}
.proj-step{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--t2);line-height:1.5}
.proj-sn{width:20px;height:20px;border-radius:5px;background:var(--gd);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.proj-tech-row{display:flex;flex-wrap:wrap;gap:5px}
.proj-tech{padding:3px 10px;background:#fff;border:1px solid var(--border);border-radius:7px;font-size:10.5px;font-weight:600;color:var(--t2)}
.proj-why{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--g);font-weight:600;padding:9px 12px;background:#fff;border-radius:9px;border:1px solid var(--gb);margin-top:12px}
.proj-done-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1.5px solid var(--border);background:#fff;font-family:'Poppins',sans-serif;font-size:11.5px;font-weight:600;cursor:pointer;color:var(--t2);transition:all .15s;margin-top:12px}
.proj-done-btn:hover{background:var(--gm);border-color:var(--gb);color:var(--gd)}
.proj-done-btn.done{background:var(--gm);border-color:var(--gb);color:var(--gd)}
.res-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.res-card{border:1.5px solid var(--border);border-radius:13px;padding:15px;background:var(--gl);text-decoration:none;display:block;transition:all .18s}
.res-card:hover{border-color:var(--gb);transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.07)}
.res-pill{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:99px;display:inline-block;margin-bottom:7px}
.res-pill.yt{background:#fee2e2;color:#dc2626}
.res-pill.doc{background:#dbeafe;color:#1e40af}
.res-pill.article{background:#f3e8ff;color:#6b21a8}
.res-pill.book{background:#fef9c3;color:#a16207}
.res-pill.course{background:#ecfdf5;color:#065f46}
.res-title{font-size:12.5px;font-weight:700;color:var(--t);line-height:1.4;margin-bottom:4px}
.res-desc{font-size:11px;color:var(--t3);line-height:1.5}
.tl-list{display:flex;flex-direction:column}
.tl-row{display:flex;position:relative}
.tl-row::before{content:'';position:absolute;left:17px;top:36px;bottom:0;width:2px;background:var(--gm)}
.tl-row:last-child::before{display:none}
.tl-dot{width:34px;height:34px;border-radius:50%;background:var(--gd);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;z-index:1;margin-top:8px;align-self:flex-start}
.tl-content{flex:1;padding:8px 0 24px 14px}
.tl-wk{font-size:11.5px;font-weight:700;color:var(--gd);margin-bottom:7px;text-transform:uppercase;letter-spacing:.06em}
.tl-tasks{display:flex;flex-direction:column;gap:5px}
.tl-task{font-size:12.5px;color:var(--t2);display:flex;align-items:flex-start;gap:7px;padding:7px 11px;background:#fff;border-radius:8px;border:1px solid var(--border)}
.tl-td{width:5px;height:5px;border-radius:50%;background:var(--g);flex-shrink:0;margin-top:5px}
.tips-list{display:flex;flex-direction:column;gap:8px}
.tip-item{display:flex;align-items:flex-start;gap:10px;padding:13px 15px;border-radius:12px;border:1.5px solid var(--border);background:var(--gl)}
.tip-em{font-size:18px;flex-shrink:0;width:26px;text-align:center;margin-top:1px}
.tip-txt{font-size:12.5px;color:var(--t2);line-height:1.6}
.sec-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:2px solid var(--gb);background:#fff;color:var(--gd);font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.sec-btn:hover{background:var(--gl)}
.sec-btn:focus-visible{outline:2px solid var(--g);outline-offset:2px}
.err-box{display:flex;align-items:flex-start;gap:8px;color:#dc2626;font-size:12.5px;margin:8px 0;padding:10px 13px;background:#fff5f5;border:1.5px solid #fca5a5;border-radius:10px;line-height:1.5}

@media(max-width:620px){
  .pp-hero{padding:22px 18px 20px}
  .inp-row{grid-template-columns:1fr}
  .res-grid{grid-template-columns:1fr}
  .iq-tabs{gap:4px}
  .iq-tab{padding:6px 10px;font-size:11px}
}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function niceDate(ts) {
    if (!ts) return "";
    try {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ts));
    } catch { return ""; }
}

function companyEmoji(company = "") {
    const c = company.toLowerCase();
    if (c.includes("google")) return "🔍";
    if (c.includes("anthropic")) return "🤖";
    if (c.includes("meta")) return "🌐";
    if (c.includes("apple")) return "🍎";
    if (c.includes("amazon")) return "📦";
    if (c.includes("stripe")) return "💳";
    if (c.includes("netflix")) return "🎬";
    if (c.includes("airbnb")) return "🏠";
    if (c.includes("uber")) return "🚗";
    if (c.includes("figma")) return "🎨";
    if (c.includes("vercel")) return "▲";
    if (c.includes("openai")) return "✨";
    return "🏢";
}

// Fires onActivate on Enter/Space — lets a non-button element behave like one.
function onKeyActivate(fn) {
    return (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fn(e);
        }
    };
}

// ─── GEMINI API ───────────────────────────────────────────────────────────────
async function callGemini(prompt) {
    const key = import.meta.env.VITE_GEMINI_KEY;
    if (!key) throw new Error("VITE_GEMINI_KEY is not set in your .env file");

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) throw new Error("Empty response from Gemini");
    return text;
}

function parseJSON(str) {
    try { return JSON.parse(str); } catch { }
    try {
        const s = str.replace(/```json/gi, "").replace(/```/g, "").trim();
        const a = s.indexOf("{"), b = s.lastIndexOf("}");
        if (a === -1 || b === -1) return null;
        return JSON.parse(s.slice(a, b + 1));
    } catch { return null; }
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
function prompt1(role, company, level, jd, notes) {
    return `You are a world-class technical career coach. Generate a structured interview preparation guide.

Role: ${role}
Company: ${company}
Candidate level: ${level}
${jd ? `Job description: ${jd.slice(0, 800)}` : ""}
${notes ? `Candidate notes: ${notes}` : ""}

Return ONLY valid JSON, no markdown, no extra text:

{
  "overview": {
    "summary": "3-4 sentence expert overview of landing ${role} at ${company}. Be specific.",
    "interviewProcess": ["Stage 1", "Stage 2", "Stage 3", "Stage 4"],
    "companyFocus": "What ${company} values in ${role} candidates — 2 sentences.",
    "timeToReady": "e.g. 4-6 weeks for intermediate"
  },
  "mustKnowSkills": [
    { "emoji": "⚛️", "name": "Skill", "level": "must", "note": "Why ${company} tests this deeply", "topics": ["topic1","topic2","topic3","topic4"] }
  ],
  "roadmap": [
    { "phase": "Foundation", "weeks": "Week 1-2", "goal": "Single sentence goal", "items": [{ "topic": "Concept", "why": "Why for ${company}", "outcome": "What you can do after", "resources": [{ "label": "Name", "url": "https://example.com", "type": "yt" }] }] },
    { "phase": "Core Skills", "weeks": "Week 3-4", "goal": "Goal", "items": [] },
    { "phase": "Company-Specific", "weeks": "Week 5-6", "goal": "Goal", "items": [] }
  ],
  "resources": [
    { "type": "yt",      "title": "Title", "desc": "Why", "url": "https://youtube.com/results?search_query=${encodeURIComponent(role + " " + company + " interview")}" },
    { "type": "doc",     "title": "Title", "desc": "Why", "url": "https://example.com" },
    { "type": "course",  "title": "Title", "desc": "Why", "url": "https://example.com" },
    { "type": "article", "title": "Title", "desc": "Why", "url": "https://example.com" },
    { "type": "book",    "title": "Title", "desc": "Why", "url": "#" }
  ],
  "timeline": [
    { "week": "Week 1", "focus": "Theme", "tasks": ["task1","task2","task3","task4"] },
    { "week": "Week 2", "focus": "Theme", "tasks": ["task1","task2","task3","task4"] },
    { "week": "Week 3", "focus": "Theme", "tasks": ["task1","task2","task3"] },
    { "week": "Week 4", "focus": "Theme", "tasks": ["task1","task2","task3"] },
    { "week": "Week 5", "focus": "Theme", "tasks": ["task1","task2","task3"] },
    { "week": "Week 6", "focus": "Final prep", "tasks": ["task1","task2","task3"] }
  ]
}

mustKnowSkills: 6-8 items. Each roadmap phase: 3-5 items. Be SPECIFIC to ${company}.`;
}

function prompt2(role, company, level, jd) {
    return `You are a world-class technical career coach. Generate interview questions and projects.

Role: ${role}
Company: ${company}
Candidate level: ${level}
${jd ? `Job description snippet: ${jd.slice(0, 500)}` : ""}

Return ONLY valid JSON, no markdown, no extra text:

{
  "interviewQuestions": {
    "technical":   [{ "q": "Question", "diff": "medium", "hint": "How to approach — what ${company} tests", "keyPoints": ["kp1","kp2","kp3"] }],
    "behavioural": [{ "q": "Question", "diff": "medium", "hint": "What ${company} wants to hear", "keyPoints": ["kp1","kp2"] }],
    "system":      [{ "q": "Design question", "diff": "hard", "hint": "How ${company} evaluates this", "keyPoints": ["kp1","kp2","kp3"] }],
    "company":     [{ "q": "Culture question", "diff": "medium", "hint": "What they look for", "keyPoints": ["kp1","kp2"] }]
  },
  "projects": [
    { "emoji": "🛠️", "name": "Project name", "difficulty": "beginner", "tagline": "Hook", "desc": "3 sentences", "features": ["f1","f2","f3","f4","f5"], "steps": ["s1","s2","s3","s4","s5"], "tech": ["t1","t2","t3"], "learns": ["l1","l2","l3"], "why": "Why this impresses ${company}" },
    { "emoji": "⚡", "name": "Project 2", "difficulty": "intermediate", "tagline": "Hook", "desc": "3 sentences", "features": ["f1","f2","f3","f4"], "steps": ["s1","s2","s3","s4","s5"], "tech": ["t1","t2","t3"], "learns": ["l1","l2","l3"], "why": "Why this impresses ${company}" }
  ],
  "insiderTips": [
    { "emoji": "💡", "tip": "Insider tip about ${company}" },
    { "emoji": "⚠️", "tip": "Common mistake at ${company}" },
    { "emoji": "🎯", "tip": "What sets top candidates apart" },
    { "emoji": "🌱", "tip": "What ${company} values beyond tech" },
    { "emoji": "📝", "tip": "Day-of-interview tip" }
  ]
}

technical: 5-6 Qs. behavioural: 4-5 Qs. system: 3-4 Qs. company: 3-4 Qs. Be SPECIFIC to ${company}.`;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PrepPage({ job, onBack }) {
    // view: "list" | "form" | "loading" | "plan"
    const [view, setView] = useState("list");
    const [preps, setPreps] = useState([]);        // saved preps from DB
    const [loading, setLoading] = useState(true);      // initial DB fetch
    const [listError, setListError] = useState("");    // error loading the list
    const [deleting, setDeleting] = useState(null);      // id being deleted
    const [confirmDeleteId, setConfirmDeleteId] = useState(null); // two-step delete

    // form fields
    const [role, setRole] = useState((job && job.role) || "");
    const [company, setCompany] = useState((job && job.company) || "");
    const [level, setLevel] = useState("intermediate");
    const [jd, setJd] = useState((job && job.jd_text) || "");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    // active plan
    const [plan, setPlan] = useState(null);
    const [currentId, setCurrentId] = useState(null); // supabase row id
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);

    // progress
    const [progStep, setProgStep] = useState(0);
    const STEPS = [
        "Researching the company & role…",
        "Mapping required skills…",
        "Building your learning roadmap…",
        "Writing interview questions…",
        "Designing company-specific projects…",
        "Assembling your full guide…",
    ];

    // plan interaction
    const [activeQTab, setActiveQTab] = useState("technical");
    const [openQs, setOpenQs] = useState({});
    const [qAnswers, setQAnswers] = useState({});
    const [doneProjects, setDoneProjects] = useState({});
    const [openPhases, setOpenPhases] = useState({ 0: true });

    const saveTimer = useRef(null);
    const tickerRef = useRef(null);
    const isMounted = useRef(true);
    const confirmTimer = useRef(null);

    // ── Lifecycle: guard against setState-after-unmount + clean up timers ──
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            clearTimeout(saveTimer.current);
            clearInterval(tickerRef.current);
            clearTimeout(confirmTimer.current);
        };
    }, []);

    // ── Load saved preps ────────────────────────────────────────────────────
    useEffect(() => {
        fetchPreps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchPreps() {
        setLoading(true);
        setListError("");
        try {
            const { data, error } = await supabase
                .from("interview_preps")
                .select("id, role, company, level, created_at, plan")
                .order("created_at", { ascending: false });
            if (!isMounted.current) return;
            if (error) {
                setListError("Couldn't load your saved preps. Please refresh.");
            } else {
                setPreps(data || []);
            }
        } catch {
            if (isMounted.current) setListError("Couldn't load your saved preps. Please refresh.");
        }
        if (isMounted.current) setLoading(false);
    }

    // ── Open a saved prep ───────────────────────────────────────────────────
    async function openPrep(prep) {
        setError("");
        const { data, error } = await supabase
            .from("interview_preps")
            .select("*")
            .eq("id", prep.id)
            .single();
        if (!isMounted.current) return;
        if (error || !data) {
            setListError("Couldn't open that prep guide. Please try again.");
            return;
        }

        setRole(data.role);
        setCompany(data.company);
        setLevel(data.level);
        setPlan(data.plan);
        setCurrentId(data.id);
        setQAnswers(data.q_answers || {});
        setDoneProjects(data.done_projects || {});
        setOpenPhases({ 0: true });
        setActiveQTab("technical");
        setView("plan");
    }

    // ── Delete a prep (two-step confirm) ────────────────────────────────────
    function handleDeleteClick(id, e) {
        e.stopPropagation();
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            clearTimeout(confirmTimer.current);
            confirmTimer.current = setTimeout(() => {
                if (isMounted.current) setConfirmDeleteId(null);
            }, 3000);
            return;
        }
        clearTimeout(confirmTimer.current);
        setConfirmDeleteId(null);
        deletePrep(id);
    }

    async function deletePrep(id) {
        setDeleting(id);
        const { error } = await supabase.from("interview_preps").delete().eq("id", id);
        if (!isMounted.current) return;
        if (error) {
            setListError("Couldn't delete that prep guide. Please try again.");
        } else {
            setPreps(prev => prev.filter(p => p.id !== id));
        }
        setDeleting(null);
    }

    // ── Generate new plan ───────────────────────────────────────────────────
    async function generate() {
        if (!role.trim()) { setError("Please enter the job role."); return; }
        if (!company.trim()) { setError("Please enter the company name."); return; }
        setError("");
        setProgStep(0);
        setView("loading");

        tickerRef.current = setInterval(() => {
            if (!isMounted.current) return;
            setProgStep(p => Math.min(p + 1, STEPS.length - 1));
        }, 2800);

        try {
            const [raw1, raw2] = await Promise.all([
                callGemini(prompt1(role, company, level, jd, notes)),
                callGemini(prompt2(role, company, level, jd)),
            ]);
            clearInterval(tickerRef.current);

            const p1 = parseJSON(raw1);
            const p2 = parseJSON(raw2);
            if (!p1 && !p2) throw new Error("AI returned unparseable responses. Please try again.");

            const merged = { ...(p1 || {}), ...(p2 || {}) };

            // Auth check — don't crash on user being null
            const { data: userData, error: userErr } = await supabase.auth.getUser();
            const user = userData?.user;
            if (userErr || !user) {
                throw new Error("You're signed out — please sign in again to save this guide.");
            }

            setSaving(true);
            const { data: row, error: insertErr } = await supabase
                .from("interview_preps")
                .insert({
                    user_id: user.id,
                    job_id: (job && job.id) || null,
                    role,
                    company,
                    level,
                    plan: merged,
                    q_answers: {},
                    done_projects: {},
                })
                .select("id")
                .single();
            if (!isMounted.current) return;
            setSaving(false);

            if (!insertErr && row) {
                setCurrentId(row.id);
                setPreps(prev => [{ id: row.id, role, company, level, created_at: new Date().toISOString(), plan: merged }, ...prev]);
            } else {
                // Plan still renders — it just isn't saved. Surface that clearly.
                setSaveError(true);
            }

            setPlan(merged);
            setQAnswers({});
            setDoneProjects({});
            setOpenPhases({ 0: true });
            setActiveQTab("technical");
            setView("plan");
        } catch (e) {
            clearInterval(tickerRef.current);
            if (!isMounted.current) return;
            setSaving(false);
            console.error(e);
            setError(e.message);
            setView("form");
        }
    }

    // ── Auto-save q_answers + done_projects (debounced 1.5s) ────────────────
    const autosave = useCallback(async (answers, done) => {
        if (!currentId) return;
        setSaving(true);
        const { error } = await supabase
            .from("interview_preps")
            .update({ q_answers: answers, done_projects: done })
            .eq("id", currentId);
        if (!isMounted.current) return;
        setSaving(false);
        setSaveError(!!error);
    }, [currentId]);

    function updateAnswers(newAnswers) {
        setQAnswers(newAnswers);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => autosave(newAnswers, doneProjects), 1500);
    }

    function updateDone(newDone) {
        setDoneProjects(newDone);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => autosave(qAnswers, newDone), 1500);
    }

    // ── Derived ─────────────────────────────────────────────────────────────
    const allQs = plan ? [
        ...((plan.interviewQuestions?.technical || []).map(q => ({ ...q, cat: "technical" }))),
        ...((plan.interviewQuestions?.behavioural || []).map(q => ({ ...q, cat: "behavioural" }))),
        ...((plan.interviewQuestions?.system || []).map(q => ({ ...q, cat: "system" }))),
        ...((plan.interviewQuestions?.company || []).map(q => ({ ...q, cat: "company" }))),
    ] : [];
    const tabQs = plan ? (plan.interviewQuestions?.[activeQTab] || []) : [];
    const answeredCount = Object.values(qAnswers).filter(v => (v || "").trim().length > 15).length;
    const doneCount = Object.values(doneProjects).filter(Boolean).length;
    const progressPct = Math.round(((progStep + 1) / STEPS.length) * 100);

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <>
            <style>{CSS}</style>
            <div className="pp-root">

                <button className="pp-back" onClick={view === "list" ? onBack : () => setView("list")}>
                    <Pi n="arrowL" size={14} />{view === "list" ? "Back to job" : "All preps"}
                </button>

                {/* HERO */}
                <div className="pp-hero">
                    <div className="pp-hero-ey">
                        {view === "plan" && plan ? `${company} · ${role}` : "Career Garden · AI Prep"}
                    </div>
                    <div className="pp-hero-t">
                        {view === "plan" && plan
                            ? `Full prep guide: ${role} at ${company}`
                            : view === "form" ? "New Prep Guide"
                                : "Interview Preparation"}
                    </div>
                    <div className="pp-hero-s">
                        {view === "plan" && plan
                            ? `${allQs.length} practice questions · 2 projects · full roadmap · insider tips`
                            : view === "form"
                                ? "Enter the role and company — get a complete expert prep guide in ~20 seconds."
                                : "All your AI-generated prep guides. Pick one to continue or generate a new one."}
                    </div>
                </div>

                {/* ── VIEW: LIST ── */}
                {view === "list" && (
                    <div className="pp-card" style={{ animation: "pop .3s ease" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div>
                                <div className="pp-card-ttl" style={{ marginBottom: 2 }}>
                                    <Pi n="briefcase" size={16} color="var(--g)" />Saved prep guides
                                </div>
                                <div style={{ fontSize: 12.5, color: "var(--t3)" }}>
                                    {loading ? "Loading…" : `${preps.length} guide${preps.length !== 1 ? "s" : ""} saved`}
                                </div>
                            </div>
                            <button className="gen-btn" style={{ width: "auto", padding: "10px 18px", margin: 0 }}
                                onClick={() => { setError(""); setView("form"); }}>
                                <Pi n="plus" size={15} />New guide
                            </button>
                        </div>

                        {listError && (
                            <div className="err-box">
                                <Pi n="info" size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />{listError}
                            </div>
                        )}

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "32px 0" }}>
                                <div style={{ width: 32, height: 32, border: "3px solid var(--gm)", borderTopColor: "var(--g)", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
                                <div style={{ fontSize: 13, color: "var(--t3)" }}>Loading your preps…</div>
                            </div>
                        ) : preps.length === 0 ? (
                            <div className="prep-empty">
                                <div className="prep-empty-icon">🌱</div>
                                <div className="prep-empty-t">No prep guides yet</div>
                                <div className="prep-empty-s">Generate your first guide — just enter a role and company and the AI does the rest.</div>
                            </div>
                        ) : (
                            <div className="preps-list">
                                {preps.map(prep => (
                                    <div key={prep.id} className="prep-row" role="button" tabIndex={0}
                                        onClick={() => openPrep(prep)}
                                        onKeyDown={onKeyActivate(() => openPrep(prep))}
                                        aria-label={`Open prep guide for ${prep.role} at ${prep.company}`}>
                                        <div className="prep-row-ic">{companyEmoji(prep.company)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="prep-row-company">{prep.company}</div>
                                            <div className="prep-row-role">{prep.role}</div>
                                            <div className="prep-row-meta">
                                                <span className={`prep-row-pill ${prep.level || "intermediate"}`}>{prep.level}</span>
                                                <span className="prep-row-date">
                                                    <Pi n="clock" size={10} color="var(--t3)" />{niceDate(prep.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="prep-row-actions" onClick={e => e.stopPropagation()}>
                                            <button className="prep-row-btn view" onClick={() => openPrep(prep)} title="Open" aria-label="Open prep guide">
                                                <Pi n="eye" size={14} color="var(--t3)" />
                                            </button>
                                            <button
                                                className={`prep-row-btn del${confirmDeleteId === prep.id ? " confirm" : ""}`}
                                                title={confirmDeleteId === prep.id ? "Click again to confirm" : "Delete"}
                                                aria-label={confirmDeleteId === prep.id ? "Confirm delete" : "Delete prep guide"}
                                                onClick={e => handleDeleteClick(prep.id, e)}
                                                disabled={deleting === prep.id}
                                                style={{ opacity: deleting === prep.id ? .5 : 1 }}>
                                                {confirmDeleteId === prep.id
                                                    ? "Confirm?"
                                                    : <Pi n="trash" size={14} color="var(--t3)" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── VIEW: FORM ── */}
                {view === "form" && (
                    <div className="pp-card" style={{ animation: "pop .3s ease" }}>
                        <div className="pp-card-ttl">
                            <Pi n="zap" size={16} color="var(--g)" />What are you preparing for?
                        </div>
                        <div className="pp-card-sub">
                            Just role + company is enough. Paste the JD for an even more targeted plan.
                        </div>

                        <div className="inp-row">
                            <div>
                                <label className="lbl" htmlFor="pp-role">Role *</label>
                                <input id="pp-role" className="inp" placeholder="e.g. Frontend Engineer" value={role} onChange={e => setRole(e.target.value)} />
                            </div>
                            <div>
                                <label className="lbl" htmlFor="pp-company">Company *</label>
                                <input id="pp-company" className="inp" placeholder="e.g. Anthropic" value={company} onChange={e => setCompany(e.target.value)} />
                            </div>
                        </div>

                        <label className="lbl" id="pp-level-lbl">Your level</label>
                        <div className="lvl-row" role="radiogroup" aria-labelledby="pp-level-lbl">
                            {[{ v: "beginner", l: "🌱 Beginner" }, { v: "intermediate", l: "🌿 Intermediate" }, { v: "advanced", l: "🌳 Advanced" }].map(o => (
                                <button key={o.v} className={`lvl-btn${level === o.v ? " on" : ""}`} role="radio" aria-checked={level === o.v} onClick={() => setLevel(o.v)}>{o.l}</button>
                            ))}
                        </div>

                        <label className="lbl" htmlFor="pp-jd">Job description <span style={{ color: "var(--t3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                        <textarea id="pp-jd" className="ta" placeholder="Paste the job description for a more targeted plan, or leave blank." value={jd} onChange={e => setJd(e.target.value)} />

                        <label className="lbl" htmlFor="pp-notes">Anything else? <span style={{ color: "var(--t3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                        <input id="pp-notes" className="inp" style={{ marginBottom: 6 }} placeholder="e.g. 2 weeks to prep, weakest in system design, 2 yrs React…" value={notes} onChange={e => setNotes(e.target.value)} />

                        {error && (
                            <div className="err-box">
                                <Pi n="info" size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />{error}
                            </div>
                        )}
                        <button className="gen-btn" onClick={generate} disabled={!role.trim() || !company.trim()}>
                            <Pi n="zap" size={16} />Generate My Full Prep Guide
                        </button>
                    </div>
                )}

                {/* ── VIEW: LOADING ── */}
                {view === "loading" && (
                    <div className="pp-card loader-wrap" role="status" aria-live="polite">
                        <div className="loader-spin" />
                        <div className="loader-ttl">Building your expert prep guide…</div>
                        <div className="loader-sub">Two AI calls running in parallel — about 15–20 seconds.</div>
                        <div className="loader-prog">
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--t3)", fontWeight: 600, marginBottom: 6 }}>
                                <span>{STEPS[progStep]}</span><span>{progressPct}%</span>
                            </div>
                            <div className="loader-prog-bar">
                                <div className="loader-prog-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                        <div className="loader-steps">
                            {STEPS.map((s, i) => (
                                <div key={i} className={`loader-step${i === progStep ? " active" : i < progStep ? " done" : ""}`}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: i < progStep ? "#4ade80" : i === progStep ? "var(--g)" : "var(--border)", flexShrink: 0, transition: "background .3s" }} />
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── VIEW: PLAN ── */}
                {view === "plan" && plan && (
                    <>
                        {/* Save status badge */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 10, gap: 8 }}>
                            <span className={`save-badge${saving ? " saving" : ""}${!saving && saveError ? " err" : ""}`}>
                                {saving
                                    ? <><Pi n="refresh" size={11} color="var(--t3)" style={{ animation: "spin .8s linear infinite" }} />Saving…</>
                                    : saveError
                                        ? <><Pi n="info" size={11} color="#dc2626" />Couldn't save — check your connection</>
                                        : <><Pi n="checkCircle" size={11} color="var(--g)" />Saved to your account</>
                                }
                            </span>
                        </div>

                        {/* 1. OVERVIEW */}
                        <div className="pp-card" style={{ animation: "fadeUp .3s ease both" }}>
                            <div className="sec-hdr">
                                <div className="sec-ico">🎯</div>
                                <div><div className="sec-ttl">What it takes to land this role</div><div className="sec-sub">Expert overview specific to {company}</div></div>
                            </div>
                            {plan.overview?.summary && <div className="ov-summary">{plan.overview.summary}</div>}
                            <div className="info-pills">
                                {plan.overview?.timeToReady && <span className="info-pill">⏱ {plan.overview.timeToReady}</span>}
                                {plan.overview?.companyFocus && <span className="info-pill" style={{ flex: 1, minWidth: 200 }}>🏢 {plan.overview.companyFocus}</span>}
                            </div>
                            {(plan.overview?.interviewProcess || []).length > 0 && (
                                <>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--g)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 9 }}>Interview process at {company}</div>
                                    <div className="process-list">
                                        {plan.overview.interviewProcess.map((s, i) => (
                                            <div key={i} className="process-item">
                                                <div className="process-n">{i + 1}</div>
                                                <div className="process-t">{s}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 2. SKILLS */}
                        {(plan.mustKnowSkills || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .06s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">💪</div>
                                    <div><div className="sec-ttl">Must-know skills</div><div className="sec-sub">What {company} actually tests — with specific topics to study</div></div>
                                </div>
                                <div className="skill-list">
                                    {plan.mustKnowSkills.map((sk, i) => (
                                        <div key={i} className="skill-row">
                                            <div className="skill-em" style={{ background: sk.level === "must" ? "#fff0f0" : sk.level === "core" ? "#fffbeb" : "#f0fdf4" }}>{sk.emoji || "🔧"}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="skill-name">{sk.name}</div>
                                                <div className="skill-note">{sk.note}</div>
                                                {(sk.topics || []).length > 0 && (
                                                    <div className="skill-topics">{sk.topics.map(t => <span key={t} className="skill-topic">{t}</span>)}</div>
                                                )}
                                            </div>
                                            <span className={`skill-lvl ${sk.level || "core"}`}>
                                                {sk.level === "must" ? "🔴 Must" : sk.level === "core" ? "🟡 Core" : "🟢 Good"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. ROADMAP */}
                        {(plan.roadmap || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .12s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">🗺️</div>
                                    <div><div className="sec-ttl">Learning roadmap</div><div className="sec-sub">Step-by-step path — every topic links to a resource</div></div>
                                </div>
                                <div className="phase-list">
                                    {plan.roadmap.map((ph, i) => (
                                        <div key={i} className={`phase${openPhases[i] ? " open" : ""}`}>
                                            <div className="phase-hd" role="button" tabIndex={0} aria-expanded={!!openPhases[i]}
                                                onClick={() => setOpenPhases(p => ({ ...p, [i]: !p[i] }))}
                                                onKeyDown={onKeyActivate(() => setOpenPhases(p => ({ ...p, [i]: !p[i] })))}>
                                                <div className="phase-num">{i + 1}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="phase-ttl">{ph.phase}</div>
                                                    {ph.goal && <div className="phase-goal">{ph.goal}</div>}
                                                </div>
                                                <span className="phase-wks">{ph.weeks}</span>
                                                <span className={`phase-badge p${i + 1}`}>Phase {i + 1}</span>
                                                <Pi n="chevR" size={14} color="var(--t3)" style={{ flexShrink: 0, marginLeft: 6, transition: "transform .2s", transform: openPhases[i] ? "rotate(90deg)" : "none" }} />
                                            </div>
                                            <div className="phase-body">
                                                <div className="phase-items">
                                                    {(ph.items || []).map((item, j) => (
                                                        <div key={j} className="pitem">
                                                            <div className="pitem-n">{j + 1}</div>
                                                            <div style={{ flex: 1 }}>
                                                                <div className="pitem-topic">{item.topic}</div>
                                                                {item.why && <div className="pitem-why">{item.why}</div>}
                                                                {item.outcome && <div className="pitem-out"><Pi n="check" size={10} color="var(--g)" />{item.outcome}</div>}
                                                                {(item.resources || []).length > 0 && (
                                                                    <div className="pitem-res">
                                                                        {item.resources.map((r, k) => (
                                                                            <a key={k} href={r.url || "#"} target="_blank" rel="noreferrer" className="pitem-res-a">
                                                                                {r.type === "yt" ? "▶" : r.type === "doc" ? "📄" : "✍"} {r.label}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. QUESTIONS */}
                        <div className="pp-card" style={{ animation: "fadeUp .3s .18s ease both" }}>
                            <div className="sec-hdr">
                                <div className="sec-ico">🎤</div>
                                <div>
                                    <div className="sec-ttl">Practice interview questions</div>
                                    <div className="sec-sub">
                                        {allQs.length} questions · click to expand · hints + answer box
                                        {answeredCount > 0 && <span style={{ fontWeight: 700, color: "var(--gd)" }}> · {answeredCount} answered</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="iq-tabs" role="tablist">
                                {[
                                    { id: "technical", label: "Technical", n: plan.interviewQuestions?.technical?.length || 0 },
                                    { id: "behavioural", label: "Behavioural", n: plan.interviewQuestions?.behavioural?.length || 0 },
                                    { id: "system", label: "System Design", n: plan.interviewQuestions?.system?.length || 0 },
                                    { id: "company", label: "Company", n: plan.interviewQuestions?.company?.length || 0 },
                                ].map(tab => (
                                    <button key={tab.id} className={`iq-tab${activeQTab === tab.id ? " on" : ""}`} role="tab" aria-selected={activeQTab === tab.id} onClick={() => setActiveQTab(tab.id)}>
                                        {tab.label}{tab.n > 0 && <span style={{ opacity: .6 }}> ({tab.n})</span>}
                                    </button>
                                ))}
                            </div>
                            <div className="iq-list">
                                {tabQs.map((q, i) => {
                                    const qid = `${activeQTab}-${i}`;
                                    const isOpen = !!openQs[qid];
                                    return (
                                        <div key={qid} className={`iq-item${isOpen ? " open" : ""}`}>
                                            <div className="iq-hd" role="button" tabIndex={0} aria-expanded={isOpen}
                                                onClick={() => setOpenQs(p => ({ ...p, [qid]: !p[qid] }))}
                                                onKeyDown={onKeyActivate(() => setOpenQs(p => ({ ...p, [qid]: !p[qid] })))}>
                                                <div className="iq-n">{i + 1}</div>
                                                <div className="iq-q">{q.q}</div>
                                                <span className={`iq-diff ${q.diff || "medium"}`}>{q.diff || "medium"}</span>
                                                <Pi n="chevR" size={13} color="var(--t3)" style={{ flexShrink: 0, marginLeft: 4, transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "none" }} />
                                            </div>
                                            <div className="iq-body">
                                                <div className="iq-inner">
                                                    {q.hint && (
                                                        <div className="iq-hint">
                                                            <div className="iq-hint-lbl">💡 How to approach this</div>
                                                            {q.hint}
                                                            {(q.keyPoints || []).length > 0 && (
                                                                <div className="iq-kps">{q.keyPoints.map(kp => <span key={kp} className="iq-kp">{kp}</span>)}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <textarea
                                                        className="iq-ta"
                                                        aria-label={`Your answer to: ${q.q}`}
                                                        placeholder={activeQTab === "behavioural" ? "STAR: Situation → Task → Action → Result" : "Write your answer here…"}
                                                        value={qAnswers[qid] || ""}
                                                        onChange={e => updateAnswers({ ...qAnswers, [qid]: e.target.value })}
                                                    />
                                                    {(qAnswers[qid] || "").trim().length > 15 && (
                                                        <div className="iq-saved"><Pi n="checkCircle" size={13} color="#15803d" />Saved</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. PROJECTS */}
                        {(plan.projects || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .24s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">⚡</div>
                                    <div>
                                        <div className="sec-ttl">Projects to build</div>
                                        <div className="sec-sub">Company-specific projects · <span style={{ fontWeight: 700, color: "var(--gd)" }}>{doneCount}/{plan.projects.length} done</span></div>
                                    </div>
                                </div>
                                <div className="proj-list">
                                    {plan.projects.map((p, i) => (
                                        <div key={i} className="proj-card" style={{ borderTop: `3px solid ${i === 0 ? "#16a34a" : "#3b82f6"}` }}>
                                            <div className="proj-top">
                                                <div className="proj-hdr">
                                                    <div className="proj-em">{p.emoji || "🛠️"}</div>
                                                    <div>
                                                        <div className="proj-name">{p.name}</div>
                                                        <span className={`proj-dp ${p.difficulty || "intermediate"}`}>{p.difficulty || "intermediate"}</span>
                                                        {p.tagline && <div className="proj-tagline">{p.tagline}</div>}
                                                    </div>
                                                </div>
                                                <div className="proj-desc">{p.desc}</div>
                                            </div>
                                            <div className="proj-body">
                                                {(p.features || []).length > 0 && (<><div className="proj-slbl">Features to build</div><div className="proj-feats">{p.features.map((f, j) => <div key={j} className="proj-feat"><div className="proj-fdot" />{f}</div>)}</div></>)}
                                                {(p.steps || []).length > 0 && (<><div className="proj-slbl">Step-by-step guide</div><div className="proj-steps">{p.steps.map((s, j) => <div key={j} className="proj-step"><div className="proj-sn">{j + 1}</div><div>{s.replace(/^Step \d+[:.]\s*/i, "")}</div></div>)}</div></>)}
                                                {(p.tech || []).length > 0 && (<><div className="proj-slbl">Tech stack</div><div className="proj-tech-row">{p.tech.map(t => <span key={t} className="proj-tech">{t}</span>)}</div></>)}
                                                {(p.learns || []).length > 0 && (<><div className="proj-slbl">What you'll learn</div><div className="proj-feats">{p.learns.map((l, j) => <div key={j} className="proj-feat"><div className="proj-fdot" />{l}</div>)}</div></>)}
                                                {p.why && <div className="proj-why"><Pi n="star" size={13} color="var(--g)" style={{ flexShrink: 0, marginTop: 1 }} />{p.why}</div>}
                                                <button
                                                    className={`proj-done-btn${doneProjects[i] ? " done" : ""}`}
                                                    onClick={() => updateDone({ ...doneProjects, [i]: !doneProjects[i] })}
                                                >
                                                    <Pi n={doneProjects[i] ? "checkCircle" : "check"} size={13} color={doneProjects[i] ? "var(--gd)" : "var(--t3)"} />
                                                    {doneProjects[i] ? "Marked as complete!" : "Mark as done"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 6. RESOURCES */}
                        {(plan.resources || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .3s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">📚</div>
                                    <div><div className="sec-ttl">Best resources</div><div className="sec-sub">Curated for {role} at {company}</div></div>
                                </div>
                                <div className="res-grid">
                                    {plan.resources.map((r, i) => (
                                        <a key={i} href={r.url || "#"} target="_blank" rel="noreferrer" className="res-card">
                                            <span className={`res-pill ${r.type || "article"}`}>{r.type === "yt" ? "▶ YouTube" : r.type === "doc" ? "📄 Docs" : r.type === "course" ? "🎓 Course" : r.type === "book" ? "📖 Book" : "✍ Article"}</span>
                                            <div className="res-title">{r.title}</div>
                                            <div className="res-desc">{r.desc}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 7. TIMELINE */}
                        {(plan.timeline || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .36s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">📅</div>
                                    <div><div className="sec-ttl">Week-by-week plan</div><div className="sec-sub">Exactly what to do each week until interview day</div></div>
                                </div>
                                <div className="tl-list">
                                    {plan.timeline.map((w, i) => (
                                        <div key={i} className="tl-row">
                                            <div className="tl-dot">{i + 1}</div>
                                            <div className="tl-content">
                                                <div className="tl-wk">{w.week}{w.focus && <span style={{ fontWeight: 500, color: "var(--t3)", marginLeft: 6 }}>— {w.focus}</span>}</div>
                                                <div className="tl-tasks">{(w.tasks || []).map((t, j) => <div key={j} className="tl-task"><div className="tl-td" />{t}</div>)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 8. TIPS */}
                        {(plan.insiderTips || []).length > 0 && (
                            <div className="pp-card" style={{ animation: "fadeUp .3s .42s ease both" }}>
                                <div className="sec-hdr">
                                    <div className="sec-ico">🔑</div>
                                    <div><div className="sec-ttl">Insider tips for {company}</div><div className="sec-sub">What separates offer-getters from the rest</div></div>
                                </div>
                                <div className="tips-list">
                                    {plan.insiderTips.map((tip, i) => (
                                        <div key={i} className="tip-item">
                                            <div className="tip-em">{tip.emoji || "💡"}</div>
                                            <div className="tip-txt">{tip.tip}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ textAlign: "center", padding: "4px 0 32px" }}>
                            <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 14 }}>
                                Questions answered: <strong style={{ color: "var(--gd)" }}>{answeredCount}/{allQs.length}</strong>
                                &nbsp;·&nbsp;Projects done: <strong style={{ color: "var(--gd)" }}>{doneCount}/{(plan.projects || []).length}</strong>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="sec-btn" onClick={() => { setView("form"); setError(""); }}>
                                    <Pi n="plus" size={14} />New guide
                                </button>
                                <button className="sec-btn" onClick={() => setView("list")}>
                                    <Pi n="arrowL" size={14} />All preps
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}