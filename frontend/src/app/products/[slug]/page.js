import { fetchProduct } from "../../../lib/api";
import ProductClient from "../../../components/ProductClient";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductClient product={product} />;
}
