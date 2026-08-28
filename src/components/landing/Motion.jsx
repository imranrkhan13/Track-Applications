/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { motion } from "framer-motion";

export const VIEWPORT = { once: true, amount: 0.2 };

export const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export const scaleIn = {
    hidden: { opacity: 0, y: 42, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

export function Reveal({ children, className = "", delay = 0, as = "div" }) {
    const Component = motion[as] || motion.div;
    return <Component className={className} variants={fadeUp} initial="hidden" whileInView="visible" viewport={VIEWPORT} transition={{ delay }}>{children}</Component>;
}

export function ScaleReveal({ children, className = "", as = "div" }) {
    const Component = motion[as] || motion.div;
    return <Component className={className} variants={scaleIn} initial="hidden" whileInView="visible" viewport={VIEWPORT}>{children}</Component>;
}

export function Stagger({ children, className = "", as = "div" }) {
    const Component = motion[as] || motion.div;
    return <Component className={className} variants={stagger} initial="hidden" whileInView="visible" viewport={VIEWPORT}>{children}</Component>;
}

export function RevealLine({ children, delay = 0, className = "" }) {
    return <span className={`cg-reveal-line ${className}`.trim()}><motion.span initial={{ y: "108%" }} animate={{ y: 0 }} transition={{ duration: 0.78, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.span></span>;
}
