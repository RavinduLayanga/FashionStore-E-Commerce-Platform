"use client";
import { useState, useMemo, useEffect } from "react";
import { useCart } from "../context/CartContext";

export default function ProductClient({ product }) {
  const { addToCart } = useCart();

  // State for image gallery and variant selection
  const [selectedImage, setSelectedImage] = useState(product.images[0]?.url);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Extract unique colors that actually have stock
  const availableColors = useMemo(() => {
    const colors = product.variants
      .filter((v) => v.isAvailable)
      .map((v) => v.color);
    return [...new Set(colors)];
  }, [product.variants]);

  // Auto-select the first available color
  useEffect(() => {
    if (!selectedColor && availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  // Extract sizes available for the currently selected color
  const availableSizes = useMemo(() => {
    return product.variants
      .filter((v) => v.color === selectedColor && v.isAvailable)
      .map((v) => v.size);
  }, [selectedColor, product.variants]);

  // Find the exact variant object based on color and size
  const selectedVariant = useMemo(() => {
    return product.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize,
    );
  }, [selectedColor, selectedSize, product.variants]);

  const handleAddToCart = () => {
    if (selectedVariant?.isAvailable) {
      addToCart(product, selectedVariant, 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-zinc-100 rounded-2xl overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img.url)}
                className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === img.url
                    ? "border-black"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.altText}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info & Variants */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
            {product.name}
          </h1>
          <p className="text-xl font-medium text-zinc-700 mb-6">
            LKR{" "}
            {selectedVariant
              ? selectedVariant.price.toLocaleString()
              : product.minPrice.toLocaleString()}
          </p>
          <p className="text-zinc-600 mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Color</h3>
            <div className="flex gap-3">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setSelectedSize(""); // Reset size when color changes
                  }}
                  className={`px-4 py-2 border rounded-full text-sm font-medium transition ${
                    selectedColor === color
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 text-zinc-700 hover:border-black"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Size</h3>
            <div className="flex gap-3">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center border rounded-lg text-sm font-medium transition ${
                    selectedSize === size
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 text-zinc-700 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
              {availableSizes.length === 0 && (
                <span className="text-sm text-red-500">
                  Out of stock in this color
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant?.isAvailable}
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedVariant?.isAvailable ? "Add to Cart" : "Select a Size"}
          </button>
        </div>
      </div>
    </div>
  );
}
