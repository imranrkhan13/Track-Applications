    /**
     * App.jsx — Career Garden root
     * deps: react-router-dom, @supabase/supabase-js, three
     *
     *   npm install react-router-dom @supabase/supabase-js three
     *
     * Supabase setup required:
     *   1. Enable Google OAuth in Auth → Providers
     *   2. Add redirect URL: http://localhost:5173/auth/callback
     *   3. Create table: jobs (id, user_id, company, role, status, date, notes,
     *                          salary, location, url, created_at)
     *      Row Level Security: user_id = auth.uid()
     */

    import { useState, useEffect, useRef, lazy, Suspense } from "react";
    import React from "react";
    import {
        BrowserRouter, Routes, Route, Navigate,
        useNavigate, useLocation
    } from "react-router-dom";
    import { createClient } from "@supabase/supabase-js";
import { motion } from 'framer-motion';
import { Sprout, MousePointerClick, LayoutDashboard, BarChart3 } from 'lucide-react';
    /* ─────────────────────────── Supabase ──────────────────────────── */
export const supabase = createClient(
    "https://podosiaizzetwtdxjyei.supabase.co",
    "sb_publishable_t6fIvb_0shfoJcICHg8-cg_ea8FUUrA",
    {
        auth: {
            flowType: "pkce",
        }
    }
);

    /* ─────────────────────────── Lazy imports ───────────────────────── */
    const MainApp = lazy(() => import("./maine"));

    /* ─────────────────────────── Global CSS ─────────────────────────── */
    const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
    body{font-family:'Poppins',sans-serif;background:#f4fbf4;color:#0d1f0d;overflow-x:hidden}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#86efac;border-radius:99px}

    :root{
    --g950:#052e16;--g900:#14532d;--g800:#166534;--g700:#15803d;
    --g600:#16a34a;--g500:#22c55e;--g400:#4ade80;--g300:#86efac;
    --g200:#bbf7d0;--g100:#dcfce7;--g50:#f0fdf4;
    --ease-spring:cubic-bezier(.34,1.56,.64,1);
    --ease-out:cubic-bezier(.22,1,.36,1);
    }
    /* ── THE FIXED HERO ── */
/* ── THE FIXED HERO ── */
.hero {
  position: relative;
  min-height: 120vh; /* Extra height for better framing */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #052e16; /* Dark base matches the forest */
}

.hero-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.hero-full-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85; /* Slightly darker to let text pop */
}

/* A dark radial vignette to focus light on the center text */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(5, 46, 22, 0.2) 0%,
    rgba(5, 46, 22, 0.7) 100%
  );
}

.hero-content-overlay {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 1100px;
  padding: 120px 24px 60px;
}

/* ── HIGHLIGHTED TEXT ── */
.hero-h1 {
  font-size: clamp(48px, 8vw, 92px);
  color: #ffffff !important; /* Pure white text */
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); /* Deep shadow for legibility */
  line-height: 1;
}

.hero-h1 em {
  color: #86efac !important; /* Neon mint highlight */
  text-shadow: 0 0 20px rgba(134, 239, 172, 0.4);
}

.hero-sub {
  color: rgba(255, 255, 255, 0.9) !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-weight: 500;
  max-width: 600px;
}

/* ── PREMIUM GLASS DASHBOARD ── */
.preview-wrap {
  margin-top: 80px;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.4));
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1) !important; /* Subtle tint */
  backdrop-filter: blur(25px) saturate(160%);
  -webkit-backdrop-filter: blur(25px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: inset 0 0 20px rgba(255,255,255,0.1);
}

/* Make the internal cards stand out inside the glass */
.pcard {
  background: rgba(255, 255, 255, 0.9) !important; /* Solid white inside blur */
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* ── NAV HIGHLIGHT ── */
.lnav-logo { color: #ffffff; }
.lnav-links a { color: #ffffff; opacity: 0.8; }
.lnav.stuck .lnav-logo { color: var(--g950); }
.lnav.stuck .lnav-links a { color: var(--g950); }

    /* ── Canvas ── */
    #cg-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.4}

    /* ── Keyframes ── */
    @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
    @keyframes treeBob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-14px) rotate(2deg)}}
    @keyframes ctaFloat{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-18px) rotate(2.5deg)}}

    /* ── Reveal ── */
    .reveal{opacity:0;transform:translateY(36px);transition:opacity .7s var(--ease-out),transform .7s var(--ease-out)}
    .reveal.visible{opacity:1;transform:translateY(0)}
    .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}

    /* ── LANDING NAV ── */
