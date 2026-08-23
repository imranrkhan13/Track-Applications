/**
     * App.jsx — Career Garden root
     * deps: react-router-dom, @supabase/supabase-js, framer-motion, lucide-react
     *
     *   npm install react-router-dom @supabase/supabase-js framer-motion lucide-react
     */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import React from "react";
import {
    BrowserRouter, Routes, Route, Navigate,
    useNavigate
} from "react-router-dom";
import { Sprout, LayoutDashboard, BarChart3, Brain, Bell, Search, GitBranch, ArrowRight, Check, Timer, Sparkles } from 'lucide-react';

import { supabase } from "./lib/supabase";
import heroDesk from "./assets/hero-desk.png";
/* ─────────────────────────── Supabase ──────────────────────────── */

/* ─────────────────────────── Lazy imports ───────────────────────── */
const MainApp = lazy(() => import("./maine"));

/* ─────────────────────────── Global CSS ─────────────────────────── */
const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
    body{font-family:'DM Sans',sans-serif;background:#f5f4ef;color:#17221b;overflow-x:hidden}
    ::-webkit-scrollbar{width:7px}
    ::-webkit-scrollbar-track{background:#f5f4ef}
    ::-webkit-scrollbar-thumb{background:#b7c6b1;border-radius:99px}
    :root{--ink:#17221b;--muted:#667269;--moss:#46624c;--deep:#263b2e;--leaf:#bfdc82;--sage:#e8ede4;--paper:#f5f4ef;--white:#fff;--line:#dbe2d9;--coral:#cf7d5e;--ease:cubic-bezier(.22,1,.36,1)}
    button,a{font:inherit}
    button{cursor:pointer}
    .landing-page{background:var(--paper);overflow:hidden}
    .lnav{position:fixed;top:0;left:0;width:100%;z-index:1000;display:flex;justify-content:space-between;align-items:center;padding:22px clamp(22px,5vw,72px);color:#fff;transition:all .35s var(--ease)}
    .lnav.stuck{background:rgba(245,244,239,.9);color:var(--ink);padding-top:14px;padding-bottom:14px;backdrop-filter:blur(18px);border-bottom:1px solid rgba(219,226,217,.8)}
    .lnav-logo{display:flex;align-items:center;gap:10px;color:inherit;font-weight:700;letter-spacing:-.04em;font-size:17px}
    .lnav-mark{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:var(--leaf);color:var(--deep)}
    .lnav-links{display:flex;align-items:center;gap:34px;list-style:none}
    .lnav-links a{color:inherit;text-decoration:none;font-size:13px;font-weight:600;opacity:.76;transition:opacity .2s}
    .lnav-links a:hover{opacity:1}
    .lnav-cta{border:1px solid rgba(255,255,255,.45);border-radius:999px;background:rgba(255,255,255,.13);color:inherit;padding:10px 16px;font-size:12px;font-weight:700;transition:all .2s}
    .lnav-cta:hover{background:var(--leaf);border-color:var(--leaf);color:var(--deep);transform:translateY(-1px)}
    .lnav.stuck .lnav-cta{background:var(--deep);border-color:var(--deep);color:#fff}
    .hero{position:relative;min-height:790px;display:flex;align-items:center;isolation:isolate;color:#fff;background:#1b2921}
    .hero-bg-layer{position:absolute;inset:0;z-index:-2}
    .hero-full-img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
    .hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,23,17,.96) 0%,rgba(12,23,17,.84) 34%,rgba(12,23,17,.2) 71%,rgba(12,23,17,.3) 100%),linear-gradient(0deg,rgba(12,23,17,.42),transparent 45%)}
    .hero-inner{width:min(1240px,100%);margin:0 auto;padding:150px clamp(22px,5vw,72px) 104px;display:grid;grid-template-columns:minmax(0,1fr) minmax(270px,380px);gap:44px;align-items:end}
    .hero-copy{max-width:680px}
    .hero-badge{display:inline-flex;align-items:center;gap:9px;color:#dbe9cc;background:rgba(191,220,130,.12);border:1px solid rgba(191,220,130,.35);border-radius:999px;padding:8px 13px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;animation:fadeUp .7s both}
    .hero-badge-dot{width:7px;height:7px;border-radius:50%;background:var(--leaf);box-shadow:0 0 0 5px rgba(191,220,130,.13)}
    .hero-h1{font-size:clamp(48px,7.2vw,92px);line-height:.96;letter-spacing:-.075em;font-weight:600;margin:24px 0 24px;max-width:750px;animation:fadeUp .7s .08s both}
    .hero-h1 em{font-family:'Fraunces',serif;color:var(--leaf);font-style:italic;font-weight:500;letter-spacing:-.06em}
    .hero-sub{max-width:550px;color:rgba(255,255,255,.74);font-size:17px;line-height:1.65;margin-bottom:32px;animation:fadeUp .7s .16s both}
    .hero-btns{display:flex;align-items:center;gap:13px;flex-wrap:wrap;animation:fadeUp .7s .24s both}
    .btn-hero-primary,.btn-hero-secondary{border-radius:999px;padding:14px 20px;display:inline-flex;align-items:center;justify-content:center;gap:9px;font-size:13px;font-weight:700;transition:all .25s var(--ease)}
    .btn-hero-primary{background:var(--leaf);color:var(--deep);border:1px solid var(--leaf);box-shadow:0 12px 28px rgba(0,0,0,.16)}
    .btn-hero-primary:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(0,0,0,.26);background:#cbe79a}
    .btn-hero-secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.3)}
    .btn-hero-secondary:hover{background:rgba(255,255,255,.16);transform:translateY(-2px)}
    .hero-meta{display:flex;align-items:center;gap:14px;margin-top:34px;color:rgba(255,255,255,.58);font-size:12px;animation:fadeUp .7s .32s both}
    .hero-avatars{display:flex;padding-left:8px}
    .hero-avatar{width:27px;height:27px;margin-left:-8px;border-radius:50%;border:2px solid #27382c;display:grid;place-items:center;font-size:10px;font-weight:700;color:var(--deep)}
    .hero-avatar:nth-child(1){background:#e8c5a3}.hero-avatar:nth-child(2){background:#d4a57e}.hero-avatar:nth-child(3){background:#b9d188}.hero-avatar:nth-child(4){background:#d2d7c8}
    .hero-side{display:flex;justify-content:flex-end;padding-bottom:8px;animation:fadeUp .8s .28s both}
    .hero-proof{width:100%;max-width:320px;padding:20px;border:1px solid rgba(255,255,255,.22);background:rgba(20,34,25,.56);backdrop-filter:blur(15px);border-radius:22px;box-shadow:0 24px 60px rgba(0,0,0,.22)}
    .hero-proof-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;color:rgba(255,255,255,.64);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
    .hero-proof-top span:last-child{color:var(--leaf);font-size:10px;letter-spacing:0;text-transform:none}
    .hero-proof h2{font-size:27px;line-height:1.06;letter-spacing:-.06em;font-weight:600;margin-bottom:8px}
    .hero-proof p{color:rgba(255,255,255,.58);font-size:12px;line-height:1.5;margin-bottom:19px}
    .proof-bar{height:7px;background:rgba(255,255,255,.14);border-radius:99px;overflow:hidden;margin-bottom:16px}
    .proof-bar span{display:block;width:68%;height:100%;background:var(--leaf);border-radius:inherit}
    .proof-rows{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .proof-row{border-top:1px solid rgba(255,255,255,.14);padding-top:10px}
    .proof-row strong{display:block;font-size:16px;font-weight:600;color:#fff}.proof-row span{font-size:10px;color:rgba(255,255,255,.52)}
    .hero-scroll{position:absolute;bottom:25px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.5);font-size:10px;letter-spacing:.13em;text-transform:uppercase}
    .hero-scroll::before{content:'';width:1px;height:26px;background:rgba(255,255,255,.38)}
    .logos-strip{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:20px clamp(22px,5vw,72px);background:var(--deep);color:#fff}
    .logos-label{color:rgba(255,255,255,.54);font-size:11px;white-space:nowrap}.logos-row{display:flex;gap:clamp(18px,4vw,48px);align-items:center;flex-wrap:wrap;justify-content:flex-end}.logo-name{font-size:14px;font-weight:600;letter-spacing:-.03em;color:rgba(255,255,255,.58)}
    .section-wrap{width:min(1180px,100%);margin:0 auto;padding:112px clamp(22px,5vw,60px)}
    .section-kicker{display:flex;align-items:center;gap:9px;color:var(--moss);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;margin-bottom:16px}.section-kicker::before{content:'';width:22px;height:1px;background:var(--coral)}
    .section-title{font-size:clamp(40px,5.5vw,70px);line-height:.98;letter-spacing:-.073em;font-weight:600;color:var(--ink);max-width:700px}.section-title em{font-family:'Fraunces',serif;color:var(--moss);font-style:italic;font-weight:500}.section-lead{max-width:530px;color:var(--muted);font-size:16px;line-height:1.65;margin-top:20px}
    .feature-section{background:var(--paper)}
    .feature-head{display:flex;align-items:end;justify-content:space-between;gap:35px;margin-bottom:48px}.feature-head .section-lead{margin:0;max-width:360px}
    .feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.feature-card{min-height:260px;padding:25px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.58);display:flex;flex-direction:column;justify-content:space-between;transition:all .25s var(--ease)}.feature-card:hover{transform:translateY(-5px);background:#fff;border-color:#b9cdb7;box-shadow:0 18px 40px rgba(39,59,46,.08)}.feature-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:var(--sage);color:var(--moss)}.feature-card:nth-child(2) .feature-icon{background:#f5e5d6;color:#a15c42}.feature-card:nth-child(3) .feature-icon{background:#e4e1f1;color:#65618d}.feature-card:nth-child(4) .feature-icon{background:#e4eef4;color:#3d7081}.feature-card:nth-child(5) .feature-icon{background:#f3edcf;color:#8e793c}.feature-card:nth-child(6) .feature-icon{background:#e8e5df;color:#635f59}.feature-card h3{font-size:18px;letter-spacing:-.05em;font-weight:700;margin-top:30px}.feature-card p{font-size:13px;line-height:1.6;color:var(--muted);margin-top:9px}.feature-link{display:flex;align-items:center;gap:6px;color:var(--moss);font-size:11px;font-weight:700;margin-top:18px}
    .workflow-section{background:#e8ede4}.workflow-layout{display:grid;grid-template-columns:.82fr 1.18fr;gap:90px;align-items:start}.workflow-intro{position:sticky;top:110px}.workflow-list{display:flex;flex-direction:column;gap:12px}.workflow-step{display:grid;grid-template-columns:46px 1fr;gap:18px;padding:23px 24px;background:rgba(255,255,255,.68);border:1px solid rgba(70,98,76,.14);border-radius:18px;transition:all .25s}.workflow-step:hover{background:#fff;transform:translateX(5px);box-shadow:0 15px 30px rgba(39,59,46,.08)}.workflow-number{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:var(--deep);color:var(--leaf);font-size:11px;font-weight:700}.workflow-step h3{font-size:17px;letter-spacing:-.04em;margin-bottom:6px}.workflow-step p{color:var(--muted);font-size:13px;line-height:1.6}.workflow-detail{display:flex;align-items:center;gap:7px;color:var(--moss);font-size:11px;font-weight:700;margin-top:13px}
    .dashboard-section{background:var(--paper)}.dashboard-card{display:grid;grid-template-columns:1fr 1.2fr;gap:0;margin-top:55px;overflow:hidden;border:1px solid var(--line);border-radius:24px;background:#fff;box-shadow:0 24px 70px rgba(39,59,46,.08)}.dashboard-copy{padding:45px}.dashboard-copy h3{font-size:28px;line-height:1.05;letter-spacing:-.065em;max-width:290px}.dashboard-copy p{font-size:13px;color:var(--muted);line-height:1.65;max-width:300px;margin:15px 0 26px}.dashboard-check{display:flex;align-items:center;gap:9px;color:var(--moss);font-size:12px;font-weight:600;margin-top:12px}.dashboard-check svg{color:#6f9b48}.dashboard-mock{padding:28px;background:#f1f3ed;min-height:330px}.mock-window{height:100%;border-radius:15px;background:#fff;border:1px solid #dfe5da;box-shadow:0 13px 30px rgba(39,59,46,.1);overflow:hidden}.mock-top{display:flex;align-items:center;gap:6px;padding:12px 15px;border-bottom:1px solid #edf0e9}.mock-dot{width:7px;height:7px;border-radius:50%;background:#d9ded5}.mock-dot:nth-child(2){background:#ead6a1}.mock-dot:nth-child(3){background:#b7d48e}.mock-title{margin-left:7px;color:#8d968b;font-size:10px;font-weight:600}.mock-content{display:grid;grid-template-columns:92px 1fr;min-height:260px}.mock-side{padding:15px 10px;border-right:1px solid #edf0e9}.mock-side-label{font-size:9px;color:#a8b0a5;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}.mock-side-item{height:22px;border-radius:6px;padding:5px 7px;color:#748176;font-size:9px;margin-bottom:4px}.mock-side-item.active{background:#e9f1e2;color:#4d724b;font-weight:700}.mock-main{padding:18px}.mock-main-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.mock-main-head strong{font-size:14px;letter-spacing:-.04em}.mock-add{border:0;background:var(--deep);color:#fff;border-radius:6px;padding:5px 8px;font-size:8px}.mock-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:15px}.mock-stat{border:1px solid #eef1eb;border-radius:8px;padding:9px}.mock-stat span{display:block;font-size:8px;color:#98a198;margin-bottom:4px}.mock-stat strong{font-size:15px;color:var(--deep)}.mock-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.mock-job{border:1px solid #edf0e9;border-radius:8px;padding:9px}.mock-job i{display:block;width:18px;height:18px;border-radius:6px;background:#d9e7cd;margin-bottom:9px}.mock-job:nth-child(2) i{background:#f1ded1}.mock-job:nth-child(3) i{background:#dedced}.mock-job strong{display:block;font-size:9px;margin-bottom:3px}.mock-job span{font-size:8px;color:#a0a9a0}
    .stats-section{background:var(--deep);color:#fff}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border-top:1px solid rgba(255,255,255,.15);border-bottom:1px solid rgba(255,255,255,.15);margin-top:55px}.stat-block{padding:28px 20px 25px;border-right:1px solid rgba(255,255,255,.15)}.stat-block:last-child{border-right:0}.stat-value{font-size:42px;letter-spacing:-.07em;color:var(--leaf);font-weight:600}.stat-block h3{font-size:13px;margin-top:3px}.stat-block p{font-size:11px;color:rgba(255,255,255,.5);margin-top:5px}
    .story-section{background:#f5eee7}.story-card{display:grid;grid-template-columns:1fr .82fr;gap:50px;align-items:center;margin-top:55px}.story-quote{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,52px);line-height:1.06;letter-spacing:-.06em;color:var(--deep)}.story-byline{display:flex;align-items:center;gap:12px;margin-top:25px}.story-avatar{width:39px;height:39px;border-radius:50%;display:grid;place-items:center;background:#d0b396;color:var(--deep);font-size:12px;font-weight:700}.story-byline strong{display:block;font-size:12px}.story-byline span{display:block;color:var(--muted);font-size:11px;margin-top:3px}.story-aside{padding:25px;border:1px solid rgba(70,98,76,.16);border-radius:20px;background:rgba(255,255,255,.55)}.story-aside p{font-size:13px;line-height:1.65;color:var(--muted)}.story-mini{display:flex;justify-content:space-between;border-top:1px solid #d9ded5;margin-top:22px;padding-top:16px}.story-mini strong{font-size:23px;letter-spacing:-.06em}.story-mini span{display:block;color:var(--muted);font-size:10px;margin-top:3px}
    .cta-section{padding:125px 22px;text-align:center;position:relative;background:var(--paper);overflow:hidden}.cta-section::before{content:'';position:absolute;width:480px;height:480px;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:50%;background:rgba(191,220,130,.25);filter:blur(65px)}.cta-content{position:relative}.cta-tree{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:17px;background:var(--deep);color:var(--leaf);margin-bottom:20px}.cta-h{font-size:clamp(42px,6vw,76px);font-weight:600;letter-spacing:-.08em;line-height:.95;color:var(--ink)}.cta-h em{font-family:'Fraunces',serif;color:var(--moss);font-style:italic;font-weight:500}.cta-sub{color:var(--muted);font-size:15px;margin:17px auto 28px}.site-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;padding:24px clamp(22px,5vw,72px);border-top:1px solid var(--line);background:var(--paper)}.footer-logo{display:flex;align-items:center;gap:8px;color:var(--deep);font-size:14px;font-weight:700}.footer-copy{color:#8a948a;font-size:11px}
    .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s var(--ease),transform .7s var(--ease)}.reveal.visible{opacity:1;transform:translateY(0)}.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes scaleIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:none}}
    .auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 10% 10%,#e2edd4,#f5f4ef 48%);position:relative}.auth-card{width:min(420px,100%);background:#fff;border:1px solid var(--line);border-radius:24px;padding:42px 36px;box-shadow:0 24px 70px rgba(39,59,46,.12);animation:scaleIn .45s var(--ease)}.auth-tree{text-align:center;color:var(--moss);display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:var(--sage);font-size:0;margin:0 auto 18px}.auth-tree::after{content:'✦';font-size:24px;color:var(--moss)}.auth-h{text-align:center;font-size:28px;line-height:1.05;letter-spacing:-.07em;color:var(--ink);margin-bottom:10px}.auth-p{text-align:center;color:var(--muted);font-size:13px;line-height:1.6;margin-bottom:26px}.auth-err{background:#fff2ed;border:1px solid #f3cbbb;border-radius:10px;padding:11px 13px;color:#9e4f38;font-size:12px;margin-bottom:16px}.google-btn{width:100%;padding:13px 15px;border:1px solid #d9e0d8;border-radius:12px;background:#fff;display:flex;justify-content:center;align-items:center;gap:10px;color:var(--ink);font-size:13px;font-weight:700;transition:all .2s}.google-btn:hover{border-color:#a9bca7;box-shadow:0 8px 20px rgba(39,59,46,.09);transform:translateY(-2px)}.google-btn:disabled{opacity:.6;pointer-events:none}.google-btn svg{width:19px;height:19px}.auth-back{width:100%;margin-top:10px;padding:12px;border:0;background:transparent;color:var(--moss);font-size:12px;font-weight:700}.auth-note{text-align:center;color:#9aa39b;font-size:10.5px;line-height:1.6;margin-top:18px}.loading-full{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:var(--paper)}.loading-ring{width:40px;height:40px;border-radius:50%;border:3px solid var(--sage);border-top-color:var(--moss);animation:spin .75s linear infinite}.loading-label{font-size:12px;color:var(--muted)}
    @media(max-width:900px){.hero-inner{grid-template-columns:1fr}.hero-side{justify-content:flex-start}.hero-proof{max-width:350px}.feature-grid{grid-template-columns:repeat(2,1fr)}.workflow-layout{grid-template-columns:1fr;gap:45px}.workflow-intro{position:static}.dashboard-card,.story-card{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}.stat-block:nth-child(2){border-right:0}.stat-block:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.15)}}
    @media(max-width:640px){.lnav,.lnav.stuck{padding:15px 18px}.lnav-links{display:none}.lnav-cta{padding:9px 12px}.hero{min-height:800px}.hero-inner{padding:125px 20px 90px}.hero-h1{font-size:clamp(47px,15vw,72px)}.hero-sub{font-size:15px}.hero-overlay{background:linear-gradient(90deg,rgba(12,23,17,.96),rgba(12,23,17,.72)),linear-gradient(0deg,rgba(12,23,17,.5),transparent 55%)}.hero-full-img{object-position:63% center}.logos-strip{align-items:flex-start;flex-direction:column;padding:19px 20px;gap:13px}.logos-row{justify-content:flex-start;gap:13px 22px}.feature-head{display:block}.feature-head .section-lead{margin-top:18px}.feature-grid{grid-template-columns:1fr}.section-wrap{padding-top:82px;padding-bottom:82px}.dashboard-copy{padding:30px}.dashboard-mock{padding:14px;overflow:auto}.mock-content{min-width:410px}.stats-grid{grid-template-columns:1fr}.stat-block,.stat-block:nth-child(2){border-right:0;border-bottom:1px solid rgba(255,255,255,.15)}.stat-block:last-child{border-bottom:0}.story-quote{font-size:36px}.auth-card{padding:34px 24px}.site-footer{align-items:flex-start;flex-direction:column}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}.hero-badge,.hero-h1,.hero-sub,.hero-btns,.hero-meta,.hero-side{animation:none}.feature-card,.workflow-step,.btn-hero-primary,.btn-hero-secondary{transition:none}}
    `;

function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll(".reveal");
        const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }), { threshold: 0.1 });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, []);
}

function AnimCounter({ to, suffix = "" }) {
    const ref = useRef(null);
    const [val, setVal] = useState(0);
    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            io.disconnect();
            let v = 0;
            const tick = () => { v += Math.ceil(to / 55); if (v >= to) { setVal(to); return; } setVal(v); requestAnimationFrame(tick); };
            requestAnimationFrame(tick);
        }, { threshold: 0.5 });
        if (ref.current) io.observe(ref.current);
        return () => io.disconnect();
    }, [to]);
    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────── Landing Page ──────────────────────── */
function LandingPage() {
    const navigate = useNavigate();
    const [stuck, setStuck] = useState(false);

    useReveal();
    useEffect(() => {
        const fn = () => setStuck(window.scrollY > 50);
        window.addEventListener("scroll", fn);
        return () => window.removeEventListener("scroll", fn);
    }, [navigate]);

    const go = () => navigate("/login");
    const seeFeatures = () => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });

    const features = [
        { title: "One calm pipeline", desc: "Move every role from saved to offer without losing the context, links, notes, or next step.", icon: <GitBranch size={20} /> },
        { title: "Follow up on time", desc: "Set a reminder on any application and keep warm leads from quietly slipping away.", icon: <Bell size={20} /> },
        { title: "See what matters", desc: "Grid, list, or board — switch views when you need a different angle on your search.", icon: <LayoutDashboard size={20} /> },
        { title: "Walk in ready", desc: "Turn each interview into a focused prep session with tailored questions and talking points.", icon: <Brain size={20} /> },
        { title: "Know your numbers", desc: "Track reply rate, offers, and momentum so you can make better decisions each week.", icon: <BarChart3 size={20} /> },
        { title: "Find it instantly", desc: "Use search and the command bar to jump from a recruiter note to the right application in seconds.", icon: <Search size={20} /> },
    ];

    const workflow = [
        { number: "01", title: "Capture the opportunity", text: "Save a role while it is fresh. Add the company, link, salary, location, and the detail you will want later.", detail: "No more lost tabs", icon: <Sprout size={15} /> },
        { number: "02", title: "Keep the momentum", text: "Move the application through six clear stages and let reminders tell you when it is time to follow up.", detail: "A pipeline you can trust", icon: <Timer size={15} /> },
        { number: "03", title: "Show up prepared", text: "When the interview arrives, open the job record, review your notes, and use focused prep to walk in with a plan.", detail: "Turn activity into progress", icon: <Sparkles size={15} /> },
    ];

    return (
        <div className="landing-page">
            <nav className={`lnav${stuck ? " stuck" : ""}`}>
                <div className="lnav-logo"><span className="lnav-mark"><Sprout size={17} /></span> Career Garden</div>
                <ul className="lnav-links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#how-it-works">How it works</a></li>
                    <li><a href="#testimonials">Stories</a></li>
                </ul>
                <button className="lnav-cta" onClick={go}>Get started free</button>
            </nav>

            <section className="hero">
                <div className="hero-bg-layer">
                    <img src={heroDesk} alt="Person working at a desk between a thriving and a dried plant" className="hero-full-img" />
                    <div className="hero-overlay" />
                </div>
                <div className="hero-inner">
                    <div className="hero-copy">
                        <div className="hero-badge"><span className="hero-badge-dot" /> A calmer way to job hunt</div>
                        <h1 className="hero-h1">Make room for the work that <em>moves you forward.</em></h1>
                        <p className="hero-sub">Career Garden keeps every application, follow-up, and interview note in one place — so your job search feels like progress, not another full-time job.</p>
                        <div className="hero-btns">
                            <button className="btn-hero-primary" onClick={go}>Start growing <ArrowRight size={16} /></button>
                            <button className="btn-hero-secondary" onClick={seeFeatures}>See how it works <ArrowRight size={15} /></button>
                        </div>
                        <div className="hero-meta">
                            <div className="hero-avatars"><span className="hero-avatar">AR</span><span className="hero-avatar">SC</span><span className="hero-avatar">JM</span><span className="hero-avatar">+</span></div>
                            <span>Join 5,000+ people growing their next chapter</span>
                        </div>
                    </div>
                    <div className="hero-side">
                        <div className="hero-proof">
                            <div className="hero-proof-top"><span>This week's garden</span><span>On track ↗</span></div>
                            <h2>6 applications moving</h2>
                            <p>Small, consistent steps add up. Keep your next action visible.</p>
                            <div className="proof-bar"><span /></div>
                            <div className="proof-rows"><div className="proof-row"><strong>12</strong><span>active roles</span></div><div className="proof-row"><strong>68%</strong><span>in motion</span></div><div className="proof-row"><strong>03</strong><span>follow-ups</span></div></div>
                        </div>
                    </div>
                </div>
                <div className="hero-scroll">Scroll to explore</div>
            </section>

            <div className="logos-strip">
                <p className="logos-label">Built for ambitious job seekers</p>
                <div className="logos-row">{["Product", "Engineering", "Design", "Marketing", "Operations"].map(n => <div key={n} className="logo-name">{n}</div>)}</div>
            </div>

            <section className="feature-section" id="features">
                <div className="section-wrap">
                    <div className="feature-head reveal">
                        <div><div className="section-kicker">Everything in one place</div><h2 className="section-title">A better system for the <em>in-between.</em></h2></div>
                        <p className="section-lead">From the first saved link to the final offer, the details stay close and the next step stays obvious.</p>
                    </div>
                    <div className="feature-grid">
                        {features.map((feature, index) => <article className={`feature-card reveal d${(index % 3) + 1}`} key={feature.title}><div><div className="feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.desc}</p></div><div className="feature-link">Explore feature <ArrowRight size={13} /></div></article>)}
                    </div>
                </div>
            </section>

            <section className="workflow-section" id="how-it-works">
                <div className="section-wrap workflow-layout">
                    <div className="workflow-intro reveal"><div className="section-kicker">A simple rhythm</div><h2 className="section-title">Keep the search <em>growing.</em></h2><p className="section-lead">You do the work. Career Garden clears the noise around it, so you always know what happened and what comes next.</p></div>
                    <div className="workflow-list">{workflow.map((step, index) => <article className={`workflow-step reveal d${index + 1}`} key={step.number}><div className="workflow-number">{step.number}</div><div><h3>{step.title}</h3><p>{step.text}</p><div className="workflow-detail">{step.icon}{step.detail}</div></div></article>)}</div>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="section-wrap">
                    <div className="section-kicker reveal">Clarity at a glance</div><h2 className="section-title reveal">Your whole search, without the <em>spreadsheet sprawl.</em></h2>
                    <div className="dashboard-card reveal d1">
                        <div className="dashboard-copy"><h3>Know the next right move.</h3><p>Every role has a home, a stage, and a next step. The dashboard makes it easy to pick up where you left off.</p>{["Six clear application stages", "Reminders that stay attached to the role", "Notes, links, and salary in context"].map(item => <div className="dashboard-check" key={item}><Check size={15} strokeWidth={2.5} />{item}</div>)}</div>
                        <div className="dashboard-mock"><div className="mock-window"><div className="mock-top"><i className="mock-dot" /><i className="mock-dot" /><i className="mock-dot" /><span className="mock-title">career garden / dashboard</span></div><div className="mock-content"><aside className="mock-side"><div className="mock-side-label">Workspace</div><div className="mock-side-item active">Overview</div><div className="mock-side-item">All jobs</div><div className="mock-side-item">Interviews</div><div className="mock-side-item">Stats</div></aside><div className="mock-main"><div className="mock-main-head"><strong>Good morning, Alex</strong><button className="mock-add">+ Add job</button></div><div className="mock-stats"><div className="mock-stat"><span>Active</span><strong>12</strong></div><div className="mock-stat"><span>Interviews</span><strong>03</strong></div><div className="mock-stat"><span>Reply rate</span><strong>24%</strong></div></div><div className="mock-cards"><div className="mock-job"><i /><strong>Notion</strong><span>Interview</span></div><div className="mock-job"><i /><strong>Figma</strong><span>Applied</span></div><div className="mock-job"><i /><strong>Linear</strong><span>Saved</span></div></div></div></div></div></div>
                    </div>
                </div>
            </section>

            <section className="stats-section"><div className="section-wrap"><div className="section-kicker" style={{ color: "var(--leaf)" }}>A little momentum</div><h2 className="section-title" style={{ color: "#fff" }}>Progress feels different when you can <em style={{ color: "var(--leaf)" }}>see it.</em></h2><div className="stats-grid">{[{ to: 12400, suffix: "+", label: "Applications tracked", desc: "Across growing careers" }, { to: 94, suffix: "%", label: "Feel more in control", desc: "A clearer search starts here" }, { to: 3, suffix: "×", label: "Less tab switching", desc: "More time for the work" }, { to: 0, suffix: "$", label: "Cost to start", desc: "Free forever" }].map(stat => <div className="stat-block" key={stat.label}><div className="stat-value"><AnimCounter to={stat.to} />{stat.suffix}</div><h3>{stat.label}</h3><p>{stat.desc}</p></div>)}</div></div></section>

            <section className="story-section" id="testimonials"><div className="section-wrap"><div className="section-kicker reveal">From the garden</div><div className="story-card"><div className="reveal"><blockquote className="story-quote">“I stopped wondering where everything stood and started spending that energy on the applications themselves.”</blockquote><div className="story-byline"><div className="story-avatar">JM</div><div><strong>Jordan M.</strong><span>Product designer · hired after 8 weeks</span></div></div></div><div className="story-aside reveal d1"><p>Career Garden gives your search a shape. See what is active, what needs attention, and how the small wins are adding up.</p><div className="story-mini"><div><strong>6</strong><span>job stages</span></div><div><strong>3</strong><span>board views</span></div><div><strong>⌘K</strong><span>quick search</span></div></div></div></div></div></section>

            <section className="cta-section"><div className="cta-content"><div className="cta-tree"><Sprout size={25} /></div><h2 className="cta-h reveal">Ready to grow into<br /><em>what's next?</em></h2><p className="cta-sub reveal d1">Sign in with Google. Free forever. No spreadsheet required.</p><div className="reveal d2"><button className="btn-hero-primary" onClick={go}>Open my garden <ArrowRight size={16} /></button></div></div></section>

            <footer className="site-footer"><div className="footer-logo"><Sprout size={16} /> Career Garden</div><div className="footer-copy">© 2026 Career Garden · Built with care</div></footer>
        </div>
    );
}

/* ─────────────────────────── Login Page ────────────────────────── */
function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function signInWithGoogle() {
        setLoading(true); setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "http://localhost:5173/auth/callback",
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        });
        if (error) { setError(error.message); setLoading(false); }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <span className="auth-tree">🌳</span>
                <h1 className="auth-h">Welcome to Career Garden</h1>
                <p className="auth-p">Sign in to track your applications and grow your career — synced across every device.</p>
                {error && <div className="auth-err">{error}</div>}
                <button className="google-btn" onClick={signInWithGoogle} disabled={loading}>
                    {loading
                        ? <span style={{ width: 18, height: 18, border: "2.5px solid #e5e7eb", borderTopColor: "#374151", borderRadius: "50%", animation: "spin .65s linear infinite", display: "inline-block" }} />
                        : <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    }
                    {loading ? "Signing in…" : "Continue with Google"}
                </button>
                <button className="auth-back" onClick={() => navigate("/")}>← Back to home</button>
                <p className="auth-note">Your data is encrypted and stored securely via Supabase.<br />No ads, no tracking, no data selling.</p>
            </div>
        </div>
    );
}

/* ─────────────────────────── Auth Callback ─────────────────────── */
function AuthCallback() {
    const navigate = useNavigate();
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) { subscription.unsubscribe(); navigate("/dashboard", { replace: true }); }
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate("/dashboard", { replace: true });
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    return <div className="loading-full"><div className="loading-ring" /><div className="loading-label">Signing you in…</div></div>;
}

/* ─────────────────────────── Protected Route ───────────────────── */
function ProtectedRoute({ children }) {
    const [session, setSession] = useState(undefined);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);

    if (session === undefined) return <div className="loading-full"><div className="loading-ring" /><div className="loading-label">Loading your garden…</div></div>;
    if (!session) return <Navigate to="/login" replace />;
    return children;
}

/* ─────────────────────────── App shell ─────────────────────────── */
function AppShell() {
    const [session, setSession] = useState(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);

    if (!session) return <div className="loading-full"><div className="loading-ring" /></div>;
    return (
        <Suspense fallback={<div className="loading-full"><div className="loading-ring" /><div className="loading-label">Loading dashboard…</div></div>}>
            <MainApp user={session.user} session={session} />
        </Suspense>
    );
}

/* ─────────────────────────── Root ──────────────────────────────── */
export default function App() {
    return (
        <>
            <style>{GLOBAL_CSS}</style>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/dashboard" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                    <Route path="/dashboard/:status" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                    <Route path="/job/:id" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}
