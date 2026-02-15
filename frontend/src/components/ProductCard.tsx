import React from 'react';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import './ProductCard.css';

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  image: string;
  images?: string[]; 
  category: string;
  description?: string;
  showDetails?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, price, image, category, description, showDetails }) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const inWishlist = isInWishlist(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, title, price, image, category });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ id, title, price, image, category });
    }
  };

  return (
    <Link to={`/product/${id}`} className="product-card-link">
      <div className="product-card">
        <div className="product-image-container">
          <img src={image} alt={title} className="product-image" />
          
          <div className={`wishlist-btn ${inWishlist ? 'active' : ''}`} onClick={handleWishlistToggle} role="button">
            <Heart size={18} fill={inWishlist ? "#e53935" : "none"} color={inWishlist ? "#e53935" : "#666"} />
          </div>

          <div className="add-to-cart-btn" onClick={handleAddToCart} role="button">
            <ShoppingBag size={18} />
            Add
          </div>
        </div>
        <div className="product-info">
          <span className="product-category">{category}</span>
          <h3 className="product-title">{title}</h3>
          {showDetails && description && (
            <p className="product-description">{description}</p>
          )}
          <div className="product-rating">
            <Star size={14} fill="#fbca1f" color="#fbca1f" />
            <Star size={14} fill="#fbca1f" color="#fbca1f" />
            <Star size={14} fill="#fbca1f" color="#fbca1f" />
            <Star size={14} fill="#fbca1f" color="#fbca1f" />
            <Star size={14} fill="none" color="#fbca1f" />
            <span className="rating-count">(24)</span>
          </div>
          <div className="product-price">${price.toFixed(2)}</div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
