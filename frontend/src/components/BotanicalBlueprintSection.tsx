import React, { useMemo, useEffect, useRef, useState } from 'react';
import './BotanicalBlueprintSection.css';

// Lazy load images handled by browser (loading="lazy") but we import normally for bundler
import amlaImg from '../assets/Botanical Blueprint/amla.jpg';
import bhringrajImg from '../assets/Botanical Blueprint/bhrigraj.jpg';
import brahmiImg from '../assets/Botanical Blueprint/Brahmi.jpg';
import hibiscusImg from '../assets/Botanical Blueprint/hibiscus.jpg';
import neemImg from '../assets/Botanical Blueprint/Neem.jpg';
import shikakaiImg from '../assets/Botanical Blueprint/shikakai.jpeg';
import coconutOilImg from '../assets/Botanical Blueprint/Coconut.jpg';

const BotanicalBlueprintSection: React.FC = () => {
  
  const ingredients = useMemo(() => [
    { name: "Amla", img: amlaImg, benefits: ["Promotes growth", "Prevents greying"] },
    { name: "Bhringraj", img: bhringrajImg, benefits: ["Reduces hair fall", "Strengthens roots"] },
    { name: "Brahmi", img: brahmiImg, benefits: ["Nourishes scalp", "Improves texture"] },
    { name: "Hibiscus", img: hibiscusImg, benefits: ["Boosts volume", "Prevents dryness"] },
    { name: "Neem", img: neemImg, benefits: ["Controls dandruff", "Scalp health"] },
    { name: "Shikakai", img: shikakaiImg, benefits: ["Natural cleanser", "Root strength"] },
    { name: "Coconut Base", img: coconutOilImg, benefits: ["Deeply moisturizes", "Prevents protein loss"] }
  ], []);

  const steps = [
    "Deep Scalp Nourishment",
    "Stronger Hair Roots",
    "Reduced Hair Fall",
    "Healthy Growth"
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Desktop Hover Handlers
  const handleMouseEnter = () => {
    setIsPaused(true);
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Resume scroll after 3 seconds even if still hovering
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPaused(false);
  };

  // Auto-scroll logic with infinite loop simulation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollSpeed = 0.4; // px per frame (slowed down)

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll position to simulate infinite loop
        // We accept a jump when we reach the halfway point of the duplicated content
        if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 2)) {
          scrollContainer.scrollLeft = 0; 
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <section className="botanical-section-new">
      <div className="botanical-container-new">
        <div className="botanical-header-new">
          <h2>Botanical Blueprint</h2>
          <p>Potent herbs blended for maximum restoration</p>
        </div>
      </div>

      {/* Infinite Scroll Layout - Edge to Edge */}
      <div 
        className="scrolling-wrapper-new" 
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="scrolling-track-new">
          {/* Render items 4 times for infinite loop to prevent gaps on wide screens */}
          {[...ingredients, ...ingredients, ...ingredients, ...ingredients].map((item, idx) => (
            <div key={idx} className="ingredient-card scroll-card-new">
              <div className="ingredient-img-wrapper">
                <img 
                  src={item.img} 
                  alt={item.name} 
                  loading="lazy" 
                  className="ingredient-img"
                  width="300" 
                  height="225"
                />
              </div>
              <div className="ingredient-info">
                <h3 className="ingredient-name">{item.name}</h3>
                <ul className="ingredient-benefits">
                  {item.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="botanical-container-new">
        {/* Process Flow - Linear minimalist */}
        <div className="process-section">
          <h3 className="process-title">Restoration Process</h3>
          <div className="process-timeline">
            {steps.map((step, index) => (
              <div key={index} className="process-step">
                <div className="step-marker">{index + 1}</div>
                <div className="step-label">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BotanicalBlueprintSection;
