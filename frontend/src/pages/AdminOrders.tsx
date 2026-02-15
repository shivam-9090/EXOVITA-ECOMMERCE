import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Package,
  Search,
  Eye,
  Truck,
  Download,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

// --- Types ---
interface Order {
  id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
  items: Array<{
    id: string;
    product: {
      name: string;
      thumbnail: string;
    };
    price: number;
    quantity: number;
    total: number;
  }>;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  status: string;
  createdAt: string;
  payment: {
    method: string;
    status: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shipment?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedDelivery?: string;
  };
}

interface Stats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Orders" },
  {
    value: "PENDING",
    label: "Pending",
    color: "text-gold-dark bg-gold/10 ring-gold/20",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    color: "text-primary-dark bg-primary/10 ring-primary/20",
  },
  {
    value: "PROCESSING",
    label: "Processing",
    color: "text-secondary bg-secondary/10 ring-secondary/10",
  },
  {
    value: "SHIPPED",
    label: "Shipped",
    color: "text-secondary bg-sage-200 ring-sage-300",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    color: "text-primary bg-primary/10 ring-primary/20",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    color: "text-rose-700 bg-rose-50 ring-rose-200",
  },
  {
    value: "REFUNDED",
    label: "Refunded",
    color: "text-orange-700 bg-orange-50 ring-orange-200",
  },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter, pagination.page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/orders/admin/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          page: pagination.page,
          limit: 10,
          search: searchTerm || undefined,
        },
      });

      if (response.data) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}/orders/admin/stats/overview`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/orders/admin/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state without full refetch if possible, or refetch
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      fetchStats(); // Status change affects stats
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const updateShipment = async (orderId: string, shipmentData: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/orders/admin/${orderId}/shipment`,
        shipmentData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Shipment updated successfully");

      // We might need to refresh the selected order to see the changes properly if the backend returns the updated order
      // For now, simpler to just close or re-fetch active details if we had an endpoint for single order
    } catch (error) {
      console.error("Failed to update shipment:", error);
      alert("Failed to update shipment");
    }
  };

  const getStatusStyle = (status: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option?.color || "text-secondary bg-sage-50 ring-current/10";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-sage-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">
            Orders
          </h1>
          <p className="mt-2 text-sm text-secondary/60">
            Manage and fulfill customer orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              /* Export logic */
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm hover:bg-sage-50 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<Package className="text-primary" size={24} />}
            bg="bg-primary/10"
          />
          <StatsCard
            title="Today's Orders"
            value={stats.todayOrders}
            icon={<Calendar className="text-gold-dark" size={24} />}
            bg="bg-gold/10"
          />
          <StatsCard
            title="Pending"
            value={stats.pendingOrders}
            icon={<Clock className="text-rose-600" size={24} />}
            bg="bg-rose-50"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue?.toLocaleString()}`}
            icon={<CheckCircle2 className="text-secondary" size={24} />}
            bg="bg-secondary/10"
          />
        </div>
      )}

      {/* Filters & Table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-sage-100 p-5 sm:flex-row sm:items-center sm:justify-between bg-white">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-secondary/40" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border-0 py-2.5 pl-11 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30 hover:bg-white transition-colors"
              placeholder="Search by order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-xl border-0 py-2.5 pl-4 pr-10 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white cursor-pointer hover:bg-sage-50 transition-colors"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-100">
              <thead className="bg-sage-50/50">
                <tr>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Order
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Payment
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-8 py-5 text-right text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-8 py-16 text-center text-secondary/50"
                    >
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="h-16 w-16 bg-sage-50 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-secondary/30" />
                        </div>
                        <p className="text-lg font-medium text-secondary">
                          No orders found.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-sage-50/30 transition-colors group"
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-primary group-hover:underline">
                          #{order.orderNumber}
                        </span>
                        <div className="text-xs text-secondary/50 mt-1 font-medium">
                          {order.items.length} items
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-secondary/70">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-secondary">
                          {order.user
                            ? `${order.user.firstName} ${order.user.lastName}`
                            : "Guest"}
                        </div>
                        <div className="text-xs text-secondary/50 font-medium">
                          {order.user?.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-secondary">
                        ₹{order.total.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-secondary/80 font-medium">
                            {order.payment?.method}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset ${
                              order.payment?.status === "COMPLETED"
                                ? "bg-primary/10 text-primary-dark ring-primary/20"
                                : order.payment?.status === "PENDING"
                                  ? "bg-gold/10 text-gold-dark ring-gold/20"
                                  : "bg-sage-100 text-secondary/60 ring-secondary/10"
                            }`}
                          >
                            {order.payment?.status || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusStyle(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Details */}
        <div className="flex items-center justify-between border-t border-sage-100 bg-sage-50/30 px-6 py-4">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary/70">
                Showing page{" "}
                <span className="font-bold text-secondary">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-bold text-secondary">
                  {pagination.totalPages}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.max(1, p.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="relative inline-flex items-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-inset ring-sage-200 hover:bg-sage-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.min(p.totalPages, p.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="relative inline-flex items-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-inset ring-sage-200 hover:bg-sage-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateOrderStatus}
          updateShipment={updateShipment}
        />
      )}
    </div>
  );
};

// --- Subcomponents ---

const StatsCard = ({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
}) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
    <div className={`rounded-xl p-4 ${bg}`}>{icon}</div>
    <div>
      <p className="text-3xl font-bold text-secondary">{value}</p>
      <p className="text-sm font-medium text-secondary/60 uppercase tracking-wide mt-1">
        {title}
      </p>
    </div>
  </div>
);

