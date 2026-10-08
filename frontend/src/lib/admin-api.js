const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAdminOrders() {
  const res = await fetch(`${API_URL}/orders`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch orders");
  }

  const json = await res.json();
  return json.data;
}

export async function approveOrderApi(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to approve order");
  return json.data;
}

export async function cancelOrderApi(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to cancel order");
  return json.data;
}
export async function createProductApi(productData) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create product");
  return json.data;
}
export async function updateProductApi(id, data) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update product");
  return json.data;
}

export async function updateVariantApi(variantId, data) {
  const res = await fetch(`${API_URL}/products/variants/${variantId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update variant");
  return json.data;
}
