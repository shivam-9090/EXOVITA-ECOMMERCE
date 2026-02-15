import React, { Suspense, lazy } from "react";
import "./Home.css";
import AnimatedSection from "../components/AnimatedSection";
import BannerCarousel from "../components/BannerCarousel";

const HeroSection = lazy(() => import("../components/HeroSection"));
const NaturalLuxurySection = lazy(
  () => import("../components/NaturalLuxurySection"),
);
const BotanicalBlueprintSection = lazy(
  () => import("../components/BotanicalBlueprintSection"),
);
const WhyChooseExovita = lazy(() => import("../components/WhyChooseExovita"));
const Transformation = lazy(() => import("../components/Transformation"));
const ReviewSection = lazy(() => import("../components/ReviewSection"));

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <BannerCarousel />

      <Suspense fallback={<div style={{ height: "100vh" }}></div>}>
        <AnimatedSection animation="fade-in">
          <HeroSection />
        </AnimatedSection>

        <AnimatedSection animation="fade-up" threshold={0.1}>
          <NaturalLuxurySection />
        </AnimatedSection>

        <AnimatedSection animation="fade-up" threshold={0.1}>
          <BotanicalBlueprintSection />
        </AnimatedSection>

        <AnimatedSection animation="fade-up" threshold={0.1}>
          <WhyChooseExovita />
        </AnimatedSection>

        <AnimatedSection animation="fade-up" threshold={0.1}>
          <Transformation />
        </AnimatedSection>

        <AnimatedSection animation="fade-up" threshold={0.1}>
          <ReviewSection />
        </AnimatedSection>
      </Suspense>
    </div>
  );
};

export default Home;
