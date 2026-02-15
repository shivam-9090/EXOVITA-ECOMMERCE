import React, { useRef, useState, useEffect } from 'react';
import './Transformation.css';
import beforeImg from '../assets/hair/before.jpeg';
import afterImg from '../assets/hair/after.jpeg';

const Transformation: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Before/After Slider handlers
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <section className="comparison-section">
      <p className="comparison-subtitle">Real Results with Our Hair Oil</p>
      <h3 className="comparison-title">Transformation</h3>
      
      {/* Interactive Slider Full Width */}
      <div 
        className="slider-container"
        ref={sliderRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="slider-frame">
          {/* After Image (Background) */}
          <div className="slider-image-wrapper">
            <img src={afterImg} alt="After using hair oil" className="slider-image" />
          </div>
          
          {/* After Label with clip */}
          <div 
            className="after-label-wrapper"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <div className="image-label after-label">AFTER</div>
          </div>

          {/* Before Image (Overlay with clip) */}
          <div 
            className="slider-image-wrapper slider-overlay"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img src={beforeImg} alt="Before using hair oil" className="slider-image" />
            <div className="image-label before-label">BEFORE</div>
          </div>

          {/* Draggable Slider Line */}
          <div 
            className="slider-line"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="slider-handle">
              <div className="slider-arrow left-arrow">◄</div>
              <div className="slider-arrow right-arrow">►</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Transformation;
