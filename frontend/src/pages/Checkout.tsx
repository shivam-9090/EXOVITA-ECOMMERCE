import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { STORE_API_URL } from "../apiBase";
import "./Checkout.css";

const API_URL = STORE_API_URL;

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, cartTotal, refreshCart, cartLoaded } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const orderPlacedRef = useRef(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(
    "RAZORPAY",
  );

  const [addressForm, setAddressForm] = useState({
    fullName: user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    isDefault: true,
  });

  const shipping = useMemo(() => (cartTotal > 500 ? 0 : 50), [cartTotal]);
  const tax = useMemo(() => cartTotal * 0.18, [cartTotal]);
  const grandTotal = useMemo(
    () => cartTotal + shipping + tax,
    [cartTotal, shipping, tax],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/");
      return;
    }

    if (!cartLoaded) return; // Wait for cart to finish loading before checking emptiness
    if (orderPlacedRef.current) return; // Don't redirect after order is placed

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    fetchAddresses();
  }, [user, authLoading, items.length, cartLoaded, navigate]);

  const handleGPSFill = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          if (!res.ok) throw new Error("Geocoding failed");
          const data = await res.json();
          const addr = data.address || {};
          const road = [addr.road, addr.suburb].filter(Boolean).join(", ");
          setAddressForm((prev) => ({
            ...prev,
            addressLine1: road || prev.addressLine1,
            city:
              addr.city ||
              addr.town ||
              addr.village ||
              addr.county ||
              prev.city,
            state: addr.state || prev.state,
            country: addr.country || prev.country,
            postalCode: addr.postcode || prev.postalCode,
          }));
          toast.success(
            "Location detected! Please verify and complete the address.",
          );
        } catch {
          toast.error(
            "Could not fetch address details. Please fill in manually.",
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Location permission denied. Please allow access or fill address manually.",
          );
        } else {
          toast.error(
            "Unable to detect location. Please fill address manually.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/users/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list: Address[] = response.data || [];
      setAddresses(list);

      const defaultAddress = list.find((address) => address.isDefault);
      setSelectedAddressId(defaultAddress?.id || list[0]?.id || "");
      setShowAddressForm(list.length === 0);
    } catch (error) {
      console.error("Failed to fetch addresses", error);
      setAddresses([]);
      setShowAddressForm(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const saveNewAddress = async () => {
    if (
      !addressForm.fullName ||
      !addressForm.phone ||
      !addressForm.addressLine1 ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.country ||
      !addressForm.postalCode
    ) {
      toast.error("Please fill all required address fields");
      return;
    }

    try {
      setSavingAddress(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${API_URL}/users/me/addresses`,
        addressForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const createdAddress: Address = response.data;
      setAddresses((prev) => {
        const next = createdAddress.isDefault
          ? prev.map((address) => ({ ...address, isDefault: false }))
          : prev;
        return [createdAddress, ...next];
      });
      setSelectedAddressId(createdAddress.id);
      setShowAddressForm(false);

      setAddressForm((prev) => ({
        ...prev,
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select or add an address before checkout");
      return;
    }

    try {
      setPlacingOrder(true);
      const token = localStorage.getItem("accessToken");

      const orderResponse = await axios.post(
        `${API_URL}/orders`,
        {
          addressId: selectedAddressId,
          paymentMethod,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const order = orderResponse.data?.order;
      if (!order?.id) {
        throw new Error("Order creation failed");
      }

      if (paymentMethod === "COD") {
        orderPlacedRef.current = true;
        await refreshCart();
        toast.success("Order placed successfully!");
        navigate("/my-orders");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay. Please try again.");
      }

      const paymentResponse = await axios.post(
        `${API_URL}/payments/create-order`,
        { orderId: order.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const paymentOrder = paymentResponse.data;

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "EXOVITA",
        description: `Order ${paymentOrder.orderNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email,
          contact: user?.phone || undefined,
        },
        handler: async (response: any) => {
          try {
            await axios.post(
              `${API_URL}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            await refreshCart();
            toast.success("Payment successful and order confirmed!");
            navigate("/my-orders");
          } catch (error: any) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
        theme: {
          color: "#5C705E",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Checkout failed", error);
      toast.error(
        error.response?.data?.message || error.message || "Checkout failed",
      );
      setPlacingOrder(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          <section className="checkout-section">
            <div className="checkout-section-header">
              <h2>1. Billing Address</h2>
              {!showAddressForm && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowAddressForm(true)}
                >
                  Add New Address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <p>Loading addresses...</p>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="address-list">
                    {addresses.map((address) => (
                      <label key={address.id} className="address-card">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <div>
                          <p className="address-name">
                            {address.fullName}{" "}
                            {address.isDefault ? "(Default)" : ""}
                          </p>
                          <p>{address.phone}</p>
                          <p>
                            {address.addressLine1}
                            {address.addressLine2
                              ? `, ${address.addressLine2}`
                              : ""}
                          </p>
                          <p>
                            {address.city}, {address.state}, {address.country} -{" "}
                            {address.postalCode}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="address-form">
                    <button
                      type="button"
                      className="gps-btn"
                      onClick={handleGPSFill}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? (
                        <Loader2 size={16} className="spinning" />
                      ) : (
                        <MapPin size={16} />
                      )}
                      {gpsLoading
                        ? "Detecting location..."
                        : "Auto-fill with GPS"}
                    </button>
                    <div className="form-grid">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={addressForm.addressLine1}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            addressLine1: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={addressForm.addressLine2}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            addressLine2: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={addressForm.country}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <label className="default-checkbox">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            isDefault: e.target.checked,
                          }))
                        }
                      />
                      Save as default address
                    </label>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={saveNewAddress}
                        disabled={savingAddress}
                      >
                        {savingAddress ? "Saving..." : "Save Address"}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setShowAddressForm(false)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="checkout-section order-summary">
            <h2>2. Payment & Summary</h2>

            <div className="payment-methods">
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "RAZORPAY"}
                  onChange={() => setPaymentMethod("RAZORPAY")}
                />
                Pay Online (Razorpay)
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on Delivery
              </label>
            </div>

            <div className="summary-lines">
              <div className="line-item">
                <span>Items ({items.length})</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="line-item">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="line-item">
                <span>Tax (GST 18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="line-item total-line">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placingOrder || loadingAddresses}
            >
              {placingOrder
                ? "Processing..."
                : paymentMethod === "RAZORPAY"
                  ? "Pay & Place Order"
                  : "Place Order"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
