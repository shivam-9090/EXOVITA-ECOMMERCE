import React from 'react';
import { Star, Quote } from 'lucide-react';
import './ReviewSection.css';

const REVIEWS = [
  {
    id: 1,
    name: "Aarav Patel",
    rating: 5,
    text: "The Ayurvedic Hair Oil completely transformed my hair texture. It feels so much healthier and thicker now!",
    location: "Mumbai"
  },
  {
    id: 2,
    name: "Priya Sharma",
    rating: 5,
    text: "I love the Kesar Kesudo Soap! My skin glows differently after using it. Highly recommended for daily use.",
    location: "Delhi"
  },
  {
    id: 3,
    name: "Neha Gupta",
    rating: 4,
    text: "Excellent products with genuine natural ingredients. The packaging is eco-friendly which is a huge plus.",
    location: "Bangalore"
  }
];

const ReviewSection: React.FC = () => {
  return (
    <section className="review-section">
      <div className="review-container">
        <div className="review-header">
          <h2 className="review-title">Review</h2>
          <div className="review-divider"></div>
        </div>

        <div className="reviews-grid">
          {REVIEWS.map((review) => (
            <div key={review.id} className="review-card">
              <div className="quote-icon">
                <Quote size={32} />
              </div>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < review.rating ? "currentColor" : "none"} 
                    className={i < review.rating ? "star-filled" : "star-empty"}
                  />
                ))}
              </div>
              <p className="review-text">"{review.text}"</p>
              <div className="review-author">
                <div className="author-info">
                  <h4 className="author-name">{review.name}</h4>
                  <span className="author-location">{review.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
