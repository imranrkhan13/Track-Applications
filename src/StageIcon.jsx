import React from "react";
import { BadgeCheck, CircleOff, GitBranch, Leaf, MessageCircle, Sprout } from "lucide-react";

const STAGE_ICONS = {
    Saved: Sprout,
    Applied: Leaf,
    Screening: GitBranch,
    Interview: MessageCircle,
    Offer: BadgeCheck,
    Rejected: CircleOff,
};

export default function StageIcon({ stage, size = 18, strokeWidth = 1.8, className }) {
    const Icon = STAGE_ICONS[stage?.id || stage] || Sprout;
    return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
