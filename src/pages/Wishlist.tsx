import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import './Wishlist.css';
import { Link } from 'react-router-dom';

const Wishlist: React.FC = () => {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="wishlist-empty">
        <h2>Your wishlist is empty</h2>
        <p>Start adding items you love!</p>
        <Link to="/shop" className="btn-shop">Browse Shop</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <p className="item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
      </div>
      <div className="wishlist-container">
        <div className="wishlist-grid">
          {items.map(item => (
            <ProductCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
