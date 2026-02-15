import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import axios from "axios";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

type ReportTab = "sales" | "products" | "customers" | "tax";

const API_URL = "http://localhost:3000/api";

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overview, setOverview] = useState<OverviewStats | null>(null);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any[]>([]);

  useEffect(() => {
    fetchOverview();
    fetchReportData();
  }, [activeTab, startDate, endDate]);

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/reports/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(response.data);
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API_URL}/reports/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = response.data || {};

      if (activeTab === "sales") {
        setSalesData(Array.isArray(data.orders) ? data.orders : []);
        setSalesTrendData(
          Array.isArray(data.monthlyRevenue)
            ? data.monthlyRevenue.map((item: any) => ({
                name: item.name,
                revenue: Number(item.value || 0),
              }))
            : [],
        );
      }
      if (activeTab === "products") {
        setProductData(Array.isArray(data.topProducts) ? data.topProducts : []);
      }
      if (activeTab === "customers") {
        setCustomerData(
          Array.isArray(data.topCustomers) ? data.topCustomers : [],
        );
      }
      if (activeTab === "tax") {
        setTaxData(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      if (activeTab === "sales") {
        setSalesData([]);
        setSalesTrendData([]);
      }
      if (activeTab === "products") setProductData([]);
      if (activeTab === "customers") setCustomerData([]);
      if (activeTab === "tax") setTaxData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(
        `${API_URL}/reports/${activeTab}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeTab}-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  };

  const rows =
    activeTab === "sales"
      ? salesData
      : activeTab === "products"
        ? productData
        : activeTab === "customers"
          ? customerData
          : taxData;

  const formatCurrency = (value: number) =>
    `₹${Number(value || 0).toLocaleString()}`;

  const tableHeaders =
    activeTab === "sales"
      ? ["Order", "Customer", "Status", "Total"]
      : activeTab === "products"
        ? ["Product", "Qty Sold", "Orders", "Revenue"]
        : activeTab === "customers"
          ? ["Customer", "Email", "Orders", "Total Spent"]
          : ["Order", "Customer", "Tax", "Total"];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <BarChart3 className="h-7 w-7 text-primary" />
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gain insights into your business performance with detailed reports.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReportData}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={`₹${overview.totalRevenue.toLocaleString()}`}
            icon={<DollarSign size={20} />}
            iconBg="bg-emerald-50"
            iconText="text-emerald-600"
          />
          <StatCard
            title="Total Orders"
            value={overview.totalOrders}
            icon={<ShoppingCart size={20} />}
            iconBg="bg-sage-50"
            iconText="text-primary"
          />
          <StatCard
            title="Total Customers"
            value={overview.totalCustomers}
            icon={<Users size={20} />}
            iconBg="bg-amber-50"
            iconText="text-amber-600"
          />
          <StatCard
            title="Products Sold"
            value={overview.totalProducts}
            icon={<Package size={20} />}
            iconBg="bg-sage-50"
            iconText="text-primary"
          />
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {(["sales", "products", "customers", "tax"] as ReportTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <DateInput value={startDate} onChange={setStartDate} />
            <span className="text-sm text-slate-400">to</span>
            <DateInput value={endDate} onChange={setEndDate} />
          </div>
        </div>

        <div className="space-y-6 p-6">
          {activeTab === "sales" && (
            <div className="h-72 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <TrendingUp size={16} className="text-indigo-600" />
                Revenue Trend
              </div>
              {salesTrendData.length === 0 ? (
                <div className="flex h-[90%] items-center justify-center text-sm text-slate-500">
                  No sales trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#577460"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#577460"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#577460"
                      fill="url(#revFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No data found for this report and date range.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      {activeTab === "sales" && (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {row.orderNumber || row.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {row.user
                              ? `${row.user.firstName} ${row.user.lastName}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {row.status || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatCurrency(row.total)}
                          </td>
                        </>
                      )}
                      {activeTab === "products" && (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {row.product?.name || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {row.totalQuantity ?? 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {row.orderCount ?? 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatCurrency(row.totalRevenue)}
                          </td>
                        </>
                      )}
                      {activeTab === "customers" && (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {row.name || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {row.email || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {row.orderCount ?? 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatCurrency(row.totalSpent)}
                          </td>
                        </>
                      )}
                      {activeTab === "tax" && (
                        <>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {row.orderId || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {row.customer || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatCurrency(row.tax)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatCurrency(row.total)}
                          </td>
                        </>
                      )}
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

const DateInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="relative">
    <Calendar
      size={14}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border-0 py-1.5 pl-9 pr-2 text-sm text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-primary focus:outline-none"
    />
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  iconBg,
  iconText,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconText: string;
}) => (
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
      <div className={`rounded-lg p-2 ${iconBg} ${iconText}`}>{icon}</div>
    </div>
  </div>
);

export default AdminReports;
