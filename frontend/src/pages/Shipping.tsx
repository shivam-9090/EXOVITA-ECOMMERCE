import React from 'react';
import './Shipping.css';

const Shipping: React.FC = () => {
  return (
    <div className="shipping-page">
      <div className="shipping-container">
        <h1>Shipping Information</h1>
        <p className="intro-text">
          At EXOVITA, we aim to deliver your products safely and on time. To ensure reliable and efficient delivery, 
          we have partnered with Shiprocket, a trusted shipping and logistics platform.
        </p>

        <section className="shipping-section">
          <h2>Shipping Partner</h2>
          <p>
            All orders placed on our website are shipped through <strong>Shiprocket</strong>, which works with multiple 
            courier partners to provide timely and secure delivery across India.
          </p>
        </section>

        <section className="shipping-section">
          <h2>Order Processing Time</h2>
          <ul>
            <li>Orders are usually processed within <strong>1–3 business days</strong> after order confirmation.</li>
            <li>Orders placed on Sundays or public holidays will be processed on the next working day.</li>
          </ul>
        </section>

        <section className="shipping-section">
          <h2>Delivery Time</h2>
          <ul>
            <li>Estimated delivery time is <strong>3–7 business days</strong>, depending on your location.</li>
            <li>Delivery timelines may vary due to weather conditions, courier delays, or regional restrictions.</li>
          </ul>
        </section>

        <section className="shipping-section">
          <h2>Shipping Charges</h2>
          <ul>
            <li>Shipping charges (if applicable) will be clearly mentioned at checkout before payment.</li>
            <li>Any free shipping offers will be applied automatically.</li>
          </ul>
        </section>

        <section className="shipping-section">
          <h2>Order Tracking</h2>
          <p>
            Once your order is shipped, you will receive a <strong>tracking link via SMS or email</strong> from Shiprocket, 
            allowing you to monitor your delivery status in real time.
          </p>
        </section>

        <section className="shipping-section">
          <h2>Delivery Address</h2>
          <p>
            Please ensure that your shipping address, contact number, and pin code are accurate at the time of placing the 
            order. EXOVITA is not responsible for delays or non-delivery due to incorrect information provided by the customer.
          </p>
        </section>

        <section className="shipping-section">
          <h2>Damaged or Missing Packages</h2>
          <p>
            If your package arrives damaged or incomplete, please contact us within <strong>48 hours of delivery</strong> with 
            clear images and order details so we can assist you promptly.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Shipping;
