import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ADMIN_API_URL } from "../admin/apiBase";
import {
  CreditCard,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  DollarSign,
  XCircle,
  Banknote,
  Smartphone,
  Filter,
  User,
  Package,
  Calendar,
  Hash,
  BadgeCheck,
} from "lucide-react";

const API_URL = ADMIN_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  paymentGateway: string | null;
  metadata: Record<string, any> | null;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    } | null;
  };
}

interface Stats {
  totalPayments: number;
  completed: number;
  failed: number;
  pending: number;
  todayCompleted: number;
  monthCompleted: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  razorpayCount: number;
  razorpayRevenue: number;
  codCount: number;
  codRevenue: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  {
    value: "COMPLETED",
    label: "Completed",
    color: "text-primary bg-primary/10 ring-primary/20",
  },
  {
    value: "PENDING",
    label: "Pending",
    color: "text-gold-dark bg-gold/10 ring-gold/20",
  },
  {
    value: "FAILED",
    label: "Failed",
    color: "text-rose-700 bg-rose-50 ring-rose-200",
  },
  {
    value: "REFUNDED",
    label: "Refunded",
    color: "text-orange-700 bg-orange-50 ring-orange-200",
  },
];

const METHOD_FILTERS = [
  { value: "ALL", label: "All Methods" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "COD", label: "Cash on Delivery" },
];

const ADMIN_STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Mark Completed" },
  { value: "FAILED", label: "Mark Failed" },
  { value: "REFUNDED", label: "Mark Refunded" },
  { value: "PENDING", label: "Mark Pending" },
];

// ─── Helper utils ─────────────────────────────────────────────────────────────

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const statusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-primary bg-primary/10 ring-1 ring-primary/20";
    case "PENDING":
      return "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gold-dark bg-gold/10 ring-1 ring-gold/20";
    case "FAILED":
      return "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-rose-700 bg-rose-50 ring-1 ring-rose-200";
    case "REFUNDED":
      return "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-orange-700 bg-orange-50 ring-1 ring-orange-200";
    default:
      return "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-secondary/60 bg-secondary/10 ring-1 ring-secondary/10";
  }
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 size={12} />;
    case "PENDING":
      return <Clock size={12} />;
    case "FAILED":
      return <XCircle size={12} />;
    case "REFUNDED":
      return <RefreshCw size={12} />;
    default:
      return null;
  }
};

