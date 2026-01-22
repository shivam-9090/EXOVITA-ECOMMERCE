import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

import heroImg from '../assets/hero.jpeg';

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        
        <div className="hero-content">
          <span className="hero-subtitle">The Essence of Ayurveda</span>
          <h1>
            Transform <br /> 
            <span className="highlight-text">Your Beauty</span> <br /> 
            Naturally.
          </h1>
          <p>
            Experience the royal heritage of pure botanical care. 
            Timeless recipes for modern radiance.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn-royal">
              Shop Collection
            </Link>
            <Link to="/about" className="btn-minimal">
              Our Story
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="image-frame">
            <img src={heroImg} alt="Exovita Royal Ayurvedic Oil" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
