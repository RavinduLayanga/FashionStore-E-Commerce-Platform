"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  fetchAdminOrders,
  approveOrderApi,
  cancelOrderApi,
} from "../../../lib/admin-api";
import { LogOut, CheckCircle, XCircle, Eye, X, Search } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [processingId, setProcessingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null);

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

  const executeApprove = async (orderId) => {
    setConfirmDialog(null);
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

  const executeCancel = async (orderId) => {
    setConfirmDialog(null);
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

  const promptApprove = (orderId) => {
    setConfirmDialog({
      title: "Confirm Order",
      message:
        "Are you sure you want to manually confirm this order? This will finalize the inventory.",
      isDestructive: false,
      onConfirm: () => executeApprove(orderId),
    });
  };

  const promptCancel = (orderId) => {
    setConfirmDialog({
      title: "Cancel Order",
      message:
        "Are you sure you want to cancel this order? This will release the reserved inventory back to the storefront. This action cannot be undone.",
      isDestructive: true,
      onConfirm: () => executeCancel(orderId),
    });
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

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [orders, searchTerm]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
              >
                Go Back
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 font-bold text-white rounded-lg transition ${confirmDialog.isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-zinc-800"}`}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal (Same as before) */}
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
                  <span className="font-semibold text-zinc-900">Phone:</span>{" "}
                  {selectedOrder.customerPhone}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">City:</span>{" "}
                  {selectedOrder.city}
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
                  onClick={() => promptApprove(selectedOrder.id)}
                  className="bg-black text-white px-5 py-2 rounded-lg font-bold hover:bg-zinc-800 transition"
                >
                  Confirm Order
                </button>
              )}
              {(selectedOrder.status === "PENDING_APPROVAL" ||
                selectedOrder.status === "PENDING_PAYMENT") && (
                <button
                  onClick={() => promptCancel(selectedOrder.id)}
                  className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg font-bold hover:bg-red-100 transition"
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
        <div className="flex gap-6 items-center">
          <Link
            href="/admin/products"
            className="text-sm font-bold text-zinc-600 hover:text-black"
          >
            Manage Products
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-600 hover:text-black font-medium transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
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
            Action Required
          </p>
          <p className="text-3xl font-extrabold text-blue-600">
            {stats.pendingCount}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-zinc-900">Recent Orders</h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-zinc-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-black transition"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-sm text-zinc-500 bg-white">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-zinc-500">
                    No orders match your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
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
                        className={`px-2 py-1 rounded-md ${order.paymentMethod === "PAYHERE" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
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
                          onClick={() => promptApprove(order.id)}
                          disabled={processingId === order.id}
                          className="inline-flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" /> Confirm
                        </button>
                      )}

                      {(order.status === "PENDING_APPROVAL" ||
                        order.status === "PENDING_PAYMENT") && (
                        <button
                          onClick={() => promptCancel(order.id)}
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
