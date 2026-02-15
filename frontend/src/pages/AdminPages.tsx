import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Check,
  X,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}/pages?includeUnpublished=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPages(response.data);
    } catch (error) {
      console.error("Error fetching pages:", error);
      alert("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle || "",
        metaDescription: page.metaDescription || "",
        isPublished: page.isPublished,
      });
    } else {
      setEditingPage(null);
      setFormData({
        slug: "",
        title: "",
        content: "",
        metaTitle: "",
        metaDescription: "",
        isPublished: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");

      if (editingPage) {
        await axios.put(`${API_URL}/pages/${editingPage.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/pages`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      handleCloseModal();
      fetchPages();
    } catch (error: any) {
      console.error("Error saving page:", error);
      alert(error.response?.data?.message || "Failed to save page");
    }
  };

  const handleTogglePublish = async (pageId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/pages/${pageId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchPages();
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Failed to toggle publish status");
    }
  };

  const handleDelete = async (pageId: number, slug: string) => {
    if (!confirm(`Are you sure you want to delete the page "${slug}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_URL}/pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Failed to delete page");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-slate-500 text-sm">Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Static Pages</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage informational pages (e.g., About Us, Legal, FAQ).
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors shadow-primary/20"
        >
          <Plus size={18} className="mr-2" />
          Add New Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            No pages found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating a new static page.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create Page
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md ${!page.isPublished ? "bg-slate-50/50 opacity-75" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold leading-6 text-slate-900 group-hover:text-primary transition-colors">
                    {page.title}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      page.isPublished
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                    }`}
                  >
                    {page.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-mono bg-slate-100 w-fit px-2 py-0.5 rounded">
                  <ExternalLink size={12} />/{page.slug}
                </div>

                {page.metaDescription && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {page.metaDescription}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span>Created: {formatDate(page.createdAt)}</span>
                  <span>•</span>
                  <span>Updated: {formatDate(page.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => handleTogglePublish(page.id)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-sage-50 rounded-lg transition-colors"
                  title={page.isPublished ? "Unpublish" : "Publish"}
                >
                  {page.isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => handleOpenModal(page)}
                  className="p-2 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(page.id, page.slug)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          <div className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPage ? "Edit Page" : "Create New Page"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <form
                id="page-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-slate-900">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
                      placeholder="e.g. Return Policy"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-slate-900">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      className="mt-2 block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 disabled:bg-slate-50 disabled:text-slate-500 disabled:ring-slate-200"
                      placeholder="e.g. return-policy"
                      required
                      disabled={!!editingPage}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      URL Friendly identifier.
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium leading-6 text-slate-900">
                    Page Content (HTML) *
                  </label>
                  <div className="mt-2">
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      rows={10}
                      className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 font-mono text-xs"
                      placeholder="<div>Enter your HTML content here...</div>"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Supports basic HTML tags.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-medium text-slate-900 mb-4">
                    SEO Settings (Optional)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-slate-900">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaTitle: e.target.value,
                          })
                        }
                        className="mt-2 block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-slate-900">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value,
                          })
                        }
                        rows={2}
                        className="mt-2 block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex h-6 items-center">
                    <input
                      id="isPublished"
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label
                      htmlFor="isPublished"
                      className="font-medium text-slate-900 select-none cursor-pointer"
                    >
                      Publish Immediately
                    </label>
                    <p className="text-slate-500">
                      If unchecked, the page will be saved as a draft.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end gap-3 z-10">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="page-form"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {editingPage ? "Update Page" : "Create Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPages;
