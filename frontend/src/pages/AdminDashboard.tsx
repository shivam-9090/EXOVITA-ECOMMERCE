import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  ArrowUp,
  ArrowDown,
  Package,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:3000/api";

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
}

// Stats Card Component
const StatCard = ({
  title,
  value,
  percentage,
  isPositive,
  icon: Icon,
  colorClass,
  trendLabel,
}: any) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-secondary/60 uppercase tracking-wide">
          {title}
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-secondary">
          {value}
        </p>
      </div>
      <div
        className={`rounded-xl p-3 ${colorClass} bg-opacity-10 backdrop-blur-sm`}
      >
        <Icon size={24} className={colorClass.replace("bg-", "text-")} />
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between relative z-10">
      <div
        className={`flex items-center text-sm font-medium ${isPositive ? "text-primary" : "text-rose-600"}`}
      >
        {isPositive ? (
          <ArrowUp size={16} className="mr-1" />
        ) : (
          <ArrowDown size={16} className="mr-1" />
        )}
        {percentage}%
      </div>
      <span className="text-xs text-secondary/40 font-medium">
        {trendLabel || "vs last month"}
      </span>
    </div>

    {/* Decorative background circle */}
    <div
      className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-5 bg-current ${colorClass.replace("bg-", "text-")}`}
    />
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const [dashboardRes, productsRes, ordersRes, salesRes] =
        await Promise.all([
          axios.get(`${API_URL}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/products?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/orders?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/reports/sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      setStats(dashboardRes.data);
      setRecentOrders(ordersRes.data.orders || ordersRes.data || []);
      setTopProducts(productsRes.data.products || productsRes.data || []);
      if (salesRes.data) setSalesData(salesRes.data);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-secondary/60 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-xl border border-rose-100 text-rose-600 m-6 shadow-sm">
        Failed to load dashboard data. Please try refreshing.
      </div>
    );
  }

  // Chart Data Preparation
  const revenueData = salesData?.monthlyRevenue || [];
  const ordersData = salesData?.monthlyOrders || [];

  const revenuePercentage =
    stats.todayRevenue > 0
      ? ((stats.todayRevenue / stats.totalRevenue) * 100).toFixed(1)
      : "0";
  const ordersPercentage =
    stats.todayOrders > 0
      ? ((stats.todayOrders / stats.totalOrders) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-secondary/60">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm shadow-sage-200 ring-1 ring-inset ring-sage-200 hover:bg-sage-50 transition-all hover:shadow-md"
          >
            Refresh Data
          </button>
          <button className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-0.5">
            <Download size={18} className="mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          percentage={revenuePercentage}
          isPositive={true}
          icon={DollarSign}
          colorClass="bg-primary"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          percentage={ordersPercentage}
          isPositive={stats.todayOrders > 0}
          icon={ShoppingCart}
          colorClass="bg-gold"
        />
        <StatCard
          title="Active Customers"
          value={stats.totalUsers.toLocaleString()}
          percentage="12.5"
          isPositive={true}
          icon={Users}
          colorClass="bg-secondary"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          percentage={stats.pendingOrders > 5 ? "-2.4" : "0.0"}
          isPositive={stats.pendingOrders < 5}
          icon={Clock}
          colorClass="bg-rose-500"
          trendLabel="vs yesterday"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold leading-6 text-secondary">
              Revenue Analytics
            </h3>
            <select className="text-xs bg-sage-50 border-sage-200 rounded-lg py-1.5 pl-3 pr-8 text-secondary/70 focus:ring-primary focus:border-primary cursor-pointer transition-colors hover:bg-sage-100">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5c705e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5c705e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2dac9"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#555555", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#555555", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    fontFamily: "Lato, sans-serif",
                  }}
                  formatter={(value: number) => [
                    `₹${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelStyle={{
                    color: "#1a1c18",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#5c705e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold leading-6 text-secondary">
              Order Volume
            </h3>
            <div className="flex gap-3">
              <span className="flex items-center text-xs font-medium text-secondary/60 bg-sage-50 px-2 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-gold mr-2"></span>{" "}
                Completed
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2dac9"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#555555", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#555555", fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ fill: "#f0ebe0", opacity: 0.4 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                    fontFamily: "Lato, sans-serif",
                  }}
                  labelStyle={{
                    color: "#1a1c18",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="#c5a059"
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-90 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b border-sage-100 bg-white px-8 py-6 flex items-center justify-between">
            <h3 className="text-lg font-bold leading-6 text-secondary">
              Recent Orders
            </h3>
            <Link
              to="/admin/orders"
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              View All <span className="text-lg leading-none">›</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-100">
              <thead className="bg-sage-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Order ID
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Customer
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Status
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-8 py-12 text-center text-secondary/40 text-sm italic"
                    >
                      No recent orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-sage-50/50 transition-colors group"
                    >
                      <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-sm text-secondary/70">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center text-xs font-bold text-secondary/60 border border-sage-200">
                            {order.user?.firstName?.[0] || "G"}
                          </div>
                          <span className="font-medium">
                            {order.user
                              ? `${order.user.firstName} ${order.user.lastName}`
                              : "Guest Customer"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                            order.status === "completed" ||
                            order.status === "delivered"
                              ? "bg-primary/10 text-primary-dark ring-primary/20"
                              : order.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 ring-rose-200"
                                : "bg-gold/10 text-gold-dark ring-gold/20"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-sm font-bold text-secondary text-right">
                        ₹{order.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b border-sage-100 bg-white px-8 py-6 flex items-center justify-between">
            <h3 className="text-lg font-bold leading-6 text-secondary">
              Top Performing Products
            </h3>
            <Link
              to="/admin/products"
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              Details <span className="text-lg leading-none">›</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-100">
              <thead className="bg-sage-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Product Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Stock Status
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary/50">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {topProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-8 py-12 text-center text-secondary/40 text-sm italic"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-sage-50/50 transition-colors group"
                    >
                      <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-secondary">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-sage-50 border border-sage-200 flex items-center justify-center text-secondary/30">
                            <Package size={20} />
                          </div>
                          <span className="truncate max-w-[180px] font-medium group-hover:text-primary transition-colors">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-sm">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm ${product.stock > 10 ? "bg-primary" : "bg-rose-500"}`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${product.stock > 10 ? "text-secondary/70" : "text-rose-600"}`}
                          >
                            {product.stock} Units
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-5 text-sm font-bold text-secondary text-right">
                        ₹{product.price?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
