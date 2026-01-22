import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import './Shop.css';
import { ChevronDown } from 'lucide-react';

import collectionVideo from '../assets/our-collection/exovita.mp4';
import collectionImg1 from '../assets/our-collection/Gemini_Generated_Image_88p17088p17088p1.png';
import collectionImg2 from '../assets/our-collection/Gemini_Generated_Image_ktcxhuktcxhuktcx.png';

import hairOil1 from '../assets/hair oil/hair_oil_1.jpg';
import hairOil2 from '../assets/hair oil/hair_oil_2.png';
import hairOil3 from '../assets/hair oil/hair_oil_3.png';

const STORE_PRODUCTS = [
  {
    id: 101,
    title: "Organic Hair Growth Oil",
    price: 45.00,
    category: "Hair Oil",
    image: hairOil1,
    images: [hairOil1, hairOil2, hairOil3]
  },
  {
    id: 102,
    title: "Lavender & Honey Soap",
    price: 12.00,
    category: "Soap",
    image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 103,
    title: "Ultra Nourish Combo Pack",
    price: 85.00,
    category: "Combo",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 104,
    title: "Charcoal Detox Soap",
    price: 14.50,
    category: "Soap",
    image: "https://images.unsplash.com/photo-1547793549-127be1d7b372?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 106,
    title: "Morning Freshness Combo",
    price: 65.00,
    category: "Combo",
    image: "https://images.unsplash.com/photo-1556228720-1987ba42654d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 108,
    title: "Oatmeal Gentle Soap",
    price: 10.00,
    category: "Soap",
    image: "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&q=80&w=600"
  }
];

const CATEGORIES = ["All", "Hair Oil", "Soap", "Combo"];
const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
];

const Shop: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileFilterOpen(false);
        setIsSortOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredProducts = useMemo(() => {
    let products = [...STORE_PRODUCTS];

    if (selectedCategory !== "All") {
      products = products.filter(p => p.category === selectedCategory);
    }

    if (sortBy === "price-asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      products.sort((a, b) => b.id - a.id);
    }

    return products;
  }, [selectedCategory, sortBy]);

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const backgroundImages = [collectionImg1, collectionImg2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="shop-page" onClick={() => mobileFilterOpen && setMobileFilterOpen(false)}>
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
                className={`slide-dot ${index === currentImageIndex ? 'active' : ''}`}
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
                  className={`banner-slide-img ${index === currentImageIndex ? 'active' : ''}`} 
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

      <div className="shop-container">
        {/* Sidebar Overlay */}
        <div 
          className={`sidebar-overlay ${mobileFilterOpen ? 'active' : ''}`}
          onClick={() => setMobileFilterOpen(false)}
        ></div>

        {/* Sidebar Filters */}
        <aside 
          className={`shop-sidebar ${mobileFilterOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sidebar-header">
            <h3>Categories</h3>
            <button className="close-filter" onClick={() => setMobileFilterOpen(false)}>&times;</button>
          </div>
          
          <div className="filter-group">
            {/* <h4>Category</h4> removed h4 as we have header now */}
            <ul>
              {CATEGORIES.map(cat => (
                <li 
                  key={cat} 
                  className={selectedCategory === cat ? 'active' : ''}
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
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
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
                    {SORT_OPTIONS.map(opt => (
                      <div 
                        key={opt.value} 
                        className={`custom-option ${sortBy === opt.value ? 'selected' : ''}`}
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

          <div className="shop-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-results">
              <p>No products found in this category.</p>
              <button onClick={() => setSelectedCategory("All")}>View All Products</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
