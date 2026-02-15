import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Shield,
  Ban,
  CheckCircle2,
  MoreVertical,
  Eye,
  Calendar,
  MapPin,
  ShoppingBag,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
  totalSpent: number;
  orders?: any[];
  addresses?: any[];
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  newToday: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [roleFilter, statusFilter, pagination.page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/users/admin/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          page: pagination.page,
          limit: 20,
          search: searchTerm || undefined,
        },
      });

      if (response.data) {
        setCustomers(response.data.users || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}/users/admin/stats/overview`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const toggleBlockUser = async (
    customerId: string,
    currentStatus: boolean,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "block" : "unblock"} this user?`,
      )
    )
      return;

    try {
      const token = localStorage.getItem("accessToken");
      // If currently active (true), we block. If blocked (false), we unblock.
      const endpoint = currentStatus ? "block" : "unblock";

      await axios.patch(
        `${API_URL}/users/admin/${customerId}/${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, isVerified: !currentStatus } : c,
        ),
      );
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, isVerified: !currentStatus } : null,
        );
      }
      fetchStats();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert("Failed to update user status");
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/users/admin/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error("Failed to fetch details", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Customers</h1>
          <p className="mt-1 text-sm text-secondary/60">
            View and manage customer accounts and permissions.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="text-primary" size={24} />}
            bg="bg-sage-50"
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<CheckCircle2 className="text-emerald-600" size={24} />}
            bg="bg-emerald-50/50"
          />
          <StatsCard
            title="Blocked Users"
            value={stats.blockedUsers}
            icon={<Ban className="text-red-600" size={24} />}
            bg="bg-red-50/50"
          />
          <StatsCard
            title="New Today"
            value={stats.newToday || 0}
            icon={<Calendar className="text-gold" size={24} />}
            bg="bg-amber-50/50"
          />
        </div>
      )}

      {/* Filters & Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-sage-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-sage-50/30">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-secondary/40" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-0 py-2 pl-10 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-white shadow-sm"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block rounded-lg border-0 py-2 pl-3 pr-8 text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-white shadow-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-lg border-0 py-2 pl-3 pr-8 text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-white shadow-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-100">
              <thead className="bg-sage-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Spent
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-secondary/60"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-sage-300" />
                        <p>No customers found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-sage-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-secondary">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-xs text-secondary/60">
                              Joined{" "}
                              {new Date(
                                customer.createdAt,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-secondary/80">
                            <Mail size={14} className="text-secondary/40" />{" "}
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-secondary/60">
                              <Phone size={12} className="text-secondary/40" />{" "}
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            customer.role === "ADMIN"
                              ? "bg-gold/10 text-gold-dark ring-gold/20"
                              : "bg-sage-100 text-secondary/80 ring-sage-200"
                          }`}
                        >
                          {customer.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary">
                          ₹{customer.totalSpent?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-secondary/60">
                          {customer._count?.orders || 0} orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary-dark ring-1 ring-inset ring-primary/20">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            <Ban size={12} /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewDetails(customer.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          <Eye size={16} /> Details
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
        <div className="flex items-center justify-between border-t border-sage-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary/70">
                Showing page{" "}
                <span className="font-medium text-secondary">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-medium text-secondary">
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
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-inset ring-sage-200 hover:bg-sage-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-inset ring-sage-200 hover:bg-sage-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggleBlock={toggleBlockUser}
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
  <div className="rounded-xl bg-white p-6 shadow-sm flex items-center gap-4">
    <div className={`rounded-full p-3 ${bg}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-secondary">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-secondary/60">
        {title}
      </p>
    </div>
  </div>
);

const CustomerDetailsModal = ({
  customer,
  onClose,
  onToggleBlock,
}: {
  customer: Customer;
  onClose: () => void;
  onToggleBlock: (id: string, currentStatus: boolean) => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-secondary/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage-200 bg-sage-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              {customer.firstName[0]}
              {customer.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-secondary">
                {customer.firstName} {customer.lastName}
              </h2>
              <p className="text-sm text-secondary/60">
                Customer ID: {customer.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary/40 hover:text-secondary hover:bg-sage-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-sage-50 space-y-3">
              <div className="flex items-center gap-2 text-sm text-secondary/60">
                <Mail size={16} /> Email Address
              </div>
              <p className="font-medium text-secondary">{customer.email}</p>
            </div>
            <div className="p-4 rounded-lg bg-sage-50 space-y-3">
              <div className="flex items-center gap-2 text-sm text-secondary/60">
                <Phone size={16} /> Phone Number
              </div>
              <p className="font-medium text-secondary">
                {customer.phone || "Not provided"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-sage-50 space-y-3">
              <div className="flex items-center gap-2 text-sm text-secondary/60">
                <Shield size={16} /> Role
              </div>
              <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-secondary ring-1 ring-inset ring-sage-200">
                {customer.role}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-sage-50 space-y-3">
              <div className="flex items-center gap-2 text-sm text-secondary/60">
                <Calendar size={16} /> Joined On
              </div>
              <p className="font-medium text-secondary">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-sm font-bold text-secondary mb-3">
              Customer Activity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm">
                <span className="text-2xl font-bold text-primary">
                  {customer._count?.orders || 0}
                </span>
                <span className="text-xs text-secondary/60 uppercase tracking-wider mt-1">
                  Orders
                </span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm">
                <span className="text-2xl font-bold text-emerald-600">
                  ₹{customer.totalSpent?.toLocaleString() || 0}
                </span>
                <span className="text-xs text-secondary/60 uppercase tracking-wider mt-1">
                  Total Spent
                </span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm">
                <span className="text-2xl font-bold text-gold-dark">
                  {customer._count?.reviews || 0}
                </span>
                <span className="text-xs text-secondary/60 uppercase tracking-wider mt-1">
                  Reviews
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                <MapPin size={16} /> Saved Addresses
              </h3>
              <div className="space-y-3">
                {customer.addresses.map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-sm text-secondary/80 bg-white shadow-sm"
                  >
                    <p className="text-secondary font-medium">{addr.street}</p>
                    <p>
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-sage-200 bg-sage-50 flex justify-end">
          <button
            onClick={() => onToggleBlock(customer.id, customer.isVerified)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              customer.isVerified
                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                : "bg-primary/5 text-primary-dark hover:bg-primary/10 border border-primary/20"
            }`}
          >
            {customer.isVerified ? (
              <>
                <Ban size={16} /> Block User Account
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Unblock User Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
