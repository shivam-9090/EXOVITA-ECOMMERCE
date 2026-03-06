import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { STORE_API_URL } from "../apiBase";
import "./Shop.css";
import {
  ChevronDown,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Tag,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import BotanicalBlueprintSection from "../components/BotanicalBlueprintSection";
import ShopReviewSection from "../components/ShopReviewSection";

const MEDIA = "https://api.exovitaherbal.com/media";
const collectionVideo = `${MEDIA}/our-collection/exovita.mp4`;
const collectionImg1 = `${MEDIA}/our-collection/Gemini_Generated_Image_88p17088p17088p1.png`;
const collectionImg2 = `${MEDIA}/our-collection/Gemini_Generated_Image_ktcxhuktcxhuktcx.png`;

const hairOil1 = `${MEDIA}/hair%20oil/hair_oil_1.jpg`;
const hairOil2 = `${MEDIA}/hair%20oil/hair_oil_2.png`;
const hairOil3 = `${MEDIA}/hair%20oil/hair_oil_3.png`;

const API_URL = STORE_API_URL;

const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
];

const Shop: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Hair Oil"]);
  const [selectedCategory, setSelectedCategory] = useState("Hair Oil");
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  // Product detail state for Hair Oil
  const [selectedSize, setSelectedSize] = useState("50ml");
  const [mainImage, setMainImage] = useState(hairOil1);
  const [quantity, setQuantity] = useState(1);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  // Hair Oil product from DB
  const [hairOilProduct, setHairOilProduct] = useState<any>(null);

  // Coupon states for Hair Oil PDP
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [finalPrice, setFinalPrice] = useState(350);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    // Refetch categories when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCategories();
      }
    };

    // Periodic refresh every 30 seconds to catch new categories
    const intervalId = setInterval(() => {
      fetchCategories();
    }, 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      const productsData =
        response.data.products || response.data.data || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      const categoryNames = response.data.map((cat: any) => cat.name);

      // Always include Hair Oil and keep it first
      const uniqueCategoryNames = Array.from(
        new Set(["Hair Oil", ...categoryNames]),
      );

      const sortedCategories = uniqueCategoryNames.sort(
        (a: string, b: string) => {
          if (a === "Hair Oil") return -1;
          if (b === "Hair Oil") return 1;
          return a.localeCompare(b);
        },
      );

      setCategories(sortedCategories);

      if (!sortedCategories.includes(selectedCategory)) {
        setSelectedCategory("Hair Oil");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(["Hair Oil"]); // Fallback to Hair Oil only
      setSelectedCategory("Hair Oil");
    }
  };

  // Derive Hair Oil product from fetched products and sync finalPrice
  useEffect(() => {
    const found = products.find((p) => p.category?.name === "Hair Oil");
    if (found) {
      setHairOilProduct(found);
      if (!couponApplied) {
        setFinalPrice(found.price);
      }
    }
  }, [products]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    if (!hairOilProduct) return;

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
          totalAmount: hairOilProduct.price,
          productIds: [hairOilProduct.id],
          categoryIds: hairOilProduct.categoryId
            ? [hairOilProduct.categoryId]
            : [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCouponApplied(response.data);
      setFinalPrice(response.data.finalAmount);
      setCouponError("");
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
      setCouponApplied(null);
      setFinalPrice(hairOilProduct.price);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(null);
    setCouponError("");
    setFinalPrice(hairOilProduct?.price || 350);
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    let filtered = [...products];

    // Filter by category (excluding Hair Oil which has special UI)
    if (selectedCategory !== "Hair Oil") {
      filtered = filtered.filter((p) => p.category?.name === selectedCategory);

      // Sort products
      if (sortBy === "price-asc") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc") {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === "newest") {
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    }

    return filtered;
  }, [products, selectedCategory, sortBy]);

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFilterOpen(false);
        setIsSortOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(
    (opt) => opt.value === sortBy,
  )?.label;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const backgroundImages = [collectionImg1, collectionImg2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="shop-page"
      onClick={() => mobileFilterOpen && setMobileFilterOpen(false)}
    >
      <div className="shop-header-wrapper">
        <div className="shop-header-split">
          <div className="shop-banner-video">
            <video autoPlay muted loop playsInline>
              <source src={collectionVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-overlay"></div>
          </div>
          <div className="shop-banner-visuals">
            <div className="slide-indicators">
              {backgroundImages.map((_, index) => (
                <div
                  key={index}
                  className={`slide-dot ${index === currentImageIndex ? "active" : ""}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
            <div className="banner-images-slideshow">
              {backgroundImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Natural Luxury ${index + 1}`}
                  className={`banner-slide-img ${index === currentImageIndex ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="shop-ticker-bar">
          <div className="ticker-track">
            <span className="ticker-item">100% ORGANIC INGREDIENTS</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">CRUELTY FREE</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">HANDCRAFTED LUXURY</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">SUSTAINABLE PACKAGING</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">DERMATOLOGICALLY TESTED</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">100% ORGANIC INGREDIENTS</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">CRUELTY FREE</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">HANDCRAFTED LUXURY</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">SUSTAINABLE PACKAGING</span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item">DERMATOLOGICALLY TESTED</span>
            <span className="ticker-separator">•</span>
          </div>
        </div>
      </div>

      <div className="shop-container">
        {/* Sidebar Overlay */}
        <div
          className={`sidebar-overlay ${mobileFilterOpen ? "active" : ""}`}
          onClick={() => setMobileFilterOpen(false)}
        ></div>

        {/* Sidebar Filters */}
        <aside
          className={`shop-sidebar ${mobileFilterOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sidebar-header">
            <h3>Categories</h3>
            <button
              className="close-filter"
              onClick={() => setMobileFilterOpen(false)}
            >
              &times;
            </button>
          </div>

          <div className="filter-group">
            {/* <h4>Category</h4> removed h4 as we have header now */}
            <ul>
              {categories.map((cat) => (
                <li
                  key={cat}
                  className={selectedCategory === cat ? "active" : ""}
                  onClick={() => {
                    setSelectedCategory(cat);
                    // Do not close sidebar on selection
                  }}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="shop-content">
          <div className="shop-controls">
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="sort-dropdown">
              <span>Sort by:</span>
              <div className="custom-select-wrapper">
                <div
                  className="custom-select-trigger"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  {currentSortLabel}
                  <ChevronDown className="select-icon" size={14} />
                </div>
                {isSortOpen && (
                  <div className="custom-options">
                    {SORT_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        className={`custom-option ${sortBy === opt.value ? "selected" : ""}`}
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortOpen(false);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedCategory === "Hair Oil" ? (
            // Full Product Details View for Hair Oil
            <div className="product-details-inline">
              <div className="product-details-container">
                <div className="product-gallery-detail">
                  <div className="main-image-container-detail">
                    <img
                      src={mainImage}
                      alt="EXOVITA Hair Oil - The Heritage Collection"
                      className="main-image-detail"
                    />
                  </div>
                  <div className="thumbnail-list-vertical">
                    {[hairOil1, hairOil2, hairOil3].map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`View ${index + 1}`}
                        className={`thumbnail-vertical ${mainImage === img ? "active" : ""}`}
                        onClick={() => setMainImage(img)}
                      />
                    ))}
                  </div>
                </div>

                <div className="product-info-section-detail">
                  <h1 className="pdp-title-detail">
                    EXOVITA Hair Oil- The Heritage Collection 50ml
                  </h1>

                  <div className="pdp-price-detail">
                    {couponApplied ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#999",
                            marginRight: "8px",
                            fontSize: "0.85em",
                          }}
                        >
                          Rs. {(hairOilProduct?.price || 350).toFixed(2)}
                        </span>
                        <span style={{ color: "#5c705e" }}>
                          Rs. {finalPrice.toFixed(2)} INR
                        </span>
                      </>
                    ) : (
                      <>
                        {hairOilProduct?.comparePrice && (
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#999",
                              fontSize: "0.85em",
                              marginRight: "8px",
                            }}
                          >
                            Rs. {Number(hairOilProduct.comparePrice).toFixed(2)}
                          </span>
                        )}
                        <span>Rs. {finalPrice.toFixed(2)} INR</span>
                      </>
                    )}
                  </div>

                  <div className="collapsible-sections">
                    <div className="collapsible-item">
                      <button
                        className="collapsible-header"
                        onClick={() => setDescriptionOpen(!descriptionOpen)}
                      >
                        <span>Description</span>
                        <ChevronDown
                          className={`chevron ${descriptionOpen ? "open" : ""}`}
                          size={18}
                        />
                      </button>
                      {descriptionOpen && (
                        <div className="collapsible-content">
                          <p>
                            Our Ayurvedic Hair Oil is a carefully crafted blend
                            of time-tested herbs and natural ingredients
                            inspired by traditional Ayurvedic wisdom. Enriched
                            with ingredients like neem, aloe vera, hibiscus, and
                            other powerful botanicals, this oil deeply nourishes
                            the scalp and strengthens hair from root to tip.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="collapsible-item">
                      <button
                        className="collapsible-header"
                        onClick={() => setDetailsOpen(!detailsOpen)}
                      >
                        <span>Details</span>
                        <ChevronDown
                          className={`chevron ${detailsOpen ? "open" : ""}`}
                          size={18}
                        />
                      </button>
                      {detailsOpen && (
                        <div className="collapsible-content">
                          <p>
                            Regular use helps reduce hair fall, promote healthy
                            hair growth, control dandruff, and improve overall
                            hair texture. The lightweight, non-sticky formula
                            absorbs easily into the scalp.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="collapsible-item">
                      <button
                        className="collapsible-header"
                        onClick={() => setIngredientsOpen(!ingredientsOpen)}
                      >
                        <span>Full Ingredients</span>
                        <ChevronDown
                          className={`chevron ${ingredientsOpen ? "open" : ""}`}
                          size={18}
                        />
                      </button>
                      {ingredientsOpen && (
                        <div className="collapsible-content">
                          <p>
                            Neem, Aloe Vera, Hibiscus, Amla, Bhringraj, Coconut
                            Oil, Sesame Oil, and other Ayurvedic botanicals.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="stock-indicator">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                    <span>Item is in stock</span>
                  </div>

                  <div className="coupon-section">
                    <div className="coupon-input-wrapper">
                      <Tag className="coupon-icon" size={20} />
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        disabled={couponLoading || !!couponApplied}
                        className="coupon-input"
                      />
                      {couponApplied ? (
                        <button
                          className="coupon-btn remove"
                          onClick={removeCoupon}
                        >
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
                        {`Coupon "${couponApplied.couponCode}" applied! You saved ₹${(couponApplied.discountAmount || 0).toFixed(2)}`}
                      </div>
                    )}
                  </div>

                  <div className="quantity-cart-section">
                    <div className="quantity-selector">
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        readOnly
                        className="qty-input"
                      />
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="pdp-add-to-cart"
                      onClick={() =>
                        addToCart({
                          id:
                            hairOilProduct?.id ||
                            "9cf083a0-a7d4-4622-bddd-9324244a9bc8",
                          title:
                            hairOilProduct?.name ||
                            "EXOVITA Hair Oil - The Heritage Collection",
                          price: finalPrice,
                          image: hairOil1,
                          category: "Hair Oil",
                        })
                      }
                    >
                      ADD TO CART • RS. {finalPrice.toFixed(2)} INR
                    </button>
                  </div>

                  <div className="pdp-features-list">
                    <div className="pdp-feature-item">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" />
                        <path
                          d="M2 17l10 5 10-5M2 12l10 5 10-5"
                          strokeWidth="2"
                        />
                      </svg>
                      <p>Crafted in India, where Ayurveda was born</p>
                    </div>
                    <div className="pdp-feature-item">
                      <Truck size={24} />
                      <p>India & Australia wide complimentary shipping</p>
                    </div>
                    <div className="pdp-feature-item">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path d="M12 6v6l4 2" strokeWidth="2" />
                      </svg>
                      <p>100% natural ingredients</p>
                    </div>
                    <div className="pdp-feature-item">
                      <Truck size={24} />
                      <p>
                        Shipping to Australia, India, New Zealand, Canada, USA &
                        UAE
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <BotanicalBlueprintSection />
              <ShopReviewSection />
            </div>
          ) : (
            // Regular Product Grid for Soap and Combo
            <>
              {loading ? (
                <div className="shop-loading">
                  <p>Loading products...</p>
                </div>
              ) : (
                <div className="shop-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.name}
                      price={product.price}
                      image={product.thumbnail || product.images?.[0] || ""}
                      category={product.category?.name}
                    />
                  ))}
                </div>
              )}

              {!loading && filteredProducts.length === 0 && (
                <div className="no-results">
                  <p>No products found in this category.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
