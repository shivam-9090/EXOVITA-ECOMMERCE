import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Package,
  DollarSign,
  BarChart,
  Image as ImageIcon,
  Layers,
  FileText,
  Tag,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

interface Category {
  id: string;
  name: string;
}

const AdminProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    ingredients: "",
    price: "",
    comparePrice: "",
    costPrice: "",
    sku: "",
    barcode: "",
    stock: "",
    lowStockAlert: "10",
    categoryId: "",
    thumbnail: "",
    images: [] as string[],
    howToUse: "",
    benefits: "",
    weight: "",
    dimensions: "",
    tags: "",
    isActive: true,
    isFeatured: false,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      if (id) fetchProduct(id);
    }
  }, [id, isEdit]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers,
      });
      const product = response.data;

      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        ingredients: product.ingredients || "",
        price: product.price?.toString() || "",
        comparePrice: product.comparePrice?.toString() || "",
        costPrice: product.costPrice?.toString() || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        stock: product.stock?.toString() || "",
        lowStockAlert: product.lowStockAlert?.toString() || "10",
        categoryId: product.categoryId || "",
        thumbnail: product.thumbnail || "",
        images: product.images || [],
        howToUse: product.howToUse || "",
        benefits: product.benefits || "",
        weight: product.weight?.toString() || "",
        dimensions: product.dimensions || "",
        tags: Array.isArray(product.tags)
          ? product.tags.join(", ")
          : product.tags || "",
        isActive: product.isActive !== false,
        isFeatured: !!product.isFeatured,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Failed to load product details");
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
    e: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    // Handle checkbox safely
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate slug from name only if adding new product and slug hasn't been manually edited
      if (name === "name" && !isEdit) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          thumbnail: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));

    // Clear the file input value if needed - harder with React ref but not critical
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.price ||
      !formData.categoryId ||
      !formData.sku
    ) {
      alert("Please fill in all required fields (Name, Price, Category, SKU)");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("You must be logged in to perform this action");
        navigate("/admin/login");
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice
          ? parseFloat(formData.comparePrice)
          : undefined,
        costPrice: formData.costPrice
          ? parseFloat(formData.costPrice)
          : undefined,
        stock: parseInt(formData.stock) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [],
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (isEdit && id) {
        await axios.patch(`${API_URL}/products/${id}`, payload, { headers });
        alert("Product updated successfully!");
      } else {
        await axios.post(`${API_URL}/products`, payload, { headers });
        alert("Product created successfully!");
      }

      navigate("/admin/products");
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !formData.name) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-secondary/60 font-medium">Loading Product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-sage-200">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="rounded-full p-2 text-secondary/60 hover:bg-white hover:text-secondary transition-colors shadow-sm ring-1 ring-sage-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-secondary">
                {isEdit ? "Edit Product" : "New Product"}
              </h1>
              <p className="text-sm text-secondary/60">
                {isEdit
                  ? `Editing "${formData.name}"`
                  : "Add a new product to your catalog"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="hidden sm:inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-secondary shadow-sm ring-1 ring-inset ring-sage-200 hover:bg-sage-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={18} />
              )}
              {isEdit ? "Update Product" : "Save Product"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* General Info */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-sage-200 pb-4">
                <FileText className="text-primary" size={20} />
                <h2 className="text-base font-bold leading-7 text-secondary">
                  General Information
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-sage-50/30 focus:outline-none"
                      placeholder="e.g. Organic Face Cream"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-bold leading-6 text-secondary"
                    >
                      Slug
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="slug"
                        id="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-0 py-3 px-4 text-secondary bg-sage-50 ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="sku"
                      className="block text-sm font-bold leading-6 text-secondary"
                    >
                      SKU (Stock Keeping Unit){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="sku"
                        id="sku"
                        required
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Description
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="Detailed product description..."
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="shortDescription"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Short Description
                  </label>
                  <div className="mt-2">
                    <textarea
                      name="shortDescription"
                      id="shortDescription"
                      rows={2}
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="Brief summary for listings..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-sage-200 pb-4">
                <ImageIcon className="text-primary" size={20} />
                <h2 className="text-base font-bold leading-7 text-secondary">
                  Media
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold leading-6 text-secondary mb-2">
                    Thumbnail
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-sage-200 flex items-center justify-center overflow-hidden bg-sage-50 relative group">
                      {formData.thumbnail ? (
                        <>
                          <img
                            src={formData.thumbnail}
                            alt="Thumbnail"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  thumbnail: "",
                                }))
                              }
                              className="text-white p-1 hover:text-red-400"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <ImageIcon className="text-secondary/40" size={32} />
                      )}
                    </div>
                    <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm font-semibold text-secondary shadow-sm ring-1 ring-inset ring-sage-200 hover:bg-sage-50">
                      <span>Change</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold leading-6 text-secondary mb-2">
                    Gallery Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg border border-sage-200 overflow-hidden relative group"
                      >
                        <img
                          src={img}
                          alt={`Gallery ${index}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-secondary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-sage-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <Upload className="text-secondary/40 mb-2" size={24} />
                      <span className="text-xs font-bold text-secondary/70">
                        Add Image
                      </span>
                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-sage-200 pb-4">
                <Layers className="text-primary" size={20} />
                <h2 className="text-base font-bold leading-7 text-secondary">
                  Additional Details
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold leading-6 text-secondary">
                    Ingredients
                  </label>
                  <textarea
                    name="ingredients"
                    rows={3}
                    value={formData.ingredients}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold leading-6 text-secondary">
                      How To Use
                    </label>
                    <textarea
                      name="howToUse"
                      rows={4}
                      value={formData.howToUse}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold leading-6 text-secondary">
                      Benefits
                    </label>
                    <textarea
                      name="benefits"
                      rows={4}
                      value={formData.benefits}
                      onChange={handleInputChange}
                      className="mt-2 block w-full rounded-lg border-0 py-3 px-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            {/* Status Card */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <h3 className="text-sm font-bold leading-7 text-secondary mb-4">
                Status
              </h3>
              <div className="space-y-4">
                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleInputChange} // Need to fix type in handler or cast
                      className="h-4 w-4 rounded border-sage-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label
                      htmlFor="isActive"
                      className="font-bold text-secondary"
                    >
                      Active
                    </label>
                    <p className="text-secondary/60">
                      Product is visible in store.
                    </p>
                  </div>
                </div>
                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="isFeatured"
                      name="isFeatured"
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-sage-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label
                      htmlFor="isFeatured"
                      className="font-bold text-secondary"
                    >
                      Featured Product
                    </label>
                    <p className="text-secondary/60">Highlight on homepage.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-primary" size={18} />
                <h3 className="text-sm font-bold leading-7 text-secondary">
                  Pricing
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Price
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-secondary/60 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 pl-7 pr-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comparePrice"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Compare at Price
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-secondary/60 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      name="comparePrice"
                      id="comparePrice"
                      value={formData.comparePrice}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 pl-7 pr-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="costPrice"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Cost per Item
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-secondary/60 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      name="costPrice"
                      id="costPrice"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 pl-7 pr-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-secondary/60">
                    Customers won't see this
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-primary" size={18} />
                <h3 className="text-sm font-bold leading-7 text-secondary">
                  Inventory
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="stock"
                    id="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-0 py-2 px-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="barcode"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Barcode (ISBN, UPC, GTIN)
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    id="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-0 py-2 px-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                  />
                </div>
              </div>
            </div>

            {/* Organization Card */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-sage-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="text-primary" size={18} />
                <h3 className="text-sm font-bold leading-7 text-secondary">
                  Organization
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="categoryId"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-0 py-2.5 px-4 text-secondary ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-bold leading-6 text-secondary"
                  >
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="mt-2 block w-full rounded-lg border-0 py-2 px-4 text-secondary ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 bg-sage-50/30"
                    placeholder="Comma separated tags"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