const OrderDetailsModal = ({
  order,
  onClose,
  updateStatus,
  updateShipment,
}: {
  order: Order;
  onClose: () => void;
  updateStatus: (id: string, status: string) => void;
  updateShipment: (id: string, data: any) => void;
}) => {
  const [shipmentForm, setShipmentForm] = useState({
    carrier: order.shipment?.carrier || "",
    trackingNumber: order.shipment?.trackingNumber || "",
    trackingUrl: order.shipment?.trackingUrl || "",
    estimatedDelivery: order.shipment?.estimatedDelivery
      ? new Date(order.shipment.estimatedDelivery).toISOString().split("T")[0]
      : "",
  });

  const handleShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShipment(order.id, shipmentForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-secondary/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-sage-100 bg-sage-50/50">
          <div>
            <h2 className="text-xl font-bold text-secondary flex items-center gap-3">
              Order #{order.orderNumber}
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                  STATUS_OPTIONS.find((o) => o.value === order.status)?.color
                }`}
              >
                {order.status}
              </span>
            </h2>
            <p className="text-sm text-secondary/60 mt-1 font-medium">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-secondary/40 hover:text-secondary rounded-full hover:bg-sage-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer & Address */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-4">
                  <User size={16} className="text-primary" /> Customer
                </h3>
                <div className="bg-sage-50/50 rounded-xl p-5 text-sm">
                  <p className="font-bold text-secondary text-lg">
                    {order.user
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : "Guest User"}
                  </p>
                  <p className="text-secondary/70 mt-1 font-medium">
                    {order.user?.email}
                  </p>
                  <p className="text-secondary/60 mt-1">
                    {order.user?.phone || "No phone number"}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-4">
                  <MapPin size={16} className="text-primary" /> Shipping Address
                </h3>
                <div className="bg-sage-50/50 rounded-xl p-5 text-sm">
                  <p className="text-secondary/80 leading-relaxed font-medium">
                    {order.address.street}
                    <br />
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.zipCode}
                    <br />
                    {order.address.country}
                  </p>
                </div>
              </section>
            </div>

            {/* Actions & Payment */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-primary" /> Management
                </h3>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-2">
                    Update Order Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30 px-3"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== "ALL").map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-primary" /> Payment Info
                </h3>
                <div className="bg-sage-50/50 rounded-xl p-5 text-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold text-secondary">
                      {order.payment?.method || "Unknown Method"}
                    </p>
                    <p className="text-xs text-secondary/60 mt-1 font-medium">
                      Transaction ID:{" "}
                      <span className="font-mono">
                        {order.id.slice(0, 8)}...
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      order.payment?.status === "COMPLETED"
                        ? "bg-primary/10 text-primary-dark"
                        : "bg-gold/10 text-gold-dark"
                    }`}
                  >
                    {order.payment?.status}
                  </span>
                </div>
              </section>
            </div>
          </div>

          {/* Items Table */}
          <section>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">
              Order Items
            </h3>
            <div className="rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-sage-100">
                <thead className="bg-sage-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-secondary/50 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary/50 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary/50 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary/50 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100 bg-white">
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-sage-50/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.product.thumbnail}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover bg-sage-50 border border-sage-100"
                          />
                          <span className="text-sm font-semibold text-secondary">
                            {item.product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-secondary/70 font-medium">
                        ₹{item.price.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-secondary/70 font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-secondary">
                        ₹{item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-sage-50/30">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-right text-xs text-secondary/60 font-bold uppercase tracking-wider border-t border-sage-100"
                    >
                      Subtotal
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-secondary font-medium border-t border-sage-100">
                      ₹{order.subtotal.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-right text-xs text-secondary/60 font-bold uppercase tracking-wider"
                    >
                      Shipping
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-secondary font-medium">
                      ₹{order.shippingCost.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-right text-xs text-secondary/60 font-bold uppercase tracking-wider"
                    >
                      Tax
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-secondary font-medium">
                      ₹{order.tax.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-right text-base font-bold text-secondary uppercase tracking-wider border-t border-sage-200"
                    >
                      Total
                    </td>
                    <td className="px-5 py-4 text-right text-xl font-bold text-primary border-t border-sage-200">
                      ₹{order.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Shipping Form */}
          <section className="bg-sage-50/50 rounded-xl p-6">
            <h3 className="text-base font-bold text-secondary flex items-center gap-2 mb-5">
              <Truck size={20} className="text-primary" /> Shipment Details
            </h3>
            <form
              onSubmit={handleShipmentSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1.5">
                  Carrier Name
                </label>
                <input
                  type="text"
                  value={shipmentForm.carrier}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      carrier: e.target.value,
                    })
                  }
                  className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="DHL, FedEx, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1.5">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={shipmentForm.trackingNumber}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      trackingNumber: e.target.value,
                    })
                  }
                  className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="ABC123456789"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1.5">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={shipmentForm.trackingUrl}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      trackingUrl: e.target.value,
                    })
                  }
                  className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="https://track.courier.com/..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1.5">
                  Est. Delivery Date
                </label>
                <input
                  type="date"
                  value={shipmentForm.estimatedDelivery}
                  onChange={(e) =>
                    setShipmentForm({
                      ...shipmentForm,
                      estimatedDelivery: e.target.value,
                    })
                  }
                  className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  Update Info
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
