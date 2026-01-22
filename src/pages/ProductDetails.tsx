import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductDetails.css';

import hairOil1 from '../assets/hair oil/hair_oil_1.jpg';
import hairOil2 from '../assets/hair oil/hair_oil_2.png';
import hairOil3 from '../assets/hair oil/hair_oil_3.png';

const PRODUCTS_DATA: Record<string, any> = {
  '101': {
    title: "Organic Hair Growth Oil",
    price: 45.00,
    description: "Revitalize your hair with our Organic Hair Growth Oil. Enriched with natural ingredients, this potent formula stimulates follicles, strengthens roots, and promotes thicker, healthier hair growth. Perfect for all hair types.",
    rating: 4.9,
    reviews: 86,
    images: [hairOil1, hairOil2, hairOil3],
    sizes: ['30ml', '50ml', '100ml']
  }
};

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  
  const product = React.useMemo(() => {
    if (id && PRODUCTS_DATA[id]) {
      return { ...PRODUCTS_DATA[id], id };
    }
    return {
      id: id || '1',
      title: "Minimalist Classic Watch", 
      price: 129.99,
      description: "Experience the perfect blend of style and functionality...",
      rating: 4.8,
      reviews: 124,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=600"
      ],
      sizes: ['S', 'M', 'L', 'XL']
    };
  }, [id]);

  const [mainImage, setMainImage] = useState(product.images[0]);
  
  useEffect(() => {
    setMainImage(product.images[0]);
    if (product.sizes.length > 0) setSelectedSize(product.sizes[0]);
  }, [product]);

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
                className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <h1 className="pdp-title">{product.title}</h1>
          
          <div className="pdp-rating">
            <div className="stars">
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
              <Star size={18} fill="#fbca1f" color="#fbca1f" />
            </div>
            <span className="review-count">{product.reviews} reviews</span>
          </div>

          <div className="pdp-price">${product.price.toFixed(2)}</div>
          
          <p className="pdp-description">{product.description}</p>

          <div className="pdp-options">
            <span className="option-label">Select Size</span>
            <div className="size-selector">
              {product.sizes.map((size: string) => (
                <button 
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''}`}
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
              onClick={() => addToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.images[0]
              })}
            >
              <ShoppingBag size={20} />
              Add to Cart
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
    </div>
  );
};

export default ProductDetails;
