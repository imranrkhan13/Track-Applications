import React from "react";

export default function SectionContainer({ id, variant = "cream", eyebrow, title, description, children, className = "" }) {
    return <section id={id} className={`landing-section landing-section-${variant} ${className}`.trim()}>
        <div className="landing-container">
            {(eyebrow || title || description) && <div className="landing-section-heading">
                <div>{eyebrow && <span className="landing-eyebrow">{eyebrow}</span>}{title && <h2>{title}</h2>}</div>
                {description && <p>{description}</p>}
            </div>}
            {children}
        </div>
    </section>;
}
