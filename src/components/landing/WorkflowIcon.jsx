import React from "react";
import workflowIcons from "../../assets/career-workflow-icons.png";

export default function WorkflowIcon({ stage = 0, className = "", label = "Workflow stage" }) {
    const safeStage = Math.max(0, Math.min(5, Number(stage) || 0));
    return <span className={`cg-workflow-icon ${className}`.trim()} role="img" aria-label={label}>
        <span className="cg-workflow-icon-crop" aria-hidden="true">
            <img src={workflowIcons} width="2172" height="724" alt="" style={{ "--workflow-stage": safeStage }} loading="lazy" decoding="async" />
        </span>
    </span>;
}
