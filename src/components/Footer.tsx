import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-column brand-column">
          <div className="footer-logo">
            <img src="/logo.png" alt="EXOVITA" />
          </div>
          <p className="footer-desc">
            Experience the essence of luxury and nature combined. Premium products for a premium lifestyle.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <MapPin size={18} />
              <span>123 Luxury Lane, Beverly Hills, CA</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+1 (800) 123-4567</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>concierge@exovita.com</span>
            </div>
          </div>
        </div>

        <div className="footer-column">
          <h4>QUICK LINKS</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/shop">FAQ</Link></li>
            <li><Link to="/shipping">Shipping Info</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>CUSTOMER SERVICE</h4>
          <ul>
            <li><Link to="/shop">Returns</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service">Terms of Service</Link></li>
            <li><Link to="/contact">Support</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>CONNECT WITH US</h4>
          <div className="social-icons">
            <a href="#" className="social-icon"><Facebook size={20} /></a>
            <a href="#" className="social-icon"><Twitter size={20} /></a>
            <a href="https://www.instagram.com/exovitaofficial/" target="_blank" rel="noopener noreferrer" className="social-icon"><Instagram size={20} /></a>
            <a href="#" className="social-icon"><Linkedin size={20} /></a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 EXOVITA. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
