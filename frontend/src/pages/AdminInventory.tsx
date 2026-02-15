import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Box,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import axios from "axios";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  thumbnail?: string;
  category?: {
    name: string;
  };
}

interface InventoryStats {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

const AdminInventory = () => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"low-stock" | "out-of-stock">(
    "low-stock",
  );
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [stockOperation, setStockOperation] = useState<
    "ADD" | "SUBTRACT" | "SET"
  >("ADD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const [statsRes, lowStockRes, outOfStockRes] = await Promise.all([
        axios.get("http://localhost:3000/api/products/inventory/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/api/products/inventory/low-stock", {
          headers: { Authorization: `Bearer ${token}` },
          params: { threshold: 10 },
        }),
        axios.get("http://localhost:3000/api/products/inventory/out-of-stock", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsRes.data);
      setLowStockProducts(lowStockRes.data);
      setOutOfStockProducts(outOfStockRes.data);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockQuantity("");
    setStockOperation("ADD");
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setStockQuantity("");
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !stockQuantity) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `http://localhost:3000/api/products/inventory/${selectedProduct.id}/stock`,
        { quantity: Number(stockQuantity), operation: stockOperation },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      closeStockModal();
      fetchInventoryData();
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert("Failed to update stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <Box className="h-8 w-8 text-primary" />
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Track product levels, manage restocks, and monitor inventory health.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchInventoryData}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-secondary shadow-sm ring-1 ring-inset ring-sage-200 hover:bg-sage-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-sage-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Total Products
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-primary-dark">
                <Package size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-sage-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Total Stock Units
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.totalStockUnits}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-sage-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Low Stock Alerts
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.lowStockProducts}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-sage-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary/60">
                  Out of Stock
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                  {stats.outOfStockProducts}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <TrendingDown size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="rounded-xl bg-white shadow-sm border border-sage-100 overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="border-b border-sage-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("low-stock")}
              className={`w-1/2 md:w-auto px-6 py-4 text-sm font-bold tracking-tight border-b-2 flex items-center justify-center gap-2 transition-colors ${
                activeTab === "low-stock"
                  ? "border-sage-400 text-secondary bg-sage-50"
                  : "border-transparent text-secondary/60 hover:text-secondary hover:border-sage-300"
              }`}
            >
              <AlertTriangle
                size={18}
                className={
                  activeTab === "low-stock"
                    ? "text-sage-600"
                    : "text-secondary/40"
                }
              />
              Low Stock Alerts
              <span
                className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-bold ${
                  activeTab === "low-stock"
                    ? "bg-sage-200 text-secondary"
                    : "bg-sage-100 text-secondary/60"
                }`}
              >
                {lowStockProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("out-of-stock")}
              className={`w-1/2 md:w-auto px-6 py-4 text-sm font-bold tracking-tight border-b-2 flex items-center justify-center gap-2 transition-colors ${
                activeTab === "out-of-stock"
                  ? "border-rose-500 text-secondary bg-rose-50/20"
                  : "border-transparent text-secondary/60 hover:text-secondary hover:border-sage-300"
              }`}
            >
              <AlertCircle
                size={18}
                className={
                  activeTab === "out-of-stock"
                    ? "text-rose-500"
                    : "text-secondary/40"
                }
              />
              Out of Stock
              <span
                className={`ml-2 rounded-full py-0.5 px-2.5 text-xs font-bold ${
                  activeTab === "out-of-stock"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-sage-100 text-secondary/60"
                }`}
              >
                {outOfStockProducts.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-secondary/60 text-sm">
                Loading inventory details...
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-100">
              <thead className="bg-sage-50/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    SKU
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Stock Level
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary/50"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sage-100">
                {(activeTab === "low-stock"
                  ? lowStockProducts
                  : outOfStockProducts
                ).map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-sage-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-sage-100 border border-sage-200">
                          {product.thumbnail ? (
                            <img
                              className="h-full w-full object-cover"
                              src={product.thumbnail}
                              alt=""
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-secondary/40">
                              <Box size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-bold text-secondary text-sm">
                            {product.name}
                          </div>
                          <div className="text-xs text-secondary/60 max-w-[200px] truncate">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-secondary/70 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-secondary/70">
                      {product.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${
                          product.stock <= 5
                            ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-secondary font-bold">
                      ₹{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openStockModal(product)}
                        className="text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors font-semibold"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
                {(activeTab === "low-stock"
                  ? lowStockProducts
                  : outOfStockProducts
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                        <Check className="h-full w-full" />
                      </div>
                      <p className="text-base font-medium text-slate-900">
                        All good!
                      </p>
                      <p className="text-sm text-slate-500">
                        No{" "}
                        {activeTab === "low-stock"
                          ? "low stock"
                          : "out of stock"}{" "}
                        items found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {showStockModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-secondary/20 backdrop-blur-sm transition-opacity"
            onClick={closeStockModal}
          ></div>

          <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary">
                  Update Stock
                </h2>
                <p className="text-sm text-secondary/60 mt-1">
                  Adjust inventory for {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={closeStockModal}
                className="text-secondary/40 hover:text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStock}>
              <div className="px-6 py-6 space-y-4">
                <div className="p-4 bg-sage-50 rounded-lg border border-sage-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary/70">
                    Current Stock
                  </span>
                  <span className="text-xl font-bold text-secondary">
                    {selectedProduct.stock}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-secondary">
                    Operation
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setStockOperation("ADD")}
                      className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border ${
                        stockOperation === "ADD"
                          ? "bg-sage-50 border-sage-300 text-secondary ring-1 ring-sage-300"
                          : "bg-white border-sage-200 text-secondary hover:bg-sage-50"
                      }`}
                    >
                      <Plus size={16} className="mr-1.5" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockOperation("SUBTRACT")}
                      className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border ${
                        stockOperation === "SUBTRACT"
                          ? "bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200"
                          : "bg-white border-sage-200 text-secondary hover:bg-sage-50"
                      }`}
                    >
                      <Minus size={16} className="mr-1.5" />
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockOperation("SET")}
                      className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border ${
                        stockOperation === "SET"
                          ? "bg-sage-100 border-sage-300 text-secondary ring-1 ring-sage-300"
                          : "bg-white border-sage-200 text-secondary hover:bg-sage-50"
                      }`}
                    >
                      <RefreshCw size={14} className="mr-1.5" />
                      Set
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-secondary">
                    {stockOperation === "ADD"
                      ? "Quantity to Add"
                      : stockOperation === "SUBTRACT"
                        ? "Quantity to Remove"
                        : "New Total Quantity"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="mt-2 block w-full rounded-lg border-sage-200 bg-white text-secondary shadow-sm focus:border-sage-400 focus:ring-sage-400 focus:outline-none px-3 py-2 sm:text-sm"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-sage-100 px-6 py-4 bg-sage-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="px-4 py-2 text-sm font-medium text-secondary bg-white border border-sage-200 rounded-lg hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !stockQuantity}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
