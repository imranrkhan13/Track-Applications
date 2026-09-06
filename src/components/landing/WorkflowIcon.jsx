import React from "react";
import { Building2, CalendarCheck2, Crosshair, Link2, Route, ScanText } from "lucide-react";

const ICONS = [Link2, ScanText, Building2, Route, Crosshair, CalendarCheck2];
const TONES = [
    ["#3567b7", "#eaf1fc"],
    ["#6d56aa", "#f1edfa"],
    ["#26806a", "#e4f3ed"],
    ["#b06b2f", "#fbefe2"],
    ["#2f7b4d", "#e7f3e9"],
    ["#8b6b25", "#f8f0d9"],
];

export default function WorkflowIcon({ stage = 0, className = "", label = "Workflow stage" }) {
    const safeStage = Math.max(0, Math.min(5, Number(stage) || 0));
    const Icon = ICONS[safeStage];
    const [tone, tint] = TONES[safeStage];
    return <span className={`cg-workflow-icon ${className}`.trim()} role="img" aria-label={label} style={{ "--workflow-tone": tone, "--workflow-tint": tint }}>
        <Icon aria-hidden="true" />
    </span>;
}
