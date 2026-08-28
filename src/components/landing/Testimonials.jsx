import React from "react";
import SectionContainer from "./SectionContainer";

const TESTIMONIALS = [["Maya R.", "Product Designer", "Career Garden finally gave me one place to manage applications and interview preparation.", "8 applications organized"], ["Arjun S.", "Backend Engineer", "The role room showed me what to study next instead of giving me another giant checklist.", "2 interviews in one month"], ["Nora K.", "New Graduate", "Seeing a rejected application turn into a lesson made the search feel much less personal.", "Clearer stories in every round"]];

export default function Testimonials() {
    return <SectionContainer id="stories" variant="cream" className="landing-testimonials" eyebrow="11 / STORIES" title={<>A calmer search<br /><em>feels different.</em></>}><div className="landing-testimonial-grid">{TESTIMONIALS.map(([name, role, quote, result]) => <article key={name}><div className="landing-testimonial-person"><span>{name.slice(0, 1)}</span><div><b>{name}</b><small>{role}</small></div></div><p>“{quote}”</p><strong>{result}</strong></article>)}</div></SectionContainer>;
}
