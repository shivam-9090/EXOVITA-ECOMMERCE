import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Check if user has already visited in this session
    const hasVisited = sessionStorage.getItem('hasVisited');

    if (hasVisited) {
      // If visited, do not show splash screen
      setShouldRender(false);
      return;
    }

    // If first time, show splash screen
    setShouldRender(true);
    setIsVisible(true);
    
    // Mark as visited for this session
    sessionStorage.setItem('hasVisited', 'true');
    
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
