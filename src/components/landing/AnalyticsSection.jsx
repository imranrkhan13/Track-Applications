import React from "react";
import { ArrowUpRight, BarChart3, Clock3, Target, TrendingUp } from "lucide-react";
import { ScaleReveal } from "./Motion";

const FUNNEL = [["Application → Response", 68], ["Response → Interview", 42], ["Interview → Offer", 18]];

export default function AnalyticsSection() {
    return <section className="cg-section cg-analytics" id="analytics"><div className="cg-shell"><div className="cg-section-head"><div><span className="cg-kicker"><i />Analytics</span><h2>Know what’s<br /><em>working.</em></h2></div><p>Professional metrics show where your search is moving and where preparation can help.</p></div><ScaleReveal className="cg-analytics-frame"><header><div><BarChart3 size={17} /><span>Search performance</span></div><small>Last 90 days</small></header><div className="cg-analytics-layout"><main><span>CONVERSION FUNNEL</span>{FUNNEL.map(([label, value]) => <div className="cg-funnel-row" key={label}><div><b>{label}</b><strong>{value}%</strong></div><i><em style={{ width: `${value}%` }} /></i></div>)}</main><aside><article><Clock3 size={18} /><span>Average response</span><strong>4.2 <small>days</small></strong><em><ArrowUpRight size={12} />2 days faster</em></article><article><Target size={18} /><span>Readiness</span><strong>74<small>%</small></strong><em><ArrowUpRight size={12} />12% from prep</em></article><article><TrendingUp size={18} /><span>Applications this week</span><strong>12</strong><div className="cg-spark-bars">{[26, 38, 31, 57, 43, 72, 90].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article></aside></div></ScaleReveal></div></section>;
}
