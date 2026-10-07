"use client";
import { useRouter } from "next/navigation";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-4 py-32 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
        ✕
      </div>
      <h1 className="text-4xl font-extrabold text-zinc-900 mb-4">
        Payment Cancelled
      </h1>
      <p className="text-zinc-600 text-lg mb-8">
        Your payment was not completed. Please return to checkout if you would
        like to try again.
      </p>
      <button
        onClick={() => router.push("/checkout")}
        className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition"
      >
        Return to Checkout
      </button>
    </div>
  );
}
