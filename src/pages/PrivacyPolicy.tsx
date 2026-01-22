import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        <h1>Privacy Policy</h1>
        <p className="intro-text">
          At EXOVITA, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect 
          your personal information when you visit or interact with our website.
        </p>
        <p className="intro-text">
          By using our website, you agree to the practices described in this policy.
        </p>

        <section className="policy-section">
          <h2>Information We Collect</h2>
          <p>When you visit or use our website, we may collect the following information:</p>
          <ul>
            <li>Personal details such as name, email address, phone number, and shipping address when you place an order or contact us</li>
            <li>Payment-related information (processed securely through trusted third-party payment gateways)</li>
            <li>Basic technical information such as IP address, browser type, and device data for website performance and security</li>
          </ul>
          <p>We only collect information that is necessary to provide our services and improve your experience.</p>
        </section>

        <section className="policy-section">
          <h2>How We Use Your Information</h2>
          <p>The information we collect is used to:</p>
          <ul>
            <li>Process and deliver your orders</li>
            <li>Communicate with you about orders, support, or updates</li>
            <li>Improve our products, services, and website experience</li>
            <li>Send promotional emails or offers (only if you choose to receive them)</li>
          </ul>
          <p className="highlight-note">We do not sell, rent, or trade your personal information to third parties.</p>
        </section>

        <section className="policy-section">
          <h2>Data Protection & Security</h2>
          <p>
            We take reasonable steps to protect your personal information from unauthorized access, misuse, or disclosure. 
            Your data is stored securely, and all transactions are handled through trusted and secure systems.
          </p>
          <p>However, please note that no method of online transmission is 100% secure.</p>
        </section>

        <section className="policy-section">
          <h2>Cookies</h2>
          <p>
            Our website may use cookies to enhance your browsing experience. Cookies help us understand how visitors use 
            our site and allow us to improve functionality. You can choose to disable cookies through your browser settings 
            if you prefer.
          </p>
        </section>

        <section className="policy-section">
          <h2>Third-Party Services</h2>
          <p>
            We may use third-party services (such as payment gateways or delivery partners) to complete transactions and 
            deliver products. These third parties have their own privacy policies, and we recommend reviewing them separately.
          </p>
        </section>

        <section className="policy-section">
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access or update your personal information</li>
            <li>Request deletion of your data (subject to legal or operational requirements)</li>
            <li>Opt out of promotional communications at any time</li>
          </ul>
          <p>For any privacy-related requests, you can contact us directly.</p>
        </section>

        <section className="policy-section">
          <h2>Changes to This Policy</h2>
          <p>
            EXOVITA reserves the right to update or modify this Privacy Policy at any time. Any changes will be reflected 
            on this page with an updated effective date.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
