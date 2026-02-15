import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate slug if creating new category and changing name
      if (name === "name" && !editingCategory) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in");
        return;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image: formData.image || null,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await axios.put(
          `${API_URL}/categories/${editingCategory.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await axios.post(`${API_URL}/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      closeModal();
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, productCount: number = 0) => {
    if (productCount > 0) {
      alert(
        "Cannot delete category with products. Please move or delete products first.",
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(error.response?.data?.message || "Failed to delete category");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      isActive: true,
    });
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Categories</h1>
          <p className="mt-1 text-sm text-secondary/60">
            Organize your products into categories.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-secondary/40" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 py-2 pl-10 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-white shadow-sm"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
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
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Slug
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Products
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100 bg-white">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-secondary/60"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-sage-50 flex items-center justify-center mb-3">
                          <Search className="h-6 w-6 text-sage-300" />
                        </div>
                        <p>No categories found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-sage-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-sage-100 flex items-center justify-center overflow-hidden">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-secondary/40" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary">
                              {category.name}
                            </div>
                            {category.description && (
                              <div className="text-xs text-secondary/60 truncate max-w-xs">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary/70">
                        <code className="bg-sage-50 px-1.5 py-0.5 rounded text-xs font-mono border border-sage-100">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-secondary/80">
                          {category._count?.products || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {category.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary-dark ring-1 ring-inset ring-primary/20">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-1 text-xs font-medium text-secondary/60 ring-1 ring-inset ring-sage-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 text-secondary/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                category.id,
                                category._count?.products,
                              )
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              (category._count?.products || 0) > 0
                                ? "text-sage-300 cursor-not-allowed"
                                : "text-secondary/40 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title={
                              (category._count?.products || 0) > 0
                                ? "Cannot delete category with products"
                                : "Delete"
                            }
                            disabled={(category._count?.products || 0) > 0}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-secondary/20 backdrop-blur-sm transition-opacity"
            onClick={() => !submitting && closeModal()}
          />
          <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5 border-b border-sage-100 pb-4">
              <h2 className="text-xl font-bold text-secondary">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={closeModal}
                className="text-secondary/40 hover:text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-secondary"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-sage-50/30"
                    placeholder="e.g. Living Room"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium leading-6 text-secondary"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-sage-50/30"
                    placeholder="e.g. living-room"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-secondary"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-sage-50/30"
                    placeholder="About this category..."
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium leading-6 text-secondary"
                >
                  Image URL
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    name="image"
                    id="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-2 px-3 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm bg-sage-50/30"
                    placeholder="https://..."
                  />
                </div>
                {formData.image && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-sage-50 h-32 w-full">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center pt-2">
                <div className="flex h-6 items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-sage-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label
                    htmlFor="isActive"
                    className="font-medium text-secondary"
                  >
                    Active
                  </label>
                  <p className="text-secondary/60">Visible in the store</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-3 pt-4 border-t border-sage-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-secondary bg-white rounded-lg hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
