"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAdminOrders,
  approveOrderApi,
  cancelOrderApi,
} from "../../../lib/admin-api";
import { LogOut, CheckCircle, XCircle, Eye, X } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        router.push("/admin/login");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  const handleApprove = async (orderId) => {
    if (!confirm("Are you sure you want to manually confirm this order?"))
      return;
    try {
      setProcessingId(orderId);
      await approveOrderApi(orderId);
      await loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (
      !confirm(
        "Cancel this order and release inventory? This cannot be undone.",
      )
    )
      return;
    try {
      setProcessingId(orderId);
      await cancelOrderApi(orderId);
      await loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const stats = useMemo(() => {
    const totalSales = orders
      .filter((o) => ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    const pendingCount = orders.filter(
      (o) => o.status === "PENDING_APPROVAL" || o.status === "PENDING_PAYMENT",
    ).length;

    return { totalSales, pendingCount, totalOrders: orders.length };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-black transition"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              Order {selectedOrder.orderNumber}
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-bold text-zinc-900 mb-2 border-b pb-2">
                  Customer Details
                </h3>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Name:</span>{" "}
                  {selectedOrder.customerName}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Email:</span>{" "}
                  {selectedOrder.customerEmail}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Phone:</span>{" "}
                  {selectedOrder.customerPhone}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Address:</span>{" "}
                  {selectedOrder.address}, {selectedOrder.city}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 mb-2 border-b pb-2">
                  Order Summary
                </h3>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Date:</span>{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Method:</span>{" "}
                  {selectedOrder.paymentMethod}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Status:</span>{" "}
                  {selectedOrder.status.replace("_", " ")}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">Total:</span>{" "}
                  LKR {parseFloat(selectedOrder.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>

            <h3 className="font-bold text-zinc-900 mb-3 border-b pb-2">
              Line Items
            </h3>
            <div className="space-y-3 mb-8">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm bg-zinc-50 p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-zinc-500">
                      {item.colorSnapshot} / {item.sizeSnapshot} (x
                      {item.quantity})
                    </p>
                  </div>
                  <p className="font-bold text-zinc-900">
                    LKR {parseFloat(item.subtotal).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              {selectedOrder.status === "PENDING_APPROVAL" && (
                <button
                  onClick={() => handleApprove(selectedOrder.id)}
                  disabled={processingId === selectedOrder.id}
                  className="bg-black text-white px-5 py-2 rounded-lg font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  Confirm Order
                </button>
              )}
              {(selectedOrder.status === "PENDING_APPROVAL" ||
                selectedOrder.status === "PENDING_PAYMENT") && (
                <button
                  onClick={() => handleCancel(selectedOrder.id)}
                  disabled={processingId === selectedOrder.id}
                  className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg font-bold hover:bg-red-100 transition disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900">
          Store Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-600 hover:text-black font-medium transition"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200 font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm font-bold text-zinc-500 mb-1">
            Total Confirmed Revenue
          </p>
          <p className="text-3xl font-extrabold">
            LKR {stats.totalSales.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm font-bold text-zinc-500 mb-1">Total Orders</p>
          <p className="text-3xl font-extrabold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm font-bold text-zinc-500 mb-1">
            Action Required (Pending)
          </p>
          <p className="text-3xl font-extrabold text-blue-600">
            {stats.pendingCount}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-xl font-bold text-zinc-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-sm text-zinc-500">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition"
                  >
                    <td className="p-4 font-medium text-sm">
                      {order.orderNumber}
                    </td>
                    <td className="p-4 text-sm">
                      <p className="font-semibold text-zinc-900">
                        {order.customerName}
                      </p>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <span
                        className={`px-2 py-1 rounded-md ${order.paymentMethod === "PAYHERE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}
                      >
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm">
                      LKR {parseFloat(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          order.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "CANCELLED" ||
                                order.status === "EXPIRED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-200 transition"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>

                      {order.status === "PENDING_APPROVAL" && (
                        <button
                          onClick={() => handleApprove(order.id)}
                          disabled={processingId === order.id}
                          className="inline-flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" /> Confirm
                        </button>
                      )}

                      {(order.status === "PENDING_APPROVAL" ||
                        order.status === "PENDING_PAYMENT") && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={processingId === order.id}
                          className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
