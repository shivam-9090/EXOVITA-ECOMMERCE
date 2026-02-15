import { useState, useEffect } from "react";
import axios from "axios";
import { Star, CheckCircle, AlertCircle, Send } from "lucide-react";
import "./ProductReviews.css";

const API_URL = "http://localhost:3000/api";

interface User {
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: User;
}

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
    fetchReviews();
    fetchRatingSummary();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/reviews/product/${productId}`,
      );
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingSummary = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/reviews/product/${productId}/summary`,
      );
      setRatingSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch rating summary:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setSubmitMessage({ type: "error", text: "Please select a rating" });
      return;
    }

    if (!comment.trim()) {
      setSubmitMessage({ type: "error", text: "Please write a comment" });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/reviews/product/${productId}`,
        {
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSubmitMessage({
        type: "success",
        text: "Review submitted successfully!",
      });

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");
      setShowForm(false);

      // Refresh reviews
      fetchReviews();
      fetchRatingSummary();
    } catch (error: any) {
      setSubmitMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    size = 18,
    interactive = false,
    onRatingChange?: (rating: number) => void,
  ) => {
    const displayRating = interactive ? hoverRating || rating : rating;

    return (
      <div className={`stars ${interactive ? "interactive" : ""}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= displayRating ? "#f59e0b" : "none"}
            stroke={star <= displayRating ? "#f59e0b" : "#d1d5db"}
            className={interactive ? "star-interactive" : ""}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPercentage = (count: number) => {
    if (!ratingSummary || ratingSummary.totalReviews === 0) return 0;
    return (count / ratingSummary.totalReviews) * 100;
  };

  return (
    <div className="product-reviews-section">
      <h2 className="reviews-title">Customer Reviews</h2>

      {/* Rating Summary */}
      {ratingSummary && (
        <div className="rating-summary">
          <div className="average-rating">
            <div className="rating-number">
              {ratingSummary.averageRating.toFixed(1)}
            </div>
            <div className="rating-stars">
              {renderStars(Math.round(ratingSummary.averageRating), 20)}
            </div>
            <div className="rating-count">
              Based on {ratingSummary.totalReviews} reviews
            </div>
          </div>

          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="distribution-row">
                <span className="star-label">{star} ★</span>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${getPercentage(ratingSummary.ratingDistribution[star])}%`,
                    }}
                  />
                </div>
                <span className="distribution-count">
                  {ratingSummary.ratingDistribution[star]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isLoggedIn && !showForm && (
        <button className="write-review-btn" onClick={() => setShowForm(true)}>
          <Send size={18} />
          Write a Review
        </button>
      )}

      {!isLoggedIn && (
        <div className="login-prompt">
          <AlertCircle size={18} />
          Please log in to write a review
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <h3>Write Your Review</h3>

          <div className="form-group">
            <label>Your Rating *</label>
            {renderStars(rating, 28, true, setRating)}
            {rating > 0 && (
              <span className="rating-text">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Review Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Your Review *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={5}
              maxLength={1000}
              required
            />
            <span className="char-count">{comment.length}/1000</span>
          </div>

          {submitMessage && (
            <div className={`submit-message ${submitMessage.type}`}>
              {submitMessage.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {submitMessage.text}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.user.firstName.charAt(0)}
                    {review.user.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="reviewer-name">
                      {review.user.firstName} {review.user.lastName}
                      {review.isVerified && (
                        <span className="verified-badge">
                          <CheckCircle size={14} /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="review-date">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating, 16)}
                </div>
              </div>

              <div className="review-content">
                {review.title && (
                  <h4 className="review-title">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
