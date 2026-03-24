"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  package: string;
  category: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, pkg?: string, qty?: number) => void;
  removeItem: (id: string, pkg: string) => void;
  updateQuantity: (id: string, pkg: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('sk_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Sync to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sk_cart', JSON.stringify(items));
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (product: any, pkg: string = 'single', qty: number = 1) => {
    console.log(`[CartContext] addToCart called for product: ${product.name} (ID: ${product.id || product._id}), quantity: ${qty}, package: ${pkg}`);
    setItems(prev => {
      const productId = product.id || product._id;
      const existing = prev.find(item => item.id === productId && item.package === pkg);
      
      if (existing) {
        // Option A: If it exists, just return the same list (no duplicates/increments as requested)
        return prev;
      }
      
      return [...prev, {
        id: productId,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || '/placeholder.png',
        price: product.price,
        package: pkg,
        category: product.category,
        quantity: qty
      }];
    });
  };

  const removeItem = (id: string, pkg: string) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.package === pkg)));
  };

  const updateQuantity = (id: string, pkg: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.package === pkg) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeItem, updateQuantity, clearCart, itemCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
