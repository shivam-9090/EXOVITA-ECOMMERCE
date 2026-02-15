import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Tag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import ProductReviews from "../components/ProductReviews";
import "./ProductDetails.css";

const API_URL = "http://localhost:3000/api";

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [autoAppliedCoupon, setAutoAppliedCoupon] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${id}`);
        setProduct(response.data);
        setFinalPrice(response.data.price);
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0]);
        }

        // Auto-apply coupon for logged-in users
        autoApplyBestCoupon(response.data);
        // Fetch available coupons
        fetchAvailableCoupons();
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const autoApplyBestCoupon = async (productData: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return; // Only for logged-in users

      // Check if user has already applied a coupon manually
      const hasAppliedCoupon = sessionStorage.getItem(`coupon_applied_${id}`);
      if (hasAppliedCoupon) return;

      // Fetch all active coupons
      const response = await axios.post(
        `${API_URL}/coupons/validate`,
        {
          code: "AUTO", // Special code to get best available coupon
          totalAmount: productData.price,
          productIds: [productData.id],
          categoryIds: productData.categoryId ? [productData.categoryId] : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data && response.data.isValid) {
        setCouponCode(response.data.couponCode);
        setCouponApplied(response.data);
        setFinalPrice(response.data.finalAmount);
        setAutoAppliedCoupon(true);
        // Mark that auto-apply has been done for this product
        sessionStorage.setItem(`coupon_auto_${id}`, "true");
      }
    } catch (error) {
      // Silently fail - auto-apply is a nice-to-have feature
      console.debug("No auto-apply coupon available");
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axios.get(`${API_URL}/coupons/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter coupons that are not expired and have usage left
      const activeCoupons = response.data.filter((coupon: any) => {
        const notExpired =
          !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const hasUsageLeft =
          !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        return notExpired && hasUsageLeft;
      });

      setAvailableCoupons(activeCoupons.slice(0, 5)); // Show top 5 coupons
    } catch (error) {
      console.debug("Could not fetch available coupons");
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCouponError("Please login to apply coupons");
        setCouponLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/coupons/apply`,
        {
          code: couponCode,
          totalAmount: product.price,
          productIds: [product.id],
          categoryIds: product.categoryId ? [product.categoryId] : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCouponApplied(response.data);
      setFinalPrice(response.data.finalAmount);
      setCouponError("");
      // Mark that user manually applied a coupon
      sessionStorage.setItem(`coupon_applied_${id}`, "true");
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
      setCouponApplied(null);
      setFinalPrice(product.price);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(null);
    setCouponError("");
    setFinalPrice(product.price);
    setAutoAppliedCoupon(false);
    // Clear session storage flags
    sessionStorage.removeItem(`coupon_applied_${id}`);
    sessionStorage.removeItem(`coupon_auto_${id}`);
  };

  const applySelectedCoupon = async (code: string) => {
    setCouponCode(code);
    setShowCoupons(false);
    await applyCoupon();
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading product...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <div className="product-details-container">
        <div className="product-gallery">
          <div className="main-image-container">
            <img src={mainImage} alt={product.title} className="main-image" />
          </div>
          <div className="thumbnail-list">
            {product.images.map((img: string, index: number) => (
              <img
                key={index}
                src={img}
                alt={`View ${index + 1}`}
                className={`thumbnail ${mainImage === img ? "active" : ""}`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-rating">
            <div className="stars">
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
            </div>
            <span className="review-count">
              {product.reviews?.length || 0} reviews
            </span>
          </div>

          <div className="pdp-price-section">
            {couponApplied ? (
              <>
                <div className="price-with-discount">
                  <span className="original-price">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className="discounted-price">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="savings-badge">
                  You save ₹{couponApplied.discountAmount.toFixed(2)}
                </div>
              </>
            ) : (
              <div className="pdp-price">₹{product.price.toFixed(2)}</div>
            )}
          </div>

          {/* Coupon Section */}
          <div className="coupon-section">
            <div className="coupon-input-wrapper">
              <Tag className="coupon-icon" size={20} />
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponLoading || !!couponApplied}
                className="coupon-input"
              />
              {couponApplied ? (
                <button className="coupon-btn remove" onClick={removeCoupon}>
                  Remove
                </button>
              ) : (
                <button
                  className="coupon-btn apply"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Checking..." : "Apply"}
                </button>
              )}
            </div>

            {couponError && (
              <div className="coupon-message error">
                <XCircle size={16} />
                {couponError}
              </div>
            )}

            {couponApplied && (
              <div className="coupon-message success">
                <CheckCircle size={16} />
                {autoAppliedCoupon
                  ? `Special offer applied! Coupon "${couponApplied.couponCode}" saved you ₹${couponApplied.discountAmount.toFixed(2)}!`
                  : `Coupon "${couponApplied.couponCode}" applied successfully!`}
              </div>
            )}

            {/* Available Coupons */}
            {availableCoupons.length > 0 && !couponApplied && (
              <div className="available-coupons-section">
                <button
                  className="show-coupons-btn"
                  onClick={() => setShowCoupons(!showCoupons)}
                >
                  <Tag size={16} />
                  {showCoupons ? "Hide" : "View"} Available Coupons (
                  {availableCoupons.length})
                </button>

                {showCoupons && (
                  <div className="coupons-list">
                    {availableCoupons.map((coupon: any) => (
                      <div key={coupon.id} className="coupon-card">
                        <div className="coupon-code-badge">{coupon.code}</div>
                        <div className="coupon-details">
                          <p className="coupon-discount">
                            {coupon.type === "PERCENTAGE"
                              ? `${coupon.discount}% OFF`
                              : `₹${coupon.discount} OFF`}
                          </p>
                          {coupon.description && (
                            <p className="coupon-description">
                              {coupon.description}
                            </p>
                          )}
                          {coupon.minPurchase > 0 && (
                            <p className="coupon-condition">
                              Min. purchase: ₹{coupon.minPurchase}
                            </p>
                          )}
                          {coupon.maxDiscount && (
                            <p className="coupon-condition">
                              Max discount: ₹{coupon.maxDiscount}
                            </p>
                          )}
                        </div>
                        <button
                          className="apply-coupon-btn"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            setShowCoupons(false);
                            setTimeout(() => applyCoupon(), 100);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="pdp-description">{product.description}</p>

          {product.ingredients && (
            <div className="pdp-section">
              <h3>Ingredients</h3>
              <p>{product.ingredients}</p>
            </div>
          )}

          {product.howToUse && (
            <div className="pdp-section">
              <h3>How to Use</h3>
              <p>{product.howToUse}</p>
            </div>
          )}

          <div className="pdp-options" style={{ display: "none" }}>
            <span className="option-label">Select Size</span>
            <div className="size-selector">
              {(product.sizes || []).map((size: string) => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? "active" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="pdp-actions">
            <button
              className="add-cart-btn-large"
              onClick={() => {
                // Get coupon ID if coupon is applied
                const couponId = couponApplied?.coupon?.id;
                addToCart(
                  {
                    id: product.id,
                    name: product.name,
                    title: product.name,
                    price: finalPrice,
                    image: product.thumbnail || product.images?.[0],
                    thumbnail: product.thumbnail || product.images?.[0],
                  },
                  couponId,
                );
              }}
            >
              <ShoppingBag size={20} />
              Add to Cart {couponApplied && `(₹${finalPrice.toFixed(2)})`}
            </button>
            <button className="wishlist-btn">
              <Heart size={24} />
            </button>
          </div>

          <div className="pdp-features">
            <div className="feature-item">
              <Truck size={24} />
              <div>
                <h5>Free Shipping</h5>
                <p>On all orders over $50</p>
              </div>
            </div>
            <div className="feature-item">
              <ShieldCheck size={24} />
              <div>
                <h5>2 Year Warranty</h5>
                <p>Full protection for your item</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="product-details-container">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetails;
