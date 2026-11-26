import React from "react";
import plantStatesAvif from "../../assets/opt/plant-states.avif";
import plantStatesWebp from "../../assets/opt/plant-states.webp";

export default function PlantSprite({ stage = 0, className = "", label = "Career opportunity plant", eager = false }) {
    const safeStage = Math.max(0, Math.min(5, Number(stage) || 0));
    return <div className={`cg-plant-sprite ${className}`.trim()} style={{ "--plant-stage": safeStage }} role="img" aria-label={label}>
        <span className="cg-plant-crop" aria-hidden="true">
            <picture>
                <source type="image/avif" srcSet={plantStatesAvif} />
                <source type="image/webp" srcSet={plantStatesWebp} />
                <img src={plantStatesWebp} width="2172" height="724" alt="" loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" />
            </picture>
        </span>
    </div>;
}
