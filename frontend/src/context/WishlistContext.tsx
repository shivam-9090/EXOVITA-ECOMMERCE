import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_URL = "http://localhost:3000/api";

export interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  name: string;
  price: number;
  image: string;
  thumbnail: string;
  category: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
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

      const response = await axios.get(`${API_URL}/wishlist`);
      const wishlistItems = response.data.items.map((item: any) => ({
        id: item.id,
        productId: item.product.id,
        title: item.product.name,
        name: item.product.name,
        price: item.product.price,
        image: item.product.thumbnail || item.product.images[0],
        thumbnail: item.product.thumbnail,
        category: item.product.category?.name || "",
      }));
      setItems(wishlistItems);
    } catch (error: any) {
      console.error("Error fetching wishlist:", error);
      // Only clear items if it's an auth error or wishlist not found
      if (error.response?.status === 401 || error.response?.status === 404) {
        setItems([]);
      }
      // Otherwise keep existing items to prevent flickering
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
    }
  }, [user]);

  const addToWishlist = async (product: any) => {
    if (!user) {
      alert("Please log in to add items to wishlist");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/wishlist/${product.id}`);
      await fetchWishlist();
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      alert(error.response?.data?.message || "Failed to add to wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/wishlist/${productId}`);
      await fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount: items.length,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
