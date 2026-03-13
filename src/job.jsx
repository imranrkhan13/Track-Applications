/**
 * job.jsx — Job components
 * JobModal is now handled inline in maine.jsx (JobModalInline).
 * This file is kept for backwards-compat exports only.
 */
export { default as EmptyState } from "./maine";
export function JobModal() { return null; } // Unused — maine.jsx handles modal inline
export function JobCard() { return null; }
export function JobSection() { return null; }
export const TreeIcons = { Applied: "🌱", Interview: "🌿", Accepted: "🌳", Rejected: "🍂" };