import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100 mb-4 relative">
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.altText || product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-zinc-400">
            No Image
          </div>
        )}
        {!product.hasStock && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
            SOLD OUT
          </div>
        )}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 truncate">
        {product.name}
      </h3>
      <p className="text-sm text-zinc-500 mb-1">{product.category?.name}</p>
      <p className="text-sm font-bold text-zinc-900">
        LKR {product.minPrice.toLocaleString()}
      </p>
    </Link>
  );
}
