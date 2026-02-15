import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  X,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    buttonText: "",
    position: 0,
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}/banners?includeInactive=true`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      setBanners(response.data);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        ...formData,
        subtitle: formData.subtitle || undefined,
        link: formData.link || undefined,
        buttonText: formData.buttonText || undefined,
        position: Number(formData.position),
      };

      if (editingBanner) {
        await axios.put(`${API_URL}/banners/${editingBanner.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/banners`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      fetchBanners();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save banner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      buttonText: banner.buttonText || "",
      position: banner.position,
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_URL}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanners();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete banner");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const token = localStorage.getItem("accessToken");
      // Use simpler update if specific toggle endpoint doesn't exist or use the toggle one if available
      // Assuming typical restful update for status since toggle endpoint might vary
      await axios.put(
        `${API_URL}/banners/${banner.id}`,
        { ...banner, isActive: !banner.isActive },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchBanners();
    } catch (error: any) {
      console.error("Toggle error", error);
      alert("Failed to update status");
    }
  };

  // Alternative specific toggle if backend supports it
  /*
  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(`${API_URL}/banners/${id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanners();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to toggle banner status");
    }
  };
  */

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image: "",
      link: "",
      buttonText: "",
      position: banners.length + 1,
      isActive: true,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  if (loading && !showForm) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium">Loading Banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Banners & Sliders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your homepage hero banners and promotional sliders.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors shadow-primary/20"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm text-slate-500 border border-slate-200">
            <ImageIcon size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-900">No banners yet</p>
            <p className="text-sm mt-1">
              Create your first banner to showcase promotions.
            </p>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={`group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md border border-slate-200 ${!banner.isActive ? "opacity-75" : ""}`}
            >
              {/* Status Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-md ${
                    banner.isActive
                      ? "bg-primary/90 text-white"
                      : "bg-slate-900/50 text-white"
                  }`}
                >
                  {banner.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Image Area */}
              <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/800x450?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <div className="absolute bottom-0 left-0 p-4 w-full text-white">
                  <h3 className="text-lg font-bold truncate">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm text-white/80 truncate">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <ArrowUp size={14} /> Pos: {banner.position}
                  </span>
                  {banner.link && (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      banner.isActive
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {banner.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 text-secondary/60 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-secondary/60 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-secondary/80 backdrop-blur-sm transition-opacity"
            onClick={() => !submitting && resetForm()}
          />
          <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-secondary">
                {editingBanner ? "Edit Banner" : "New Banner"}
              </h2>
              <button
                onClick={resetForm}
                className="text-secondary/40 hover:text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    placeholder="e.g. Summer Sale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle || ""}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    placeholder="e.g. Up to 50% off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="image"
                    required
                    value={formData.image}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    placeholder="https://..."
                  />
                  {formData.image && (
                    <div className="mt-2 rounded-lg overflow-hidden bg-sage-50 h-32 w-full border border-sage-100">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Link URL
                    </label>
                    <input
                      type="text"
                      name="link"
                      value={formData.link || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="/shop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      name="buttonText"
                      value={formData.buttonText || ""}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="Shop Now"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <div className="w-24">
                    <label className="block text-sm font-medium text-secondary mb-1">
                      Position
                    </label>
                    <input
                      type="number"
                      name="position"
                      min="0"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-3 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30"
                    />
                  </div>
                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-sage-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-secondary">
                        Active
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-sage-100">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-secondary bg-white rounded-lg hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm ring-1 ring-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingBanner ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
