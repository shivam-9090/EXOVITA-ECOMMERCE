import React, { useState, useEffect } from "react";
import "./NaturalLuxurySection.css";
const showcase3 = "https://api.exovitaherbal.com/media/showcase-1.jpg";
const showcase4 = "https://api.exovitaherbal.com/media/box-1.png";

const NaturalLuxurySection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="natural-luxury-section">
      <div className="natural-luxury-grid">
        <div className="grid-box box-1">
          <div className="green-luxury-box">
            <div className="green-box-content">
              <h3>
                THE <br />
                QUINTESSENCE OF <br />
                NATURAL LUXURY
              </h3>
              <div className="divider-line"></div>
              <a href="/shop" className="explore-link">
                EXPLORE COLLECTION &gt;
              </a>
            </div>
          </div>
        </div>

        {/* Desktop: individual boxes | Mobile: hidden, rendered in carousel below */}
        <div className="grid-box box-2 desktop-only">
          <div className="white-beauty-frame">
            <div className="white-beauty-inner">
              <div className="beauty-img-wrapper">
                <img src={showcase3} alt="Beauty Boost" loading="lazy" />
              </div>
              <p>Treat yourself to the luxury of nature</p>
              <a href="/shop" className="sm-shop-link">
                SHOP ALL SKINCARE &gt;
              </a>
            </div>
          </div>
        </div>

        <div className="grid-box box-3 desktop-only">
          <div className="winter-collection-frame">
            <div className="winter-frame-inner">
              <div className="winter-img-wrap">
                <img src={showcase4} alt="Ayurvedic Hair Oil" loading="lazy" />
              </div>
              <h3>NEW WINTER FRAGRANCES</h3>
              <p>cinnamon, spice and everything nice</p>
              <a href="/shop" className="stock-link">
                STOCK UP NOW &gt;
              </a>
            </div>
          </div>
        </div>

        {/* Mobile-only carousel — single fixed frame, content fades inside */}
        <div className="mobile-carousel">
          <div className="mobile-frame-outer">
            <div className="mobile-frame-inner">
              {/* Slide 1 */}
              <div
                className={`mobile-frame-slide ${activeSlide === 0 ? "active" : ""}`}
              >
                <div className="beauty-img-wrapper">
                  <img src={showcase3} alt="Beauty Boost" loading="lazy" />
                </div>
                <p className="frame-slide-text">
                  Treat yourself to the luxury of nature
                </p>
                <a href="/shop" className="sm-shop-link">
                  SHOP ALL SKINCARE &gt;
                </a>
              </div>
              {/* Slide 2 */}
              <div
                className={`mobile-frame-slide ${activeSlide === 1 ? "active" : ""}`}
              >
                <div className="winter-img-wrap">
                  <img
                    src={showcase4}
                    alt="Ayurvedic Hair Oil"
                    loading="lazy"
                  />
                </div>
                <h3 className="frame-slide-heading">NEW WINTER FRAGRANCES</h3>
                <p className="frame-slide-subtext">
                  cinnamon, spice and everything nice
                </p>
                <a href="/shop" className="stock-link">
                  STOCK UP NOW &gt;
                </a>
              </div>
            </div>
          </div>
          <div className="mobile-carousel-dots">
            <button
              className={`carousel-dot ${activeSlide === 0 ? "active" : ""}`}
              onClick={() => setActiveSlide(0)}
              aria-label="Slide 1"
            />
            <button
              className={`carousel-dot ${activeSlide === 1 ? "active" : ""}`}
              onClick={() => setActiveSlide(1)}
              aria-label="Slide 2"
            />
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
