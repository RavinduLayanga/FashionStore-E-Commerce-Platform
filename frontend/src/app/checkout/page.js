"use client";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, isMounted } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "WHATSAPP",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [payhereData, setPayhereData] = useState(null);
  const payhereFormRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

    const payload = {
      ...formData,
      items: cart.map((item) => ({
        variantId: item.variant.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const specificErrors = data.errors
          ? data.errors
              .map((e) => e.message || `${e.field} is invalid`)
              .join(" | ")
          : null;
        throw new Error(
          specificErrors || data.message || "Failed to place order",
        );
      }

      setSuccess(true);

      if (formData.paymentMethod === "WHATSAPP") {
        clearCart();
        const orderNumber = data.data.orderNumber;

        let text = `*NEW ORDER* - ${orderNumber}\n\n`;
        text += `*Customer:*\nName: ${formData.customerName}\nPhone: ${formData.phone}\nAddress: ${formData.address}\nCity: ${formData.city}\n\n`;
        text += `*Items:*\n`;

        cart.forEach((item, index) => {
          text += `${index + 1}. ${item.product.name}\n`;
          text += `   Color: ${item.variant.color}\n`;
          text += `   Size: ${item.variant.size}\n`;
          text += `   Quantity: ${item.quantity}\n`;
          text += `   Price: LKR ${(item.variant.price * item.quantity).toLocaleString()}\n\n`;
        });

        text += `*Total:* LKR ${cartTotal.toLocaleString()}\n\n`;
        text += `Please confirm this order.`;

        const shopWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        const whatsappUrl = `https://wa.me/${shopWhatsAppNumber}?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, "_blank");
      } else if (formData.paymentMethod === "PAYHERE") {
        setPayhereData(data.payhereConfig);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  if (!isMounted) return null;

  if (success) {
    // Dynamic PayHere Action URL
    const payhereActionUrl =
      process.env.NEXT_PUBLIC_PAYHERE_CHECKOUT_URL ||
      "https://sandbox.payhere.lk/pay/checkout";

    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ✓
        </div>

        {formData.paymentMethod === "WHATSAPP" ? (
          <>
            <h1 className="text-4xl font-extrabold mb-4">Order Received!</h1>
            <p className="text-zinc-600 text-lg mb-8">
              Your order has been reserved for 30 minutes. We'll contact you
              shortly to confirm payment.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition"
            >
              Continue Shopping
            </button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold mb-4">
              Redirecting to PayHere...
            </h1>
            <p className="text-zinc-600 text-lg mb-8">
              Please wait while we transfer you to our secure payment gateway.
            </p>

            {/* Dynamic PayHere Form */}
            {payhereData && (
              <form
                ref={payhereFormRef}
                method="post"
                action={payhereActionUrl}
              >
                <input
                  type="hidden"
                  name="merchant_id"
                  value={payhereData.merchant_id}
                />
                <input
                  type="hidden"
                  name="return_url"
                  value={payhereData.return_url}
                />
                <input
                  type="hidden"
                  name="cancel_url"
                  value={payhereData.cancel_url}
                />
                <input
                  type="hidden"
                  name="notify_url"
                  value={payhereData.notify_url}
                />
                <input
                  type="hidden"
                  name="order_id"
                  value={payhereData.order_id}
                />
                <input type="hidden" name="items" value={payhereData.items} />
                <input
                  type="hidden"
                  name="currency"
                  value={payhereData.currency}
                />
                <input type="hidden" name="amount" value={payhereData.amount} />
                <input
                  type="hidden"
                  name="first_name"
                  value={payhereData.first_name}
                />
                <input
                  type="hidden"
                  name="last_name"
                  value={payhereData.last_name}
                />
                <input type="hidden" name="email" value={payhereData.email} />
                <input type="hidden" name="phone" value={payhereData.phone} />
                <input
                  type="hidden"
                  name="address"
                  value={payhereData.address}
                />
                <input type="hidden" name="city" value={payhereData.city} />
                <input
                  type="hidden"
                  name="country"
                  value={payhereData.country}
                />
                <input type="hidden" name="hash" value={payhereData.hash} />
              </form>
            )}
          </>
        )}
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 font-semibold hover:underline"
        >
          Go back to store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-8 text-sm">
        <strong className="block mb-1 text-base">⚠️ Demo Environment</strong>
        This is a technical showcase. No real transactions will be processed,
        and no items will be shipped.
        <b>
          {" "}
          Please do not enter real credit card numbers or personal data.
        </b>{" "}
        Use the PayHere test credentials if testing the gateway.
      </div>

      <h1 className="text-3xl font-extrabold text-zinc-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Contact Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                name="customerName"
                placeholder="Full Name"
                onChange={handleInputChange}
                className="col-span-2 sm:col-span-1 border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none"
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email Address"
                onChange={handleInputChange}
                className="col-span-2 sm:col-span-1 border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none"
              />
              <input
                required
                name="phone"
                placeholder="Phone Number"
                onChange={handleInputChange}
                className="col-span-2 border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold border-b pb-2">
              Shipping Address
            </h2>
            <input
              required
              name="address"
              placeholder="Street Address"
              onChange={handleInputChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none"
            />
            <input
              required
              name="city"
              placeholder="City"
              onChange={handleInputChange}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold border-b pb-2">Payment Method</h2>
            <div className="flex gap-4">
              <label
                className={`flex-1 border p-4 rounded-xl cursor-pointer transition ${formData.paymentMethod === "WHATSAPP" ? "border-black bg-zinc-50 ring-1 ring-black" : "hover:border-zinc-400"}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WHATSAPP"
                  checked={formData.paymentMethod === "WHATSAPP"}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <span className="block font-bold">WhatsApp Order</span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Manual payment
                </span>
              </label>
              <label
                className={`flex-1 border p-4 rounded-xl cursor-pointer transition ${formData.paymentMethod === "PAYHERE" ? "border-black bg-zinc-50 ring-1 ring-black" : "hover:border-zinc-400"}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="PAYHERE"
                  checked={formData.paymentMethod === "PAYHERE"}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <span className="block font-bold">Credit Card</span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Via PayHere
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition disabled:opacity-50"
          >
            {isSubmitting
              ? "Processing..."
              : `Place Order • LKR ${cartTotal.toLocaleString()}`}
          </button>
        </form>

        {/* Right: Order Summary */}
        <div className="bg-zinc-50 p-6 rounded-2xl h-fit border">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div
                key={item.variant.id}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-white rounded overflow-hidden border">
                    <div className="w-16 h-20 bg-white rounded overflow-hidden border">
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
                  <div>
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.variant.color} / {item.variant.size} x{" "}
                      {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-sm">
                  LKR {(item.variant.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>LKR {cartTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
