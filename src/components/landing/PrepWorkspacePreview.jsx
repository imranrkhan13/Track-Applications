import React from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Code2, FileSearch, Hash, HeartHandshake, Mic, Network, Sprout, Target } from "lucide-react";
import SectionContainer from "./SectionContainer";

const CHANNELS = [
    ["OVERVIEW", [[Hash, "overview"]]],
    ["RESEARCH", [[Sprout, "company"], [FileSearch, "job-description"], [Network, "hiring-process"]]],
    ["PRACTICE", [[Code2, "technical"], [Target, "coding"], [Network, "system-design"], [HeartHandshake, "behavioral"]]],
    ["PLAN", [[CalendarDays, "today"], [FileSearch, "14-day-plan"], [CheckCircle2, "notes"]]],
];

export default function PrepWorkspacePreview({ onStart }) {
    return <SectionContainer id="prep-workspace" variant="muted-green" className="landing-prep-workspace" eyebrow="06 / THE PREP ROOM" title={<>The work before the interview,<br /><em>in one focused place.</em></>} description="A role-specific workspace for company signals, practice, resources, and the small plan that gets you ready."><div className="landing-prep-window"><aside className="landing-prep-sidebar"><div className="landing-prep-role"><span>G</span><div><b>Google</b><small>Senior Backend Engineer</small></div></div>{CHANNELS.map(([group, channels]) => <div className="landing-prep-group" key={group}><small>{group}</small>{channels.map(([Icon, channel]) => <span className={channel === "overview" ? "is-active" : ""} key={channel}>{React.createElement(Icon, { size: 13 })}{channel}</span>)}</div>)}</aside><div className="landing-prep-center"><div className="landing-prep-center-head"><span><Hash size={15} />system-design</span><small>role-specific practice</small></div><div className="landing-coach-message"><span className="landing-coach-avatar"><Sprout size={15} /></span><div><strong>Career Garden Coach <small>just now</small></strong><p>System Design is currently your highest-priority preparation area for this role.</p><div className="landing-priority-tags"><span>Distributed systems</span><span>Caching</span><span>API scalability</span><span>Database partitioning</span></div><button type="button" onClick={onStart}>Start practice <ArrowRight size={13} /></button></div></div><div className="landing-prep-input">Write a note or ask the coach… <small>⌘ ↵</small></div></div><aside className="landing-prep-insights"><div><small>INTERVIEW</small><strong>12 <em>days</em></strong><span>remaining</span></div><div><small>READINESS</small><strong>74%</strong><i><em /></i></div><div><small>TODAY</small><strong>3 <em>/ 5 tasks</em></strong><span>keep the momentum</span></div><button type="button" onClick={onStart}>Open the room <ArrowRight size={13} /></button></aside></div></SectionContainer>;
}
