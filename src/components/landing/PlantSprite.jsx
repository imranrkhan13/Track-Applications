import React from "react";
import plantStates from "../../assets/career-plant-states.png";

export default function PlantSprite({ stage = 0, className = "", label = "Career opportunity plant", eager = false }) {
    const safeStage = Math.max(0, Math.min(5, Number(stage) || 0));
    return <div className={`cg-plant-sprite ${className}`.trim()} style={{ "--plant-stage": safeStage }} role="img" aria-label={label}>
        <span className="cg-plant-crop" aria-hidden="true">
            <img src={plantStates} width="2172" height="724" alt="" loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" />
        </span>
    </div>;
}
