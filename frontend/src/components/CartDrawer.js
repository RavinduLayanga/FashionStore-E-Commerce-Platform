"use client";
import { useCart } from "../context/CartContext";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    isMounted,
  } = useCart();

  if (!isMounted) return null;

  return (
    <>
      {/* Dimmed Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-zinc-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20">
              Your cart is empty
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variant.id} className="flex gap-4">
                <div className="w-20 h-24 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0">
                  <div className="w-20 h-24 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={
                        item.product.images?.[0]?.url ||
                        item.product.primaryImage?.url ||
                        "https://placehold.co/400x500/e4e4e7/a1a1aa?text=No+Image"
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold line-clamp-2">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {item.variant.color} / {item.variant.size}
                  </p>
                  <p className="text-sm font-bold mt-2">
                    LKR {item.variant.price.toLocaleString()}
                  </p>

                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() =>
                          updateQuantity(item.variant.id, item.quantity - 1)
                        }
                        className="p-1 hover:bg-zinc-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variant.id, item.quantity + 1)
                        }
                        className="p-1 hover:bg-zinc-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variant.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-zinc-50">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span>
              <span>LKR {cartTotal.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                router.push("/checkout");
              }}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
