"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories } from "../../../../lib/api";
import { createProductApi } from "../../../../lib/admin-api";
import { Plus, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
  });

  // Dynamic state for multiple images
  const [images, setImages] = useState([""]);

  const [variants, setVariants] = useState([
    { sku: "", color: "", size: "", price: 3500, stock: 10 },
  ]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data || []);
      } catch (err) {
        setError("Failed to load categories. Please refresh the page.");
      }
    };
    loadCategories();
  }, []);

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImage = (index, url) => {
    setImages((prev) => prev.map((img, i) => (i === index ? url : img)));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty URLs and format for the backend
      const validImages = images
        .filter((url) => url.trim() !== "")
        .map((url, index) => ({
          url: url.trim(),
          isPrimary: index === 0, // First image is always primary
          displayOrder: index + 1,
        }));

      if (validImages.length === 0) {
        throw new Error("At least one valid image URL is required.");
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        images: validImages,
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
        })),
      };

      await createProductApi(payload);
      router.push("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border hover:bg-zinc-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-zinc-900">
          Add New Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Basic Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold mb-2">
                Product Name
              </label>
              <input
                required
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold mb-2">Category</label>
              <select
                required
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                rows="3"
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Dynamic Images Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex justify-between items-center border-b pb-2 mb-6">
            <h2 className="text-xl font-bold">Product Images</h2>
            <button
              type="button"
              onClick={() => setImages([...images, ""])}
              className="text-sm font-bold bg-zinc-100 px-3 py-2 rounded-lg hover:bg-zinc-200 flex items-center gap-1 transition"
            >
              <ImageIcon className="w-4 h-4" /> Add Another Image
            </button>
          </div>
          <div className="space-y-4">
            {images.map((url, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 mb-1">
                    {i === 0
                      ? "Primary Image URL"
                      : `Additional Image URL ${i + 1}`}
                  </label>
                  <input
                    required={i === 0}
                    type="url"
                    placeholder="https://..."
                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    value={url}
                    onChange={(e) => updateImage(i, e.target.value)}
                  />
                </div>
                {url && (
                  <div className="w-16 h-16 bg-zinc-100 rounded-lg border overflow-hidden mt-5 flex-shrink-0">
                    <img
                      src={url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="mt-5 p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Variants Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex justify-between items-center border-b pb-2 mb-6">
            <h2 className="text-xl font-bold">Inventory Variants</h2>
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { sku: "", color: "", size: "", price: 3500, stock: 10 },
                ])
              }
              className="text-sm font-bold bg-zinc-100 px-3 py-2 rounded-lg hover:bg-zinc-200 flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {variants.map((v, i) => (
              <div
                key={i}
                className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end p-4 border rounded-xl bg-zinc-50 relative"
              >
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-zinc-500">SKU</label>
                  <input
                    required
                    className="w-full border p-2.5 rounded-lg outline-none"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, "sku", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-zinc-500">
                    Color
                  </label>
                  <input
                    required
                    className="w-full border p-2.5 rounded-lg outline-none"
                    value={v.color}
                    onChange={(e) => updateVariant(i, "color", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-zinc-500">
                    Size
                  </label>
                  <input
                    required
                    className="w-full border p-2.5 rounded-lg outline-none"
                    value={v.size}
                    onChange={(e) => updateVariant(i, "size", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-zinc-500">
                    Price
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border p-2.5 rounded-lg outline-none"
                    value={v.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-zinc-500">
                    Stock
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border p-2.5 rounded-lg outline-none"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                  />
                </div>

                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="col-span-2 sm:col-span-1 p-2.5 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition"
                  >
                    <Trash2 className="w-5 h-5" />{" "}
                    <span className="sm:hidden ml-2 font-bold">Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
