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
import * as THREE from "three";
import {
    BrowserRouter, Routes, Route, Navigate,
    useNavigate, useLocation
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────── Supabase ──────────────────────────── */
export const supabase = createClient(
    "https://podosiaizzetwtdxjyei.supabase.co",
    "sb_publishable_t6fIvb_0shfoJcICHg8-cg_ea8FUUrA",
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
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
.lnav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  padding:20px 48px;display:flex;align-items:center;justify-content:space-between;
  transition:all .4s var(--ease-out);
}
.lnav.stuck{
  background:rgba(246,253,246,.92);backdrop-filter:blur(24px);
  border-bottom:1px solid rgba(187,247,208,.45);padding:13px 48px;
}
.lnav-logo{
  font-size:19px;font-weight:800;color:var(--g900);letter-spacing:-.05em;
  display:flex;align-items:center;gap:9px;cursor:pointer;text-decoration:none;
  flex-shrink:0;
}
.lnav-links{display:flex;gap:32px;list-style:none}
.lnav-links a{
  font-size:14px;font-weight:500;color:var(--g900);text-decoration:none;
  opacity:.6;transition:opacity .2s;
}
.lnav-links a:hover{opacity:1}
.lnav-cta{
  background:var(--g950);color:#fff;border:none;border-radius:99px;
  padding:11px 24px;font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:700;
  cursor:pointer;transition:all .28s var(--ease-spring);
  box-shadow:0 4px 18px rgba(5,46,22,.28);
}
.lnav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(5,46,22,.38)}

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
.feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:56px}
.feat-card{
  background:#fff;border:1px solid var(--g100);border-radius:22px;
  padding:32px 28px;transition:all .38s var(--ease-spring);cursor:default;
}
.feat-card:hover{transform:translateY(-7px);box-shadow:0 22px 56px rgba(5,46,22,.1);border-color:var(--g200)}
.feat-icon{
  width:52px;height:52px;border-radius:14px;
  background:linear-gradient(135deg,var(--g100),var(--g200));
  display:flex;align-items:center;justify-content:center;
  font-size:24px;margin-bottom:20px;
  transition:transform .32s var(--ease-spring);
}
.feat-card:hover .feat-icon{transform:scale(1.12) rotate(-4deg)}
.feat-title{font-size:16.5px;font-weight:700;color:var(--g950);margin-bottom:10px}
.feat-desc{font-size:13.5px;color:#4b5563;line-height:1.72}

/* ── STAGES ── */
.stages-layout{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;margin-top:56px}
.stage-item{
  display:flex;align-items:flex-start;gap:16px;padding:18px;
  border-radius:16px;transition:all .28s ease;cursor:default;margin-bottom:6px;
}
.stage-item:hover{background:rgba(220,252,231,.5)}
.stage-bullet{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:20px;background:var(--g50);border:1px solid var(--g100);
}
.stage-label{font-size:15px;font-weight:700;color:var(--g950);margin-bottom:5px}
.stage-desc{font-size:13px;color:#4b5563;line-height:1.65}

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
function useThreeScene(canvasRef) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let raf;
        try {
            const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            r.setPixelRatio(Math.min(devicePixelRatio, 2));
            r.setSize(innerWidth, innerHeight);
            const scene = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
            cam.position.z = 32;

            const N = 460;
            const pos = new Float32Array(N * 3);
            const col = new Float32Array(N * 3);
            const sz = new Float32Array(N);
            const pal = [
                new THREE.Color("#bbf7d0"), new THREE.Color("#6ee7b7"),
                new THREE.Color("#34d399"), new THREE.Color("#a7f3d0"),
                new THREE.Color("#dcfce7"), new THREE.Color("#4ade80"),
            ];
            for (let i = 0; i < N; i++) {
                pos[i * 3] = (Math.random() - 0.5) * 90;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 68;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 45;
                const c = pal[Math.floor(Math.random() * pal.length)];
                col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
                sz[i] = Math.random() * 4 + 1;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
            geo.setAttribute("size", new THREE.BufferAttribute(sz, 1));
            const mat = new THREE.ShaderMaterial({
                vertexShader: `
          attribute float size; attribute vec3 color;
          varying vec3 vColor; varying float vAlpha; uniform float uTime;
          void main() {
            vColor = color;
            vec3 p = position;
            p.y += sin(uTime * 0.38 + position.x * 0.28) * 0.9;
            p.x += cos(uTime * 0.28 + position.z * 0.22) * 0.55;
            vAlpha = 0.45 + 0.55 * sin(uTime * 0.5 + position.x * 0.4);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (280.0 / -gl_Position.z);
          }`,
                fragmentShader: `
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(vColor, (1.0 - d * 2.0) * vAlpha * 0.7);
          }`,
                uniforms: { uTime: { value: 0 } },
                transparent: true, vertexColors: true, depthWrite: false,
            });
            const pts = new THREE.Points(geo, mat);
            scene.add(pts);

            // Connecting lines
            const lm = new THREE.LineBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.1 });
            for (let i = 0; i < 32; i++) {
                const lg = new THREE.BufferGeometry();
                const lp = new Float32Array(6);
                for (let k = 0; k < 6; k++) lp[k] = (Math.random() - 0.5) * 72;
                lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
                scene.add(new THREE.Line(lg, lm));
            }

            let mx = 0, my = 0;
            const onMouse = e => { mx = (e.clientX / innerWidth - 0.5) * 2; my = -(e.clientY / innerHeight - 0.5) * 2; };
            window.addEventListener("mousemove", onMouse);
            const onResize = () => { r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
            window.addEventListener("resize", onResize);
            const tick = () => {
                raf = requestAnimationFrame(tick);
                mat.uniforms.uTime.value += 0.011;
                pts.rotation.y += 0.0014 + mx * 0.0003;
                pts.rotation.x += my * 0.0003;
                r.render(scene, cam);
            };
            tick();
            return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMouse); window.removeEventListener("resize", onResize); r.dispose(); };
        } catch (e) { console.warn("Three.js:", e); }
    }, []);
}

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
    useThreeScene(canvasRef);
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
                <div className="hero-badge"><span className="hero-badge-dot" /> Now in public beta</div>
                <h1 className="hero-h1">Your job search,<br /><em>beautifully</em> organised.</h1>
                <p className="hero-sub">Track every application from seed to offer. Career Garden brings calm, clarity, and momentum to your job search — powered by Supabase.</p>
                <div className="hero-btns">
                    <button className="btn-hero-primary" onClick={go}>Plant your first seed →</button>
                    <button className="btn-hero-secondary" onClick={go}>See how it works</button>
                </div>

                {/* Preview window */}
                <div className="preview-wrap">
                    <div className="preview-glow" />
                    <div className="preview-win">
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
            <section className="lp-section" id="features" style={{ background: "#fff", borderTop: "1px solid #e7faea" }}>
                <div className="section-inner">
                    <div className="reveal">
                        <div className="section-eyebrow">Features</div>
                        <h2 className="section-h">Everything you need.<br />Nothing you don't.</h2>
                        <p className="section-sub">Built for focus. Designed for momentum.</p>
                    </div>
                    <div className="feat-grid">
                        {[
                            { icon: "🌿", title: "Visual stage tracking", desc: "Applied → Interview → Accepted → Rejected. See your entire pipeline at a glance with colour-coded stages." },
                            { icon: "🔗", title: "URL-based routing", desc: "Every view has a shareable URL. /dashboard/Interview shows all interviews. /job/123 opens a specific role." },
                            { icon: "☁️", title: "Supabase cloud sync", desc: "Your data syncs instantly across every device. Secured with Row Level Security — only you see your garden." },
                            { icon: "🔐", title: "Google Sign-In", desc: "One-click authentication via Google OAuth. No passwords, no friction, no forgotten credentials." },
                            { icon: "📊", title: "Analytics dashboard", desc: "Response rates, conversion funnels, and momentum metrics. Know exactly where your search stands." },
                            { icon: "⌘", title: "Command palette", desc: "Hit ⌘K anywhere to search, navigate, or add a new application without leaving the keyboard." },
                        ].map((f, i) => (
                            <div key={f.title} className={`feat-card reveal d${(i % 3) + 1}`}>
                                <div className="feat-icon">{f.icon}</div>
                                <div className="feat-title">{f.title}</div>
                                <div className="feat-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="lp-section" id="how-it-works">
                <div className="section-inner">
                    <div className="stages-layout">
                        <div className="reveal">
                            <div className="section-eyebrow">How it works</div>
                            <h2 className="section-h">Four stages.<br />One clear picture.</h2>
                            <p className="section-sub" style={{ marginBottom: 32 }}>From the moment you hit send, to the day you sign an offer.</p>
                            <button className="btn-hero-primary" onClick={go} style={{ fontSize: 14, padding: "13px 30px" }}>Start tracking — free</button>
                        </div>
                        <div className="reveal d2">
                            {[
                                { icon: "🌱", label: "Applied", desc: "Seeds you've planted. Follow up within 5–7 days and keep them watered." },
                                { icon: "🌿", label: "Interview", desc: "Sprouts that need care. Prep deeply, capture notes, stay sharp." },
                                { icon: "🌳", label: "Accepted", desc: "Fully bloomed. Celebrate, capture the story, negotiate boldly." },
                                { icon: "🍂", label: "Rejected", desc: "Leaves that fell. Extract the lesson, keep the momentum, move on." },
                            ].map(s => (
                                <div key={s.label} className="stage-item">
                                    <div className="stage-bullet">{s.icon}</div>
                                    <div>
                                        <div className="stage-label">{s.label}</div>
                                        <div className="stage-desc">{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <div className="stats-band">
                <div className="stats-inner">
                    {[
                        { to: 12400, suffix: "+", label: "Applications tracked" },
                        { to: 94, suffix: "%", label: "Feel more in control" },
                        { to: 3, suffix: "x", label: "Faster than spreadsheets" },
                        { to: 0, suffix: "$", label: "Cost to start" },
                    ].map(s => (
                        <div key={s.label} className="stat-item">
                            <div className="stat-num"><AnimCounter to={s.to} /><span>{s.suffix}</span></div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TESTIMONIALS */}
            <section className="lp-section" id="testimonials" style={{ background: "#fff", borderTop: "1px solid #e7faea" }}>
                <div className="section-inner">
                    <div className="reveal" style={{ textAlign: "center" }}>
                        <div className="section-eyebrow" style={{ justifyContent: "center" }}>Stories</div>
                        <h2 className="section-h" style={{ textAlign: "center" }}>What job seekers say</h2>
                    </div>
                    <div className="testi-grid">
                        {[
                            { text: "I went from chaos — 40 tabs, a broken spreadsheet — to knowing my status at every company. Got 4 offers in 3 months.", name: "Priya M.", role: "Product Manager @ Stripe" },
                            { text: "The URL routing is genius. I bookmarked /dashboard/Interview and checked it every morning. Kept me focused.", name: "James T.", role: "Software Engineer @ Google" },
                            { text: "Beautiful, cloud-synced, and actually fast. I told my entire bootcamp cohort to switch. Nothing else comes close.", name: "Aisha K.", role: "UX Designer @ Figma" },
                        ].map(t => (
                            <div key={t.name} className="tcard reveal">
                                <div className="tcard-stars">★★★★★</div>
                                <div className="tcard-text">"{t.text}"</div>
                                <div className="tcard-author-name">{t.name}</div>
                                <div className="tcard-author-role">{t.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
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
            options: { redirectTo: `${window.location.origin}/auth/callback` },
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