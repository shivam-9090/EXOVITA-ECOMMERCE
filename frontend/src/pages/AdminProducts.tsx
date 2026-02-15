import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Package,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sku: string;
  thumbnail: string;
  category: {
    id: string;
    name: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/products?limit=100`, {
        headers,
      });

      // Handle different response structures
      const data = response.data;
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to perform this action");
        return;
      }
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-secondary/60 font-medium">Loading Products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-sage-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">
            Products
          </h1>
          <p className="mt-2 text-sm text-secondary/60">
            Manage your product catalog, pricing, and inventory.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="hidden sm:inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-secondary shadow-sm shadow-sage-200 ring-1 ring-inset ring-sage-200 hover:bg-sage-50 transition-all hover:shadow-md">
            Export
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-0.5"
            onClick={() => navigate("/admin/products/new")}
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search size={18} className="text-secondary/40" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border-0 py-2.5 pl-11 pr-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all bg-sage-50/30 hover:bg-white"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-secondary/70 hover:text-secondary transition-colors px-4 py-2.5 rounded-xl hover:bg-sage-50 bg-white border border-sage-200 shadow-sm">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-sage-100">
            <thead className="bg-sage-50/50">
              <tr>
                <th
                  scope="col"
                  className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-8 py-5 text-left text-xs font-bold uppercase tracking-wider text-secondary/50"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-8 py-5 text-right text-xs font-bold uppercase tracking-wider text-secondary/50"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-8 py-5 text-center text-xs font-bold uppercase tracking-wider text-secondary/50"
                >
                  Stock
                </th>
                <th scope="col" className="relative px-8 py-5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-secondary/40">
                      <div className="h-16 w-16 bg-sage-50 rounded-full flex items-center justify-center mb-4">
                        <Package size={32} className="text-secondary/30" />
                      </div>
                      <p className="text-lg font-medium text-secondary">
                        No products found
                      </p>
                      <p className="text-sm mt-1 mb-6">
                        Try adjusting your search or add a new product.
                      </p>
                      <button
                        onClick={() => navigate("/admin/products/new")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <Plus size={16} /> Add New Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="group hover:bg-sage-50/30 transition-colors"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-sage-50 flex items-center justify-center border border-sage-200 overflow-hidden relative group-hover:border-primary/30 transition-colors">
                          {product.thumbnail ? (
                            <img
                              className="h-full w-full object-cover"
                              src={product.thumbnail}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                (
                                  e.target as HTMLImageElement
                                ).nextElementSibling?.classList.remove(
                                  "hidden",
                                );
                              }}
                            />
                          ) : (
                            <Package size={20} className="text-secondary/30" />
                          )}
                          <div className="hidden h-full w-full flex items-center justify-center bg-sage-50 text-secondary/30 absolute inset-0">
                            <Package size={20} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-secondary group-hover:text-primary transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-secondary/50 font-medium mt-0.5">
                            SKU: {product.sku || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="inline-flex items-center rounded-lg bg-sage-50 border border-sage-200 px-2.5 py-1 text-xs font-medium text-secondary/70">
                        {product.category?.name || "Uncategorized"}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          product.isActive !== false
                            ? "bg-primary/10 text-primary-dark ring-primary/20"
                            : "bg-sage-100 text-secondary/60 ring-secondary/10"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full mr-1.5 ${product.isActive !== false ? "bg-primary" : "bg-secondary/40"}`}
                        ></span>
                        {product.isActive !== false ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-bold text-secondary">
                      ₹{product.price?.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${product.stock > 10 ? "bg-primary" : "bg-rose-500"}`}
                        ></div>
                        <span
                          className={`font-medium ${product.stock > 10 ? "text-secondary/70" : "text-rose-600"}`}
                        >
                          {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          className="p-2 text-secondary/40 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/products/edit/${product.id}`)
                          }
                          className="p-2 text-secondary/40 hover:text-gold-dark rounded-lg hover:bg-gold/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 text-secondary/40 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="border-t border-sage-100 bg-sage-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-secondary/60">
                    Showing{" "}
                    <span className="font-semibold text-secondary">1</span> to{" "}
                    <span className="font-semibold text-secondary">
                      {filteredProducts.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-secondary">
                      {products.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button className="relative inline-flex items-center rounded-l-xl px-2 py-2 text-secondary/40 ring-1 ring-inset ring-sage-200 hover:bg-white hover:text-secondary focus:z-20 focus:outline-offset-0 transition-colors">
                      <span className="sr-only">Previous</span>
                      <ChevronLeft size={16} />
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary ring-1 ring-inset ring-primary focus:z-20 focus:outline-offset-0">
                      1
                    </button>
                    <button className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-secondary/40 ring-1 ring-inset ring-sage-200 hover:bg-white hover:text-secondary focus:z-20 focus:outline-offset-0 transition-colors">
                      <span className="sr-only">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