.lnav {
  position: fixed; top: 0; width: 100%; z-index: 1000;
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 60px; transition: all 0.4s var(--ease-out);
}
.lnav-logo { font-weight: 800; font-size: 22px; color: #ffffff; display: flex; align-items: center; gap: 8px; }
.lnav-links { display: flex; gap: 32px; list-style: none; }
.lnav-links a { color: #ffffff; text-decoration: none; font-weight: 500; opacity: 0.8; transition: 0.3s; }
.lnav-links a:hover { opacity: 1; }
.lnav-cta { background: #ffffff; color: #052e16; border: none; padding: 12px 24px; border-radius: 99px; font-weight: 700; cursor: pointer; }

/* When scrolling down */
.lnav.stuck {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  padding: 16px 60px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.lnav.stuck .lnav-logo, .lnav.stuck .lnav-links a { color: #052e16; }
.lnav.stuck .lnav-cta { background: #052e16; color: #ffffff; }

    /* ── HERO ── */
    .hero{
    position:relative;z-index:1;
    min-height:100vh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    text-align:center;padding:140px 24px 90px;
    }
    .hero-badge{
    display:inline-flex;align-items:center;gap:8px;
    padding:7px 18px;border-radius:99px;
    background:rgba(220,252,231,.82);border:1px solid var(--g200);
    font-size:11.5px;font-weight:700;color:var(--g700);
    letter-spacing:.08em;text-transform:uppercase;
    margin-bottom:32px;backdrop-filter:blur(8px);
    animation:fadeUp .8s ease both;
    }
    .hero-badge-dot{width:7px;height:7px;border-radius:50%;background:var(--g500);animation:pulse 2s ease infinite}
    .hero-h1{
    font-size:clamp(48px,7.5vw,92px);font-weight:800;
    color:var(--g950);line-height:1.03;letter-spacing:-.052em;
    margin-bottom:24px;animation:fadeUp .8s .08s ease both;
    }
    .hero-h1 em{color:var(--g700);font-style:italic;font-weight:800}
    .hero-sub{
    font-size:clamp(16px,1.8vw,20px);color:#4b5563;line-height:1.7;
    max-width:540px;margin:0 auto 46px;font-weight:400;
    animation:fadeUp .8s .16s ease both;
    }
    .hero-btns{
    display:flex;gap:14px;justify-content:center;flex-wrap:wrap;
    margin-bottom:72px;animation:fadeUp .8s .24s ease both;
    }
    .btn-hero-primary{
    background:var(--g950);color:#fff;border:none;border-radius:99px;
    padding:16px 38px;font-family:'Poppins',sans-serif;font-size:15.5px;font-weight:700;
    cursor:pointer;transition:all .3s var(--ease-spring);
    box-shadow:0 8px 30px rgba(5,46,22,.32),inset 0 1px 0 rgba(255,255,255,.12);
    }
    .btn-hero-primary:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 44px rgba(5,46,22,.44)}
    .btn-hero-secondary{
    background:rgba(255,255,255,.82);color:var(--g900);
    border:1.5px solid var(--g200);border-radius:99px;
    padding:15px 32px;font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;
    cursor:pointer;transition:all .3s var(--ease-spring);backdrop-filter:blur(8px);
    }
    .btn-hero-secondary:hover{background:#fff;border-color:var(--g400);transform:translateY(-2px)}

    /* ── PREVIEW WINDOW ── */
    .preview-wrap{
    position:relative;width:100%;max-width:920px;margin:0 auto;
    animation:fadeUp .9s .38s ease both;
    }
    .preview-glow{
    position:absolute;inset:-50px;
    background:radial-gradient(ellipse at 50% 80%,rgba(34,197,94,.18) 0%,transparent 65%);
    pointer-events:none;
    }
    .preview-win{
    position:relative;z-index:1;background:#fff;border-radius:22px;
    border:1px solid rgba(187,247,208,.85);
    box-shadow:0 36px 90px rgba(5,46,22,.13),0 8px 24px rgba(5,46,22,.05);
    overflow:hidden;
    }
    .preview-bar{
    background:linear-gradient(to right,#f0fdf4,#e7faea);
    padding:14px 20px;border-bottom:1px solid #d1fae5;
    display:flex;align-items:center;gap:8px;
    }
    .pdot{width:12px;height:12px;border-radius:50%}
    .purl{
    flex:1;margin:0 14px;background:rgba(255,255,255,.75);
    border:1px solid #d1fae5;border-radius:9px;padding:6px 14px;
    font-size:11.5px;color:#6b7280;font-weight:500;
    }
    .preview-body{
    padding:24px;display:grid;
    grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;
    }
    .pcard{
    border-radius:16px;padding:18px 14px;text-align:center;
    border:1px solid;transition:transform .3s var(--ease-spring);cursor:default;
    }
    .pcard:hover{transform:translateY(-5px) scale(1.02)}
    .pcard-co{font-size:13.5px;font-weight:800;color:#0d1f0d;margin-bottom:3px}
    .pcard-role{font-size:11px;color:#4b7a5c;font-weight:500}
    .pcard-tag{display:inline-block;margin-top:9px;padding:4px 11px;border-radius:99px;font-size:9px;font-weight:700;letter-spacing:.06em}

    /* ── LOGOS ── */
    .logos-strip{position:relative;z-index:1;padding:60px 24px;text-align:center}
    .logos-label{font-size:11.5px;font-weight:600;color:#c9d4c9;letter-spacing:.12em;text-transform:uppercase;margin-bottom:28px}
    .logos-row{display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap}
    .logo-name{font-size:17px;font-weight:700;color:#c9d4c9;letter-spacing:-.02em;transition:color .25s;cursor:default}
    .logo-name:hover{color:#9ca3af}

    /* ── GENERIC SECTION ── */
    .lp-section{position:relative;z-index:1;padding:100px 24px}
    .section-inner{max-width:1120px;margin:0 auto}
    .section-eyebrow{
    font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
    color:var(--g600);margin-bottom:16px;display:flex;align-items:center;gap:11px;
    }
    .section-eyebrow::before{content:'';width:24px;height:2.5px;background:var(--g500);border-radius:2px;display:inline-block}
    .section-h{
    font-size:clamp(32px,4.8vw,56px);font-weight:800;color:var(--g950);
    letter-spacing:-.045em;line-height:1.08;margin-bottom:16px;
    }
    .section-sub{font-size:18px;color:#4b5563;line-height:1.7;max-width:500px}

    /* ── FEATURE CARDS ── */
    .feat-card .front { opacity:1; transform:scale(1) translateY(0); transition:all .5s cubic-bezier(.22,1,.36,1); }
.feat-card:hover .front { opacity:0; transform:scale(0.88) translateY(-12px); }
.feat-card .back { opacity:0; transform:translateY(24px); transition:all .5s cubic-bezier(.22,1,.36,1); background:#059669; }
.feat-card:hover .back { opacity:1; transform:translateY(0); }
.feat-card .accent { width:32px; background:#e2e8f0; transition:all .5s; }
.feat-card:hover .accent { width:48px; background:#34d399; }
.feat-card:hover { border-color:#10b981 !important; box-shadow:0 8px 40px rgba(16,185,129,0.18) !important; }

/* Add to GLOBAL_CSS */
.bento-accordion {
  display: flex;
  gap: 12px;
  height: 540px;
  width: 100%;
  padding: 10px 0;
}

.bento-panel {
  flex: 1;
  min-width: 80px;
  height: 100%;
  background: #ffffff;
  border-radius: 42px;
  border: 1px solid #eef7ee;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.8s var(--ease-out);
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
}

.bento-panel:hover {
  flex: 5;
  background: #fcfdfc;
  border-color: #bbf7d0;
  box-shadow: 0 40px 100px rgba(5, 46, 22, 0.04);
}

.panel-header {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  font-size: 32px;
  font-weight: 900;
  color: #0d1f0d;
  letter-spacing: -0.05em;
  transition: all 0.6s var(--ease-out);
  display: flex;
  align-items: center;
  gap: 20px;
}

.bento-panel:hover .panel-header {
  writing-mode: horizontal-tb;
  transform: rotate(0deg);
  font-size: 56px;
  color: #16a34a;
}

.panel-num {
  font-family: 'Poppins';
  font-weight: 900;
  -webkit-text-stroke: 1px #86efac;
  color: transparent;
  font-size: 80px;
  line-height: 1;
  opacity: 0.3;
  transition: all 0.6s var(--ease-out);
}

.bento-panel:hover .panel-num {
  -webkit-text-stroke: 0px;
  color: #16a34a;
  opacity: 1;
  font-size: 24px;
}

.panel-body {
  margin-top: auto;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s var(--ease-out);
}

.bento-panel:hover .panel-body {
  opacity: 1;
  transform: translateY(0);
}

    /* ── STAGES ── */
    
    /* ── STATS BAND ── */
    .stats-band{
    position:relative;z-index:1;
    background:linear-gradient(135deg,var(--g950) 0%,#0a3d1a 100%);
    padding:96px 24px;overflow:hidden;
    }
    .stats-band::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 65% 80% at 80% 50%,rgba(34,197,94,.13) 0%,transparent 60%);
    }
    .stats-inner{
    max-width:1000px;margin:0 auto;
    display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:40px;position:relative;z-index:1;
    }
    .stat-item{text-align:center}
    .stat-num{
    font-size:clamp(44px,6.5vw,66px);font-weight:800;color:#fff;
    letter-spacing:-.055em;line-height:1;margin-bottom:9px;
    }
    .stat-num span{color:var(--g400)}
    .stat-label{font-size:14px;color:rgba(255,255,255,.48);font-weight:500}

    /* ── TESTIMONIALS ── */
    .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:54px}
    .tcard{
    background:var(--g50);border:1px solid var(--g100);border-radius:22px;
    padding:28px 24px;transition:all .38s var(--ease-spring);cursor:default;
    }
    .tcard:hover{transform:translateY(-6px);box-shadow:0 18px 48px rgba(5,46,22,.09);background:#fff}
    .tcard-stars{color:var(--g500);font-size:13px;margin-bottom:14px;letter-spacing:3px}
    .tcard-text{font-size:14px;color:#4b5563;line-height:1.78;font-style:italic;margin-bottom:18px}
    .tcard-author-name{font-size:13.5px;font-weight:700;color:var(--g950)}
    .tcard-author-role{font-size:12px;color:#9ca3af;margin-top:3px}

    /* ── CTA SECTION ── */
    .cta-section{
    position:relative;z-index:1;padding:128px 24px;
    text-align:center;overflow:hidden;
    }
    .cta-section::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(34,197,94,.1) 0%,transparent 65%);
    pointer-events:none;
    }
    .cta-tree{font-size:74px;display:inline-block;margin-bottom:20px;animation:ctaFloat 6s ease-in-out infinite}
    .cta-h{font-size:clamp(34px,5.5vw,64px);font-weight:800;color:var(--g950);letter-spacing:-.048em;line-height:1.08;margin-bottom:16px}
    .cta-sub{font-size:18px;color:#4b5563;margin-bottom:42px}

    /* ── FOOTER ── */
    .site-footer{
    position:relative;z-index:1;border-top:1px solid var(--g100);
    padding:34px 48px;display:flex;align-items:center;
    justify-content:space-between;flex-wrap:wrap;gap:12px;background:#f4fbf4;
    }
    .footer-logo{font-size:15.5px;font-weight:800;color:var(--g900);letter-spacing:-.04em}
    .footer-copy{font-size:12.5px;color:#9ca3af}

    /* ── AUTH SCREEN ── */
    .auth-wrap{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:24px;position:relative;z-index:1;
    background:radial-gradient(ellipse 70% 55% at 50% -5%,#d1fae5,#f4fbf4 60%);
    }
    .auth-card{
    background:#fff;border:1px solid var(--g100);border-radius:28px;
    padding:44px 36px;width:100%;max-width:420px;
    box-shadow:0 28px 80px rgba(5,46,22,.11);
    animation:scaleIn .48s var(--ease-spring) both;
    }
    .auth-tree{text-align:center;font-size:56px;display:block;margin-bottom:16px;animation:treeBob 5s ease-in-out infinite}
    .auth-h{text-align:center;font-size:27px;font-weight:800;color:var(--g950);letter-spacing:-.045em;margin-bottom:8px}
    .auth-p{text-align:center;font-size:14.5px;color:#9ca3af;margin-bottom:30px;line-height:1.6}
    .auth-err{
    background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;
    padding:11px 15px;font-size:13px;color:#dc2626;
    margin-bottom:18px;text-align:center;font-weight:500;
    }
    .google-btn{
    width:100%;padding:14px;border:1.5px solid #e5e7eb;border-radius:14px;
    background:#fff;display:flex;align-items:center;justify-content:center;
    gap:11px;font-family:'Poppins',sans-serif;font-size:14.5px;font-weight:600;
    color:#374151;cursor:pointer;transition:all .25s var(--ease-spring);
    }
    .google-btn:hover{border-color:#d1d5db;box-shadow:0 6px 20px rgba(0,0,0,.09);transform:translateY(-2px)}
    .google-btn:disabled{opacity:.55;pointer-events:none}
    .google-btn svg{width:20px;height:20px;flex-shrink:0}
    .auth-divider{
    display:flex;align-items:center;gap:13px;
    margin:20px 0;color:#d1d5db;font-size:12px;font-weight:500;
    }
    .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--g100)}
    .auth-back{
    width:100%;margin-top:12px;padding:12px;background:none;
    border:1.5px solid var(--g100);border-radius:13px;
    font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:600;
    color:var(--g700);cursor:pointer;transition:all .2s;
    }
    .auth-back:hover{background:var(--g50);border-color:var(--g200)}
    .auth-note{text-align:center;font-size:11.5px;color:#9ca3af;margin-top:18px;line-height:1.65}

    /* ── LOADING ── */
    .loading-full{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:18px;background:#f4fbf4;
    }
    .loading-ring{
    width:44px;height:44px;border-radius:50%;
    border:3.5px solid var(--g100);border-top-color:var(--g500);
    animation:spin .75s linear infinite;
    }
    .loading-label{font-size:13.5px;color:#9ca3af;font-family:'Poppins',sans-serif;font-weight:500}

    /* ── MOBILE ── */
    @media(max-width:820px){
    .lnav,.lnav.stuck{padding:14px 20px}
    .lnav-links{display:none}
    .stages-layout{grid-template-columns:1fr;gap:36px}
    .preview-body{grid-template-columns:1fr 1fr}
    }
    @media(max-width:520px){
    .preview-body{grid-template-columns:1fr 1fr}
    .stats-inner{grid-template-columns:1fr 1fr}
    }
    `;

    /* ─────────────────── Three.js particle field ──────────────────── */


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

    const PCARDS = [
        { co: "Google", role: "SWE Intern", status: "Accepted", bg: "#ecfdf5", bd: "#34d399", tBg: "#d1fae5", tC: "#065f46" },
        { co: "Stripe", role: "PM", status: "Interview", bg: "#fefce8", bd: "#fcd34d", tBg: "#fef9c3", tC: "#a16207" },
        { co: "Notion", role: "Designer", status: "Applied", bg: "#f0fdf4", bd: "#86efac", tBg: "#dcfce7", tC: "#15803d" },
        { co: "Figma", role: "Front-end", status: "Interview", bg: "#fefce8", bd: "#fcd34d", tBg: "#fef9c3", tC: "#a16207" },
    ];

    /* ─────────────────────────── Landing Page ──────────────────────── */
    function LandingPage() {
        const navigate = useNavigate();
        const canvasRef = useRef(null);
        const [stuck, setStuck] = useState(false);

        useReveal();
        useEffect(() => {
            const fn = () => setStuck(scrollY > 50);
            window.addEventListener("scroll", fn);
            return () => window.removeEventListener("scroll", fn);
        }, []);

        const go = () => navigate("/login");

        return (
            <>
                <canvas ref={canvasRef} id="cg-canvas" />

                {/* NAV */}
                <nav className={`lnav${stuck ? " stuck" : ""}`}>
                    <div className="lnav-logo"><span>🌳</span> Career Garden</div>
                    <ul className="lnav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#how-it-works">How it works</a></li>
                        <li><a href="#testimonials">Stories</a></li>
                    </ul>
                    <button className="lnav-cta" onClick={go}>Get started — free</button>
                </nav>

                {/* HERO */}
                <section className="hero">
                    {/* 1. THE BACKGROUND LAYER (Sits behind everything) */}
                    <div className="hero-bg-layer">
                        <img
                            src="https://i.pinimg.com/1200x/ab/35/e5/ab35e5f7b7cee47090e507ef9c0bf133.jpg"
                            alt="Hero Background"
                            className="hero-full-img"
                        />
                        <div className="hero-overlay" />
                    </div>

                    {/* 2. THE CONTENT LAYER (Sits on top) */}
                    <div className="hero-content-overlay">
                        <div className="hero-badge"><span className="hero-badge-dot" /> Now in public beta</div>
                        <h1 className="hero-h1">Your job search,<br /><em>beautifully</em> organised.</h1>
                        <p className="hero-sub">Track every application from seed to offer. Career Garden brings calm, clarity, and momentum to your job search — powered by Supabase.</p>

                        <div className="hero-btns">
                            <button className="btn-hero-primary" onClick={go}>Plant your first seed →</button>
                            <button className="btn-hero-secondary" onClick={go}>See how it works</button>
                        </div>

                        {/* Preview window (Now floating over the image) */}
                        <div className="preview-wrap">
                            <div className="preview-glow" />
                            <div className="preview-win glass-effect">
                                <div className="preview-bar">
                                    <div className="pdot" style={{ background: "#f87171" }} />
                                    <div className="pdot" style={{ background: "#fbbf24" }} />
                                    <div className="pdot" style={{ background: "#4ade80" }} />
                                    <div className="purl">careergarden.app / dashboard</div>
                                </div>
                                <div className="preview-body">
                                    {PCARDS.map(c => (
                                        <div key={c.co} className="pcard" style={{ background: c.bg, borderColor: c.bd }}>
                                            <div className="pcard-co">{c.co}</div>
                                            <div className="pcard-role">{c.role}</div>
                                            <div className="pcard-tag" style={{ background: c.tBg, color: c.tC }}>{c.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LOGOS */}
                <div className="logos-strip">
                    <p className="logos-label">Trusted by job seekers from</p>
                    <div className="logos-row">
                        {["Google", "Amazon", "Meta", "Microsoft", "Stripe", "Notion", "Figma", "OpenAI"].map(n => (
                            <div key={n} className="logo-name">{n}</div>
                        ))}
                    </div>
                </div>

                {/* FEATURES */}
                <section className="py-24 bg-[#e8f4e8] font-['Poppins']" id="features">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-16">
                            <h2 className="text-5xl md:text-7xl font-[900] text-slate-900 tracking-tighter leading-none lowercase">
                                The <span className="text-emerald-500 italic">Garden</span> <br />
                                Essentials.
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Life Tracker", desc: "watch your applications grow from seeds to full-grown trees as you move through stages.", tag: "Track growth", icon: <Sprout size={48} strokeWidth={1.5} /> },
                                { title: "Quick Save", desc: "instantly drop in job links to save them to your soil before you forget.", tag: "Save fast", icon: <MousePointerClick size={48} strokeWidth={1.5} /> },
                                { title: "Garden Views", desc: "organize your space with clean boards and lists that keep your garden tidy.", tag: "Stay tidy", icon: <LayoutDashboard size={48} strokeWidth={1.5} /> },
                                { title: "Growth Stats", desc: "look back at your harvest and see exactly how much progress you've made this month.", tag: "See progress", icon: <BarChart3 size={48} strokeWidth={1.5} /> }
                            ].map((f, i) => (
                                <div key={i} className="feat-card" style={{ position: 'relative', height: 300, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 36, cursor: 'pointer', overflow: 'hidden' }}>

                                    {/* Front */}
                                    <div className="front" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                                        <div style={{ color: '#10b981' }}>{f.icon}</div>
                                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.03em', textAlign: 'center', padding: '0 16px' }}>{f.title}</h3>
                                    </div>

                                    {/* Back */}
                                    <div className="back" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
                                        <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.5, textAlign: 'center', textTransform: 'lowercase' }}>{f.desc}</p>
                                        <span style={{ marginTop: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: 999 }}>{f.tag}</span>
                                    </div>

                                    {/* Accent */}
                                    <div className="accent" style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', height: 3, borderRadius: 999 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="py-32 bg-[#fcfdfc] font-['Poppins'] overflow-hidden" id="how-it-works">
                    <div className="max-w-7xl mx-auto px-6 relative">

                        {/* Floating Light Sparks */}
                        <div className="absolute top-0 -left-20 w-96 h-96 bg-green-200/30 blur-[100px] rounded-full animate-pulse" />
                        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-green-100/40 blur-[100px] rounded-full" />

                        <div className="mb-24 relative">
                            <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]">
                                How your <br />
                                <span className="text-green-600 italic">garden grows.</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    step: "01",
                                    label: "Planting",
                                    text: "Drop your job links here. We handle the rest and get things ready.",
                                    emoji: "🌱",
                                    gradient: "from-green-400 to-emerald-600"
                                },
                                {
                                    step: "02",
                                    label: "Sprouting",
                                    text: "Your interviews are moving. Track every date and every meeting.",
                                    emoji: "🌿",
                                    gradient: "from-emerald-500 to-green-700"
                                },
                                {
                                    step: "03",
                                    label: "Blooming",
                                    text: "The offer is here. Celebrate your win and save the good news.",
                                    emoji: "🌳",
                                    gradient: "from-green-600 to-slate-900"
                                },
                                {
                                    step: "04",
                                    label: "Harvest",
                                    text: "Build your history. Look back at your growth and keep going.",
                                    emoji: "🍂",
                                    gradient: "from-slate-800 to-slate-950"
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="group h-[420px] [perspective:1500px]">

                                    {/* The Flip Unit */}
                                    <div className="relative h-full w-full transition-all duration-[800ms] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">

                                        {/* FRONT: The Visual Spark */}
                                        <div className="absolute inset-0 h-full w-full rounded-[40px] bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-2 [backface-visibility:hidden]">
                                            <div className="h-full w-full rounded-[35px] bg-slate-50/50 flex flex-col items-center justify-center relative overflow-hidden">

                                                {/* Animated Floating Element */}
                                                <div className="relative z-10 w-24 h-24 bg-white rounded-[30%] shadow-2xl flex items-center justify-center text-5xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                                                    {item.emoji}
                                                </div>

                                                {/* Decorative Ring */}
                                                <div className="absolute w-40 h-40 border-2 border-green-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                                                <div className="absolute w-56 h-56 border border-green-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                                                <div className="mt-12 text-center">
                                                    <div className="text-[10px] font-black text-green-600 tracking-[0.4em] uppercase mb-1">Step {item.step}</div>
                                                    <div className="h-[2px] w-6 bg-green-500 mx-auto rounded-full" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* BACK: The Clean Info */}
                                        <div className={`absolute inset-0 h-full w-full rounded-[40px] bg-gradient-to-br ${item.gradient} p-10 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-2xl flex flex-col justify-between`}>
                                            <div className="space-y-6">
                                                <span className="text-4xl font-black opacity-20">{item.step}</span>
                                                <h3 className="text-3xl font-black tracking-tighter italic uppercase">{item.label}</h3>
                                                <p className="text-white/80 text-sm leading-relaxed font-medium">
                                                    {item.text}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-6 border-t border-white/10">
                                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                <span className="text-[10px] font-black tracking-widest uppercase">Live Now</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* STATS */}
                <section className="py-24 px-6 bg-[#f2fcf2] font-['Poppins']">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { to: 12400, suffix: "+", label: "Applications tracked", desc: "Total career growth" },
                            { to: 94, suffix: "%", label: "Feel more in control", desc: "User satisfaction" },
                            { to: 3, suffix: "x", label: "Faster than spreadsheets", desc: "Efficiency boost" },
                            { to: 0, suffix: "$", label: "Cost to start", desc: "Free forever" },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                                viewport={{ once: true }}
                                className="relative group p-8 bg-white border border-emerald-100 rounded-3xl hover:border-emerald-500 hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] transition-all duration-500"
                            >
                                {/* Background Decoration */}
                                <div className="absolute top-4 right-4 h-12 w-12 rounded-full border-2 border-emerald-50 border-t-emerald-500 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="flex items-baseline mb-2">
                                        <span className="text-5xl font-bold text-emerald-600 tracking-tight">
                                            <AnimCounter to={s.to} />
                                        </span>
                                        <span className="text-2xl font-bold text-emerald-500 ml-1">
                                            {s.suffix}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">
                                        {s.label}
                                    </h3>

                                    <p className="text-sm font-medium text-slate-400">
                                        {s.desc}
                                    </p>
                                </div>

                                {/* Bottom Progress Bar Animation */}
                                <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500/10 w-full rounded-b-3xl overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "100%" }}
                                        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                                        viewport={{ once: true }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="py-32 bg-[#f8f9fa] font-['Poppins'] overflow-hidden" id="testimonials">
                    <div className="max-w-7xl mx-auto px-6">

                        {/* Top Editorial Heading */}
                        <div className="mb-20">
                            <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.5em] mb-4 block">Wall of Growth</span>
                            <h2 className="text-6xl md:text-8xl font-[900] text-slate-900 tracking-tighter leading-[0.8] lowercase">
                                The <span className="text-emerald-500 italic">harvest</span> <br />
                                report.
                            </h2>
                        </div>

                        {/* Main Bento Card */}
                        <div className="bg-white rounded-[64px] border border-slate-200/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">

                            {/* Left Column: Fixed Content & Visual Texture */}
                            <div className="p-12 md:p-24 flex flex-col justify-between bg-white z-20 relative">
                                {/* Subtle Grid Pattern Overlay */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                                <div className="relative z-10">
                                    <h3 className="text-4xl md:text-5xl font-[900] text-slate-900 tracking-tighter leading-[0.95] mb-8 uppercase">
                                        From Seed <br />
                                        To Full <br />
                                        <span className="text-emerald-500 text-[1.1em]">Offer.</span>
                                    </h3>
                                    <p className="text-slate-500 text-lg leading-relaxed max-w-sm font-medium mb-10">
                                        Real developers moving from spreadsheet chaos to organized career sanctuaries. Join 5,000+ users growing their future.
                                    </p>

                                    {/* NEW: Trusted By Logos */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Users Hired At</p>
                                        <div className="flex gap-6 opacity-30 grayscale items-center">
                                            <span className="font-black text-xl tracking-tighter">Stripe</span>
                                            <span className="font-black text-xl tracking-tighter">Figma</span>
                                            <span className="font-black text-xl tracking-tighter">Google</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 relative z-10">
                                    <div className="flex gap-12 mb-12">
                                        <div>
                                            <div className="text-5xl font-black text-slate-900 tracking-tighter">98%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Success Rate</div>
                                        </div>
                                        <div>
                                            <div className="text-5xl font-black text-slate-900 tracking-tighter">24/7</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Auto Tracking</div>
                                        </div>
                                    </div>

                                    {/* NEW: Call to Action */}
                                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-200">
                                        Join the community →
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Infinite Dual Vertical Scroller */}
                            <div className="relative h-[750px] bg-[#fcfcfc] border-l border-slate-100 overflow-hidden group">
                                <div className="absolute inset-0 grid grid-cols-2 gap-4 p-6">

                                    {/* Column 1: Fast Upward Scroll */}
                                    <div className="flex flex-col gap-4 animate-scroll-v group-hover:[animation-play-state:paused]">
                                        {[...Array(2)].map((_, groupIdx) => (
                                            <div key={groupIdx} className="flex flex-col gap-4">
                                                {[
                                                    { text: "The garden metaphor actually works. It made the job hunt feel like progress, not a grind.", name: "Alex Rivera", handle: "@arivera_dev", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
                                                    { text: "Cleanest UI I've seen in a career tool. It's the Linear of job hunting.", name: "Sarah Chen", handle: "@schen_ui", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
                                                    { text: "Moved my 50+ tab spreadsheet into Career Garden. 3 interviews booked this week alone.", name: "Marc Levinson", handle: "@marcl_codes", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
                                                    { text: "The URL auto-capture is magic. Saves me hours of manual entry every single month.", name: "Jasmine Kaur", handle: "@jas_kaur", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" }
                                                ].map((t, i) => (
                                                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-2xl object-cover border border-emerald-100" />
                                                            <div>
                                                                <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{t.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">{t.handle}</div>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-snug font-medium lowercase">"{t.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Column 2: Slow Downward Scroll */}
                                    <div className="flex flex-col gap-4 animate-scroll-v-reverse group-hover:[animation-play-state:paused]">
                                        {[...Array(2)].map((_, groupIdx) => (
                                            <div key={groupIdx} className="flex flex-col gap-4">
                                                {[
                                                    { text: "Finally, a place to see my whole career landscape in one view. Unmatched utility.", name: "Kevin V.", handle: "@kev_v", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" },
                                                    { text: "The Kanban board is butter smooth. I track everything here now.", name: "Aisha M.", handle: "@aisha_design", img: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=100&h=100&fit=crop" },
                                                    { text: "It helped me negotiate better because I had all my offer data in one spot.", name: "David L.", handle: "@dl_io", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
                                                    { text: "I told my entire bootcamp cohort to switch. This is the future of job hunting.", name: "Elena Rossi", handle: "@erossi_dev", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" }
                                                ].map((t, i) => (
                                                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all duration-300">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <img src={t.img} alt={t.name} className="w-10 h-10 rounded-2xl object-cover border border-slate-100" />
                                                            <div>
                                                                <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{t.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">{t.handle}</div>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-snug font-medium lowercase">"{t.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Smooth Edge Overlays */}
                                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#fcfcfc] via-[#fcfcfc]/80 to-transparent z-10" />
                                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc]/80 to-transparent z-10" />
                            </div>

                        </div>
                    </div>

                    {/* Seamless Infinite Animation Logic */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
        @keyframes scroll-v {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
        }
        @keyframes scroll-v-reverse {
            from { transform: translateY(-50%); }
            to { transform: translateY(0); }
        }
        .animate-scroll-v {
            animation: scroll-v 35s linear infinite;
        }
        .animate-scroll-v-reverse {
            animation: scroll-v-reverse 50s linear infinite;
        }
    `}} />
                </section>

                {/* CTA */}
                <section className="cta-section">
                    <div className="cta-tree">🌳</div>
                    <h2 className="cta-h reveal">Ready to grow?</h2>
                    <p className="cta-sub reveal d1">Sign in with Google. Free forever.</p>
                    <div className="reveal d2">
                        <button className="btn-hero-primary" style={{ fontSize: 16.5, padding: "18px 50px" }} onClick={go}>
                            Open my garden →
                        </button>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="site-footer">
                    <div className="footer-logo">🌳 Career Garden</div>
                    <div className="footer-copy">© 2026 Career Garden · Powered by Supabase · Built with care</div>
                </footer>
            </>
        );
    }

    /* ─────────────────────────── Login Page ────────────────────────── */
    function LoginPage() {
        const navigate = useNavigate();
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        async function signInWithGoogle() {
            setLoading(true);
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: "https://career-garden.techiesaie.com/auth/callback",
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
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
                if (event === "SIGNED_IN" && session) {
                    subscription.unsubscribe();
                    navigate("/dashboard", { replace: true });
                }
            });
            // Fallback: check existing session
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) navigate("/dashboard", { replace: true });
            });
            return () => subscription.unsubscribe();
        }, []);

        return (
            <div className="loading-full">
                <div className="loading-ring" />
                <div className="loading-label">Signing you in…</div>
            </div>
        );
    }

    /* ─────────────────────────── Protected Route ───────────────────── */
    function ProtectedRoute({ children }) {
        const [session, setSession] = useState(undefined);
        useEffect(() => {
            supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
            return () => subscription.unsubscribe();
        }, []);

        if (session === undefined) return (
            <div className="loading-full">
                <div className="loading-ring" />
                <div className="loading-label">Loading your garden…</div>
            </div>
        );
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

                        {/* Protected dashboard routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                        <Route path="/dashboard/:status" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
                        <Route path="/job/:id" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </>
        );
    }