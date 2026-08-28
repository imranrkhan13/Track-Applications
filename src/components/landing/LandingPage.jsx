import React from "react";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import JourneySection from "./JourneySection";
import DashboardDemo from "./DashboardDemo";
import CaptureSection from "./CaptureSection";
import IntelligenceSection from "./IntelligenceSection";
import InterviewPrepSection from "./InterviewPrepSection";
import PlanSection from "./PlanSection";
import PracticeSection from "./PracticeSection";
import ApplicationViews from "./ApplicationViews";
import AnalyticsSection from "./AnalyticsSection";
import LessonsSection from "./LessonsSection";
import FinalCTA from "./FinalCTA";
import LandingFooter from "./LandingFooter";

export default function LandingPage({ onStart, onSignIn }) {
    return <div className="landing-page" id="top">
        <LandingNavbar onStart={onStart} onSignIn={onSignIn} />
        <main>
            <HeroSection onStart={onStart} />
            <JourneySection onStart={onStart} />
            <DashboardDemo onStart={onStart} />
            <CaptureSection onStart={onStart} />
            <IntelligenceSection />
            <InterviewPrepSection onStart={onStart} />
            <PlanSection />
            <PracticeSection />
            <ApplicationViews />
            <AnalyticsSection />
            <LessonsSection onStart={onStart} />
            <FinalCTA onStart={onStart} />
        </main>
        <LandingFooter onStart={onStart} />
    </div>;
}
