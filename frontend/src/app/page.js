import { fetchProducts, fetchCategories } from "../lib/api";
import ProductCard from "../components/ProductCard";

export default async function HomePage() {
  const { products } = await fetchProducts({ limit: 12 });
  const categories = await fetchCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white rounded-3xl p-8 sm:p-16 mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          The New Standard
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-8 text-lg">
          Discover our latest collection of premium quality essentials, designed
          for everyday comfort and modern style.
        </p>
        <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-zinc-200 transition">
          Shop Collection
        </button>
      </div>

      {/* Category Pills */}
      <div className="mb-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <div className="px-5 py-2 bg-black text-white rounded-full text-sm font-medium whitespace-nowrap cursor-pointer">
          All Products
        </div>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition"
          >
            {cat.name}
          </div>
        ))}
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          No products found.
        </div>
      )}
    </div>
  );
}
