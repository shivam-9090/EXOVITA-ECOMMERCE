import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ADMIN_API_URL } from "../admin/apiBase";
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
  Navigation,
  Zap,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

const API_URL = ADMIN_API_URL;

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
    shiprocketOrderId?: string;
    shiprocketShipmentId?: string;
    awbCode?: string;
    courierName?: string;
    shiprocketStatus?: string;
  } | null;
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
      toast.error("Failed to update status");
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
      toast.success("Shipment updated successfully");
      fetchOrders();
    } catch (error) {
      console.error("Failed to update shipment:", error);
      toast.error("Failed to update shipment");
    }
  };

  const pushToShiprocket = async (orderId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/orders/admin/${orderId}/push-shiprocket`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Order pushed to Shiprocket â€” AWB will appear shortly");
      setTimeout(() => fetchOrders(), 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Shiprocket push failed");
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
            value={`â‚¹${stats.totalRevenue?.toLocaleString()}`}
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
                  {["Order", "Date", "Customer", "Total", "Payment", "Tracking / AWB", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-16 text-center text-secondary/50">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="h-16 w-16 bg-sage-50 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-secondary/30" />
                        </div>
                        <p className="text-base font-medium text-secondary">No orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-sage-50/30 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-primary">#{order.orderNumber}</span>
                        <div className="text-xs text-secondary/50 mt-0.5">{order.items.length} item{order.items.length > 1 ? "s" : ""}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-secondary/60">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-secondary">
                          {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                        </div>
                        <div className="text-xs text-secondary/50">{order.user?.email || "N/A"}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-secondary">
                        â‚¹{order.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-secondary/70">{order.payment?.method || "â€”"}</div>
                        <span className={`inline-flex mt-0.5 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                          order.payment?.status === "COMPLETED"
                            ? "bg-primary/10 text-primary-dark ring-primary/20"
                            : order.payment?.status === "PENDING"
                              ? "bg-gold/10 text-gold-dark ring-gold/20"
                              : "bg-sage-100 text-secondary/60 ring-secondary/10"
                        }`}>
                          {order.payment?.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {order.shipment?.awbCode ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Navigation size={12} className="text-sky-600 shrink-0" />
                              <span className="text-xs font-mono font-bold text-sky-700">{order.shipment.awbCode}</span>
                            </div>
                            {order.shipment?.courierName && (
                              <div className="text-xs text-secondary/50 mt-0.5">{order.shipment.courierName}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-secondary/30">â€”</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <Eye size={14} /> View
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

      {/* Detail Drawer */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateOrderStatus}
          updateShipment={updateShipment}
          pushToShiprocket={pushToShiprocket}
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
  pushToShiprocket,
}: {
  order: Order;
  onClose: () => void;
  updateStatus: (id: string, status: string) => void;
  updateShipment: (id: string, data: any) => void;
  pushToShiprocket: (id: string) => Promise<void>;
}) => {
  const [shipmentForm, setShipmentForm] = useState({
    carrier: order.shipment?.carrier || "",
    trackingNumber: order.shipment?.trackingNumber || order.shipment?.awbCode || "",
    trackingUrl: order.shipment?.trackingUrl || "",
    estimatedDelivery: order.shipment?.estimatedDelivery
      ? new Date(order.shipment.estimatedDelivery).toISOString().split("T")[0]
      : "",
  });
  const [pushingShiprocket, setPushingShiprocket] = useState(false);

  const handleShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShipment(order.id, shipmentForm);
  };

  const handlePush = async () => {
    setPushingShiprocket(true);
    try { await pushToShiprocket(order.id); } finally { setPushingShiprocket(false); }
  };

  const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const STEP_RANK: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4 };
  const rank = STEP_RANK[order.status] ?? -1;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-sage-100 bg-sage-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-secondary">#{order.orderNumber}</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${STATUS_OPTIONS.find((o) => o.value === order.status)?.color}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-secondary/50 mt-1">
              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-secondary/40 hover:text-secondary rounded-xl hover:bg-sage-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Status Timeline */}
          {!["CANCELLED", "REFUNDED"].includes(order.status) && (
            <div className="bg-sage-50/50 rounded-xl p-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-sage-200 mx-6 z-0" />
                <div className="absolute left-0 top-4 h-0.5 bg-primary z-0 mx-6 transition-all" style={{ width: `${(rank / (STEPS.length - 1)) * 100}%` }} />
                {[
                  { s: "PENDING", label: "Placed", Icon: Clock },
                  { s: "CONFIRMED", label: "Confirmed", Icon: CheckCircle2 },
                  { s: "PROCESSING", label: "Processing", Icon: Package },
                  { s: "SHIPPED", label: "Shipped", Icon: Truck },
                  { s: "DELIVERED", label: "Delivered", Icon: CheckCircle2 },
                ].map(({ s, label, Icon }, i) => {
                  const done = rank >= i;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1 z-10 relative">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${done ? "bg-primary text-white shadow-sm" : "bg-white text-secondary/30 ring-1 ring-sage-200"}`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${done ? "text-primary-dark" : "text-secondary/40"}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status + Payment row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-sage-100 shadow-sm">
              <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-2">Update Status</p>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className="block w-full rounded-lg border-0 py-2 px-3 text-sm text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-primary bg-sage-50/30"
              >
                {STATUS_OPTIONS.filter((o) => o.value !== "ALL").map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-white rounded-xl p-4 border border-sage-100 shadow-sm">
              <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-2">Payment</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-secondary">{order.payment?.method || "â€”"}</p>
                  <p className="text-xs text-secondary/50 mt-0.5">â‚¹{order.total.toLocaleString("en-IN")}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.payment?.status === "COMPLETED" ? "bg-primary/10 text-primary-dark" : "bg-gold/10 text-gold-dark"}`}>
                  {order.payment?.status || "PENDING"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer + Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sage-50/50 rounded-xl p-4">
              <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider flex items-center gap-1.5 mb-2"><User size={12} className="text-primary" /> Customer</p>
              <p className="text-sm font-bold text-secondary">{order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}</p>
              <p className="text-xs text-secondary/60 mt-0.5">{order.user?.email}</p>
              <p className="text-xs text-secondary/50 mt-0.5">{order.user?.phone || "No phone"}</p>
            </div>
            <div className="bg-sage-50/50 rounded-xl p-4">
              <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider flex items-center gap-1.5 mb-2"><MapPin size={12} className="text-primary" /> Ship To</p>
              <p className="text-xs text-secondary/80 leading-relaxed">
                {order.address.street}<br />
                {order.address.city}, {order.address.state} {order.address.zipCode}<br />
                {order.address.country}
              </p>
            </div>
          </div>

          {/* Shiprocket Panel */}
          <div className={`rounded-xl p-4 border ${order.shipment?.awbCode ? "bg-sky-50/40 border-sky-200" : "bg-white border-sage-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={12} className="text-sky-600" /> Shiprocket Tracking
              </p>
              {!order.shipment?.shiprocketOrderId && (
                <button
                  onClick={handlePush}
                  disabled={pushingShiprocket}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
                >
                  {pushingShiprocket ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {pushingShiprocket ? "Pushingâ€¦" : "Push to Shiprocket"}
                </button>
              )}
            </div>
            {order.shipment?.awbCode ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-secondary/50 font-semibold">AWB Code</p>
                  <p className="font-mono font-bold text-sky-700 mt-0.5">{order.shipment.awbCode}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary/50 font-semibold">Courier</p>
                  <p className="font-semibold text-secondary mt-0.5">{order.shipment.courierName || "â€”"}</p>
                </div>
                {order.shipment.shiprocketStatus && (
                  <div>
                    <p className="text-xs text-secondary/50 font-semibold">Shiprocket Status</p>
                    <p className="font-medium text-secondary mt-0.5">{order.shipment.shiprocketStatus}</p>
                  </div>
                )}
                {order.shipment.trackingUrl && (
                  <div className="col-span-2">
                    <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700">
                      <ExternalLink size={12} /> Track on Shiprocket
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-secondary/50">
                Not yet pushed. Mark order as <strong>Confirmed</strong> to auto-push, or click the button above to push manually.
              </p>
            )}
          </div>

          {/* Order Items */}
          <div>
            <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-3">Order Items</p>
            <div className="rounded-xl overflow-hidden border border-sage-100">
              <table className="min-w-full divide-y divide-sage-100">
                <thead className="bg-sage-50/60">
                  <tr>
                    {["Product", "Price", "Qty", "Total"].map((h) => (
                      <th key={h} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-secondary/50 ${h !== "Product" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100 bg-white">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-sage-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={item.product.thumbnail} alt="" className="h-9 w-9 rounded-lg object-cover border border-sage-100 shrink-0" />
                          <span className="text-sm font-medium text-secondary">{item.product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-secondary/70">â‚¹{item.price.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-sm text-secondary/70">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-secondary">â‚¹{item.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="divide-y divide-sage-100 border-t border-sage-100 bg-sage-50/40">
                  {[{ label: "Subtotal", value: order.subtotal }, { label: "Shipping", value: order.shippingCost }, { label: "Tax (GST)", value: order.tax }].map((r) => (
                    <tr key={r.label}>
                      <td colSpan={3} className="px-4 py-2 text-right text-xs text-secondary/50 font-semibold uppercase tracking-wider">{r.label}</td>
                      <td className="px-4 py-2 text-right text-sm text-secondary">â‚¹{r.value.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-secondary uppercase">Total</td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-primary">â‚¹{order.total.toLocaleString("en-IN")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Manual Shipment Override */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-bold text-secondary/40 uppercase tracking-wider flex items-center gap-1.5 select-none hover:text-secondary/70 transition-colors py-1">
              <ArrowRight size={12} className="group-open:rotate-90 transition-transform" /> Manual Shipment Override
            </summary>
            <form onSubmit={handleShipmentSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sage-50/50 rounded-xl p-4">
              {[
                { label: "Carrier Name", key: "carrier", placeholder: "Blue Dart, FedExâ€¦" },
                { label: "Tracking Number", key: "trackingNumber", placeholder: "AWB / tracking #" },
                { label: "Tracking URL", key: "trackingUrl", placeholder: "https://â€¦" },
                { label: "Est. Delivery", key: "estimatedDelivery", type: "date" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-secondary/60 mb-1">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={(shipmentForm as any)[f.key]}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, [f.key]: e.target.value })}
                    className="w-full rounded-lg border-0 py-2 px-3 text-sm text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-primary bg-white"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors">
                  Save Override
                </button>
              </div>
            </form>
          </details>

        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
