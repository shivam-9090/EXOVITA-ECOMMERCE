import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  User,
  Calendar,
  Search,
  Filter,
  Download,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface AdminLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface LoginHistory {
  id: string;
  email: string;
  status: "SUCCESS" | "FAILED";
  failReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Stats {
  activityLogs: {
    total: number;
    today: number;
    byAction: { action: string; count: number }[];
    byEntity: { entity: string; count: number }[];
  };
  loginAttempts: {
    total: number;
    today: number;
    success: number;
    failed: number;
    successRate: string;
  };
}

const AdminLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"activity" | "logins">("activity");
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchActivityLogs();
    } else {
      fetchLoginHistory();
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    actionFilter,
    entityFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`http://localhost:3000/api/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:3000/api/logs/admin-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            limit: 20,
            action: actionFilter || undefined,
            entity: entityFilter || undefined,
            search: searchTerm || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        },
      );
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:3000/api/logs/login-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            limit: 20,
            status: statusFilter || undefined,
            search: searchTerm || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        },
      );
      setLoginHistory(response.data.history);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching login history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case "create":
      case "INSERT":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "update":
      case "EDIT":
        return "bg-sage-50 text-primary ring-primary/20";
      case "delete":
      case "REMOVE":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "login":
        return "bg-sage-50 text-primary ring-sage-200";
      case "logout":
        return "bg-sage-50 text-secondary ring-sage-200";
      default:
        return "bg-sage-50 text-secondary ring-sage-200";
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Logs & Security
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Monitor system activity, track user actions, and review security
            events.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === "activity") fetchActivityLogs();
              else fetchLoginHistory();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-sage-50 transition-colors"
          >
            <RefreshCw
              size={18}
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Total Activities
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.activityLogs.total}
                </p>
              </div>
              <div className="rounded-lg bg-sage-50 p-2 text-primary">
                <Activity size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 font-medium">
                +{stats.activityLogs.today}
              </span>
              <span className="ml-2 text-secondary/60">records today</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Successful Logins
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.loginAttempts.success}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 font-medium">
                {stats.loginAttempts.successRate}%
              </span>
              <span className="ml-2 text-secondary/60">success rate</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Failed Attempts
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.loginAttempts.failed}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <XCircle size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm text-secondary/60">
              Requires attention
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Active Entities
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.activityLogs.byEntity.length}
                </p>
              </div>
              <div className="rounded-lg bg-sage-50 p-2 text-primary">
                <Globe size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm text-secondary/60">
              Unique resources accessed
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex px-6" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab("activity");
                setCurrentPage(1);
              }}
              className={`py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "activity"
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary/60 hover:text-secondary hover:border-sage-300"
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => {
                setActiveTab("logins");
                setCurrentPage(1);
              }}
              className={`ml-8 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "logins"
                  ? "border-primary text-primary"
                  : "border-transparent text-secondary/60 hover:text-secondary hover:border-sage-300"
              }`}
            >
              Login History
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
              />
            </div>

            {activeTab === "activity" && (
              <>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                </select>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="">All Entities</option>
                  <option value="Product">Product</option>
                  <option value="Order">Order</option>
                  <option value="User">User</option>
                  <option value="Category">Category</option>
                  <option value="Coupon">Coupon</option>
                </select>
              </>
            )}

            {activeTab === "logins" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            )}

            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-slate-500 text-sm">Loading logs...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="min-w-full divide-y divide-slate-200">
                {activeTab === "activity" && (
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Entity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                )}
                {activeTab === "logins" && (
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Email/User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        IP Address
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Device Info
                      </th>
                    </tr>
                  </thead>
                )}

                <tbody className="bg-white divide-y divide-slate-200">
                  {activeTab === "activity" ? (
                    logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                {log.user?.firstName?.[0] || "S"}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">
                                  {log.user
                                    ? `${log.user.firstName} ${log.user.lastName}`
                                    : "System"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {log.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionBadgeColor(log.action)}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            <span className="font-mono text-xs">
                              {log.entity}
                            </span>
                            {log.entityId && (
                              <span className="ml-1 text-slate-400 text-xs">
                                #{log.entityId.substring(0, 6)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            <div
                              className="max-w-xs truncate"
                              title={JSON.stringify(log.details)}
                            >
                              {JSON.stringify(log.details)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No activity logs found matching your filters.
                        </td>
                      </tr>
                    )
                  ) : loginHistory.length > 0 ? (
                    loginHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {new Date(history.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs">
                              {new Date(history.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {history.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              history.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-rose-50 text-rose-700 ring-rose-600/20"
                            }`}
                          >
                            {history.status === "SUCCESS" ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : (
                              <XCircle size={12} className="mr-1" />
                            )}
                            {history.status}
                          </span>
                          {history.failReason && (
                            <div className="text-xs text-rose-500 mt-1">
                              {history.failReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono text-xs">
                          {history.ipAddress || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-xs">
                          <div
                            className="max-w-xs truncate"
                            title={history.userAgent || ""}
                          >
                            {history.userAgent}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No login history found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
                <p className="text-xs text-slate-500">
                  ({total} total records)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
