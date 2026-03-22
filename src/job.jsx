/**
 * job.jsx — Job components
 * JobModal is handled inline in maine.jsx (JobModalInline).
 * Tree icons: 🌱 Applied · 🌿 Interview · 🌳 Accepted · 🍂 Rejected
 * All other icons are SVG (no emoji).
 */
export { default as EmptyState } from "./maine";
export function JobModal() { return null; } // Unused — maine.jsx handles modal inline
export function JobCard() { return null; }
export function JobSection() { return null; }

export const TreeIcons = {
    Applied: "🌱",
    Interview: "🌿",
    Accepted: "🌳",
    Rejected: "🍂",
};