import { Injectable, Logger } from "@nestjs/common";

interface ShiprocketOrder {
  id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    fullName?: string;
    addressLine1?: string;
  };
  items: Array<{
    product: { name: string; id: string };
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  payment?: { method: string };
}

interface ShiprocketTokenResponse {
  token: string;
}

interface ShiprocketCreateResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  awb_code?: string;
  courier_name?: string;
  pickup_scheduled_date?: string;
  routing_code?: string;
}

interface TrackingActivity {
  date: string;
  activity: string;
  location: string;
}

interface ShiprocketTrackResponse {
  tracking_data?: {
    shipment_id?: number;
    awb_code?: string;
    courier_name?: string;
    current_status?: string;
    etd?: string;
    shipment_track_activities?: TrackingActivity[];
  };
}

@Injectable()
export class ShiprocketService {
  private readonly logger = new Logger(ShiprocketService.name);
  private readonly baseUrl = "https://apiv2.shiprocket.in/v1/external";

  // Token cache
  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private get email() {
    return process.env.SHIPROCKET_EMAIL || "";
  }
  private get password() {
    return process.env.SHIPROCKET_PASSWORD || "";
  }
  private get pickupLocation() {
    return process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
  }
  private get channelId() {
    return process.env.SHIPROCKET_CHANNEL_ID || "";
  }

  get isConfigured(): boolean {
    return !!(this.email && this.password);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  async getToken(): Promise<string> {
    // Return cached token if still valid (Shiprocket tokens last 10 days, refresh every 9)
    if (
      this.cachedToken &&
      this.tokenExpiresAt &&
      new Date() < this.tokenExpiresAt
    ) {
      return this.cachedToken;
    }

    if (!this.isConfigured) {
      throw new Error("Shiprocket credentials not configured in environment");
    }

    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket auth failed: ${err}`);
    }

    const data = (await res.json()) as ShiprocketTokenResponse;
    this.cachedToken = data.token;
    // Cache for 9 days
    this.tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    this.logger.log("Shiprocket token refreshed");
    return this.cachedToken;
  }

  // ─── Create Shiprocket Order ──────────────────────────────────────────────────

  async createOrder(order: ShiprocketOrder): Promise<ShiprocketCreateResponse> {
    const token = await this.getToken();

    const addr = order.address;
    const user = order.user;
    const firstName = user?.firstName || "Customer";
    const lastName = user?.lastName || "";
    const email = user?.email || "customer@exovita.com";

    // Prefer address phone → user phone → fallback. Strip non-digits and ensure 10 digits.
    const rawPhone = (addr as any).phone || user?.phone || "9999999999";
    const digitsOnly = String(rawPhone).replace(/\D/g, "");
    // Take last 10 digits (handles +91 prefix etc.)
    const phone =
      digitsOnly.length >= 10
        ? digitsOnly.slice(-10)
        : digitsOnly.padEnd(10, "0");

    const paymentMethod = order.payment?.method === "COD" ? "COD" : "Prepaid";

    const orderItems = order.items.map((item) => ({
      name: item.product.name,
      sku: `EXOV-${item.product.id.slice(0, 8).toUpperCase()}`,
      units: item.quantity,
      selling_price: String(item.price),
      discount: "0",
      tax: "",
      hsn: "",
    }));

    const payload = {
      order_id: order.orderNumber,
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: this.pickupLocation,
      ...(this.channelId ? { channel_id: this.channelId } : {}),

      // Billing = Shipping
      billing_customer_name:
        (addr as any).fullName || firstName + (lastName ? " " + lastName : ""),
      billing_last_name: "",
      billing_address: (addr as any).addressLine1 || addr.street || "N/A",
      billing_city: addr.city,
      billing_pincode: addr.postalCode,
      billing_state: addr.state,
      billing_country: addr.country || "India",
      billing_email: email,
      billing_phone: phone,

      shipping_is_billing: 1,

      order_items: orderItems,

      payment_method: paymentMethod,
      sub_total: order.subtotal,

      // Default dimensions (configurable via env)
      length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
      breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 10),
      height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 10),
      weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5),
    };

    const res = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket create order failed: ${err}`);
    }

    const data = (await res.json()) as ShiprocketCreateResponse;
    this.logger.log(
      `Shiprocket order created: orderId=${data.order_id} shipmentId=${data.shipment_id} awb=${data.awb_code}`,
    );
    return data;
  }

  // ─── Track by AWB ────────────────────────────────────────────────────────────

  async trackByAWB(awb: string): Promise<ShiprocketTrackResponse> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}/courier/track/awb/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Shiprocket tracking failed: ${err}`);
    }

    return (await res.json()) as ShiprocketTrackResponse;
  }

  // ─── Cancel Order ────────────────────────────────────────────────────────────

  async cancelOrder(shiprocketOrderIds: number[]): Promise<void> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}/orders/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: shiprocketOrderIds }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Shiprocket cancel failed: ${err}`);
    }
  }
}
