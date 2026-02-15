import React from 'react';
import './NaturalLuxurySection.css';
import showcase3 from '../assets/showcase-1.jpg';
import showcase4 from '../assets/box-1.png';

const NaturalLuxurySection: React.FC = () => {
  return (
    <section className="natural-luxury-section">
      <div className="natural-luxury-grid">
        <div className="grid-box box-1">
          <div className="green-luxury-box">
            <div className="green-box-content">
              <h3>THE <br />QUINTESSENCE OF <br />NATURAL LUXURY</h3>
              <div className="divider-line"></div>
              <a href="/shop" className="explore-link">EXPLORE COLLECTION &gt;</a>
            </div>
          </div>
        </div>

        <div className="grid-box box-2">
          <div className="white-beauty-frame">
            <div className="white-beauty-inner">
              <div className="beauty-img-wrapper">
                <img src={showcase3} alt="Beauty Boost" loading="lazy" />
              </div>
              <p>Treat yourself to the luxury of nature</p>
              <a href="/shop" className="sm-shop-link">SHOP ALL SKINCARE &gt;</a>
            </div>
          </div>
        </div>

        <div className="grid-box box-3">
          <div className="winter-collection-frame">
            <div className="winter-frame-inner">
              <div className="winter-img-wrap">
                <img src={showcase4} alt="Ayurvedic Hair Oil" loading="lazy" />
              </div>
              <h3>NEW WINTER FRAGRANCES</h3>
              <p>cinnamon, spice and everything nice</p>
              <a href="/shop" className="stock-link">STOCK UP NOW &gt;</a>
            </div>
          </div>
        </div>

        <div className="decorative-badge-container">
          <div className="deco-badge">
            <span className="deco-small">PREMIUM</span>
            <span className="deco-large">Quality</span>
            <span className="deco-divider"></span>
            <span className="deco-small">EST. 2024</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NaturalLuxurySection;
