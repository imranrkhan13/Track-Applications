import React, { useEffect } from "react";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import ProductIntro from "./ProductIntro";
import GrowthJourney from "./GrowthJourney";
import DashboardPreview from "./DashboardPreview";
import InterviewPrep from "./InterviewPrep";
import PrepWorkspacePreview from "./PrepWorkspacePreview";
import HowItWorks from "./HowItWorks";
import ApplicationViews from "./ApplicationViews";
import AnalyticsPreview from "./AnalyticsPreview";
import LessonsGarden from "./LessonsGarden";
import Testimonials from "./Testimonials";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";

export default function LandingPage({ onStart, onSignIn }) {
    useEffect(() => {
        const page = document.querySelector(".landing-page");
        if (!page) return undefined;
        page.classList.add("landing-page--reveal-ready");
        const elements = [...page.querySelectorAll("[data-reveal], [data-stagger]")];
        const show = element => element.classList.add("is-visible");
        if (!("IntersectionObserver" in window)) {
            elements.forEach(show);
            return undefined;
        }
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                show(entry.target);
                observer.unobserve(entry.target);
            }
        }), { threshold: 0.12, rootMargin: "0px 0px -8%" });
        elements.forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return <div className="landing-page" id="top"><LandingNavbar onStart={onStart} onSignIn={onSignIn} /><main><HeroSection onStart={onStart} /><ProductIntro onStart={onStart} /><GrowthJourney onStart={onStart} /><DashboardPreview onStart={onStart} /><InterviewPrep onStart={onStart} /><PrepWorkspacePreview onStart={onStart} /><HowItWorks onStart={onStart} /><ApplicationViews onStart={onStart} /><AnalyticsPreview /><LessonsGarden onStart={onStart} /><Testimonials /><FinalCTA onStart={onStart} /></main><LandingFooter onStart={onStart} /></div>;
}
