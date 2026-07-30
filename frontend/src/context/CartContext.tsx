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
    const savedCart = localStorage.getItem('sk_tech_cctv_cart_v1');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Sanitize: Only keep items with a valid 24-character hex ID (MongoDB ObjectId), name, and price
        const validItems = parsed.filter((item: any) => {
          const isValidId = item.id && typeof item.id === 'string' && item.id.length === 24;
          const hasName = item.name && typeof item.name === 'string';
          const hasPrice = typeof item.price === 'number';
          return isValidId && hasName && hasPrice;
        });
        setItems(validItems);
        
        // Update storage immediately if we stripped invalid items
        if (parsed.length !== validItems.length) {
          localStorage.setItem('sk_tech_cctv_cart_v1', JSON.stringify(validItems));
        }
      } catch (e: any) {
        console.error("Failed to parse cart:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Sync to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sk_tech_cctv_cart_v1', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const [isAdding, setIsAdding] = useState(false);

  const addToCart = (product: any, pkg: string = 'single', qty: number = 1) => {
    if (isAdding) return;
    setIsAdding(true);
    
    console.log(`[CartContext] addToCart: ${product.name} (Pkg: ${pkg})`);
    
    setItems(prev => {
      const productId = product.id || product._id;
      const existingIndex = prev.findIndex(item => item.id === productId && item.package === pkg);
      
      if (existingIndex > -1) {
        // Increment Quantity
        const newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + qty
        };
        return newItems;
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

    setTimeout(() => setIsAdding(false), 500); // 500ms debounce/lock
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
