import React from "react";
import { ArrowUpRight, BarChart3, Clock3, Target } from "lucide-react";
import SectionContainer from "./SectionContainer";

const FUNNEL = [["Application → Response", 68, "of applications get a signal"], ["Response → Interview", 42, "of responses become conversations"], ["Interview → Offer", 18, "of conversations bloom"]];

export default function AnalyticsPreview() {
    return <SectionContainer id="analytics" variant="sage" className="landing-analytics-section" eyebrow="09 / ANALYTICS" title={<>Know what<br /><em>works.</em></>} description="Use your numbers to focus."><div className="landing-analytics-grid"><div className="landing-funnel-card"><div className="landing-analytics-card-head"><span><BarChart3 size={16} /> CONVERSION FUNNEL</span><small>last 90 days</small></div>{FUNNEL.map(([label, value, detail]) => <div className="landing-funnel-row" key={label}><div><b>{label}</b><small>{detail}</small></div><strong>{value}%</strong><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className="landing-analytics-side"><article><Clock3 size={17} /><span>Response time</span><strong>4.2 days</strong><small>2 days faster <ArrowUpRight size={12} /></small></article><article><Target size={17} /><span>Interview ready</span><strong>74%</strong><small>+12% from prep <ArrowUpRight size={12} /></small></article><div className="landing-monthly-chart"><span>Applications this month</span><b>12</b><div>{[28, 42, 32, 66, 51, 80, 62, 90].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><small>May <em>Jun</em> Jul</small></div></div></div></SectionContainer>;
}
