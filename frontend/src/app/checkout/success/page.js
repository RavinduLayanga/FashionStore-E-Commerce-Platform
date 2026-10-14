"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useCart } from "../../../context/CartContext";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-32 text-center">
      <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
        ✓
      </div>
      <h1 className="text-4xl font-extrabold text-zinc-900 mb-4">
        Payment Authorized
      </h1>

      {orderId && (
        <p className="text-zinc-500 mb-8 text-lg">
          Order Reference:{" "}
          <span className="font-bold text-black">{orderId}</span>
        </p>
      )}

      <div className="bg-blue-50 border border-blue-100 text-blue-800 p-6 rounded-2xl inline-block mb-10 text-sm max-w-lg text-left">
        <strong className="block mb-2 text-base">Payment processing</strong>
        We are verifying your payment securely. Your order will be confirmed
        once our server receives and verifies the payment notification from
        PayHere.
      </div>

      <div>
        <button
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
