import React from "react";
import { Star } from "lucide-react";
import "./ReviewSection.css";

const REVIEWS = [
  {
    id: 1,
    name: "Aarav Patel",
    rating: 5,
    text: "The Ayurvedic Hair Oil completely transformed my hair texture. It feels so much healthier and thicker now!",
    location: "Mumbai",
  },
  {
    id: 2,
    name: "Priya Sharma",
    rating: 5,
    text: "I love the Kesar Kesudo Soap! My skin glows differently after using it. Highly recommended for daily use.",
    location: "Delhi",
  },
  {
    id: 3,
    name: "Neha Gupta",
    rating: 5,
    text: "Excellent products with genuine natural ingredients. The packaging is eco-friendly which is a huge plus.",
    location: "Bangalore",
  },
];

const ReviewSection: React.FC = () => {
  return (
    <section className="review-section">
      <div className="review-container">
        <div className="review-header">
          <p className="review-subtitle">Testimonials</p>
          <h2 className="review-title">What Our Customers Say</h2>
        </div>

        <div className="reviews-grid">
          {REVIEWS.map((review) => (
            <div key={review.id} className="review-minimal-card">
              <div className="review-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? "#000" : "none"}
                    color="#000"
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="review-text">"{review.text}"</p>
              <div className="review-author">
                <h4 className="author-name">{review.name}</h4>
                <span className="author-location">{review.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
