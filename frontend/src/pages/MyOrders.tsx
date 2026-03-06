import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { STORE_API_URL } from "../apiBase";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Star,
  ExternalLink,
  MapPin,
  IndianRupee,
  CreditCard,
  Banknote,
  RefreshCw,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Hash,
  AlertTriangle,
  Loader2,
  Activity,
  Navigation,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./MyOrders.css";

const API_URL = STORE_API_URL;

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; thumbnail?: string; slug?: string };
}

interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface OrderPayment {
  method: string;
  status: string;
  amount: number;
  transactionId?: string;
  paidAt?: string;
}

interface OrderShipment {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  awbCode?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  address?: OrderAddress;
  payment?: OrderPayment;
  shipment?: OrderShipment;
}

const STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> =
  {
    PENDING: { label: "Pending", color: "#92400e", bg: "#fef3c7" },
    CONFIRMED: { label: "Confirmed", color: "#1e40af", bg: "#dbeafe" },
    PROCESSING: { label: "Processing", color: "#9a3412", bg: "#fff7ed" },
    SHIPPED: { label: "Shipped", color: "#065f46", bg: "#d1fae5" },
    DELIVERED: { label: "Delivered", color: "#fff", bg: "#5c705e" },
    CANCELLED: { label: "Cancelled", color: "#fff", bg: "#ef4444" },
  };

