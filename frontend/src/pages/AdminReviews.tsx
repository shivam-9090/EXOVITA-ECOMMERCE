import { useState, useEffect } from "react";
import axios from "axios";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  thumbnail: string | null;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  isPublished: boolean;
  createdAt: string;
  user: User;
  product: Product;
}

interface Stats {
  total: number;
  published: number;
  unpublished: number;
  verified: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "unpublished"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [verifiedFilter, setVerifiedFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, [page, search, statusFilter, ratingFilter, verifiedFilter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch review stats:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
        status: statusFilter,
      };

      if (search) params.search = search;
      if (ratingFilter) params.rating = ratingFilter;
      if (verifiedFilter !== "all") {
        params.isVerified = verifiedFilter === "verified" ? "true" : "false";
      }

      const response = await axios.get(`${API_URL}/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setReviews(response.data.reviews);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (reviewId: string) => {
    try {
      await axios.patch(
        `${API_URL}/reviews/admin/${reviewId}/toggle-publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update review status");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/reviews/admin/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete review");
    }
  };

  const renderStars = (rating: number, size: "small" | "large" = "small") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size === "small" ? 14 : 18}
            className={`${star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reviews & Ratings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and manage customer feedback and product ratings.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Reviews
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-lg bg-sage-50 p-2 text-primary">
                <MessageSquare size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">
                  {stats.verified}
                </span>{" "}
                verified purchases
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Published</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stats.published}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Eye size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">
                  {stats.unpublished}
                </span>{" "}
                pending moderation
              </span>
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall Rating
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400">/ 5.0</span>
                </div>
              </div>
              <div className="flex-1 max-w-xs ml-4 space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-slate-500">{rating}★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${stats.total > 0 ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.total) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="w-6 text-right text-slate-400">
                      {
                        stats.ratingDistribution[
                          rating as keyof typeof stats.ratingDistribution
                        ]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Content */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 placeholder:text-secondary/40 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="block rounded-lg border-0 py-2 pl-3 pr-8 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Hidden</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value ? parseInt(e.target.value) : "");
                setPage(1);
              }}
              className="block rounded-lg border-0 py-2 pl-3 pr-8 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
            >
              <option value="">All Ratings</option>
              <option value="5">★★★★★</option>
              <option value="4">★★★★☆</option>
              <option value="3">★★★☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="1">★☆☆☆☆</option>
            </select>

            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value as any);
                setPage(1);
              }}
              className="block rounded-lg border-0 py-2 pl-3 pr-8 text-secondary shadow-sm ring-1 ring-inset ring-sage-200 focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6"
            >
              <option value="all">Any Type</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center h-64 rounded-xl bg-white shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-slate-500 text-sm">Loading reviews...</p>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 text-slate-400">
              <MessageSquare className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              No reviews found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`relative flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${!review.isPublished ? "bg-slate-50/50" : ""}`}
              >
                {!review.isPublished && (
                  <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                    Unpublished
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    {/* Product Info */}
                    <div className="hidden sm:block h-16 w-16 flex-shrink-0 rounded-lg bg-slate-50 overflow-hidden">
                      {review.product.thumbnail ? (
                        <img
                          src={review.product.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MessageSquare className="text-slate-300" size={20} />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-slate-900">
                        {review.product.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-slate-400">
                          • {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="mt-2 text-sm font-semibold text-slate-800">
                          {review.title}
                        </h4>
                      )}
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {review.user.firstName.charAt(0)}
                      {review.user.lastName.charAt(0)}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        {review.user.firstName} {review.user.lastName}
                        {review.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <CheckCircle size={10} /> Verified Buyer
                          </span>
                        )}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {review.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(review.id)}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        review.isPublished
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-inset ring-amber-600/20"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-inset ring-emerald-600/20"
                      }`}
                    >
                      {review.isPublished ? (
                        <>
                          <EyeOff size={14} className="mr-1.5" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye size={14} className="mr-1.5" /> Publish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-sm">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{totalPages}</span> ({total}{" "}
                  results)
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