const MethodIcon = ({ method }: { method: string }) =>
  method === "RAZORPAY" ? (
    <Smartphone size={14} className="text-primary" />
  ) : (
    <Banknote size={14} className="text-secondary/60" />
  );

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const authHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/payments/admin/all`, {
        headers: authHeader(),
        params: {
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          method: methodFilter !== "ALL" ? methodFilter : undefined,
          search: searchTerm || undefined,
          page: pagination.page,
          limit: pagination.limit,
        },
      });
      setPayments(res.data.payments || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, searchTerm, pagination.page]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await axios.get(`${API_URL}/payments/admin/stats`, {
        headers: authHeader(),
      });
      setStats(res.data);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [statusFilter, methodFilter, pagination.page]);

  useEffect(() => {
    const t = setTimeout(() => fetchPayments(), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const openDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setSelectedPayment(null);
      const res = await axios.get(`${API_URL}/payments/admin/${id}`, {
        headers: authHeader(),
      });
      setSelectedPayment(res.data);
      setAdminNote((res.data.metadata as any)?.adminNote || "");
    } catch {
      toast.error("Failed to load payment details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedPayment) return;
    try {
      setUpdatingStatus(true);
      await axios.patch(
        `${API_URL}/payments/admin/${selectedPayment.id}/status`,
        { status: newStatus, note: adminNote },
        { headers: authHeader() },
      );
      toast.success(`Payment marked as ${newStatus.toLowerCase()}`);
      setSelectedPayment({ ...selectedPayment, status: newStatus });
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id ? { ...p, status: newStatus } : p,
        ),
      );
      fetchStats();
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Payments
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Monitor all transactions, revenue, and payment health.
          </p>
        </div>
        <button
          onClick={() => {
            fetchPayments();
            fetchStats();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-sage-200 text-sm font-medium text-secondary hover:bg-sage-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "Total Revenue",
            value: statsLoading ? "—" : fmt(stats?.totalRevenue || 0),
            icon: <DollarSign size={18} className="text-primary" />,
            bg: "bg-primary/5",
          },
          {
            label: "Today Revenue",
            value: statsLoading ? "—" : fmt(stats?.todayRevenue || 0),
            icon: <TrendingUp size={18} className="text-primary" />,
            bg: "bg-primary/5",
          },
          {
            label: "Month Revenue",
            value: statsLoading ? "—" : fmt(stats?.monthRevenue || 0),
            icon: <Calendar size={18} className="text-primary" />,
            bg: "bg-primary/5",
          },
          {
            label: "Completed",
            value: statsLoading
              ? "—"
              : stats?.completed.toLocaleString() || "0",
            icon: <CheckCircle2 size={18} className="text-primary" />,
            bg: "bg-primary/5",
          },
          {
            label: "Failed",
            value: statsLoading ? "—" : stats?.failed.toLocaleString() || "0",
            icon: <XCircle size={18} className="text-rose-500" />,
            bg: "bg-rose-50",
          },
          {
            label: "Pending",
            value: statsLoading ? "—" : stats?.pending.toLocaleString() || "0",
            icon: <Clock size={18} className="text-gold-dark" />,
            bg: "bg-gold/5",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-4 shadow-sm border border-sage-100"
          >
            <div className={`inline-flex rounded-lg p-2 ${card.bg} mb-3`}>
              {card.icon}
            </div>
            <p className="text-xl font-bold text-secondary leading-tight">
              {card.value}
            </p>
            <p className="text-xs text-secondary/50 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Method breakdown */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-sage-100 flex items-center gap-4">
            <div className="rounded-full p-3 bg-primary/10">
              <Smartphone size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">
                ₹{stats.razorpayRevenue.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-secondary/50">
                Razorpay · {stats.razorpayCount} confirmed
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-sage-100 flex items-center gap-4">
            <div className="rounded-full p-3 bg-secondary/10">
              <Banknote size={20} className="text-secondary/60" />
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">
                ₹{stats.codRevenue.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-secondary/50">
                COD · {stats.codCount} collected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-sage-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40"
            />
            <input
              type="text"
              placeholder="Search order number, email, transaction ID…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-sage-200 bg-sage-50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-secondary placeholder:text-secondary/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-secondary/40" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-secondary text-white"
                    : "bg-sage-50 text-secondary/70 hover:bg-sage-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 text-sm rounded-lg border border-sage-200 bg-sage-50 text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {METHOD_FILTERS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100 bg-sage-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-secondary/40"
                  >
                    <RefreshCw
                      size={24}
                      className="animate-spin mx-auto mb-2"
                    />
                    Loading transactions…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-secondary/40"
                  >
                    <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                    No transactions found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-sage-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-secondary">
                        {payment.order?.orderNumber || "—"}
                      </p>
                      <p className="text-xs text-secondary/40 font-mono mt-0.5">
                        {payment.transactionId
                          ? payment.transactionId.slice(0, 20) + "…"
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-secondary">
                        {payment.order?.user
                          ? `${payment.order.user.firstName} ${payment.order.user.lastName}`
                          : "—"}
                      </p>
                      <p className="text-xs text-secondary/40">
                        {payment.order?.user?.email || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
                        <MethodIcon method={payment.method} />
                        {payment.method === "RAZORPAY" ? "Razorpay" : "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-secondary">
                      {fmt(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(payment.status)}>
                        <StatusIcon status={payment.status} />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary/60">
                      {fmtDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetail(payment.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sage-50 hover:bg-sage-100 text-secondary text-xs font-medium transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-sage-100">
            <p className="text-xs text-secondary/50">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                className="p-1.5 rounded-lg hover:bg-sage-100 disabled:opacity-30 disabled:cursor-not-allowed text-secondary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-secondary">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                className="p-1.5 rounded-lg hover:bg-sage-100 disabled:opacity-30 disabled:cursor-not-allowed text-secondary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {(detailLoading || selectedPayment) && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          />
          <div className="relative ml-auto w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-white border-b border-sage-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <h2 className="text-base font-semibold text-secondary">
                  Transaction Detail
                </h2>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg hover:bg-sage-100 text-secondary/60"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw size={24} className="animate-spin text-primary/50" />
              </div>
            ) : selectedPayment ? (
              <div className="p-6 space-y-6">
                {/* Status + amount hero */}
                <div className="rounded-xl bg-sage-50 p-5 text-center">
                  <p className="text-3xl font-bold text-secondary">
                    {fmt(selectedPayment.amount)}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <span className={statusBadge(selectedPayment.status)}>
                      <StatusIcon status={selectedPayment.status} />
                      {selectedPayment.status}
                    </span>
                  </div>
                  {selectedPayment.paidAt && (
                    <p className="mt-2 text-xs text-secondary/50">
                      Paid on {fmtDate(selectedPayment.paidAt)}
                    </p>
                  )}
                  {selectedPayment.failedAt && (
                    <p className="mt-2 text-xs text-rose-500">
                      Failed on {fmtDate(selectedPayment.failedAt)}
                    </p>
                  )}
                  {selectedPayment.refundedAt && (
                    <p className="mt-2 text-xs text-orange-500">
                      Refunded on {fmtDate(selectedPayment.refundedAt)}
                    </p>
                  )}
                </div>

                {/* Transaction IDs */}
                <section>
                  <h3 className="text-xs font-semibold text-secondary/40 uppercase tracking-wider mb-3">
                    Transaction IDs
                  </h3>
                  <div className="space-y-2 bg-white rounded-xl border border-sage-100 divide-y divide-sage-50">
                    {[
                      {
                        label: "Payment ID",
                        value: selectedPayment.id,
                        icon: <Hash size={14} />,
                      },
                      {
                        label: "Gateway TXN ID",
                        value: selectedPayment.transactionId || "—",
                        icon: <BadgeCheck size={14} />,
                      },
                      {
                        label: "Gateway",
                        value: selectedPayment.paymentGateway || "—",
                        icon: <CreditCard size={14} />,
                      },
                      {
                        label: "Order Number",
                        value: selectedPayment.order?.orderNumber || "—",
                        icon: <Package size={14} />,
                      },
                      {
                        label: "Method",
                        value: selectedPayment.method,
                        icon: <MethodIcon method={selectedPayment.method} />,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-start gap-3 px-4 py-2.5"
                      >
                        <span className="text-secondary/40 mt-0.5">
                          {row.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-secondary/40">
                            {row.label}
                          </p>
                          <p className="text-sm font-mono text-secondary break-all">
                            {row.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Customer */}
                {selectedPayment.order?.user && (
                  <section>
                    <h3 className="text-xs font-semibold text-secondary/40 uppercase tracking-wider mb-3">
                      Customer
                    </h3>
                    <div className="bg-white rounded-xl border border-sage-100 p-4 flex items-center gap-4">
                      <div className="rounded-full bg-sage-100 p-3">
                        <User size={18} className="text-secondary/60" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary">
                          {selectedPayment.order.user.firstName}{" "}
                          {selectedPayment.order.user.lastName}
                        </p>
                        <p className="text-xs text-secondary/50">
                          {selectedPayment.order.user.email}
                        </p>
                        {selectedPayment.order.user.phone && (
                          <p className="text-xs text-secondary/50">
                            {selectedPayment.order.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Razorpay metadata */}
                {selectedPayment.metadata &&
                  Object.keys(selectedPayment.metadata).length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-secondary/40 uppercase tracking-wider mb-3">
                        Gateway Metadata
                      </h3>
                      <div className="bg-sage-50 rounded-xl p-4 font-mono text-xs text-secondary/70 space-y-1 break-all">
                        {Object.entries(selectedPayment.metadata).map(
                          ([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-secondary/40 shrink-0">
                                {k}:
                              </span>
                              <span>{String(v)}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                {/* Admin actions */}
                <section>
                  <h3 className="text-xs font-semibold text-secondary/40 uppercase tracking-wider mb-3">
                    Admin Actions
                  </h3>
                  <div className="bg-white rounded-xl border border-sage-100 p-4 space-y-3">
                    <div>
                      <label className="text-xs text-secondary/60 font-medium block mb-1">
                        Admin Note (optional)
                      </label>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={2}
                        placeholder="e.g. Verified with bank, manual refund issued…"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-sage-200 bg-sage-50 text-secondary placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ADMIN_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          disabled={
                            updatingStatus ||
                            selectedPayment.status === opt.value
                          }
                          onClick={() => handleStatusUpdate(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            opt.value === "COMPLETED"
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : opt.value === "FAILED"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : opt.value === "REFUNDED"
                                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                  : "bg-sage-100 text-secondary hover:bg-sage-200"
                          }`}
                        >
                          {updatingStatus ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            opt.label
                          )}
                        </button>
                      ))}
                    </div>
                    {(selectedPayment.metadata as any)?.adminNote && (
                      <p className="text-xs text-secondary/50 italic">
                        Last note: "
                        {(selectedPayment.metadata as any).adminNote}"
                      </p>
                    )}
                  </div>
                </section>

                <p className="text-xs text-secondary/30 text-center">
                  ID: {selectedPayment.id}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
