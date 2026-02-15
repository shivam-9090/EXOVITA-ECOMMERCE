import React from 'react';
import './WhyChooseExovita.css';
import featureImage from '../assets/hair oil/hair_oil_1.jpg';

const WhyChooseExovita: React.FC = () => {
  const reasons = [
    {
      title: "Authentic Ayurvedic Formulation",
      description: "Our oil is crafted using time-honored Ayurvedic traditions, blending rare herbs like Bhringraj and Amla to target hair health at the root, ensuring a truly natural remedy."
    },
    {
      title: "Clinically Proven Results",
      description: "Experience the power of nature backed by science. Our formula is tested to reduce hair fall and stimulate growth, providing visible results you can trust."
    },
    {
      title: "100% Pure & Toxin-Free",
      description: "We promise purity. No parabens, sulfates, or mineral oils—just the goodness of nature delivered straight to your scalp for deep nourishment and vitality."
    }
  ];

  return (
    <section className="why-choose-section">
      <div className="why-choose-container">
        
        <div className="why-choose-top">
          <div className="why-choose-header">
            <h2 className="why-choose-title">
              Why Choose Exovita for Your<br />
              Hair Care Journey?
            </h2>
          </div>
          <div className="why-choose-visual">
            <div className="why-choose-img-wrapper">
              <img src={featureImage} alt="Exovita Hair Oil" className="why-choose-img" />
            </div>
          </div>
        </div>

        <div className="why-choose-bottom">
          {reasons.map((reason, index) => (
            <div key={index} className="why-choose-feature">
              <h3 className="why-choose-feature-title">{reason.title}</h3>
              <p className="why-choose-feature-desc">{reason.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseExovita;
