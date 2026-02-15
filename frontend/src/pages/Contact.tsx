import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import './Contact.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form Submitted:', formData);
    alert('Thank you for your message. We will get back to you soon!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-header fade-up">
        <h1>Get in Touch</h1>
        <p>
          Have questions about our Ayurvedic formulations? We're here to help you on your journey to natural wellness.
        </p>
      </div>

      <div className="contact-container">
        
        {/* Contact Info Side */}
        <div className="contact-info slide-in-left">
          <div className="info-card">
            <div className="info-item">
              <div className="icon-box">
                <MapPin size={24} />
              </div>
              <div className="info-content">
                <h3>Visit Us</h3>
                <p>123 Herbal Heritage Lane,<br />Green Valley, Kerala 685612</p>
              </div>
            </div>

            <div className="info-item">
              <div className="icon-box">
                <Mail size={24} />
              </div>
              <div className="info-content">
                <h3>Email Us</h3>
                <p>support@exovita.com</p>
                <p>partners@exovita.com</p>
              </div>
            </div>

            <div className="info-item">
              <div className="icon-box">
                <Phone size={24} />
              </div>
              <div className="info-content">
                <h3>Call Us</h3>
                <p>+91 98765 43210</p>
                <p>Mon - Fri, 9am - 6pm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="contact-form-container slide-in-right">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <label>Your Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name" 
                  required 
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label>Your Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com" 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea 
                name="message" 
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..." 
                required
              ></textarea>
            </div>

            <button type="submit" className="send-btn">
              <span>Send Message</span>
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;
