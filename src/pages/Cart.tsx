import React from 'react';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './Cart.css';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const shipping = items.length > 0 ? 15.00 : 0;
  const total = cartTotal + shipping;

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <Link to="/shop" className="continue-shopping">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Shopping Cart</h1>
      
      <div className="cart-container">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.title} className="cart-item-image" />
              <div className="cart-item-info">
                <h3>{item.title}</h3>
                <p className="cart-item-price">${item.price.toFixed(2)}</p>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}><Minus size={16} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}><Plus size={16} /></button>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <button className="checkout-btn">
            Proceed to Checkout <ArrowRight size={18} />
          </button>
      </div>
    </div>
  </div>
  );
};

export default Cart;
