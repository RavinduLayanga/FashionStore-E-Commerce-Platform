"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchProducts } from "../../../lib/api";
import { Plus, Package, ArrowLeft, Search } from "lucide-react";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProducts({ limit: 50 });
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products by name or category based on search input
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">Loading products...</div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="p-2 bg-white rounded-full border hover:bg-zinc-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-extrabold text-zinc-900">
            Products & Inventory
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-zinc-800 transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-200">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          {/* Search Bar Header */}
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-end">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-zinc-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-black transition"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-sm text-zinc-500 bg-zinc-50">
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold hidden sm:table-cell">
                  Category
                </th>
                <th className="p-4 font-semibold">Price Range</th>
                <th className="p-4 font-semibold text-center">Stock</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">
                    {searchTerm
                      ? `No products found matching "${searchTerm}".`
                      : "No products found."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                        {product.primaryImage && (
                          <img
                            src={product.primaryImage.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-semibold text-sm line-clamp-1">
                        {product.name}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-600 hidden sm:table-cell">
                      {product.category?.name}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {product.minPrice === product.maxPrice
                        ? `LKR ${product.minPrice?.toLocaleString()}`
                        : `LKR ${product.minPrice?.toLocaleString()} - ${product.maxPrice?.toLocaleString()}`}
                    </td>
                    <td className="p-4 text-sm text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${product.totalAvailableStock < 10 ? "text-red-600" : "text-green-600"}`}
                      >
                        <Package className="w-4 h-4" />{" "}
                        {product.totalAvailableStock}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-block px-4 py-1.5 bg-zinc-100 text-zinc-700 font-bold rounded-lg text-sm hover:bg-zinc-200 transition"
                      >
                        Edit & Inventory
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
