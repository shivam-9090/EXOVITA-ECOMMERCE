import React from 'react';
import './TermsOfService.css';

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>Terms & Conditions</h1>
        <p className="intro-text">
          Welcome to EXOVITA. By accessing or using our website, you agree to be bound by these Terms & Conditions.
          Please read them carefully before using our services.
        </p>

        <section className="terms-section">
          <h2>1. General Conditions</h2>
          <p>
            We reserve the right to refuse service to anyone for any reason at any time.
            You understand that your content (not including credit card information) may be transferred unencrypted and involve 
            transmissions over various networks.
          </p>
          <p>
            You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without 
            express written permission by us.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Products and Services</h2>
          <p>
            We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. 
            We cannot guarantee that your computer monitor's display of any color will be accurate.
          </p>
          <p>
            We reserve the right to limit the sales of our products or Services to any person, geographic region or jurisdiction. 
            We may exercise this right on a case-by-case basis.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Accuracy of Billing and Account Information</h2>
          <p>
            We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, 
            we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Third-Party Links</h2>
          <p>
            Certain content, products and services available via our Service may include materials from third-parties.
            Third-party links on this site may direct you to third-party websites that are not affiliated with us.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Governing Law</h2>
          <p>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed 
            in accordance with the laws of the United States.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Changes to Terms of Service</h2>
          <p>
            You can review the most current version of the Terms of Service at any time at this page.
            We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
