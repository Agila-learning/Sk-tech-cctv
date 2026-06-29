"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await fetchWithAuth('/wishlist');
      setWishlist(data.map((item: any) => item._id || item));
    } catch (e) {
      console.error("Wishlist: Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('sk_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setWishlist(parsed);
      } catch (e) {
        console.error("Wishlist: Parse error:", e);
      }
    }
    setIsInitialized(true);
    
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sk_wishlist', JSON.stringify(wishlist));
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const toggleWishlist = async (id: string) => {
    // Optimistic Update
    const isRemoving = wishlist.includes(id);
    setWishlist(prev => isRemoving ? prev.filter(i => i !== id) : [...prev, id]);

    if (isAuthenticated) {
      try {
        await fetchWithAuth('/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ productId: id })
        });
      } catch (e) {
        // Rollback on error
        setWishlist(prev => isRemoving ? [...prev, id] : prev.filter(i => i !== id));
        console.error("Wishlist: Toggle error:", e);
      }
    }
  };

  const isInWishlist = (id: string) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
