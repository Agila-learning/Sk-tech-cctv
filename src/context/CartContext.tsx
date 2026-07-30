import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from '../utils/storage';

type CartItem = {
  product: any;
  quantity: number;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await SecureStore.getItemAsync('sk_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Sanitize: Only keep items with a valid 24-character hex ID (MongoDB ObjectId), name, and price
        const validItems = parsed.filter((item: CartItem) => {
          const product = item.product;
          if (!product) return false;
          
          const isValidId = product._id && typeof product._id === 'string' && product._id.length === 24;
          const hasName = product.name && typeof product.name === 'string';
          const hasPrice = typeof product.price === 'number';
          
          return isValidId && hasName && hasPrice;
        });

        setCart(validItems);
        
        // Update storage immediately if we stripped invalid items
        if (parsed.length !== validItems.length) {
          await SecureStore.setItemAsync('sk_cart', JSON.stringify(validItems));
        }
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
  };

  const saveCart = async (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      await SecureStore.setItemAsync('sk_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  };

  const addToCart = (product: any, quantity = 1) => {
    const existing = cart.find(item => item.product._id === product._id);
    if (existing) {
      saveCart(cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      saveCart([...cart, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    saveCart(cart.map(item => item.product._id === productId ? { ...item, quantity } : item));
  };

  const clearCart = async () => {
    await saveCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
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
