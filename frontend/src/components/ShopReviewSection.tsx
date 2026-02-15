import React, { useState } from 'react';
import './ShopReviewSection.css';
import { Star } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  verified: boolean;
  rating: 5;
  date: string;
  comment: string;
  hasPhoto?: boolean;
}

const ShopReviewSection: React.FC = () => {
  const [sortBy, setSortBy] = useState('most-recent');

  const reviews: Review[] = [
    {
      id: 1,
      name: "Rachel R",
      verified: true,
      rating: 5,
      date: "11/23/2025",
      comment: "I've been using Seva Hair Oil and I'm so impressed! It's reduced my dandruff, makes my scalp feel so clean, smells amazing, and even calms my nervous system. I feel less anxious due to the natural oils in this product, it's clean and I feel more relaxed every time I use it. Highly recommend you grab yourself one! Thanks for creating such an amazing product !! X"
    },
    {
      id: 2,
      name: "Tresna Kirthana",
      verified: true,
      rating: 5,
      date: "11/10/2025",
      comment: "I recently cut my hair shorter, but since using the Seva Beauty hair oil, I've already noticed a bit of length coming back! I love applying it before my hair wash, it's something my mum always did, and now it's my little self care ritual too. My hair feels so nourished and healthy after, and honestly, it just feels good. Highly recommend!"
    },
    {
      id: 3,
      name: "Anonymous",
      verified: true,
      rating: 5,
      date: "11/07/2025",
      comment: "In love! Have been using this oil for the past 4 weeks and already have noticed less shedding and more shine ❤️"
    },
    {
      id: 4,
      name: "Riddhi K Mistry",
      verified: true,
      rating: 5,
      date: "10/31/2025",
      comment: "This hair oil is absolutely amazing! I've noticed significant reduction in hair fall and my hair feels so much healthier and shinier. The natural ingredients really make a difference!"
    }
  ];

  const ratingBreakdown = [
    { stars: 5, count: 15, percentage: 100 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 }
  ];

  const totalReviews = 15;
  const averageRating = 5.0;

  const renderStars = (rating: number) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#2C5F2D' : 'none'}
            stroke={star <= rating ? '#2C5F2D' : '#d1d5db'}
            strokeWidth={1.5}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="shop-review-section">
      <div className="review-container">
        <h2 className="review-main-title">Customer Reviews</h2>

        <div className="review-summary-grid">
          {/* Left: Overall Rating */}
          <div className="rating-overview">
            <div className="rating-stars-large">
              {renderStars(5)}
            </div>
            <div className="rating-score">
              <span className="score-number">{averageRating.toFixed(1)}</span>
              <span className="score-text"> out of 5</span>
            </div>
            <div className="rating-count">
              Based on {totalReviews} reviews
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="verified-icon">
                <circle cx="8" cy="8" r="7" fill="#10b981" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>

          {/* Right: Rating Breakdown */}
          <div className="rating-breakdown">
            {ratingBreakdown.map((item) => (
              <div key={item.stars} className="breakdown-row">
                <div className="breakdown-stars">
                  {renderStars(item.stars)}
                </div>
                <div className="breakdown-bar-wrapper">
                  <div 
                    className="breakdown-bar-fill" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="breakdown-count">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Photos Section */}
        <div className="customer-photos-section">
          <h3 className="photos-title">Customer photos & videos</h3>
          <div className="photos-grid">
            <div className="photo-placeholder">
              <img 
                src="https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=200&h=200&fit=crop" 
                alt="Customer photo" 
              />
            </div>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="review-sort-wrapper">
          <label htmlFor="review-sort" className="sort-label">Sort by:</label>
          <select 
            id="review-sort"
            className="review-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="most-recent">Most Recent</option>
            <option value="highest-rating">Highest Rating</option>
            <option value="lowest-rating">Lowest Rating</option>
            <option value="most-helpful">Most Helpful</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-stars-row">
                  {renderStars(review.rating)}
                </div>
                <div className="review-date">{review.date}</div>
              </div>
              
              <div className="review-author">
                <div className="author-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#E5E7EB"/>
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#9CA3AF"/>
                  </svg>
                </div>
                <span className="author-name">{review.name}</span>
                {review.verified && (
                  <span className="verified-badge">Verified</span>
                )}
              </div>

              <p className="review-comment">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopReviewSection;
