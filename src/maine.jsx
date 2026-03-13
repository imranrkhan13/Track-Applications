/**
 * maine.jsx — Career Garden Dashboard
 *
 * Routes handled:
 *   /dashboard            → All applications, grouped by status
 *   /dashboard/:status    → Filtered by status (Applied / Interview / Accepted / Rejected)
 *   /job/:id              → Job detail page
 *
 * Views: Grid · List · Kanban
 * Extras: Analytics, Command Palette (⌘K), Activity Feed, Toast stack
 */

import {
    useState, useEffect, useRef, useCallback, useMemo
} from "react";
import React from "react";
import {
    useNavigate, useParams, useLocation
} from "react-router-dom";
import { supabase } from "./App";
import { JobModal } from "./job";
import Info from "./info";

/* ════════════════════════════════════════════════════════════════════
   CSS
════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
body{font-family:'Poppins',sans-serif;background:#f2fbf2;color:#0d1f0d;overflow-x:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#86efac;border-radius:99px}

:root{
  --g950:#052e16;--g900:#14532d;--g800:#166534;--g700:#15803d;
  --g600:#16a34a;--g500:#22c55e;--g400:#4ade80;--g300:#86efac;
  --g200:#bbf7d0;--g100:#dcfce7;--g50:#f0fdf4;
  --sidebar:260px;
  --ease-spring:cubic-bezier(.34,1.56,.64,1);
  --ease-out:cubic-bezier(.22,1,.36,1);
  --r:18px;
  --sh-sm:0 1px 4px rgba(0,0,0,.07);
  --sh-md:0 4px 18px rgba(0,0,0,.08);
  --sh-lg:0 10px 38px rgba(0,0,0,.1);
  --sh-xl:0 20px 64px rgba(0,0,0,.12);
}

/* ── keyframes ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:scale(.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes cardIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
@keyframes toastSlide{from{opacity:0;transform:translateX(24px) scale(.95)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes treeBob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-10px) rotate(1.5deg)}}

/* ════ LAYOUT ════ */
.shell{display:flex;min-height:100vh}

