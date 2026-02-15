import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Search,
  Filter,
} from "lucide-react";
import axios from "axios";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  discount: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  specificUsers: string[];
  description?: string;
  createdAt: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    used: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
    discount: 0,
    minPurchase: "",
    maxDiscount: "",
    expiresAt: "",
    usageLimit: "",
    description: "",
    isActive: true,
  });

  const [filterActive, setFilterActive] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [filterActive, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [couponsRes, statsRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/coupons/admin/all`, {
          headers,
          params: {
            isActive:
              filterActive === "all" ? undefined : filterActive === "active",
            search: searchQuery || undefined,
          },
        }),
        axios.get(`http://localhost:3000/api/coupons/admin/stats`, { headers }),
      ]);

      setCoupons(couponsRes.data.coupons);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        discount: coupon.discount,
        minPurchase: coupon.minPurchase?.toString() || "",
        maxDiscount: coupon.maxDiscount?.toString() || "",
        expiresAt: coupon.expiresAt
          ? new Date(coupon.expiresAt).toISOString().split("T")[0]
          : "",
        usageLimit: coupon.usageLimit?.toString() || "",
        description: coupon.description || "",
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "PERCENTAGE",
        discount: 0,
        minPurchase: "",
        maxDiscount: "",
        expiresAt: "",
        usageLimit: "",
        description: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        discount: Number(formData.discount),
        minPurchase: formData.minPurchase
          ? Number(formData.minPurchase)
          : undefined,
        maxDiscount: formData.maxDiscount
          ? Number(formData.maxDiscount)
          : undefined,
        expiresAt: formData.expiresAt || undefined,
        usageLimit: formData.usageLimit
          ? Number(formData.usageLimit)
          : undefined,
        description: formData.description || undefined,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        await axios.put(
          `http://localhost:3000/api/coupons/admin/${editingCoupon.id}`,
          payload,
          { headers },
        );
      } else {
        await axios.post(`http://localhost:3000/api/coupons/admin`, payload, {
          headers,
        });
      }

      fetchData();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`http://localhost:3000/api/coupons/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `http://localhost:3000/api/coupons/admin/${coupon.id}`,
        { isActive: !coupon.isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
    } catch (error) {
      console.error("Error toggling coupon status:", error);
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Coupons & Discounts
          </h1>
          <p className="mt-1 text-sm text-secondary/60">
            Create and manage discount codes for your customers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-sage-50 transition-colors"
          >
            <RefreshCw
              size={18}
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors shadow-primary/20"
          >
            <Plus size={18} className="mr-2" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary/60">
                Total Coupons
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                {stats.total}
              </p>
            </div>
            <div className="rounded-lg bg-sage-50 p-2 text-primary">
              <Tag size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary/60">Active</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                {stats.active}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <RefreshCw size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary/60">Expired</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                {stats.expired}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary/60">
                Total Uses
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                {stats.used}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-secondary/40" />
          </div>
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-10 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActive("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === "all" ? "bg-primary text-white shadow-sm" : "bg-white text-secondary hover:bg-sage-50"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive("active")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === "active" ? "bg-primary text-white shadow-sm" : "bg-white text-secondary hover:bg-sage-50"}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive("inactive")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === "inactive" ? "bg-primary text-white shadow-sm" : "bg-white text-secondary hover:bg-sage-50"}`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-secondary/60 text-sm">Loading coupons...</p>
            </div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mx-auto h-12 w-12 text-secondary/40">
              <Tag className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-secondary">
              No coupons found
            </h3>
            <p className="mt-1 text-sm text-secondary/60">
              Create a new coupon to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage-200">
              <thead className="bg-sage-50/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-secondary/60 uppercase tracking-wider"
                  >
                    Coupon Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-secondary/60 uppercase tracking-wider"
                  >
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-secondary/60 uppercase tracking-wider"
                  >
                    Usage
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-secondary/60 uppercase tracking-wider"
                  >
                    Expires
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-secondary/60 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sage-200">
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-sage-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary font-mono tracking-wide">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <span className="text-xs text-secondary/60 mt-1">
                            {coupon.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary flex items-center gap-1">
                        {coupon.type === "PERCENTAGE" ? (
                          <Percent size={14} className="text-emerald-500" />
                        ) : (
                          <DollarSign size={14} className="text-emerald-500" />
                        )}
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.discount}%`
                          : `₹${coupon.discount}`}
                      </div>
                      <div className="text-xs text-secondary/60 mt-1">
                        {coupon.minPurchase && (
                          <span>Min: ₹{coupon.minPurchase}</span>
                        )}
                        {coupon.maxDiscount && (
                          <span className="ml-2">
                            Max: ₹{coupon.maxDiscount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary">
                        {coupon.usedCount}{" "}
                        <span className="text-secondary/40">/</span>{" "}
                        {coupon.usageLimit ? coupon.usageLimit : "∞"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.expiresAt ? (
                        <span
                          className={`text-sm ${isExpired(coupon.expiresAt) ? "text-red-600 font-medium" : "text-secondary/70"}`}
                        >
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary/40 italic">
                          Never
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(coupon)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset cursor-pointer transition-all hover:ring-opacity-70 ${
                          coupon.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : "bg-sage-50 text-secondary/60 ring-sage-200"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(coupon)}
                          className="p-2 text-secondary/40 hover:text-primary hover:bg-sage-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-secondary/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-secondary/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>

          <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-secondary">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={closeModal}
                className="text-secondary/40 hover:text-secondary/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form
                id="coupon-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 uppercase font-mono tracking-wider bg-sage-50/30"
                      placeholder="SUMMER25"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Discount Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "PERCENTAGE" | "FLAT",
                        })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Discount Value *
                    </label>
                    <div className="relative mt-2 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-secondary/60 sm:text-sm">
                          {formData.type === "FLAT" ? "₹" : "%"}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: Number(e.target.value),
                          })
                        }
                        className="block w-full rounded-lg border-0 py-2 pl-8 pr-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Max Discount Limit (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscount: e.target.value,
                        })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="1000"
                      disabled={formData.type === "FLAT"}
                    />
                    <p className="mt-1 text-xs text-secondary/60">
                      Only applicable for percentage discounts.
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Min Purchase (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minPurchase: e.target.value,
                        })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="Leave blank for unlimited"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium leading-6 text-secondary">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="mt-2 block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="Describe the offer..."
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-sage-200 text-primary focus:ring-primary"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <label
                          htmlFor="isActive"
                          className="font-medium text-secondary"
                        >
                          Active Coupon
                        </label>
                        <p className="text-secondary/60">
                          Enable or disable this coupon immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-sage-100 px-6 py-4 bg-sage-50 flex justify-end gap-3 z-10">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-secondary shadow-sm ring-1 ring-inset ring-sage-200 hover:bg-sage-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="coupon-form"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
