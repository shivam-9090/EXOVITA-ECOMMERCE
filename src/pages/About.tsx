import React, { useEffect } from 'react';
import './About.css';
import AnimatedSection from '../components/AnimatedSection';
import aboutVideo from '../assets/about/exo-1-reel.mp4';

const About: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page-new">
      
      {/* Hero Section */}
      <section className="about-hero">
        <AnimatedSection animation="fade-in">
          <div className="about-hero-content">
            <h1 className="hero-title">The Essence of <span className="text-highlight">EXOVITA</span></h1>
            <p className="hero-subtitle">Where ancient wisdom meets modern soul.</p>
            <div className="hero-divider"></div>
          </div>
        </AnimatedSection>
      </section>

      {/* Origin Story */}
      <section className="about-section origin-section">
        <div className="container">
          <AnimatedSection animation="fade-up">
            <div className="split-layout">
              <div className="text-block">
                <h2 className="section-title">The Origin</h2>
                <p className="lead-text">
                  EXOVITA was not born in a boardroom. It began with a simple question: 
                  <em>What if care could be pure again?</em>
                </p>
                <p>
                  On <strong>Oct 8th, 2025</strong>, we embarked on a journey to reclaim the slower, honest path. 
                  In a world rushing towards shortcuts, we chose to stand still and listen to nature. 
                  Inspired by Ayurvedic traditions passed down through generations, we create products 
                  that nurture not just the body, but the spirit within.
                </p>
              </div>
              <div className="visual-block calendar-visual">
                <div className="date-card">
                  <span className="est">EST.</span>
                  <span className="year">2025</span>
                  <span className="date">OCT 08</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Philosophy Banner */}
      <section className="philosophy-banner">
        <AnimatedSection animation="scale-up">
          <div className="philosophy-content">
            <div className="philosophy-item">
              <h3>EXO</h3>
              <span>Beyond</span>
            </div>
            <div className="philosophy-divider"></div>
            <div className="philosophy-item">
              <h3>VITA</h3>
              <span>Life</span>
            </div>
          </div>
          <p className="philosophy-quote">"Self-care going beyond appearance to become a ritual of wellness."</p>
        </AnimatedSection>
      </section>



      {/* Hair Oil & Soap Details */}
      <section className="about-section products-info-section">
        <div className="container">
          
          <AnimatedSection animation="slide-in-left">
            <div className="product-feature-row">
              <div className="feature-text">
                <h3>Ayurvedic Hair Oil</h3>
                <p>
                  Nourishment doesn't happen on the surface; it happens at the root. 
                  Our oils are a blend of patience and potency, designed to strengthen, 
                  calm, and revitalize your hair from within.
                </p>
                <ul className="feature-list">
                  <li>Strengthens roots & reduces hair fall</li>
                  <li>Promotes thick, natural growth</li>
                  <li>Prevents dryness & dandruff</li>
                </ul>
              </div>
              <div className="visual-block frame-visual frame-visual-1">
                <div className="frame-inner video-container">
                  <video autoPlay muted playsInline loop={false} className="about-feature-video">
                    <source src={aboutVideo} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slide-in-right">
            <div className="product-feature-row reverse">
              <div className="feature-text">
                <h3>Handmade Ritual Soaps</h3>
                <p>
                   Cleansing should be a caress, not a strip-down. Our small-batch soaps 
                   retain the natural glycerin and goodness of herbs, ensuring your skin 
                   feels grounded and soft after every wash.
                </p>
                <ul className="feature-list">
                  <li>Retains natural skin moisture</li>
                  <li>Gentle for sensitive skin types</li>
                  <li>Free from sulphates & parabens</li>
                </ul>
              </div>
               <div className="visual-block frame-visual frame-visual-2">
                <div className="frame-inner"></div>
              </div>
            </div>
          </AnimatedSection>
        
        </div>
      </section>

      {/* Closing */}
      <section className="about-footer">
        <AnimatedSection animation="fade-in">
          <h2>Welcome to EXOVITA</h2>
          <p>Stay Natural. Stay Mindful. Stay True.</p>
        </AnimatedSection>
      </section>

    </div>
  );
};

export default About;
