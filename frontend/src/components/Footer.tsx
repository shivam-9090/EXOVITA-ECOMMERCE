import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer-new" style={{ '--footer-bg': `url("/foter.svg")` } as React.CSSProperties}>
      <div className="footer-wrapper">
        
        {/* Left Side */}
        <div className="footer-left">
          <div className="newsletter-container">
            <h3>A small gift for your first order.<br />Enjoy 15% off on your first purchase.</h3>
            
            <div className="newsletter-input-group">
              <input type="email" placeholder="Your email address" />
              <button>Sign Up</button>
            </div>
            
            <p className="newsletter-terms">
              By signing up you agree to our Terms & Conditions. You can unsubscribe at anytime you wish.
            </p>
          </div>

          <div className="social-section">
            <span>Follow us on</span>
            <div className="social-icons-list">
              <a href="#" className="social-btn"><Instagram size={18} /></a>
              <a href="#" className="social-btn"><Facebook size={18} /></a>
              <a href="#" className="social-btn"><Linkedin size={18} /></a>
              <a href="#" className="social-btn"><MessageCircle size={18} /></a>
            </div>
          </div>

          <div className="brand-header">
            <h2 className="brand-title">E X O V I T A</h2>
          </div>
        </div>

        {/* Center Line */}
        <div className="footer-divider"></div>

        {/* Right Side */}
        <div className="footer-right">
          <div className="footer-links-grid">
            <div className="footer-nav-column">
              <h4>About EXOVITA</h4>
              <ul>
                <li><Link to="/about">Our Story</Link></li>
                <li><Link to="/about">Ayurvedic Journal</Link></li>
                <li><Link to="/about">Sensory Guides</Link></li>
                <li><Link to="/contact">In the News</Link></li>
                <li><Link to="/contact">Support Centre</Link></li>
              </ul>
            </div>
            <div className="footer-nav-column">
              <h4>Shop</h4>
              <ul>
                <li><Link to="/shop">Collections</Link></li>
                <li><Link to="/shop">Gifts</Link></li>
                <li><Link to="/shop">Special Edition</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>&copy;2026, EXOVITA. All rights reserved. <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/terms-of-service">Terms & Conditions</Link></p>
      </div>
    </footer>
  );
};

export default Footer;
