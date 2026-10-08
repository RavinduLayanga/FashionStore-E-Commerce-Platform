import { fetchProducts, fetchCategories } from "../lib/api";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function HomePage({ searchParams }) {
  // Extract search and category from the URL, defaulting to empty
  const currentCategory = searchParams?.category || "";
  const currentSearch = searchParams?.search || "";
  const currentPage = parseInt(searchParams?.page || "1", 10);

  const { products } = await fetchProducts(searchParams);
  const categories = await fetchCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white rounded-3xl p-8 sm:p-16 mb-12 text-center relative overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 relative z-10">
          The New Standard
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-8 text-lg relative z-10">
          Discover our latest collection of premium quality essentials, designed
          for everyday comfort and modern style.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
          <Link
            href="/"
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${!currentCategory ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"}`}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${currentCategory === cat.slug ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <form action="/" method="GET" className="relative w-full md:w-72">
          {currentCategory && (
            <input type="hidden" name="category" value={currentCategory} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Search products..."
            className="w-full border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-black transition"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-100">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            No products found
          </h3>
          <p className="text-zinc-500 mb-4">
            Try adjusting your search or category filter.
          </p>
          <Link href="/" className="text-black font-bold hover:underline">
            Clear all filters
          </Link>
        </div>
      )}
      {/* Pagination Controls */}
      {products.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-12 border-t pt-8">
          <Link
            href={`/?page=${Math.max(1, currentPage - 1)}${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
            className={`px-4 py-2 font-bold rounded-lg border ${currentPage === 1 ? "text-zinc-300 border-zinc-200 pointer-events-none" : "text-zinc-700 hover:bg-zinc-50"}`}
          >
            Previous
          </Link>
          <span className="text-sm font-bold text-zinc-500">
            Page {currentPage}
          </span>
          <Link
            href={`/?page=${currentPage + 1}${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
            className={`px-4 py-2 font-bold rounded-lg border text-zinc-700 hover:bg-zinc-50 ${products.length < 12 ? "pointer-events-none opacity-50" : ""}`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
