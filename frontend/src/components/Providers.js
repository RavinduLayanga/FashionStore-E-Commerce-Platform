"use client";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

export default function Providers({ children }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
