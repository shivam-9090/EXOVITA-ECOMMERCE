import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Show splash screen on every load/refresh
    setShouldRender(true);
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3300);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`splash-screen ${!isVisible ? 'hidden' : ''}`}>
      <div className="splash-logo-container">
        <img src="/logo.png" alt="EXOVITA" className="splash-logo" />
      </div>
    </div>
  );
};

export default SplashScreen;
