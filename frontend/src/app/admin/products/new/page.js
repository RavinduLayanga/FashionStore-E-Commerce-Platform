"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories } from "../../../../lib/api";
import { createProductApi } from "../../../../lib/admin-api";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
  });

  const [variants, setVariants] = useState([
    { sku: "", color: "", size: "", price: 3500, stock: 10 },
  ]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        images: [{ url: formData.imageUrl, isPrimary: true, displayOrder: 1 }],
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
            <div className="col-span-2">
              <label className="block text-sm font-bold mb-2">
                Product Name
              </label>
              <input
                required
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
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
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold mb-2">
                Image URL (Unsplash/Imgur)
              </label>
              <input
                required
                type="url"
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                rows="3"
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        </div>

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
