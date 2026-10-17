const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Failed to fetch categories");

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function fetchProducts(searchParams = {}) {
  try {
    const params = new URLSearchParams(searchParams);

    const res = await fetch(`${API_URL}/products?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch products");

    const json = await res.json();

    return {
      products: json.data,
      pagination: json.pagination,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], pagination: null };
  }
}

export async function fetchProduct(identifier) {
  try {
    const res = await fetch(
      `${API_URL}/products/${encodeURIComponent(identifier)}`,
      { cache: "no-store" },
    );

    if (!res.ok) throw new Error("Failed to fetch product");

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
