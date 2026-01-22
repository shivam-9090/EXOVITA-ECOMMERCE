import React, { Suspense, lazy } from 'react';
import './Home.css';
import AnimatedSection from '../components/AnimatedSection';

const HeroSection = lazy(() => import('../components/HeroSection'));
const NaturalLuxurySection = lazy(() => import('../components/NaturalLuxurySection'));
const BotanicalBlueprintSection = lazy(() => import('../components/BotanicalBlueprintSection'));

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <Suspense fallback={<div style={{height: '100vh'}}></div>}>
        <AnimatedSection animation="fade-in">
           <HeroSection />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-up" threshold={0.1}>
           <NaturalLuxurySection />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-up" threshold={0.1}>
           <BotanicalBlueprintSection />
        </AnimatedSection>
      </Suspense>
    </div>
  );
};

export default Home;
