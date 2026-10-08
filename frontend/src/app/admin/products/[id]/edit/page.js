"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories } from "../../../../../lib/api";
import {
  fetchAdminProductApi,
  updateProductApi,
  updateVariantApi,
} from "../../../../../lib/admin-api";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

export default function EditProductPage({ params }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBase, setSavingBase] = useState(false);
  const [savingVariantId, setSavingVariantId] = useState(null);
  const [error, setError] = useState(null);

  // Custom Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000); // Auto-hide after 3 seconds
  };

  // Form states
  const [baseDetails, setBaseDetails] = useState({
    name: "",
    description: "",
    categoryId: "",
    isActive: true,
  });

  // New: Image and Variant States
  const [images, setImages] = useState([""]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          fetchAdminProductApi(params.id),
          fetchCategories(),
        ]);

        if (!prodData) throw new Error("Product not found");

        setProduct(prodData);
        setCategories(catData || []);

        setBaseDetails({
          name: prodData.name,
          description: prodData.description || "",
          categoryId: prodData.category.id,
          isActive: prodData.isActive ?? true,
        });

        // Load existing images, or give an empty box if none exist
        if (prodData.images && prodData.images.length > 0) {
          setImages(prodData.images.map((img) => img.url));
        }

        setVariants(prodData.variants || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  // Image Handlers
  const updateImage = (index, url) => {
    setImages((prev) => prev.map((img, i) => (i === index ? url : img)));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBase = async (e) => {
    e.preventDefault();
    try {
      setSavingBase(true);

      // Filter out empty URLs and format for backend
      const validImages = images
        .filter((url) => url.trim() !== "")
        .map((url, index) => ({
          url: url.trim(),
          isPrimary: index === 0,
          displayOrder: index + 1,
        }));

      await updateProductApi(product.id, {
        ...baseDetails,
        images: validImages,
      });

      showToast("Product details and images updated successfully!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingBase(false);
    }
  };

  // Variant Handlers
  const handleUpdateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const handleSaveVariant = async (index) => {
    const variant = variants[index];
    try {
      setSavingVariantId(variant.id);
      await updateVariantApi(variant.id, {
        stock: variant.stock,
        price: variant.price,
        isActive: variant.isActive,
      });
      showToast(`Variant ${variant.sku} inventory updated!`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingVariantId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading editor...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* Sleek Custom Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-black text-white" : "bg-red-600 text-white"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border hover:bg-zinc-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-zinc-900">
          Manage Product & Inventory
        </h1>
      </div>

      {/* Top Section: Edit Base Details & Images */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 mb-8">
        <h2 className="text-xl font-bold border-b pb-2 mb-4">
          Product Details
        </h2>
        <form onSubmit={handleSaveBase} className="grid grid-cols-2 gap-6">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-bold mb-2">Product Name</label>
            <input
              required
              className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
              value={baseDetails.name}
              onChange={(e) =>
                setBaseDetails({ ...baseDetails, name: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-bold mb-2">Category</label>
            <select
              required
              className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
              value={baseDetails.categoryId}
              onChange={(e) =>
                setBaseDetails({ ...baseDetails, categoryId: e.target.value })
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              rows="3"
              className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-black"
              value={baseDetails.description}
              onChange={(e) =>
                setBaseDetails({ ...baseDetails, description: e.target.value })
              }
            />
          </div>

          {/* New Image Updating Section */}
          <div className="col-span-2 mt-4">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <label className="block text-sm font-bold text-zinc-900">
                Product Images
              </label>
              <button
                type="button"
                onClick={() => setImages([...images, ""])}
                className="text-xs font-bold bg-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-200 flex items-center gap-1 transition"
              >
                <ImageIcon className="w-3 h-3" /> Add Image
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
                      placeholder="https://images.unsplash.com/..."
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

          {/* Submit Details & Status */}
          <div className="col-span-2 flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-black"
                checked={baseDetails.isActive}
                onChange={(e) =>
                  setBaseDetails({ ...baseDetails, isActive: e.target.checked })
                }
              />
              <span className="font-bold text-zinc-900">
                Product is Active (Visible to customers)
              </span>
            </label>
            <button
              type="submit"
              disabled={savingBase}
              className="bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-zinc-800 transition disabled:opacity-50"
            >
              {savingBase ? "Saving..." : "Save Details & Images"}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Section: Variant Stock Management */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold border-b pb-2 mb-6">
          Inventory Management
        </h2>
        <div className="space-y-4">
          {variants.map((v, i) => (
            <div
              key={v.id}
              className="grid grid-cols-2 sm:grid-cols-7 gap-4 items-end p-4 border rounded-xl bg-zinc-50"
            >
              <div className="col-span-2 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500">
                  SKU / Variant
                </label>
                <div className="p-2.5 font-bold text-sm bg-zinc-200/50 rounded-lg">
                  {v.sku} ({v.color} / {v.size})
                </div>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-zinc-500">
                  Price (LKR)
                </label>
                <input
                  required
                  type="number"
                  className="w-full border p-2.5 rounded-lg outline-none"
                  value={v.price}
                  onChange={(e) =>
                    handleUpdateVariant(i, "price", e.target.value)
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-zinc-500">
                  Physical Stock
                </label>
                <input
                  required
                  type="number"
                  className="w-full border p-2.5 rounded-lg outline-none"
                  value={v.stock}
                  onChange={(e) =>
                    handleUpdateVariant(i, "stock", e.target.value)
                  }
                />
              </div>
              <div className="col-span-1 flex items-center h-full pb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-black"
                    checked={v.isActive}
                    onChange={(e) =>
                      handleUpdateVariant(i, "isActive", e.target.checked)
                    }
                  />
                  Active
                </label>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <button
                  onClick={() => handleSaveVariant(i)}
                  disabled={savingVariantId === v.id}
                  className="w-full bg-zinc-200 text-zinc-800 p-2.5 rounded-lg font-bold hover:bg-zinc-300 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
