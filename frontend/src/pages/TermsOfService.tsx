import React from 'react';
import './TermsOfService.css';

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>Terms & Conditions</h1>
        <p className="intro-text">
          Welcome to our website. By accessing or purchasing from our site, you agree to comply with the following Terms & Services. Please read them carefully.
        </p>

        <section className="terms-section">
          <h2>1. Product Information & Disclaimer</h2>
          <p>
            All products listed on our website, including Ayurvedic hair oil and herbal soaps, are made using natural and herbal ingredients. Our products are intended for external use only and are not meant to diagnose, treat, cure, or prevent any medical condition. Individual results may vary depending on skin type and usage.
          </p>
          <p>
            We recommend performing a patch test before using any product. We are not responsible for any allergic reactions, skin sensitivity, or misuse of the products.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Product Availability & Changes</h2>
          <p>
            All product information, prices, and availability are subject to change without prior notice. We reserve the right to modify or discontinue any product at any time.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Orders & Delivery</h2>
          <p>
            Orders will be processed after successful payment. Delivery timelines may vary depending on location and logistics. We are not responsible for delays caused by courier services or unforeseen circumstances.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Intellectual Property</h2>
          <p>
            All content on this website, including images, text, and branding, is our property and may not be copied or used without permission.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Agreement to Terms</h2>
          <p>
            By using our website, you agree to these Terms & Services.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