const FILTERS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const MyOrders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    orderNumber: string;
    paymentMethod: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [liveTracking, setLiveTracking] = useState<Record<string, any>>({});
  const [trackLoading, setTrackLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/");
      return;
    }
    fetchOrders();
  }, [user, authLoading, navigate]);

  const fetchOrders = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/orders/${cancelTarget.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        "Order cancelled — cancellation confirmation sent to your email",
      );
      setCancelTarget(null);
      fetchOrders(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const fetchLiveTracking = async (orderNumber: string, orderId: string) => {
    setTrackLoading((prev) => new Set(prev).add(orderId));
    try {
      const res = await axios.get(`${API_URL}/orders/track/${orderNumber}`);
      const data = res.data;
      setLiveTracking((prev) => ({
        ...prev,
        [orderId]: data.liveTracking || data.shipment || null,
      }));
      if (!data.liveTracking && !data.shipment?.awbCode) {
        toast.info(
          "No live tracking data yet — tracking will appear once shipped",
        );
      }
    } catch {
      toast.error("Could not fetch live tracking");
    } finally {
      setTrackLoading((prev) => {
        const s = new Set(prev);
        s.delete(orderId);
        return s;
      });
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const trackingId = (s?: OrderShipment) => s?.awbCode || s?.trackingNumber;
  const courierName = (s?: OrderShipment) => s?.courierName || s?.carrier;
  const getImg = (item: OrderItem) => item.product?.thumbnail || null;

  const filtered = orders.filter((o) => {
    // Hide PENDING Razorpay orders — these are incomplete payments (modal opened but not paid)
    if (o.status === "PENDING" && o.payment?.method === "RAZORPAY") return false;
    return filter === "ALL" || o.status === filter;
  });

  if (loading)
    return (
      <div className="mo-page">
        <div className="mo-loading">
          <div className="mo-spinner" />
          <p>Loading orders�</p>
        </div>
      </div>
    );

  return (
    <>
      <div className="mo-page">
        <div className="mo-container">
          {/* -- Header -- */}
          <div className="mo-header">
            <div className="mo-header-left">
              <ShoppingBag size={28} className="mo-header-icon" />
              <div>
                <h1>My Orders</h1>
                <p>
                  {orders.length} order{orders.length !== 1 ? "s" : ""} total
                </p>
              </div>
            </div>
            <button
              className={`mo-refresh-btn${refreshing ? " spinning" : ""}`}
              onClick={() => fetchOrders(true)}
            >
              <RefreshCw size={16} />
              {refreshing ? "Refreshing�" : "Refresh"}
            </button>
          </div>

          {/* -- Filter tabs -- */}
          <div className="mo-filters">
            {FILTERS.map((f) => {
              const cnt =
                f === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === f).length;
              return (
                <button
                  key={f}
                  className={`mo-filter-btn${filter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {STATUS_CFG[f]?.label || f}
                  {cnt > 0 && <span className="mo-badge">{cnt}</span>}
                </button>
              );
            })}
          </div>

          {/* -- Empty state -- */}
          {filtered.length === 0 ? (
            <div className="mo-empty">
              <Package size={64} />
              <h2>
                No{" "}
                {filter !== "ALL"
                  ? (STATUS_CFG[filter]?.label || filter).toLowerCase()
                  : ""}{" "}
                orders
              </h2>
              {filter === "ALL" ? (
                <p>Place your first order and it will appear here</p>
              ) : (
                <p>No orders with this status</p>
              )}
              <button
                className="mo-btn-primary"
                onClick={() => navigate("/shop")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="mo-list">
              {filtered.map((order) => {
                const cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
                const isOpen = expanded.has(order.id);
                const canCancel = ["PENDING", "CONFIRMED"].includes(
                  order.status,
                );
                const canReview = order.status === "DELIVERED";
                const si = STATUS_STEPS.indexOf(order.status);

                return (
                  <div
                    key={order.id}
                    className={`mo-card${isOpen ? " open" : ""}`}
                  >
                    {/* Top bar */}
                    <div className="mo-card-top">
                      <div className="mo-card-meta">
                        <span className="mo-order-num">
                          <Hash size={13} />
                          {order.orderNumber}
                        </span>
                        <span className="mo-order-date">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <span
                        className="mo-status"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Product row */}
                    <div className="mo-products-row">
                      <div className="mo-thumbs">
                        {order.items.slice(0, 4).map((item, idx) => {
                          const img = getImg(item);
                          return (
                            <div
                              key={item.id}
                              className="mo-thumb"
                              style={{ zIndex: 10 - idx }}
                            >
                              {img ? (
                                <img src={img} alt={item.product.name} />
                              ) : (
                                <div className="mo-thumb-ph">
                                  <Package size={14} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {order.items.length > 4 && (
                          <div className="mo-thumb mo-thumb-more">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="mo-price-col">
                        <span className="mo-price-label">Total Paid</span>
                        <span className="mo-price-val">
                          <IndianRupee size={13} />
                          {order.total.toFixed(2)}
                        </span>
                        {order.payment && (
                          <span className="mo-pay-tag">
                            {order.payment.method === "COD" ? (
                              <>
                                <Banknote size={11} /> Cash on Delivery
                              </>
                            ) : (
                              <>
                                <CreditCard size={11} /> Online
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item names */}
                    <div className="mo-item-chips">
                      {order.items.map((item) => (
                        <span key={item.id} className="mo-chip">
                          {item.product.name} �{item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Tracking pill */}
                    {order.shipment &&
                      (trackingId(order.shipment) ||
                        courierName(order.shipment)) && (
                        <div className="mo-tracking-pill">
                          <Truck size={13} />
                          <strong>
                            {courierName(order.shipment) || "Courier"}
                          </strong>
                          {trackingId(order.shipment) && (
                            <span className="mo-awb">
                              {trackingId(order.shipment)}
                            </span>
                          )}
                          {order.shipment.trackingUrl && (
                            <a
                              href={order.shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mo-track-link"
                            >
                              Track <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}

                    {/* Expandable details */}
                    {isOpen && (
                      <div className="mo-details">
                        {/* Timeline */}
                        {order.status !== "CANCELLED" && (
                          <div className="mo-timeline">
                            {STATUS_STEPS.map((step, i) => (
                              <React.Fragment key={step}>
                                <div
                                  className={`mo-tl-step${si >= i ? " done" : ""}${si === i ? " current" : ""}`}
                                >
                                  <div className="mo-tl-dot">
                                    {si >= i ? (
                                      <CheckCircle size={13} />
                                    ) : (
                                      <span>{i + 1}</span>
                                    )}
                                  </div>
                                  <span className="mo-tl-label">
                                    {STATUS_CFG[step]?.label || step}
                                  </span>
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div
                                    className={`mo-tl-line${si > i ? " done" : ""}`}
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}

                        {/* Items */}
                        <div className="mo-section">
                          <h4 className="mo-sec-title">
                            <Package size={14} /> Order Items
                          </h4>
                          {order.items.map((item) => (
                            <div key={item.id} className="mo-item-row">
                              <div className="mo-item-img">
                                {getImg(item) ? (
                                  <img
                                    src={getImg(item)!}
                                    alt={item.product.name}
                                  />
                                ) : (
                                  <Package size={18} />
                                )}
                              </div>
                              <div className="mo-item-info">
                                <span className="mo-item-name">
                                  {item.product.name}
                                </span>
                                <span className="mo-item-qty">
                                  Qty: {item.quantity} � ?
                                  {item.price.toFixed(2)} each
                                </span>
                              </div>
                              <span className="mo-item-total">
                                <IndianRupee size={12} />
                                {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Address */}
                        {order.address && (
                          <div className="mo-section">
                            <h4 className="mo-sec-title">
                              <MapPin size={14} /> Delivery Address
                            </h4>
                            <div className="mo-address">
                              <p className="mo-addr-name">
                                {order.address.fullName} � {order.address.phone}
                              </p>
                              <p>
                                {order.address.addressLine1}
                                {order.address.addressLine2
                                  ? `, ${order.address.addressLine2}`
                                  : ""}
                              </p>
                              <p>
                                {order.address.city}, {order.address.state} �{" "}
                                {order.address.postalCode},{" "}
                                {order.address.country}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Shipping */}
                        {order.shipment && (
                          <div className="mo-section">
                            <div className="mo-sec-header-row">
                              <h4 className="mo-sec-title">
                                <Truck size={14} /> Shipping Details
                              </h4>
                              {trackingId(order.shipment) && (
                                <button
                                  className="mo-live-track-btn"
                                  onClick={() =>
                                    fetchLiveTracking(
                                      order.orderNumber,
                                      order.id,
                                    )
                                  }
                                  disabled={trackLoading.has(order.id)}
                                >
                                  {trackLoading.has(order.id) ? (
                                    <>
                                      <Loader2 size={12} className="mo-spin" />{" "}
                                      Loading…
                                    </>
                                  ) : (
                                    <>
                                      <Navigation size={12} /> Live Track
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="mo-sh-grid">
                              {courierName(order.shipment) && (
                                <div className="mo-sh-cell">
                                  <span>Courier</span>
                                  <strong>{courierName(order.shipment)}</strong>
                                </div>
                              )}
                              {trackingId(order.shipment) && (
                                <div className="mo-sh-cell">
                                  <span>AWB / Tracking #</span>
                                  <strong className="mono">
                                    {trackingId(order.shipment)}
                                  </strong>
                                </div>
                              )}
                              {order.shipment.estimatedDelivery && (
                                <div className="mo-sh-cell">
                                  <span>Est. Delivery</span>
                                  <strong>
                                    {new Date(
                                      order.shipment.estimatedDelivery,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </strong>
                                </div>
                              )}
                              {order.shipment.shippedAt && (
                                <div className="mo-sh-cell">
                                  <span>Shipped On</span>
                                  <strong>
                                    {new Date(
                                      order.shipment.shippedAt,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </strong>
                                </div>
                              )}
                              {order.shipment.trackingUrl && (
                                <div className="mo-sh-cell full">
                                  <a
                                    href={order.shipment.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mo-track-full"
                                  >
                                    <ExternalLink size={13} /> Open Courier
                                    Tracking
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Live Shiprocket tracking */}
                            {liveTracking[order.id] && (
                              <div className="mo-live-tracking">
                                <div className="mo-live-header">
                                  <Activity size={14} />
                                  <strong>Live Status</strong>
                                  {liveTracking[order.id].currentStatus && (
                                    <span className="mo-live-status">
                                      {liveTracking[order.id].currentStatus}
                                    </span>
                                  )}
                                  {liveTracking[order.id].etd && (
                                    <span className="mo-live-etd">
                                      ETA:{" "}
                                      {new Date(
                                        liveTracking[order.id].etd,
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </span>
                                  )}
                                </div>
                                {liveTracking[order.id].activities?.length >
                                  0 && (
                                  <div className="mo-activities">
                                    {liveTracking[order.id].activities.map(
                                      (act: any, i: number) => (
                                        <div key={i} className="mo-activity">
                                          <div className="mo-act-dot" />
                                          <div className="mo-act-body">
                                            <span className="mo-act-text">
                                              {act.activity}
                                            </span>
                                            <span className="mo-act-meta">
                                              {act.location && (
                                                <span>{act.location}</span>
                                              )}
                                              {act.date && (
                                                <span>
                                                  {new Date(
                                                    act.date,
                                                  ).toLocaleString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  })}
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment summary */}
                        <div className="mo-section">
                          <h4 className="mo-sec-title">
                            <IndianRupee size={14} /> Payment
                          </h4>
                          <div className="mo-summary">
                            {order.payment && (
                              <>
                                <div className="mo-sum-row">
                                  <span>Method</span>
                                  <span className="mo-pay-method">
                                    {order.payment.method === "COD" ? (
                                      <>
                                        <Banknote size={13} /> Cash on Delivery
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard size={13} />{" "}
                                        {order.payment.method}
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="mo-sum-row">
                                  <span>Payment Status</span>
                                  <span
                                    className={`mo-pay-status ${(order.payment.status || "").toLowerCase()}`}
                                  >
                                    {order.payment.status}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="mo-sum-row total">
                              <span>Total</span>
                              <span>?{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mo-card-footer">
                      <button
                        className="mo-btn-toggle"
                        onClick={() => toggle(order.id)}
                      >
                        {isOpen ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                        {isOpen ? "Hide Details" : "View Details"}
                      </button>
                      <div className="mo-actions">
                        {canCancel && (
                          <button
                            className="mo-btn-cancel"
                            onClick={() =>
                              setCancelTarget({
                                id: order.id,
                                orderNumber: order.orderNumber,
                                paymentMethod: order.payment?.method || "COD",
                              })
                            }
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                        {canReview && order.items[0] && (
                          <button
                            className="mo-btn-review"
                            onClick={() =>
                              navigate(
                                `/product/${order.items[0].product.id}?review=true&order=${order.orderNumber}`,
                              )
                            }
                          >
                            <Star size={14} /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {cancelTarget && (
        <div
          className="mo-modal-overlay"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Cancel Order?</h3>
            <p className="mo-modal-order-num">
              Order #{cancelTarget.orderNumber}
            </p>

            {cancelTarget.paymentMethod === "COD" ? (
              <div className="mo-modal-info cod">
                <Banknote size={15} />
                <span>
                  Cash on Delivery — no refund needed. Your order will simply be
                  cancelled.
                </span>
              </div>
            ) : (
              <div className="mo-modal-info online">
                <CreditCard size={15} />
                <span>
                  Online payment detected — your refund will be processed within{" "}
                  <strong>72 hours</strong> to your original payment method.
                </span>
              </div>
            )}

            <p className="mo-modal-note">
              A cancellation confirmation will be sent to your email.
            </p>

            <div className="mo-modal-actions">
              <button
                className="mo-modal-btn-keep"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="mo-modal-btn-confirm"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={14} className="mo-spin" /> Cancelling…
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Yes, Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrders;