/* ════ SIDEBAR ════ */
.sb{
  width:var(--sidebar);flex-shrink:0;position:fixed;
  top:0;left:0;bottom:0;z-index:60;
  background:#fff;border-right:1px solid var(--g100);
  display:flex;flex-direction:column;
  transition:transform .32s var(--ease-spring);
  box-shadow:var(--sh-sm);
}
.sb-logo{
  padding:22px 20px 16px;display:flex;align-items:center;gap:10px;
  border-bottom:1px solid var(--g50);font-size:18px;font-weight:800;
  color:var(--g900);letter-spacing:-.045em;flex-shrink:0;cursor:default;
}
.sb-logo-mark{
  width:34px;height:34px;border-radius:10px;
  background:linear-gradient(135deg,var(--g700),var(--g500));
  display:flex;align-items:center;justify-content:center;font-size:18px;
  box-shadow:0 4px 12px rgba(22,163,74,.3);flex-shrink:0;
}
.sb-nav{flex:1;padding:12px 10px;overflow-y:auto}
.sb-section{font-size:10px;font-weight:700;color:#b0c8b0;letter-spacing:.12em;text-transform:uppercase;padding:14px 12px 6px}
.sb-item{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:12px;
  font-size:13.5px;font-weight:600;color:#5a7a5a;
  cursor:pointer;transition:all .18s;margin-bottom:2px;
  position:relative;text-decoration:none;user-select:none;
}
.sb-item:hover{background:var(--g50);color:var(--g800)}
.sb-item.on{background:var(--g100);color:var(--g800)}
.sb-item.on::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:20px;background:var(--g600);border-radius:0 3px 3px 0;
}
.sb-icon{width:20px;text-align:center;font-size:15px;flex-shrink:0}
.sb-badge{
  margin-left:auto;background:var(--g100);color:var(--g700);
  font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;min-width:24px;text-align:center;
}
.sb-item.on .sb-badge{background:var(--g200);color:var(--g800)}
.sb-item.warn .sb-badge{background:#fef9c3;color:#a16207}

.sb-foot{padding:12px 10px 16px;border-top:1px solid var(--g50)}
.sb-user{
  display:flex;align-items:center;gap:10px;padding:10px 12px;
  border-radius:12px;cursor:pointer;transition:all .18s;position:relative;
}
.sb-user:hover{background:var(--g50)}
.sb-avatar{
  width:34px;height:34px;border-radius:50%;border:2px solid var(--g100);
  overflow:hidden;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;background:var(--g50);color:var(--g700);flex-shrink:0;
}
.sb-avatar img{width:100%;height:100%;object-fit:cover}
.sb-uname{font-size:13px;font-weight:700;color:var(--g950);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
.sb-uemail{font-size:10.5px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
.sb-caret{margin-left:auto;color:#c4d4c4;font-size:12px;flex-shrink:0;transition:transform .2s}
.sb-caret.open{transform:rotate(180deg)}

.user-popup{
  position:absolute;bottom:calc(100% + 6px);left:0;right:0;
  background:#fff;border:1px solid var(--g100);border-radius:16px;
  padding:6px;box-shadow:var(--sh-xl);z-index:200;
  animation:pop .22s var(--ease-spring);
}
.popup-head{padding:11px 14px;border-bottom:1px solid var(--g50);margin-bottom:4px}
.popup-name{font-size:13.5px;font-weight:700;color:var(--g950)}
.popup-email{font-size:11px;color:#9ca3af;margin-top:1px}
.popup-item{
  display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;
  border-radius:10px;background:none;border:none;text-align:left;
  font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;
  cursor:pointer;color:#5a7a5a;transition:background .15s;
}
.popup-item:hover{background:var(--g50)}
.popup-item.red{color:#dc2626}
.popup-item.red:hover{background:#fef2f2}

/* ════ MAIN ════ */
.main{margin-left:var(--sidebar);flex:1;min-width:0;display:flex;flex-direction:column;min-height:100vh}

/* ════ TOPBAR ════ */
.topbar{
  position:sticky;top:0;z-index:40;
  background:rgba(242,251,242,.92);backdrop-filter:blur(24px);
  border-bottom:1px solid rgba(187,247,208,.38);
  padding:11px 28px;display:flex;align-items:center;gap:12px;
  box-shadow:0 1px 0 rgba(187,247,208,.3);
}
.tb-burger{
  display:none;width:36px;height:36px;border-radius:10px;
  background:#fff;border:1.5px solid var(--g100);
  align-items:center;justify-content:center;font-size:18px;
  cursor:pointer;color:var(--g700);transition:all .2s;flex-shrink:0;
}
.tb-burger:hover{background:var(--g50)}
.tb-breadcrumb{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:500}
.tb-bc-link{color:var(--g700);cursor:pointer;transition:color .15s}
.tb-bc-link:hover{color:var(--g950)}
.tb-bc-sep{color:#c4d4c4}
.tb-bc-cur{color:var(--g950);font-weight:700}

.search-pill{
  flex:1;max-width:420px;
  display:flex;align-items:center;gap:8px;
  padding:9px 15px;border:1.5px solid var(--g100);border-radius:99px;
  background:#fff;cursor:pointer;transition:all .2s;
  color:#a0b4a0;font-size:13px;font-family:'Poppins',sans-serif;font-weight:500;
}
.search-pill:hover{border-color:var(--g300);box-shadow:0 2px 8px rgba(22,163,74,.07)}
.search-pill-hint{margin-left:auto;background:var(--g50);border:1px solid var(--g100);border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700;color:var(--g600)}

.tb-actions{display:flex;align-items:center;gap:7px;margin-left:auto}
.tb-icon-btn{
  width:36px;height:36px;border-radius:10px;
  background:#fff;border:1.5px solid var(--g100);
  display:flex;align-items:center;justify-content:center;
  font-size:16px;cursor:pointer;color:var(--g700);
  transition:all .2s;flex-shrink:0;
}
.tb-icon-btn:hover{background:var(--g50);border-color:var(--g200);transform:translateY(-1px)}
.tb-icon-btn.on{background:var(--g100);border-color:var(--g200)}
.tb-add{
  display:flex;align-items:center;gap:7px;
  padding:9px 20px;border-radius:99px;border:none;
  background:var(--g950);color:#fff;
  font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;
  cursor:pointer;transition:all .3s var(--ease-spring);
  box-shadow:0 4px 16px rgba(5,46,22,.26);
}
.tb-add:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(5,46,22,.38)}
.tb-add-icon{font-size:17px;font-weight:400}

/* ════ PAGE ════ */
.page{padding:28px 32px 100px;max-width:1280px}

/* ════ WELCOME ════ */
.welcome{
  background:linear-gradient(135deg,var(--g950) 0%,#0a4520 55%,#0d3b1e 100%);
  border-radius:22px;padding:30px 34px;
  display:flex;align-items:center;justify-content:space-between;gap:20px;
  margin-bottom:26px;position:relative;overflow:hidden;
  animation:fadeUp .5s ease both;
}
.welcome::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 55% 80% at 95% 50%,rgba(74,222,128,.16) 0%,transparent 60%);
}
.welcome::after{
  content:'';position:absolute;top:-30%;right:-5%;
  width:220px;height:220px;border-radius:50%;
  background:rgba(34,197,94,.06);
  border:1px solid rgba(34,197,94,.12);
}
.welcome-text{position:relative;z-index:1}
.welcome-greeting{
  font-size:clamp(19px,2.5vw,26px);font-weight:800;
  color:#fff;letter-spacing:-.04em;margin-bottom:5px;
}
.welcome-sub{font-size:14px;color:rgba(255,255,255,.52);font-weight:400}
.welcome-sub strong{color:rgba(255,255,255,.82);font-weight:600}
.welcome-tree{font-size:54px;animation:treeBob 4.5s ease-in-out infinite;position:relative;z-index:1;flex-shrink:0}

/* ════ STAT CARDS ════ */
.stat-row{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:14px;margin-bottom:26px;
  animation:fadeUp .5s .06s ease both;
}
.sc{
  background:#fff;border:1px solid var(--g100);border-radius:var(--r);
  padding:20px 20px 16px;cursor:pointer;
  transition:all .32s var(--ease-spring);position:relative;overflow:hidden;
}
.sc:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(5,46,22,.1)}
.sc::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 var(--r) var(--r);opacity:0;transition:opacity .3s}
.sc:hover::after{opacity:1}
.sc-accent{position:absolute;top:0;right:0;width:60px;height:60px;border-radius:0 var(--r) 0 60px;opacity:.08}
.sc-icon{font-size:20px;margin-bottom:10px}
.sc-num{font-size:38px;font-weight:800;letter-spacing:-.06em;line-height:1;margin-bottom:3px}
.sc-label{font-size:12px;color:#9ca3af;font-weight:500}
.sc-bar{height:3px;background:var(--g100);border-radius:99px;overflow:hidden;margin-top:14px}
.sc-fill{height:100%;border-radius:99px;transition:width 1.3s var(--ease-out)}
.sc-rate{font-size:11.5px;font-weight:600;margin-top:7px}

/* ════ TOOLBAR (filters/view) ════ */
.toolbar{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  margin-bottom:20px;animation:fadeUp .5s .12s ease both;
}
.filter-tabs{display:flex;gap:5px;flex-wrap:wrap;flex:1}
.ftab{
  padding:8px 16px;border-radius:99px;
  border:1.5px solid var(--g100);background:#fff;
  font-size:13px;font-weight:600;color:#5a7a5a;
  cursor:pointer;transition:all .22s var(--ease-spring);
  font-family:'Poppins',sans-serif;white-space:nowrap;
}
.ftab:hover{background:var(--g50);border-color:var(--g200);transform:translateY(-1px)}
.ftab.on{background:var(--g950);color:#fff;border-color:var(--g950)}
.inline-search{
  display:flex;align-items:center;gap:7px;position:relative;
}
.inline-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--g300);font-size:13px;pointer-events:none}
.inline-search input{
  padding:8px 14px 8px 34px;border:1.5px solid var(--g100);border-radius:99px;
  font-family:'Poppins',sans-serif;font-size:13px;background:#fff;
  color:var(--g950);outline:none;transition:all .2s;width:200px;
}
.inline-search input:focus{border-color:var(--g400);box-shadow:0 0 0 3px rgba(74,222,128,.1);width:260px}
.inline-search input::placeholder{color:#b0c8b0}
.sort-sel{
  padding:8px 14px;border:1.5px solid var(--g100);border-radius:99px;
  font-family:'Poppins',sans-serif;font-size:12.5px;font-weight:600;
  color:var(--g700);background:#fff;cursor:pointer;outline:none;
  transition:all .2s;
}
.view-toggle{
  display:flex;gap:3px;background:var(--g50);
  border:1px solid var(--g100);border-radius:12px;padding:3px;
}
.vt-btn{
  padding:6px 11px;border-radius:9px;border:none;background:none;
  font-size:12px;font-weight:600;cursor:pointer;
  font-family:'Poppins',sans-serif;color:#9ca3af;
  transition:all .2s;display:flex;align-items:center;gap:5px;
}
.vt-btn.on{background:#fff;color:var(--g800);box-shadow:var(--sh-sm)}

/* ════ SECTION HEADER ════ */
.section-hd{
  display:flex;align-items:center;gap:10px;margin:28px 0 14px;
  animation:fadeUp .4s ease both;
}
.section-hd-title{font-size:13.5px;font-weight:700;color:var(--g900);letter-spacing:.01em}
.section-hd-count{font-size:12px;color:#9ca3af;font-weight:500}
.section-hd-line{flex:1;height:1px;background:linear-gradient(90deg,var(--g100),transparent)}

/* ════ GRID ════ */
.grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(208px,1fr));
  gap:14px;
}

/* ════ JOB CARD ════ */
.jc{
  background:#fff;border:1px solid;border-radius:var(--r);
  overflow:hidden;cursor:pointer;position:relative;
  transition:all .34s var(--ease-spring);
}
.jc:hover{transform:translateY(-6px) scale(1.014);box-shadow:0 22px 54px rgba(5,46,22,.11)}
.jc:active{transform:scale(.978)}
.jc-top{padding:18px 16px 0;text-align:center}
.jc-tag{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 11px;border-radius:99px;font-size:9.5px;
  font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  margin-bottom:13px;
}
.jc-dot{width:5px;height:5px;border-radius:50%}
.jc-company{
  font-size:14.5px;font-weight:800;color:#0d1f0d;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  letter-spacing:-.025em;margin-bottom:3px;
}
.jc-role{
  font-size:12px;color:#4b7a5c;font-weight:500;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.jc-meta{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px 0;font-size:10.5px;color:#9ca3af;
}
.jc-salary{
  display:inline-flex;align-items:center;gap:4px;
  background:var(--g50);color:var(--g700);
  padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;
}
.jc-notes{
  margin:8px 14px 0;font-size:11px;color:#6b7280;
  font-style:italic;background:rgba(240,253,244,.8);
  border-radius:9px;padding:7px 10px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
  overflow:hidden;line-height:1.55;text-align:left;
}
.jc-actions{
  display:flex;gap:6px;padding:12px 14px 14px;
}
.jc-btn{
  flex:1;padding:8px;border-radius:9px;
  border:1.5px solid rgba(0,0,0,.06);background:rgba(255,255,255,.9);
  font-size:11.5px;font-weight:700;cursor:pointer;
  font-family:'Poppins',sans-serif;color:var(--g700);
  transition:all .18s;
}
.jc-btn:hover{background:#fff;border-color:var(--g200);transform:translateY(-1px)}
.jc-del{
  padding:8px 10px;border-radius:9px;
  border:1.5px solid rgba(0,0,0,.06);background:rgba(255,255,255,.9);
  color:#dc2626;font-size:13px;cursor:pointer;
  font-family:'Poppins',sans-serif;transition:all .18s;
}
.jc-del:hover{background:#fff2f2;border-color:#fecaca}

/* ════ LIST VIEW ════ */
.list{display:flex;flex-direction:column;gap:8px}
.li{
  background:#fff;border:1.5px solid var(--g100);border-radius:14px;
  padding:14px 18px;display:flex;align-items:center;gap:14px;
  cursor:pointer;transition:all .26s var(--ease-spring);
}
.li:hover{transform:translateX(5px);box-shadow:var(--sh-md);border-color:var(--g200)}
.li-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.li-company{font-size:14px;font-weight:800;color:var(--g950);min-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.li-role{font-size:13px;color:#5a7a5a;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.li-location{font-size:12px;color:#9ca3af;white-space:nowrap}
.li-tag{padding:4px 13px;border-radius:99px;font-size:10.5px;font-weight:700;letter-spacing:.04em;white-space:nowrap;flex-shrink:0}
.li-date{font-size:11.5px;color:#9ca3af;flex-shrink:0;min-width:88px;text-align:right}
.li-actions{display:flex;gap:5px;flex-shrink:0}
.li-btn{padding:5px 13px;border-radius:8px;border:1.5px solid var(--g100);background:#fff;color:var(--g700);font-size:11px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .15s}
.li-btn:hover{background:var(--g50);border-color:var(--g200)}
.li-del{padding:5px 10px;border-radius:8px;border:1.5px solid #fee2e2;background:#fff;color:#dc2626;font-size:12px;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .15s}
.li-del:hover{background:#fef2f2}

/* ════ KANBAN ════ */
.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}
.kb-col{background:var(--g50);border:1px solid var(--g100);border-radius:var(--r);overflow:hidden}
.kb-head{
  padding:14px 16px;border-bottom:1px solid var(--g100);
  display:flex;align-items:center;gap:8px;
}
.kb-head-icon{font-size:16px}
.kb-head-title{font-size:13px;font-weight:700;color:var(--g950)}
.kb-head-count{
  margin-left:auto;background:#fff;border:1px solid var(--g100);
  border-radius:99px;padding:2px 9px;font-size:11px;font-weight:700;color:#9ca3af;
}
.kb-body{padding:10px;display:flex;flex-direction:column;gap:8px;min-height:90px}
.kb-card{
  background:#fff;border:1px solid;border-radius:14px;padding:14px 13px;
  cursor:pointer;transition:all .3s var(--ease-spring);
}
.kb-card:hover{transform:translateY(-3px);box-shadow:var(--sh-md)}
.kb-company{font-size:13.5px;font-weight:800;color:var(--g950);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kb-role{font-size:11.5px;color:#5a7a5a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:9px}
.kb-footer{display:flex;align-items:center;justify-content:space-between}
.kb-date{font-size:10.5px;color:#9ca3af}
.kb-salary{font-size:10px;font-weight:700;color:var(--g700);background:var(--g50);padding:2px 8px;border-radius:99px}
.kb-empty{text-align:center;padding:22px 10px;color:#c4d4c4;font-size:12px}

/* ════ JOB DETAIL ════ */
.detail{animation:fadeUp .38s ease both}
.detail-back{
  display:inline-flex;align-items:center;gap:7px;
  color:var(--g700);font-size:13.5px;font-weight:600;
  cursor:pointer;margin-bottom:22px;
  background:none;border:none;font-family:'Poppins',sans-serif;
  transition:gap .2s;padding:0;
}
.detail-back:hover{gap:11px}
.detail-card{
  background:#fff;border:1px solid var(--g100);
  border-radius:22px;overflow:hidden;
  box-shadow:var(--sh-md);
}
.detail-hero{
  padding:32px 34px 26px;
  border-bottom:1px solid var(--g50);
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:20px;flex-wrap:wrap;
}
.detail-company{
  font-size:clamp(22px,3vw,30px);font-weight:800;
  color:var(--g950);letter-spacing:-.045em;margin-bottom:5px;
}
.detail-role{font-size:16px;color:var(--g700);font-weight:500;margin-bottom:14px}
.status-pill{
  display:inline-flex;align-items:center;gap:7px;
  padding:7px 16px;border-radius:99px;font-size:12.5px;font-weight:700;
  border:1.5px solid;
}
.sp-dot{width:7px;height:7px;border-radius:50%}
.detail-btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start}
.detail-btn{
  padding:9px 20px;border-radius:11px;font-family:'Poppins',sans-serif;
  font-size:13px;font-weight:700;cursor:pointer;transition:all .22s;
}
.detail-btn-edit{background:#fff;border:1.5px solid var(--g100);color:var(--g700)}
.detail-btn-edit:hover{background:var(--g50);border-color:var(--g200)}
.detail-btn-del{background:#fff;border:1.5px solid #fee2e2;color:#dc2626}
.detail-btn-del:hover{background:#fef2f2}

.detail-grid{padding:28px 34px;display:grid;grid-template-columns:1fr 1fr;gap:22px}
.df label{display:block;font-size:11px;font-weight:700;color:var(--g600);letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px}
.df p{font-size:14px;color:var(--g950);font-weight:500;line-height:1.6}
.df a{color:var(--g600);text-decoration:underline;text-underline-offset:3px;word-break:break-all}
.df.full{grid-column:1/-1}
.notes-box{
  background:var(--g50);border:1px solid var(--g100);border-radius:12px;
  padding:14px 18px;font-size:13.5px;color:var(--g950);
  line-height:1.75;min-height:80px;white-space:pre-wrap;
}

.timeline{display:flex;flex-direction:column;gap:10px;margin-top:6px}
.tl-item{display:flex;align-items:flex-start;gap:12px;font-size:13px;color:#5a7a5a}
.tl-dot{width:9px;height:9px;border-radius:50%;background:var(--g400);margin-top:4px;flex-shrink:0;box-shadow:0 0 0 3px rgba(74,222,128,.2)}
.tl-main{font-weight:600;color:var(--g950)}
.tl-time{font-size:11px;color:#9ca3af;margin-top:1px}

/* ════ ANALYTICS ════ */
.analytics-grid{display:grid;grid-template-columns:3fr 2fr;gap:18px;margin-bottom:18px;animation:fadeUp .4s ease both}
.an-card{background:#fff;border:1px solid var(--g100);border-radius:var(--r);padding:24px}
.an-title{font-size:15px;font-weight:800;color:var(--g950);letter-spacing:-.03em;margin-bottom:4px}
.an-sub{font-size:12px;color:#9ca3af;margin-bottom:20px}
.funnel{display:flex;flex-direction:column;gap:12px}
.fn-row{display:flex;align-items:center;gap:12px}
.fn-label{font-size:12px;font-weight:600;color:#5a7a5a;width:76px;display:flex;align-items:center;gap:5px}
.fn-track{flex:1;height:11px;background:var(--g50);border-radius:99px;overflow:hidden}
.fn-fill{height:100%;border-radius:99px;transition:width 1.3s var(--ease-out)}
.fn-pct{font-size:12px;font-weight:700;color:var(--g950);width:38px;text-align:right}
.rate-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rate-card{background:var(--g50);border:1px solid var(--g100);border-radius:14px;padding:16px;text-align:center}
.rate-n{font-size:26px;font-weight:800;letter-spacing:-.05em}
.rate-l{font-size:11px;color:#9ca3af;font-weight:500;margin-top:3px;line-height:1.4}

.chart-bar{display:flex;align-items:flex-end;gap:10px;height:130px;margin-top:18px;padding:0 4px}
.cb-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px}
.cb-bar{width:100%;border-radius:7px 7px 0 0;min-height:8px;transition:height 1.2s var(--ease-out)}
.cb-num{font-size:11px;font-weight:700}
.cb-lbl{font-size:10px;color:#9ca3af}

/* ════ ACTIVITY FEED ════ */
.feed{background:#fff;border:1px solid var(--g100);border-radius:var(--r);padding:22px;margin-top:18px;animation:fadeUp .5s .18s ease both}
.feed-title{font-size:15px;font-weight:800;color:var(--g950);letter-spacing:-.03em;margin-bottom:16px}
.feed-item{display:flex;align-items:flex-start;gap:11px;padding:10px 0;border-bottom:1px solid var(--g50)}
.feed-item:last-child{border-bottom:none;padding-bottom:0}
.feed-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;border:1px solid var(--g100)}
.feed-text{font-size:13px;color:#5a7a5a;line-height:1.55}
.feed-text strong{color:var(--g950);font-weight:700}
.feed-time{font-size:11px;color:#9ca3af;margin-top:2px}

/* ════ EMPTY STATE ════ */
.empty{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;min-height:50vh;
  text-align:center;gap:14px;padding:40px 24px;
  animation:fadeUp .5s ease both;
}
.empty-icon{font-size:76px;animation:treeBob 5s ease-in-out infinite;line-height:1}
.empty-h{font-size:27px;font-weight:800;color:var(--g950);letter-spacing:-.045em}
.empty-p{font-size:15px;color:#9ca3af;max-width:340px;line-height:1.65}
.empty-btn{
  padding:14px 36px;background:var(--g950);color:#fff;border:none;
  border-radius:99px;font-family:'Poppins',sans-serif;font-size:15px;
  font-weight:700;cursor:pointer;margin-top:6px;
  box-shadow:0 6px 22px rgba(5,46,22,.28);
  transition:all .3s var(--ease-spring);
}
.empty-btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(5,46,22,.38)}

/* ════ SKELETON ════ */
.skeleton{
  background:linear-gradient(90deg,var(--g50) 25%,var(--g100) 50%,var(--g50) 75%);
  background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;
}

/* ════ COMMAND PALETTE ════ */
.cmd-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.52);
  backdrop-filter:blur(14px);z-index:400;
  display:flex;align-items:flex-start;justify-content:center;
  padding-top:110px;animation:fadeIn .2s ease;
}
.cmd-box{
  background:#fff;border-radius:22px;width:100%;max-width:560px;
  box-shadow:0 36px 90px rgba(0,0,0,.22);border:1px solid var(--g100);
  overflow:hidden;animation:pop .26s var(--ease-spring);
}
.cmd-input-wrap{
  display:flex;align-items:center;gap:10px;
  padding:16px 20px;border-bottom:1px solid var(--g100);
}
.cmd-input-icon{color:var(--g300);font-size:17px;flex-shrink:0}
.cmd-input{
  flex:1;border:none;font-family:'Poppins',sans-serif;font-size:15px;
  font-weight:500;color:var(--g950);outline:none;background:none;
}
.cmd-input::placeholder{color:#b0c8b0}
.cmd-esc{
  background:var(--g50);border:1px solid var(--g100);border-radius:7px;
  padding:3px 8px;font-size:11px;font-weight:700;color:var(--g600);
  cursor:pointer;flex-shrink:0;font-family:'Poppins',sans-serif;
}
.cmd-results{max-height:340px;overflow-y:auto}
.cmd-section-label{
  padding:10px 18px 5px;font-size:10.5px;font-weight:700;
  color:#9ca3af;letter-spacing:.1em;text-transform:uppercase;
}
.cmd-item{
  display:flex;align-items:center;gap:12px;padding:11px 18px;
  cursor:pointer;transition:background .12s;
}
.cmd-item:hover,.cmd-item.sel{background:var(--g50)}
.cmd-item-icon{
  width:32px;height:32px;border-radius:9px;
  background:var(--g50);border:1px solid var(--g100);
  display:flex;align-items:center;justify-content:center;
  font-size:15px;flex-shrink:0;
}
.cmd-item-main{font-size:14px;font-weight:700;color:var(--g950)}
.cmd-item-sub{font-size:11.5px;color:#9ca3af}
.cmd-item-badge{
  margin-left:auto;padding:3px 10px;border-radius:99px;
  font-size:10px;font-weight:700;flex-shrink:0;
}
.cmd-empty{padding:36px;text-align:center;color:#9ca3af;font-size:14px}
.cmd-footer{
  padding:10px 20px;border-top:1px solid var(--g50);
  display:flex;gap:18px;
}
.cmd-hint{font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px}
.cmd-hint kbd{
  background:var(--g50);border:1px solid var(--g100);
  border-radius:5px;padding:2px 6px;font-size:9.5px;font-weight:700;color:var(--g600);
}

/* ════ TOAST ════ */
.toast-stack{position:fixed;bottom:28px;right:28px;display:flex;flex-direction:column;gap:8px;z-index:9999;pointer-events:none}
.toast{
  padding:12px 18px 12px 14px;border-radius:14px;
  font-size:13.5px;font-weight:600;
  display:flex;align-items:center;gap:9px;
  min-width:230px;max-width:340px;
  box-shadow:0 12px 40px rgba(0,0,0,.14);
  animation:toastSlide .38s var(--ease-spring) both;
}
.toast.success{background:var(--g800);color:#fff}
.toast.error{background:#dc2626;color:#fff}
.toast.info{background:var(--g950);color:#fff}
.toast.warn{background:#d97706;color:#fff}
.toast-icon{font-size:17px;flex-shrink:0}

/* ════ FAB (mobile) ════ */
.fab{
  position:fixed;bottom:24px;right:22px;z-index:55;
  width:54px;height:54px;border-radius:50%;
  background:var(--g950);color:#fff;border:none;
  font-size:24px;cursor:pointer;
  box-shadow:0 10px 32px rgba(5,46,22,.38);
  transition:all .3s var(--ease-spring);
  display:none;align-items:center;justify-content:center;
}
.fab:hover{transform:scale(1.12) rotate(42deg)}

/* ════ OVERLAY (mobile sidebar) ════ */
.sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:59;backdrop-filter:blur(4px)}

/* ════ MODAL ════ */
.m-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.42);
  backdrop-filter:blur(12px);z-index:300;
  display:flex;align-items:center;justify-content:center;
  padding:16px;animation:fadeIn .22s ease;
}
.m-box{
  background:#fff;border-radius:26px;padding:36px 32px;
  width:100%;max-width:480px;
  box-shadow:0 32px 88px rgba(0,0,0,.16);
  border:1px solid var(--g100);
  animation:pop .36s var(--ease-spring);
  max-height:90vh;overflow-y:auto;
}
.m-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px}
.m-title{font-size:21px;font-weight:800;color:var(--g950);letter-spacing:-.04em}
.m-sub{font-size:12.5px;color:#9ca3af;margin-top:3px}
.m-close{
  background:none;border:none;font-size:23px;color:#c4d4c4;
  cursor:pointer;line-height:1;padding:0;transition:color .15s;
}
.m-close:hover{color:#9ca3af}
.m-form{display:flex;flex-direction:column;gap:16px}
.m-label{display:block;font-size:11px;font-weight:700;color:var(--g600);letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px}
.m-input{
  width:100%;padding:12px 16px;border:1.5px solid var(--g100);border-radius:13px;
  font-family:'Poppins',sans-serif;font-size:14px;background:#fafffe;
  color:var(--g950);outline:none;transition:all .2s;
}
.m-input:focus{border-color:var(--g400);background:#fff;box-shadow:0 0 0 3.5px rgba(74,222,128,.12)}
.m-input::placeholder{color:#c4dac4}
.m-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stage-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.stage-opt{
  padding:11px 9px;border-radius:12px;border:1.5px solid var(--g100);
  background:#fff;font-family:'Poppins',sans-serif;font-size:13px;
  font-weight:600;cursor:pointer;color:#9ca3af;
  display:flex;align-items:center;justify-content:center;gap:7px;
  transition:all .22s var(--ease-spring);
}
.stage-opt:hover{transform:scale(1.02)}
.m-foot{display:flex;gap:10px;margin-top:28px}
.m-cancel{
  flex:1;padding:13px;border-radius:12px;
  border:1.5px solid var(--g100);background:#fff;
  color:var(--g700);font-family:'Poppins',sans-serif;
  font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;
}
.m-cancel:hover{background:var(--g50);border-color:var(--g200)}
.m-save{
  flex:2;padding:13px;border-radius:12px;border:none;
  background:var(--g950);color:#fff;
  font-family:'Poppins',sans-serif;font-size:14.5px;font-weight:700;
  cursor:pointer;transition:all .3s var(--ease-spring);
  box-shadow:0 4px 18px rgba(5,46,22,.26);
}
.m-save:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(5,46,22,.38)}
.m-save:disabled{opacity:.45;pointer-events:none}

/* ════ RESPONSIVE ════ */
@media(max-width:960px){
  .sb{transform:translateX(-100%)}
  .sb.open{transform:translateX(0)}
  .sb-overlay.open{display:block}
  .main{margin-left:0}
  .tb-burger{display:flex}
  .fab{display:flex}
  .topbar{padding:10px 16px}
  .page{padding:20px 16px 100px}
  .kanban{grid-template-columns:1fr 1fr}
  .stat-row{grid-template-columns:1fr 1fr}
  .analytics-grid{grid-template-columns:1fr}
  .detail-grid{grid-template-columns:1fr}
  .m-row{grid-template-columns:1fr}
}
@media(max-width:580px){
  .kanban{grid-template-columns:1fr}
  .li-location,.li-date{display:none}
  .stat-row{grid-template-columns:1fr 1fr}
  .search-pill{display:none}
}
`;

/* ════════════════════════════════════════════════════════════════════
   STATUS CONFIG
════════════════════════════════════════════════════════════════════ */
const STATUS = {
    Applied: { bg: "#f0fdf4", border: "#86efac", dot: "#16a34a", tagBg: "#dcfce7", tagC: "#15803d", bar: "#22c55e", icon: "🌱", accent: "#22c55e" },
    Interview: { bg: "#fefce8", border: "#fcd34d", dot: "#d97706", tagBg: "#fef9c3", tagC: "#a16207", bar: "#f59e0b", icon: "🌿", accent: "#f59e0b" },
    Accepted: { bg: "#ecfdf5", border: "#34d399", dot: "#059669", tagBg: "#d1fae5", tagC: "#065f46", bar: "#10b981", icon: "🌳", accent: "#10b981" },
    Rejected: { bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af", tagBg: "#f3f4f6", tagC: "#6b7280", bar: "#d1d5db", icon: "🍂", accent: "#d1d5db" },
};
const ALL_STATUSES = ["Applied", "Interview", "Accepted", "Rejected"];

function fmt(date) {
    if (!date) return "—";
    try { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)); }
    catch { return date; }
}
function relTime(ts) {
    if (!ts) return "";
    const d = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (d < 60) return "just now";
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
}

/* ════════════════════════════════════════════════════════════════════
   TOAST HOOK
════════════════════════════════════════════════════════════════════ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((msg, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
    }, []);
    const icons = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" };
    const ToastStack = () => (
        <div className="toast-stack">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    <span className="toast-icon">{icons[t.type]}</span>
                    {t.msg}
                </div>
            ))}
        </div>
    );
    return { add, ToastStack };
}

/* ════════════════════════════════════════════════════════════════════
   JOB MODAL (inline — full featured)
════════════════════════════════════════════════════════════════════ */
function JobModalInline({ onClose, onSave, editing }) {
    const [company, setCompany] = useState(editing?.company || "");
    const [role, setRole] = useState(editing?.role || "");
    const [status, setStatus] = useState(editing?.status || "Applied");
    const [date, setDate] = useState(editing?.date || new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState(editing?.notes || "");
    const [salary, setSalary] = useState(editing?.salary || "");
    const [location, setLocation] = useState(editing?.location || "");
    const [url, setUrl] = useState(editing?.url || "");
    const [saving, setSaving] = useState(false);

    const stageConfig = [
        { v: "Applied", label: "Applied", color: "#16a34a" },
        { v: "Interview", label: "Interview", color: "#d97706" },
        { v: "Accepted", label: "Accepted", color: "#059669" },
        { v: "Rejected", label: "Rejected", color: "#6b7280" },
    ];

    async function handleSave() {
        if (!company.trim() || !role.trim()) return;
        setSaving(true);
        await onSave({ id: editing?.id, company: company.trim(), role: role.trim(), status, date, notes, salary, location, url });
        setSaving(false);
    }

    return (
        <div className="m-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="m-box">
                <div className="m-head">
                    <div>
                        <div className="m-title">{editing ? "Edit application" : "New application"}</div>
                        <div className="m-sub">{editing ? "Update the details below" : "Track a new job opportunity"}</div>
                    </div>
                    <button className="m-close" onClick={onClose}>×</button>
                </div>

                <div className="m-form">
                    <div>
                        <label className="m-label">Company *</label>
                        <input className="m-input" placeholder="e.g. Google" value={company} onChange={e => setCompany(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="m-label">Role *</label>
                        <input className="m-input" placeholder="e.g. Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
                    </div>

                    <div className="m-row">
                        <div>
                            <label className="m-label">Date applied</label>
                            <input className="m-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="m-label">Salary (optional)</label>
                            <input className="m-input" placeholder="e.g. $120k" value={salary} onChange={e => setSalary(e.target.value)} />
                        </div>
                    </div>

                    <div className="m-row">
                        <div>
                            <label className="m-label">Location</label>
                            <input className="m-input" placeholder="e.g. Remote / NYC" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div>
                            <label className="m-label">Job URL</label>
                            <input className="m-input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="m-label">Stage</label>
                        <div className="stage-grid">
                            {stageConfig.map(s => (
                                <button key={s.v} className="stage-opt"
                                    onClick={() => setStatus(s.v)}
                                    style={{
                                        borderColor: status === s.v ? s.color : undefined,
                                        background: status === s.v ? s.color + "18" : undefined,
                                        color: status === s.v ? s.color : undefined,
                                        transform: status === s.v ? "scale(1.04)" : undefined,
                                    }}>
                                    {status === s.v && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />}
                                    {STATUS[s.v].icon} {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="m-label">Notes</label>
                        <textarea className="m-input" style={{ height: 90, resize: "none", lineHeight: 1.6 }}
                            placeholder="Recruiter name, prep notes, next steps, key contacts..."
                            value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                <div className="m-foot">
                    <button className="m-cancel" onClick={onClose}>Cancel</button>
                    <button className="m-save" onClick={handleSave} disabled={saving || !company.trim() || !role.trim()}>
                        {saving
                            ? <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />
                            : editing ? "Save changes" : "Add application"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   COMMAND PALETTE
════════════════════════════════════════════════════════════════════ */
function CmdPalette({ jobs, onClose, onAdd, navigate }) {
    const [q, setQ] = useState("");
    const [sel, setSel] = useState(0);
    const ref = useRef(null);
    useEffect(() => ref.current?.focus(), []);

    const QUICK = [
        { icon: "➕", label: "Add new application", sub: "Create a new job entry", action: () => { onClose(); onAdd(); } },
        { icon: "🏠", label: "Dashboard", sub: "View all applications", action: () => { onClose(); navigate("/dashboard"); } },
        { icon: "🌱", label: "Applied", sub: "View applied jobs", action: () => { onClose(); navigate("/dashboard/Applied"); } },
        { icon: "🌿", label: "Interviews", sub: "View interview stage", action: () => { onClose(); navigate("/dashboard/Interview"); } },
        { icon: "🌳", label: "Accepted", sub: "View accepted offers", action: () => { onClose(); navigate("/dashboard/Accepted"); } },
        { icon: "📊", label: "Analytics", sub: "View your funnel stats", action: () => { onClose(); navigate("/dashboard?analytics=1"); } },
    ];

    const jobResults = q.length >= 1
        ? jobs.filter(j =>
            j.company.toLowerCase().includes(q.toLowerCase()) ||
            j.role.toLowerCase().includes(q.toLowerCase()) ||
            (j.notes || "").toLowerCase().includes(q.toLowerCase())
        ).slice(0, 7).map(j => ({
            icon: STATUS[j.status]?.icon || "📄",
            label: j.company,
            sub: `${j.role} · ${j.status}`,
            badge: j.status,
            action: () => { onClose(); navigate(`/job/${j.id}`); }
        }))
        : [];

    const actions = q.length < 1 ? QUICK : QUICK.filter(a => a.label.toLowerCase().includes(q.toLowerCase()));
    const allResults = [...jobResults, ...actions];
    useEffect(() => setSel(0), [q]);

    function onKey(e) {
        if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, allResults.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
        if (e.key === "Enter" && allResults[sel]) allResults[sel].action();
        if (e.key === "Escape") onClose();
    }

    return (
        <div className="cmd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmd-box">
                <div className="cmd-input-wrap">
                    <span className="cmd-input-icon">🔍</span>
                    <input ref={ref} className="cmd-input"
                        placeholder="Search jobs, navigate, or run a command..."
                        value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
                    />
                    <button className="cmd-esc" onClick={onClose}>Esc</button>
                </div>

                <div className="cmd-results">
                    {allResults.length === 0
                        ? <div className="cmd-empty">No results for "{q}"</div>
                        : <>
                            {jobResults.length > 0 && <div className="cmd-section-label">Applications</div>}
                            {jobResults.map((r, i) => (
                                <div key={i} className={`cmd-item${sel === i ? " sel" : ""}`}
                                    onMouseEnter={() => setSel(i)} onClick={r.action}>
                                    <div className="cmd-item-icon">{r.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="cmd-item-main">{r.label}</div>
                                        <div className="cmd-item-sub">{r.sub}</div>
                                    </div>
                                    {r.badge && (
                                        <div className="cmd-item-badge" style={{ background: STATUS[r.badge]?.tagBg, color: STATUS[r.badge]?.tagC }}>{r.badge}</div>
                                    )}
                                </div>
                            ))}
                            {actions.length > 0 && <div className="cmd-section-label">Actions</div>}
                            {actions.map((r, i) => {
                                const idx = jobResults.length + i;
                                return (
                                    <div key={idx} className={`cmd-item${sel === idx ? " sel" : ""}`}
                                        onMouseEnter={() => setSel(idx)} onClick={r.action}>
                                        <div className="cmd-item-icon">{r.icon}</div>
                                        <div>
                                            <div className="cmd-item-main">{r.label}</div>
                                            <div className="cmd-item-sub">{r.sub}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    }
                </div>
                <div className="cmd-footer">
                    <div className="cmd-hint"><kbd>↑↓</kbd> navigate</div>
                    <div className="cmd-hint"><kbd>↵</kbd> select</div>
                    <div className="cmd-hint"><kbd>Esc</kbd> dismiss</div>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   JOB DETAIL
════════════════════════════════════════════════════════════════════ */
function JobDetail({ job, onEdit, onDelete, onBack }) {
    const s = STATUS[job.status] || STATUS.Applied;
    return (
        <div className="detail">
            <button className="detail-back" onClick={onBack}>← Back</button>
            <div className="detail-card">
                <div className="detail-hero">
                    <div>
                        <div className="detail-company">{job.company}</div>
                        <div className="detail-role">{job.role}</div>
                        <div className="status-pill" style={{ background: s.tagBg, color: s.tagC, borderColor: s.border }}>
                            <span className="sp-dot" style={{ background: s.dot }} />
                            {s.icon} {job.status}
                        </div>
                    </div>
                    <div className="detail-btn-row">
                        <button className="detail-btn detail-btn-edit" onClick={() => onEdit(job)}>Edit</button>
                        <button className="detail-btn detail-btn-del" onClick={() => onDelete(job.id)}>Delete</button>
                    </div>
                </div>

                <div className="detail-grid">
                    <div className="df"><label>Company</label><p>{job.company}</p></div>
                    <div className="df"><label>Role</label><p>{job.role}</p></div>
                    <div className="df"><label>Date Applied</label><p>{fmt(job.date)}</p></div>
                    <div className="df"><label>Stage</label><p>{s.icon} {job.status}</p></div>
                    {job.salary && <div className="df"><label>Salary</label><p>{job.salary}</p></div>}
                    {job.location && <div className="df"><label>Location</label><p>{job.location}</p></div>}
                    {job.url && (
                        <div className="df full">
                            <label>Job URL</label>
                            <p><a href={job.url} target="_blank" rel="noopener noreferrer">{job.url}</a></p>
                        </div>
                    )}
                    {job.notes && (
                        <div className="df full">
                            <label>Notes</label>
                            <div className="notes-box">{job.notes}</div>
                        </div>
                    )}
                    <div className="df full">
                        <label>Activity</label>
                        <div className="timeline">
                            <div className="tl-item">
                                <div className="tl-dot" />
                                <div>
                                    <div className="tl-main">Application created</div>
                                    <div className="tl-time">{fmt(job.date)}</div>
                                </div>
                            </div>
                            {job.status !== "Applied" && (
                                <div className="tl-item">
                                    <div className="tl-dot" style={{ background: s.dot }} />
                                    <div>
                                        <div className="tl-main">Status updated to <strong>{job.status}</strong></div>
                                        <div className="tl-time">{relTime(job.updated_at)}</div>
                                    </div>
                                </div>
                            )}
                            <div className="tl-item">
                                <div className="tl-dot" style={{ background: "#c4d4c4" }} />
                                <div>
                                    <div className="tl-main">Added to Career Garden</div>
                                    <div className="tl-time">{relTime(job.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   ANALYTICS VIEW
════════════════════════════════════════════════════════════════════ */
function AnalyticsView({ jobs }) {
    const total = jobs.length;
    const counts = { Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 };
    jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });
    const responseRate = total > 0 ? Math.round(((counts.Interview + counts.Accepted) / total) * 100) : 0;
    const offerRate = counts.Interview > 0 ? Math.round((counts.Accepted / counts.Interview) * 100) : 0;
    const activeJobs = total - counts.Rejected;

    // Recent 8 jobs for activity
    const recent = [...jobs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6);

    return (
        <div>
            <div className="analytics-grid">
                <div className="an-card">
                    <div className="an-title">Application Funnel</div>
                    <div className="an-sub">Your pipeline conversion from application to offer</div>
                    <div className="funnel">
                        {ALL_STATUSES.map(st => (
                            <div key={st} className="fn-row">
                                <div className="fn-label">{STATUS[st].icon} {st}</div>
                                <div className="fn-track">
                                    <div className="fn-fill" style={{ width: total ? `${(counts[st] / total) * 100}%` : "0%", background: STATUS[st].bar }} />
                                </div>
                                <div className="fn-pct">{counts[st]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="chart-bar">
                        {ALL_STATUSES.map(st => {
                            const pct = total ? (counts[st] / total) * 100 : 0;
                            const s = STATUS[st];
                            return (
                                <div key={st} className="cb-col">
                                    <div className="cb-num" style={{ color: s.bar }}>{counts[st]}</div>
                                    <div className="cb-bar" style={{ height: `${Math.max(pct, 6)}%`, background: `linear-gradient(to top, ${s.bar}, ${s.bar}aa)`, border: `1px solid ${s.border}` }} />
                                    <div className="cb-lbl">{st}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="an-card">
                    <div className="an-title">Key Metrics</div>
                    <div className="an-sub">Your search performance at a glance</div>
                    <div className="rate-grid">
                        {[
                            { n: `${responseRate}%`, l: "Response rate", c: "#16a34a" },
                            { n: `${offerRate}%`, l: "Interview → Offer", c: "#059669" },
                            { n: activeJobs, l: "Active applications", c: "#d97706" },
                            { n: total, l: "Total applications", c: "#6b7280" },
                        ].map(r => (
                            <div key={r.l} className="rate-card">
                                <div className="rate-n" style={{ color: r.c }}>{r.n}</div>
                                <div className="rate-l">{r.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="feed">
                <div className="feed-title">Recent Activity</div>
                {recent.length === 0
                    ? <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "20px 0" }}>No activity yet.</div>
                    : recent.map((j, i) => {
                        const s = STATUS[j.status];
                        return (
                            <div key={j.id} className="feed-item">
                                <div className="feed-icon" style={{ background: s.tagBg, borderColor: s.border }}>{s.icon}</div>
                                <div>
                                    <div className="feed-text">
                                        Added <strong>{j.company}</strong> — {j.role} as <strong>{j.status}</strong>
                                    </div>
                                    <div className="feed-time">{relTime(j.created_at)}</div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════════════════ */
export default function Main({ user, session }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { status: paramStatus, id: paramId } = useParams();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [showInfo, setShowInfo] = useState(false);
    const [showCmd, setShowCmd] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(new URLSearchParams(location.search).get("analytics") === "1");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userPopup, setUserPopup] = useState(false);

    const userPopupRef = useRef(null);
    const { add: toast, ToastStack } = useToast();

    /* ── Info from Supabase user ── */
    const meta = user?.user_metadata || {};
    const userName = meta.full_name || meta.name || user?.email?.split("@")[0] || "there";
    const userEmail = user?.email || "";
    const userPic = meta.avatar_url || meta.picture || null;
    const firstName = userName.split(" ")[0];
    const initials = userName.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase() || "U";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    /* ── Supabase fetch ── */
    useEffect(() => { fetchJobs(); }, [user.id]);

    async function fetchJobs() {
        setLoading(true);
        const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (error) toast("Failed to load: " + error.message, "error");
        else setJobs(data || []);
        setLoading(false);
    }

    async function handleSave(jobData) {
        const payload = {
            company: jobData.company,
            role: jobData.role,
            status: jobData.status,
            date: jobData.date,
            notes: jobData.notes,
            salary: jobData.salary,
            location: jobData.location,
            url: jobData.url,
            user_id: user.id,
        };

        if (jobData.id) {
            // Update existing
            const { data, error } = await supabase
                .from("jobs").update({ ...payload, updated_at: new Date().toISOString() })
                .eq("id", jobData.id).select().single();
            if (error) { toast("Update failed: " + error.message, "error"); return; }
            setJobs(prev => prev.map(j => j.id === jobData.id ? data : j));
            toast("Application updated ✓");
        } else {
            // Insert new
            const { data, error } = await supabase
                .from("jobs").insert([payload]).select().single();
            if (error) { toast("Save failed: " + error.message, "error"); return; }
            setJobs(prev => [data, ...prev]);
            toast("Application added ✓");
        }

        setShowModal(false);
        setEditing(null);
    }

    async function handleDelete(id) {
        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) { toast("Delete failed", "error"); return; }
        setJobs(prev => prev.filter(j => j.id !== id));
        toast("Removed");
        if (activeJobId === id) navigate("/dashboard");
    }

    function openEdit(job) { setEditing(job); setShowModal(true); }
    function openAdd() { setEditing(null); setShowModal(true); }

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/");
    }

    /* ── Keyboard shortcut ── */
    useEffect(() => {
        const fn = e => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowCmd(c => !c); }
            if (e.key === "Escape") { setShowCmd(false); }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);

    /* ── Outside click for user popup ── */
    useEffect(() => {
        const fn = e => { if (userPopupRef.current && !userPopupRef.current.contains(e.target)) setUserPopup(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    /* ── URL-driven state ── */
    const activeStatus = paramStatus || null;
    const activeJobId = paramId ? Number(paramId) : null;
    const activeJob = activeJobId ? jobs.find(j => j.id === activeJobId) : null;

    /* ── Filter & sort ── */
    const counts = useMemo(() => {
        const c = { Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 };
        jobs.forEach(j => { if (c[j.status] !== undefined) c[j.status]++; });
        return c;
    }, [jobs]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return jobs
            .filter(j => {
                const matchStatus = !activeStatus || j.status === activeStatus;
                const matchSearch = !q || j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || (j.notes || "").toLowerCase().includes(q);
                return matchStatus && matchSearch;
            })
            .sort((a, b) => {
                if (sort === "newest") return new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0);
                if (sort === "oldest") return new Date(a.created_at || a.date || 0) - new Date(b.created_at || b.date || 0);
                if (sort === "alpha") return a.company.localeCompare(b.company);
                if (sort === "status") return ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
                return 0;
            });
    }, [jobs, activeStatus, search, sort]);

    /* ── Sidebar nav config ── */
    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: "🏠", exact: true },
        { label: "Applied", path: "/dashboard/Applied", icon: "🌱", count: counts.Applied },
        { label: "Interview", path: "/dashboard/Interview", icon: "🌿", count: counts.Interview, warn: counts.Interview > 0 },
        { label: "Accepted", path: "/dashboard/Accepted", icon: "🌳", count: counts.Accepted },
        { label: "Rejected", path: "/dashboard/Rejected", icon: "🍂", count: counts.Rejected },
    ];

    function isNavActive(item) {
        if (item.exact) return location.pathname === "/dashboard" && !paramStatus;
        return location.pathname.startsWith(item.path);
    }

    /* ── Breadcrumb ── */
    const crumbs = activeJob
        ? [{ label: "Dashboard", path: "/dashboard" }, { label: activeJob.company }]
        : activeStatus
            ? [{ label: "Dashboard", path: "/dashboard" }, { label: activeStatus }]
            : showAnalytics
                ? [{ label: "Dashboard", path: "/dashboard" }, { label: "Analytics" }]
                : [];

    /* ══════════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{CSS}</style>

            <div className="shell">
                {/* ── SIDEBAR OVERLAY ── */}
                <div className={`sb-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

                {/* ── SIDEBAR ── */}
                <aside className={`sb${sidebarOpen ? " open" : ""}`}>
                    {/* Logo */}
                    <div className="sb-logo">
                        <div className="sb-logo-mark">🌳</div>
                        Career Garden
                    </div>

                    {/* Nav */}
                    <nav className="sb-nav">
                        <div className="sb-section">Navigation</div>
                        {navItems.map(item => (
                            <div
                                key={item.path}
                                className={`sb-item${isNavActive(item) ? " on" : ""}${item.warn ? " warn" : ""}`}
                                onClick={() => { navigate(item.path); setSidebarOpen(false); setShowAnalytics(false); }}
                            >
                                <span className="sb-icon">{item.icon}</span>
                                {item.label}
                                {item.count !== undefined && (
                                    <span className="sb-badge">{item.count}</span>
                                )}
                            </div>
                        ))}

                        <div className="sb-section" style={{ marginTop: 14 }}>Tools</div>
                        <div
                            className={`sb-item${showAnalytics ? " on" : ""}`}
                            onClick={() => { setShowAnalytics(a => !a); navigate("/dashboard"); setSidebarOpen(false); }}
                        >
                            <span className="sb-icon">📊</span>Analytics
                        </div>
                        <div className="sb-item" onClick={() => { setShowCmd(true); setSidebarOpen(false); }}>
                            <span className="sb-icon">⌘</span>Command Palette
                            <span className="sb-badge" style={{ fontFamily: "monospace", background: "var(--g50)", color: "var(--g600)" }}>⌘K</span>
                        </div>
                        <div className="sb-item" onClick={() => setShowInfo(true)}>
                            <span className="sb-icon">❓</span>Help & Info
                        </div>
                        <div className="sb-item" onClick={openAdd}>
                            <span className="sb-icon">✚</span>Add Application
                        </div>
                    </nav>

                    {/* User card */}
                    <div className="sb-foot">
                        <div className="sb-user" ref={userPopupRef} onClick={() => setUserPopup(p => !p)}>
                            <div className="sb-avatar">
                                {userPic ? <img src={userPic} alt={initials} /> : initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="sb-uname">{userName}</div>
                                <div className="sb-uemail">{userEmail}</div>
                            </div>
                            <span className={`sb-caret${userPopup ? " open" : ""}`}>⌄</span>

                            {userPopup && (
                                <div className="user-popup">
                                    <div className="popup-head">
                                        <div className="popup-name">{userName}</div>
                                        <div className="popup-email">{userEmail}</div>
                                    </div>
                                    <button className="popup-item" onClick={() => { setShowInfo(true); setUserPopup(false); }}>
                                        ❓ Help & Info
                                    </button>
                                    <button className="popup-item" onClick={() => { setShowAnalytics(a => !a); setUserPopup(false); navigate("/dashboard"); }}>
                                        📊 Analytics
                                    </button>
                                    <button className="popup-item red" onClick={handleLogout}>
                                        ↗ Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <div className="main">

                    {/* TOPBAR */}
                    <header className="topbar">
                        <button className="tb-burger" onClick={() => setSidebarOpen(s => !s)}>☰</button>

                        {/* Breadcrumb */}
                        <div className="tb-breadcrumb">
                            {crumbs.length > 0
                                ? crumbs.map((c, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="tb-bc-sep">/</span>}
                                        {c.path
                                            ? <span className="tb-bc-link" onClick={() => { navigate(c.path); setShowAnalytics(false); }}>{c.label}</span>
                                            : <span className="tb-bc-cur">{c.label}</span>
                                        }
                                    </React.Fragment>
                                ))
                                : <span className="tb-bc-cur" style={{ color: "var(--g700)", fontWeight: 600 }}>Dashboard</span>
                            }
                        </div>

                        {/* Search pill → opens command palette */}
                        <div className="search-pill" onClick={() => setShowCmd(true)}>
                            <span>🔍</span>
                            <span>Search or jump to...</span>
                            <span className="search-pill-hint">⌘K</span>
                        </div>

                        {/* Actions */}
                        <div className="tb-actions">
                            <div
                                className={`tb-icon-btn${showAnalytics ? " on" : ""}`}
                                onClick={() => { setShowAnalytics(a => !a); navigate("/dashboard"); }}
                                title="Analytics"
                            >📊</div>
                            <div className="tb-icon-btn" onClick={() => setShowInfo(true)} title="Help">❓</div>
                            <button className="tb-add" onClick={openAdd}>
                                <span className="tb-add-icon">+</span>
                                Add application
                            </button>
                        </div>
                    </header>

                    {/* PAGE CONTENT */}
                    <div className="page">

                        {/* ── JOB DETAIL ── */}
                        {activeJob ? (
                            <JobDetail
                                job={activeJob}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onBack={() => navigate(activeStatus ? `/dashboard/${activeStatus}` : "/dashboard")}
                            />

                        ) : /* ── ANALYTICS ── */ showAnalytics ? (
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <h1 style={{ fontSize: "clamp(20px,3vw,27px)", fontWeight: 800, color: "var(--g950)", letterSpacing: "-.04em" }}>Analytics</h1>
                                    <p style={{ fontSize: 13.5, color: "#9ca3af", marginTop: 5 }}>Your job search performance at a glance</p>
                                </div>
                                <AnalyticsView jobs={jobs} />
                            </>

                        ) : (
                            <>
                                {/* ── WELCOME BANNER ── */}
                                {!activeStatus && (
                                    <div className="welcome">
                                        <div className="welcome-text">
                                            <div className="welcome-greeting">{greeting}, {firstName} 👋</div>
                                            <div className="welcome-sub">
                                                {jobs.length === 0
                                                    ? "Your garden is empty — plant your first seed."
                                                    : <><strong>{jobs.length}</strong> application{jobs.length !== 1 ? "s" : ""} in your garden · <strong>{counts.Interview}</strong> in interview stage</>
                                                }
                                            </div>
                                        </div>
                                        <div className="welcome-tree">🌳</div>
                                    </div>
                                )}

                                {/* ── STAT CARDS ── */}
                                {!activeStatus && jobs.length > 0 && (
                                    <div className="stat-row">
                                        {[
                                            { icon: "🌱", label: "Applied", count: counts.Applied, color: "#22c55e", path: "/dashboard/Applied" },
                                            { icon: "🌿", label: "Interviews", count: counts.Interview, color: "#f59e0b", path: "/dashboard/Interview" },
                                            { icon: "🌳", label: "Accepted", count: counts.Accepted, color: "#10b981", path: "/dashboard/Accepted" },
                                            { icon: "🍂", label: "Rejected", count: counts.Rejected, color: "#d1d5db", path: "/dashboard/Rejected" },
                                        ].map(s => (
                                            <div key={s.label} className="sc" onClick={() => navigate(s.path)}
                                                style={{ "--sc-color": s.color }}>
                                                <div className="sc-accent" style={{ background: s.color }} />
                                                <div className="sc-icon">{s.icon}</div>
                                                <div className="sc-num" style={{ color: s.color }}>{s.count}</div>
                                                <div className="sc-label">{s.label}</div>
                                                <div className="sc-bar">
                                                    <div className="sc-fill" style={{ width: jobs.length ? `${(s.count / jobs.length) * 100}%` : "0%", background: s.color }} />
                                                </div>
                                                <div className="sc-rate" style={{ color: s.color }}>
                                                    {jobs.length ? `${Math.round((s.count / jobs.length) * 100)}% of total` : "—"}
                                                </div>
                                                <style>{`.sc:hover::after{background:${s.color};opacity:1}`}</style>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── TOOLBAR ── */}
                                {!loading && jobs.length > 0 && (
                                    <div className="toolbar">
                                        {/* Filter tabs — only shown when not on a status route */}
                                        {!activeStatus && (
                                            <div className="filter-tabs">
                                                {["All", ...ALL_STATUSES].map(st => (
                                                    <button key={st} className={`ftab${(st === "All" && !search) || false ? "" : ""} on`}
                                                        style={st === "All"
                                                            ? { background: "var(--g950)", color: "#fff", borderColor: "var(--g950)" }
                                                            : { background: STATUS[st]?.tagBg, color: STATUS[st]?.tagC, borderColor: STATUS[st]?.border }
                                                        }
                                                        onClick={() => navigate(st === "All" ? "/dashboard" : `/dashboard/${st}`)}>
                                                        {STATUS[st]?.icon || "📋"} {st}
                                                        {st !== "All" && <span style={{ marginLeft: 5, opacity: .7 }}>{counts[st]}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Inline search */}
                                        <div className="inline-search">
                                            <span className="inline-search-icon">⌕</span>
                                            <input
                                                placeholder={`Filter ${activeStatus || "all"}...`}
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                            />
                                        </div>

                                        {/* Sort */}
                                        <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
                                            <option value="newest">Newest first</option>
                                            <option value="oldest">Oldest first</option>
                                            <option value="alpha">A → Z</option>
                                            <option value="status">By stage</option>
                                        </select>

                                        {/* View toggle */}
                                        <div className="view-toggle">
                                            {[
                                                { v: "grid", icon: "▦", label: "Grid" },
                                                { v: "list", icon: "≡", label: "List" },
                                                { v: "kanban", icon: "⊞", label: "Board" },
                                            ].map(m => (
                                                <button key={m.v} className={`vt-btn${viewMode === m.v ? " on" : ""}`} onClick={() => setViewMode(m.v)} title={m.label}>
                                                    {m.icon} {viewMode === m.v && m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION HEADER (when on status route) ── */}
                                {activeStatus && jobs.length > 0 && (
                                    <div className="section-hd" style={{ marginTop: 0, marginBottom: 20 }}>
                                        <span className="section-hd-title">{STATUS[activeStatus]?.icon} {activeStatus}</span>
                                        <span className="section-hd-count">· {filtered.length} application{filtered.length !== 1 ? "s" : ""}</span>
                                        <div className="section-hd-line" />
                                    </div>
                                )}

                                {/* ── CONTENT ── */}
                                {loading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                                        <div style={{ width: 40, height: 40, border: "3.5px solid var(--g100)", borderTopColor: "var(--g500)", borderRadius: "50%", animation: "spin .75s linear infinite" }} />
                                    </div>

                                ) : jobs.length === 0 ? (
                                    <div className="empty">
                                        <div className="empty-icon">🌳</div>
                                        <h2 className="empty-h">Your garden is waiting</h2>
                                        <p className="empty-p">Add your first application and watch your career grow, one seed at a time.</p>
                                        <button className="empty-btn" onClick={openAdd}>+ Plant your first seed</button>
                                    </div>

                                ) : filtered.length === 0 ? (
                                    <div className="empty" style={{ minHeight: "30vh" }}>
                                        <div style={{ fontSize: 48 }}>🔍</div>
                                        <h2 className="empty-h" style={{ fontSize: 22 }}>No results</h2>
                                        <p className="empty-p">Try adjusting your search or filter.</p>
                                    </div>

                                ) : viewMode === "kanban" && !activeStatus ? (
                                    /* ─── KANBAN ─── */
                                    <div className="kanban">
                                        {ALL_STATUSES.map(st => {
                                            const col = filtered.filter(j => j.status === st);
                                            const s = STATUS[st];
                                            return (
                                                <div key={st} className="kb-col"
                                                    style={{ borderTopWidth: 3, borderTopColor: s.dot }}>
                                                    <div className="kb-head">
                                                        <span className="kb-head-icon">{s.icon}</span>
                                                        <span className="kb-head-title">{st}</span>
                                                        <span className="kb-head-count">{col.length}</span>
                                                    </div>
                                                    <div className="kb-body">
                                                        {col.length === 0
                                                            ? <div className="kb-empty">No jobs yet</div>
                                                            : col.map(j => (
                                                                <div key={j.id} className="kb-card"
                                                                    style={{ background: s.bg, borderColor: s.border }}
                                                                    onClick={() => navigate(`/job/${j.id}`)}>
                                                                    <div className="kb-company">{j.company}</div>
                                                                    <div className="kb-role">{j.role}</div>
                                                                    <div className="kb-footer">
                                                                        <span className="kb-date">{fmt(j.date)}</span>
                                                                        {j.salary && <span className="kb-salary">{j.salary}</span>}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                ) : viewMode === "list" ? (
                                    /* ─── LIST ─── */
                                    <div className="list">
                                        {filtered.map((j, i) => {
                                            const s = STATUS[j.status] || STATUS.Applied;
                                            return (
                                                <div key={j.id} className="li"
                                                    style={{ animation: `slideRight .35s ${i * 28}ms var(--ease-out) both` }}
                                                    onClick={() => navigate(`/job/${j.id}`)}>
                                                    <div className="li-dot" style={{ background: s.dot }} />
                                                    <div className="li-company">{j.company}</div>
                                                    <div className="li-role">{j.role}</div>
                                                    {j.location && <div className="li-location">📍 {j.location}</div>}
                                                    <div className="li-tag" style={{ background: s.tagBg, color: s.tagC }}>{s.icon} {j.status}</div>
                                                    <div className="li-date">{fmt(j.date)}</div>
                                                    <div className="li-actions" onClick={e => e.stopPropagation()}>
                                                        <button className="li-btn" onClick={() => openEdit(j)}>Edit</button>
                                                        <button className="li-del" onClick={() => handleDelete(j.id)}>✕</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                ) : /* ─── GRID ─── */ (
                                    activeStatus ? (
                                        // Flat grid for filtered status view
                                        <div className="grid">
                                            {filtered.map((j, i) => (
                                                <JobGridCard key={j.id} job={j} index={i}
                                                    onEdit={openEdit} onDelete={handleDelete}
                                                    onClick={() => navigate(`/job/${j.id}`)} />
                                            ))}
                                        </div>
                                    ) : (
                                        // Grouped grid for full dashboard
                                        ALL_STATUSES.map(st => {
                                            const group = filtered.filter(j => j.status === st);
                                            if (!group.length) return null;
                                            const s = STATUS[st];
                                            return (
                                                <div key={st} style={{ marginBottom: 32 }}>
                                                    <div className="section-hd">
                                                        <span className="section-hd-title">{s.icon} {st}</span>
                                                        <span className="section-hd-count">· {group.length}</span>
                                                        <div className="section-hd-line" />
                                                    </div>
                                                    <div className="grid">
                                                        {group.map((j, i) => (
                                                            <JobGridCard key={j.id} job={j} index={i}
                                                                onEdit={openEdit} onDelete={handleDelete}
                                                                onClick={() => navigate(`/job/${j.id}`)} />
                                                        ))}
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

            {/* ── FAB (mobile) ── */}
            <button className="fab" onClick={openAdd}>+</button>

            {/* ── JOB MODAL ── */}
            {showModal && (
                <JobModalInline
                    editing={editing}
                    onClose={() => { setShowModal(false); setEditing(null); }}
                    onSave={handleSave}
                />
            )}

            {/* ── INFO MODAL ── */}
            {showInfo && <Info onClose={() => setShowInfo(false)} />}

            {/* ── COMMAND PALETTE ── */}
            {showCmd && (
                <CmdPalette
                    jobs={jobs}
                    onClose={() => setShowCmd(false)}
                    onAdd={openAdd}
                    navigate={navigate}
                />
            )}

            {/* ── TOASTS ── */}
            <ToastStack />
        </>
    );
}

/* ════════════════════════════════════════════════════════════════════
   JOB GRID CARD
════════════════════════════════════════════════════════════════════ */
function JobGridCard({ job, index, onEdit, onDelete, onClick }) {
    const s = STATUS[job.status] || STATUS.Applied;
    return (
        <div className="jc"
            style={{
                background: s.bg,
                borderColor: s.border,
                animation: `cardIn .42s ${index * 38}ms var(--ease-out) both`,
            }}>
            <div className="jc-top" onClick={onClick}>
                <div className="jc-tag" style={{ background: s.tagBg, color: s.tagC }}>
                    <span className="jc-dot" style={{ background: s.dot }} />
                    {job.status}
                </div>
                <div className="jc-company">{job.company}</div>
                <div className="jc-role">{job.role}</div>
                <div className="jc-meta">
                    <span className="jc-date">{fmt(job.date)}</span>
                    {job.salary && <span className="jc-salary">💰 {job.salary}</span>}
                </div>
                {job.notes && <div className="jc-notes">{job.notes}</div>}
            </div>
            <div className="jc-actions" onClick={e => e.stopPropagation()}>
                <button className="jc-btn" onClick={() => onEdit(job)}>Edit</button>
                <button className="jc-del" onClick={() => onDelete(job.id)}>✕</button>
            </div>
        </div>
    );
}