"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cartCount, isMounted, setIsCartOpen } = useCart();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              FASHION<span className="text-zinc-400">STORE</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-600 hover:text-black transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {isMounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
