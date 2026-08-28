import React from "react";
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
    return <div className="landing-page" id="top"><LandingNavbar onStart={onStart} onSignIn={onSignIn} /><main><HeroSection onStart={onStart} /><ProductIntro onStart={onStart} /><GrowthJourney onStart={onStart} /><DashboardPreview onStart={onStart} /><InterviewPrep onStart={onStart} /><PrepWorkspacePreview onStart={onStart} /><HowItWorks onStart={onStart} /><ApplicationViews onStart={onStart} /><AnalyticsPreview /><LessonsGarden onStart={onStart} /><Testimonials /><FinalCTA onStart={onStart} /></main><LandingFooter onStart={onStart} /></div>;
}
