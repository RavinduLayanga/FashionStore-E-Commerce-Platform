"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Load cart from LocalStorage on mount to survive page refreshes
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCart = localStorage.getItem("fashion_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to restore cart:", error);
      localStorage.removeItem("fashion_cart");
    }
  }, []);

  const addToCart = (product, variant, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        const newQuantity = Math.min(
          existing.quantity + quantity,
          variant.availableStock,
        );
        return prev.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: newQuantity }
            : item,
        );
      }
      return [...prev, { product, variant, quantity }];
    });
    setIsCartOpen(true); // Automatically open drawer when adding
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(variantId);
    setCart((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              quantity: Math.min(newQuantity, item.variant.availableStock),
            }
          : item,
      ),
    );
  };

  const removeFromCart = (variantId) => {
    setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("fashion_cart");
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.variant.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isMounted,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
