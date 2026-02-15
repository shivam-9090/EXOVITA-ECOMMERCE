import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./MyOrders.css";

const API_URL = "http://localhost:3000/api";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: any[];
  shipment: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
  } | null;
  deliveredAt: string | null;
}

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="status-icon delivered" />;
      case "SHIPPED":
        return <Truck className="status-icon shipped" />;
      case "PROCESSING":
        return <Package className="status-icon processing" />;
      case "CONFIRMED":
        return <Clock className="status-icon confirmed" />;
      case "CANCELLED":
        return <XCircle className="status-icon cancelled" />;
      default:
        return <Clock className="status-icon pending" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "#10b981";
      case "SHIPPED":
        return "#3b82f6";
      case "PROCESSING":
        return "#f59e0b";
      case "CONFIRMED":
        return "#8b5cf6";
      case "CANCELLED":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const canCancelOrder = (order: Order) => {
    return ["PENDING", "CONFIRMED"].includes(order.status);
  };

  const canReview = (order: Order) => {
    return order.status === "DELIVERED" && order.deliveredAt;
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Order cancelled successfully");
      fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleReviewProduct = (productId: number, orderNumber: string) => {
    navigate(`/product/${productId}?review=true&order=${orderNumber}`);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "ALL") return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="loading-container">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="my-orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="order-filters">
          {[
            "ALL",
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
          ].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <Package size={64} />
            <h2>No orders found</h2>
            <p>You haven't placed any orders yet</p>
            <button className="btn-primary" onClick={() => navigate("/shop")}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-number">
                    <Package size={20} />
                    <span>Order #{order.orderNumber}</span>
                  </div>
                  <div
                    className="order-status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <DollarSign size={16} />
                    <span>Total: ₹{order.total.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <Package size={16} />
                    <span>{order.items.length} item(s)</span>
                  </div>
                </div>

                {/* Tracking Information */}
                {order.shipment && (
                  <div className="tracking-info">
                    <div className="tracking-header">
                      <Truck size={18} />
                      <span>Shipment Tracking</span>
                    </div>
                    <div className="tracking-details">
                      <p>
                        <strong>Carrier:</strong> {order.shipment.carrier}
                      </p>
                      <p>
                        <strong>Tracking #:</strong>{" "}
                        {order.shipment.trackingNumber}
                      </p>
                      {order.shipment.estimatedDelivery && (
                        <p>
                          <strong>Est. Delivery:</strong>{" "}
                          {new Date(
                            order.shipment.estimatedDelivery,
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {order.shipment.trackingUrl && (
                        <a
                          href={order.shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="track-link"
                        >
                          Track Shipment <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items Preview */}
                <div className="order-items-preview">
                  {order.items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="item-thumbnail">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                      />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="more-items">+{order.items.length - 3}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="order-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Details
                  </button>

                  {canCancelOrder(order) && (
                    <button
                      className="btn-danger"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}

                  {canReview(order) && (
                    <button
                      className="btn-review"
                      onClick={() =>
                        handleReviewProduct(
                          order.items[0].product.id,
                          order.orderNumber,
                        )
                      }
                    >
                      <Star size={16} />
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div
              className="modal-content order-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Order Details #{selectedOrder.orderNumber}</h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="order-status-timeline">
                  <div
                    className={`timeline-step ${["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(selectedOrder.status) ? "completed" : ""}`}
                  >
                    <div className="step-icon">
                      <Clock size={20} />
                    </div>
                    <div className="step-label">Order Placed</div>
                  </div>
                  <div
                    className={`timeline-step ${["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(selectedOrder.status) ? "completed" : ""}`}
                  >
                    <div className="step-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="step-label">Confirmed</div>
                  </div>
                  <div
                    className={`timeline-step ${["PROCESSING", "SHIPPED", "DELIVERED"].includes(selectedOrder.status) ? "completed" : ""}`}
                  >
                    <div className="step-icon">
                      <Package size={20} />
                    </div>
                    <div className="step-label">Processing</div>
                  </div>
                  <div
                    className={`timeline-step ${["SHIPPED", "DELIVERED"].includes(selectedOrder.status) ? "completed" : ""}`}
                  >
                    <div className="step-icon">
                      <Truck size={20} />
                    </div>
                    <div className="step-label">Shipped</div>
                  </div>
                  <div
                    className={`timeline-step ${selectedOrder.status === "DELIVERED" ? "completed" : ""}`}
                  >
                    <div className="step-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="step-label">Delivered</div>
                  </div>
                </div>

                <div className="order-items-detail">
                  <h3>Order Items</h3>
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="order-item-detail">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                      />
                      <div className="item-info">
                        <h4>{item.product.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: ₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="item-total">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
