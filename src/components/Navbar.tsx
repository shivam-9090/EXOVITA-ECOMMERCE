import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, Heart, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import LoginModal from './LoginModal';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const prevScrollPos = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isVisible = prevScrollPos.current > currentScrollPos || currentScrollPos < 10;
      
      setIsNavbarVisible(isVisible);
      prevScrollPos.current = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when screen is resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when scrolling
  useEffect(() => {
    const handleScrollClose = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      window.addEventListener('scroll', handleScrollClose, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', handleScrollClose);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`navbar ${isNavbarVisible ? '' : 'navbar-hidden'}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo-link">
            <div className="navbar-logo">
              <img src="/logo.png" alt="EXOVITA" style={{ height: '60px' }} />
            </div>
          </Link>
          
          <div className="navbar-left-actions">
            <Link to="/" className="nav-action-item">Home</Link>
            <Link to="/shop" className="nav-action-item">Shop Now</Link>
            <Link to="/about" className="nav-action-item">About</Link>
            <Link to="/contact" className="nav-action-item">Contact Us</Link>
          </div>

          <div className="navbar-search-container">
            <div className="search-bar">
              <Search size={18} className="search-icon" strokeWidth={1.5} />
              <input type="text" placeholder="Search for what you want?..." autoComplete="off" />
            </div>
          </div>

          <div className="navbar-icons">
            <Link to="/wishlist" className="icon-item-row" title="Wishlist">
              <div className="icon-wrapper">
                <Heart size={24} strokeWidth={1.5} />
                <span className="badge">{wishlistCount}</span>
              </div>
            </Link>

            <Link to="/cart" className="time-icon-link icon-item-row" title="Cart">
              <div className="icon-wrapper">
                <ShoppingBag size={24} strokeWidth={1.5} />
                 <span className="badge">{cartCount}</span>
              </div>
            </Link>

            <button 
              className="icon-item-row icon-btn-reset" 
              title="Login"
              onClick={() => setIsLoginModalOpen(true)}
            >
              <div className="icon-wrapper">
                 <User size={24} strokeWidth={1.5} />
              </div>
            </button>
            
            <div className="mobile-menu" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </nav>

      <div className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h3>Menu</h3>
          <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="mobile-nav-links">
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>Shop Now</Link>
          <Link to="/deals" onClick={() => setIsMobileMenuOpen(false)}>Deals</Link>
          <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
          <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>Wishlist</Link>
          <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>Cart ({cartCount})</Link>
          <button 
            className="mobile-nav-btn" 
            onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
          >
            Login / Register
          </button>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchStart={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};


export default Navbar;
