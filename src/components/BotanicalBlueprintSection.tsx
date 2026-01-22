import React from 'react';
import './BotanicalBlueprintSection.css';

import amlaImg from '../assets/Botanical Blueprint/amla.jpg';
import bhringrajImg from '../assets/Botanical Blueprint/bhrigraj.jpg';
import brahmiImg from '../assets/Botanical Blueprint/Brahmi.jpg';
import hibiscusImg from '../assets/Botanical Blueprint/hibiscus.jpg';
import neemImg from '../assets/Botanical Blueprint/Neem.jpg';
import coconutOilImg from '../assets/Botanical Blueprint/Coconut.jpg';
// import castorOilImg from '../assets/Botanical Blueprint/Castor.jpg';

const BotanicalBlueprintSection: React.FC = () => {
  
  const herbalIngredients = [
    {
      name: "Amla",
      image: amlaImg,
      benefits: ["Promotes growth", "Adds shine and strength", "Prevents premature greying"]
    },
    {
      name: "Bhringraj",
      image: bhringrajImg,
      benefits: ["Reduces hair fall", "Strengthens roots", "Supports thicker growth"]
    },
    {
      name: "Brahmi",
      image: brahmiImg,
      benefits: ["Nourishes scalp", "Reduces stress-related fall", "Improves texture"]
    },
    {
      name: "Hibiscus",
      image: hibiscusImg,
      benefits: ["Boosts volume", "Prevents dryness and split ends", "Softens hair"]
    },
    {
      name: "Neem",
      image: neemImg,
      benefits: ["Controls dandruff", "Keeps scalp clean", "Prevents infections"]
    }
  ];

  const baseOils = [
    {
      name: "Coconut Oil",
      image: coconutOilImg,
      benefits: ["Deeply moisturizes", "Prevents protein loss", "Adds natural shine"]
    }
  ];

  const processFlow = [
    "Deep Scalp Nourishment",
    "Stronger Hair Roots",
    "Reduced Hair Fall",
    "Healthy Hair Growth",
    "Shiny, Thick, Natural Hair"
  ];

  return (
    <section className="botanical-section">
      <div className="botanical-container">
        <div className="botanical-header">
          <h2>Botanical Blueprint</h2>
          <p>For Hair Restoration</p>
        </div>

        {/* Part 1: Herbal Ingredients */}
        <div className="blueprint-category">
          <h3 className="category-title">Herbal Ingredients</h3>
          
          <div className="scrolling-wrapper">
            <div className="scrolling-track">
              {/* Render items twice for infinite loop effect */}
              {[...herbalIngredients, ...herbalIngredients].map((item, index) => (
                <div key={index} className="botanical-card scroll-card">
                  <div className="card-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="card-header">
                    <h3>{item.name}</h3>
                  </div>
                  <ul className="card-details">
                    {item.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Part 2: Base Oils */}
        <div className="blueprint-category">
          <h3 className="category-title">Base Oils</h3>
          <div className="botanical-grid base-oils">
            {baseOils.map((item, index) => (
              <div key={index} className="botanical-card">
                <div className="card-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <h3>{item.name}</h3>
                  </div>
                  <ul className="card-details">
                    {item.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3: Process Flow */}
        <div className="blueprint-category">
          <h3 className="category-title">Process Flow</h3>
          <div className="process-flow-container">
            {processFlow.map((step, index) => (
              <div key={index} className="process-node">
                <div className="node-icon">
                  {index + 1}
                </div>
                <div className="node-label">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default BotanicalBlueprintSection;
