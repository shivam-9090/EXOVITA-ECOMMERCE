import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_URL = "http://localhost:3000/api";

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  name: string;
  price: number;
  image: string;
  thumbnail: string;
  quantity: number;
  category?: string;
  couponId?: string;
  couponCode?: string;
  originalPrice?: number;
  discountedPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, couponId?: string) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setItems([]);
        return;
      }

      const response = await axios.get(`${API_URL}/cart`);
      const cartItems = response.data.items.map((item: any) => ({
        id: item.id,
        productId: item.product.id,
        title: item.product.name,
        name: item.product.name,
        price: item.discountedPrice || item.originalPrice || item.product.price,
        image: item.product.thumbnail || item.product.images[0],
        thumbnail: item.product.thumbnail,
        quantity: item.quantity,
        couponId: item.couponId,
        couponCode: item.couponCode,
        originalPrice: item.originalPrice || item.product.price,
        discountedPrice: item.discountedPrice,
      }));
      setItems(cartItems);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      // Only clear items if it's an auth error or cart not found
      if (error.response?.status === 401 || error.response?.status === 404) {
        setItems([]);
      }
      // Otherwise keep existing items to prevent flickering
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const addToCart = async (product: any, couponId?: string) => {
    if (!user) {
      alert("Please log in to add items to cart");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/cart/items`, {
        productId: product.id,
        quantity: 1,
        couponId,
      });
      await fetchCart();
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      alert(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/cart/items/${id}`);
      await fetchCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return; // Prevent going below 1

    try {
      setLoading(true);
      await axios.patch(`${API_URL}/cart/items/${id}`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => {
    // If coupon is applied and quantity > 1, apply discount to only 1 item
    if (
      item.couponCode &&
      item.discountedPrice &&
      item.originalPrice &&
      item.quantity > 1
    ) {
      // 1 item with discount + remaining items at original price
      return (
        acc + item.discountedPrice + item.originalPrice * (item.quantity - 1)
      );
    }
    // Otherwise use the item price * quantity
    return acc + item.price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartTotal,
        loading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
