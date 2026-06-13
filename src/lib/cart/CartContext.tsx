'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  colour?: { name: string; hex_code: string };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, colour?: { name: string; hex_code: string }) => void;
  updateQuantity: (id: string, quantity: number, colour?: { name: string; hex_code: string }) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    localStorage.removeItem('2dtoy_cart'); // remove old key from previous project
    const storedCart = localStorage.getItem('noys3d_cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from local storage', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('noys3d_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  // Clear the cart when a user logs out (dispatched by useAuth.logout) so
  // cart contents never leak to the next person on a shared device.
  useEffect(() => {
    const handleLogout = () => setItems([]);
    window.addEventListener('noys-logout', handleLogout);
    return () => window.removeEventListener('noys-logout', handleLogout);
  }, []);

  const addToCart = (newItem: CartItem) => {
    setItems((currentItems) => {
      const isSameEntry = (item: CartItem) =>
        item.id === newItem.id && (item.colour?.name ?? '') === (newItem.colour?.name ?? '');
      const existingItem = currentItems.find(isSameEntry);
      if (existingItem) {
        return currentItems.map(item =>
          isSameEntry(item)
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      }
      return [...currentItems, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const removeFromCart = (id: string, colour?: { name: string; hex_code: string }) => {
    setItems((currentItems) => currentItems.filter(item => {
      if (item.id !== id) return true;
      if (colour) return (item.colour?.name ?? '') !== colour.name;
      return false;
    }));
  };

  const updateQuantity = (id: string, quantity: number, colour?: { name: string; hex_code: string }) => {
    setItems((currentItems) =>
      currentItems.map(item => {
        if (item.id !== id) return item;
        if (colour && (item.colour?.name ?? '') !== colour.name) return item;
        return { ...item, quantity: Math.max(1, quantity) };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
