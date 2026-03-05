import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  awbCode?: string;
  courierName?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly companyInfo = {
    name: "Exovita Herbal",
    address:
      "I-705 Megh Malhar Residancy, Sarthana Jakatnaka, Surat, Gujarat 395006",
    email: "ariski@exovitaherbal.com",
    website: "https://exovitaherbal.com",
    phone: "+91 96245 42207",
  };

  private readonly colors = {
    primary: "#5c705e",
    secondary: "#1a1c18",
    gold: "#c5a059",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#334155",
    border: "#e2e8f0",
  };

  private get isConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  private get fromAddress(): string {
    const name = process.env.SMTP_FROM_NAME || "Exovita Herbal";
    const email = process.env.SMTP_USER || "ariski@exovitaherbal.com";
    return `"${name}" <${email}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  async sendOTP(email: string, name: string, otp: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn("SMTP not configured — skipping OTP email");
      return;
    }

    const content = `
      <div style="text-align:center;padding:10px 0 30px;">
        <h2 style="margin:0 0 16px;color:#1a1c18;font-size:20px;font-weight:600;letter-spacing:-0.5px;">Verify Your Email</h2>
        <p style="margin:0 0 30px;color:#64748b;font-size:15px;line-height:1.6;">Hello <strong>${name}</strong>,<br/>Please use the following code to complete your registration.</p>     

        <div style="display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px 48px;margin-bottom:30px;">       
          <span style="font-size:32px;font-weight:700;color:#5c705e;letter-spacing:6px;font-family:'Courier New', monospace;">${otp}</span>
        </div>

        <p style="margin:0 0 10px;color:#64748b;font-size:14px;">This code is valid for <strong>10 minutes</strong>.</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    const html = this.baseWrapper(content, "Verify Your Email");

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: email,
        subject: `${otp} is your verification code | Exovita Herbal`,
        html,
      });
      this.logger.log(`OTP sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${email}: ${err.message}`);
      throw err;
    }
  }

  async sendOrderConfirmation(data: OrderEmailData): Promise<void> {
    if (!this.isConfigured) return;

    const subject = `Order Confirmed #${data.orderNumber}`;
    const html = this.baseWrapper(
      this.buildOrderConfirmationContent(data),
      "Order Confirmation",
    );

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      this.logger.log(
        `Order confirmation sent to ${data.customerEmail} [${data.orderNumber}]`,
      );
    } catch (err) {
      this.logger.error(`Failed to send order confirmation: ${err.message}`);
    }
  }

  async sendInvoice(data: OrderEmailData): Promise<void> {
    if (!this.isConfigured) return;

    const subject = `Invoice for Order #${data.orderNumber}`;
    const html = this.baseWrapper(this.buildInvoiceContent(data), "Invoice");

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      this.logger.log(
        `Invoice sent to ${data.customerEmail} [${data.orderNumber}]`,
      );
    } catch (err) {
      this.logger.error(`Failed to send invoice: ${err.message}`);
    }
  }

  async sendShippedNotification(data: OrderEmailData): Promise<void> {
    if (!this.isConfigured) return;

    const subject = `Order Dispatched #${data.orderNumber}`;
    const html = this.baseWrapper(
      this.buildShippedContent(data),
      "Order Dispatched",
    );

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      this.logger.log(
        `Shipped notification sent to ${data.customerEmail} [${data.orderNumber}]`,
      );
    } catch (err) {
      this.logger.error(`Failed to send shipped notification: ${err.message}`);
    }
  }

  async sendDeliveredNotification(data: OrderEmailData): Promise<void> {
    if (!this.isConfigured) return;

    const subject = `Order Delivered #${data.orderNumber}`;
    const html = this.baseWrapper(
      this.buildDeliveredContent(data),
      "Order Delivered",
    );

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      this.logger.log(
        `Delivered notification sent to ${data.customerEmail} [${data.orderNumber}]`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send delivered notification: ${err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE BUILDERS
  // ─────────────────────────────────────────────────────────────────────────────

  private baseWrapper(content: string, title: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { color: ${this.colors.gold}; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .btn { display: inline-block; background-color: ${this.colors.primary}; color: #ffffff !important; padding: 12px 30px; border-radius: 4px; font-size: 14px; font-weight: 500; text-decoration: none !important; }
    .btn:hover { background-color: #4a5a4b; text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;color:${this.colors.text};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <!-- Main Container -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:0px;">
        
        <!-- Header -->
        <tr>
          <td style="padding:40px 0 30px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <h1 style="margin:0;color:${this.colors.primary};font-size:24px;font-weight:600;letter-spacing:2px;font-family:'Times New Roman', serif;text-transform:uppercase;">EXOVITA HERBAL</h1>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Nature's Finest Wellness</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 48px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#1a1c18;padding:40px 20px;text-align:center;">
            <p style="margin:0 0 20px;color:#e2e8f0;font-size:14px;font-weight:500;letter-spacing:1px;">${this.companyInfo.name.toUpperCase()}</p>
            
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.6;">${this.companyInfo.address}</p>
            
            <div style="margin:20px 0;">
              <span style="display:inline-block;margin:0 10px;color:#94a3b8;font-size:12px;">${this.companyInfo.email}</span>
              <span style="display:inline-block;margin:0 10px;color:#52525b;font-size:12px;">|</span>
              <span style="display:inline-block;margin:0 10px;color:#94a3b8;font-size:12px;">${this.companyInfo.phone}</span>
            </div>
            
            <div style="margin:20px 0 30px;">
              <a href="${this.companyInfo.website}" style="color:#c5a059;font-size:12px;margin:0 10px;text-transform:uppercase;letter-spacing:1px;">Website</a>
              <a href="${this.companyInfo.website}/shop" style="color:#c5a059;font-size:12px;margin:0 10px;text-transform:uppercase;letter-spacing:1px;">Shop</a>
              <a href="${this.companyInfo.website}/my-orders" style="color:#c5a059;font-size:12px;margin:0 10px;text-transform:uppercase;letter-spacing:1px;">My Orders</a>
            </div>

            <p style="margin:0;color:#52525b;font-size:11px;">© ${year} ${this.companyInfo.name}. All rights reserved.</p>
          </td>
        </tr>
      </table>
      
      <p style="margin:20px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
        You received this email because you placed an order or registered on our website.
      </p>

    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildOrderConfirmationContent(data: OrderEmailData): string {
    return `
      <h2 style="font-size:22px;color:${this.colors.secondary};font-weight:600;margin-bottom:20px;">Order Confirmation</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:24px;">
        Dear <strong>${data.customerName.split(" ")[0]}</strong>,<br/><br/>
        Thank you for your order. We have received your request and are currently processing it.
      </p>

      <div style="margin-bottom:30px;border:1px solid #e2e8f0;border-radius:6px;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top">
              <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Order Number</p>
              <p style="font-size:16px;color:${this.colors.secondary};font-weight:600;margin:0;">#${data.orderNumber}</p>
            </td>
            <td valign="top" style="text-align:right;">
             <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Date</p>
              <p style="font-size:15px;color:${this.colors.secondary};font-weight:500;margin:0;">${new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </td>
          </tr>
        </table>
      </div>

      <h3 style="font-size:14px;color:${this.colors.secondary};border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Order Summary</h3>
      ${this.itemsTableHTML(data.items)}
      ${this.totalsHTML(data)}

      <div style="margin-top:40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:20px;">
              <h4 style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Billing & Shipping Address</h4>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
                ${data.customerName}<br/>
                ${data.address.street}<br/>
                ${data.address.city}, ${data.address.state}<br/>
                ${data.address.zipCode}<br/>
                ${data.address.country || "India"}<br/>
                ${data.phone ? `T: ${data.phone}` : ""}
              </p>
            </td>
            <td width="50%" valign="top">
              <h4 style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Payment Method</h4>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
                ${data.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (Razorpay)"}
              </p>
              
              ${
                data.paymentMethod === "COD"
                  ? `
              <div style="margin-top:15px;background-color:#f9fafb;border-left:3px solid ${this.colors.gold};padding:10px;font-size:13px;color:#64748b;line-height:1.5;">
                Total due on delivery: <strong>₹${Math.round(data.total).toLocaleString("en-IN")}</strong>
              </div>
              `
                  : ""
              }
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align:center;margin-top:40px;">
        <a href="${this.companyInfo.website}/my-orders" class="btn">View Order Details</a>
      </div>
    `;
  }

  private buildInvoiceContent(data: OrderEmailData): string {
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `
      <div style="border-bottom:1px solid #e2e8f0;padding-bottom:20px;margin-bottom:30px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top">
              <h2 style="margin:0;color:${this.colors.secondary};font-size:24px;font-weight:600;">TAX INVOICE</h2>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Original for Recipient</p>
            </td>
            <td align="right" valign="top">
               <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Invoice No.</p>
               <p style="margin:0;font-size:16px;color:#475569;font-weight:600;">INV-${data.orderNumber}</p>
            </td>
          </tr>
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
        <tr>
          <td width="50%" valign="top" style="padding-right:20px;">
            <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:8px;">Seller</p>
            <p style="font-size:14px;color:${this.colors.secondary};font-weight:600;margin:0 0 4px;">${this.companyInfo.name}</p>
            <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
              ${this.companyInfo.address}<br/>
              GSTIN: 24ABCD1234E1Z5<br/>
              Email: ${this.companyInfo.email}
            </p>
          </td>
          <td width="50%" valign="top" style="padding-left:20px;">
            <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:8px;">Buyer</p>
            <p style="font-size:14px;color:${this.colors.secondary};font-weight:600;margin:0 0 4px;">${data.customerName}</p>
            <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
              ${data.address.street}<br/>
              ${data.address.city}, ${data.address.state}<br/>
              ${data.address.zipCode}<br/>
              Phone: ${data.phone || "N/A"}
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;background-color:#f8fafc;border-radius:4px;padding:15px;">
        <tr>
          <td width="50%">
            <p style="font-size:13px;color:#64748b;margin:0;">Order Reference: <strong>${data.orderNumber}</strong></p>
          </td>
          <td width="50%" align="right">
            <p style="font-size:13px;color:#64748b;margin:0;">Date: <strong>${invoiceDate}</strong></p>
          </td>
        </tr>
      </table>

      ${this.itemsTableHTML(data.items)}
      ${this.totalsHTML(data)}

      <div style="margin-top:40px;text-align:center;border-top:1px dashed #e2e8f0;padding-top:20px;">
        <p style="font-size:12px;color:#94a3b8;margin-bottom:5px;">This is a computer generated invoice and does not require a signature.</p>
      </div>
    `;
  }

  private buildShippedContent(data: OrderEmailData): string {
    return `
      <h2 style="font-size:22px;color:${this.colors.secondary};font-weight:600;margin-bottom:20px;text-align:center;">Dispatch Notification</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin-bottom:30px;">
        Your order <strong>#${data.orderNumber}</strong> has been dispatched and is on its way to you.
      </p>

      ${
        data.awbCode
          ? `
      <div style="background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:24px;text-align:center;margin-bottom:30px;">
        <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;margin-bottom:8px;letter-spacing:1px;">Tracking Number</p>
        <p style="font-size:18px;color:${this.colors.secondary};font-weight:600;margin:0 0 8px;letter-spacing:1px;font-family:monospace;">${data.awbCode}</p>
        <p style="font-size:13px;color:#64748b;">Carrier: ${data.courierName || "Standard Shipping"}</p>
      </div>
      `
          : ""
      }

      <div style="margin-bottom:30px;">
        <h3 style="font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Items in Shipment</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          ${data.items
            .map(
              (item) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">${item.name}</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:right;">Qty: ${item.quantity}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
      </div>

      <div style="text-align:center;margin-top:40px;">
        <a href="${this.companyInfo.website}/my-orders" class="btn">Track Shipment</a>
      </div>
    `;
  }

  private buildDeliveredContent(data: OrderEmailData): string {
    return `
      <h2 style="font-size:22px;color:${this.colors.secondary};font-weight:600;margin-bottom:20px;text-align:center;">Delivery Update</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin-bottom:30px;">
         We are pleased to inform you that your order <strong>#${data.orderNumber}</strong> has been delivered successfully.
      </p>

      <div style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:30px 0;margin-bottom:30px;">
        <p style="font-size:15px;color:#334155;line-height:1.6;text-align:center;margin:0;">
          We hope you enjoy your purchase. Your journey to wellness is important to us, and we would love to hear about your experience.
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${this.companyInfo.website}/my-orders" class="btn">Leave a Review</a>
      </div>
    `;
  }

  async sendCancellationEmail(
    data: OrderEmailData,
    isOnlinePayment: boolean,
  ): Promise<void> {
    if (!this.isConfigured) return;

    const subject = `Order Cancelled #${data.orderNumber}`;
    const html = this.baseWrapper(
      this.buildCancellationContent(data, isOnlinePayment),
      "Order Cancelled",
    );

    try {
      await this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.customerEmail,
        subject,
        html,
      });
      this.logger.log(
        `Cancellation email sent to ${data.customerEmail} [${data.orderNumber}]`,
      );
    } catch (err) {
      this.logger.error(`Failed to send cancellation email: ${err.message}`);
    }
  }

  private buildCancellationContent(
    data: OrderEmailData,
    isOnlinePayment: boolean,
  ): string {
    const refundNote = isOnlinePayment
      ? `<div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:20px 24px;margin:28px 0;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#92400e;">Refund Information</p>
          <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">
            Since you paid online, your refund of <strong>₹${data.total.toFixed(2)}</strong> will be credited back
            to your original payment method within <strong>72 hours</strong>.
          </p>
        </div>`
      : `<div style="background:#f0fdf4;border-left:4px solid #5c705e;border-radius:8px;padding:20px 24px;margin:28px 0;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#3d5241;">Cash on Delivery Order</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            As this was a Cash on Delivery order, no payment was collected, so no refund is required.
            Your order has been cancelled and stock has been restored.
          </p>
        </div>`;

    return `
      <h2 style="font-size:22px;color:#ef4444;font-weight:600;margin-bottom:8px;text-align:center;">Order Cancelled</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin-bottom:24px;">
        Hi <strong>${data.customerName}</strong>, your order <strong>#${data.orderNumber}</strong> has been successfully cancelled.
      </p>

      ${refundNote}

      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:28px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">Cancelled Items</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${data.items
            .map(
              (item) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${item.name}</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;text-align:center;">×${item.quantity}</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:right;font-weight:600;">₹${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
          <tr>
            <td colspan="2" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#1a1c18;">Order Total</td>
            <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#5c705e;text-align:right;">₹${data.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:#64748b;line-height:1.6;text-align:center;margin-bottom:28px;">
        If you have any questions about your cancellation, please contact us at
        <a href="mailto:${this.companyInfo.email}" style="color:#5c705e;">${this.companyInfo.email}</a>
      </p>

      <div style="text-align:center;">
        <a href="${this.companyInfo.website}/shop" style="display:inline-block;background:#5c705e;color:#fff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">Continue Shopping</a>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BROADCAST / MARKETING EMAILS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Send a single broadcast email to one recipient.
   * Used internally by sendBulkBroadcast.
   */
  async sendBroadcastToOne(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    title: string,
    body: string,
    ctaText?: string,
    ctaUrl?: string,
  ): Promise<void> {
    if (!this.isConfigured) return;

    const ctaBlock =
      ctaText && ctaUrl
        ? `<div style="text-align:center;margin-top:36px;">
           <a href="${ctaUrl}" class="btn">${ctaText}</a>
         </div>`
        : "";

    const content = `
      <h2 style="font-size:22px;color:${this.colors.secondary};font-weight:600;margin-bottom:16px;">${title}</h2>
      <p style="font-size:14px;color:#64748b;margin-bottom:24px;">Dear <strong>${recipientName}</strong>,</p>
      <div style="font-size:15px;color:#334155;line-height:1.8;">${body}</div>
      ${ctaBlock}
    `;

    const html = this.baseWrapper(content, title);
    await this.getTransporter().sendMail({
      from: this.fromAddress,
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Bulk broadcast to multiple users with a small delay between sends
   * to avoid SMTP rate limiting.
   */
  async sendBulkBroadcast(
    recipients: Array<{ email: string; name: string }>,
    subject: string,
    title: string,
    body: string,
    ctaText?: string,
    ctaUrl?: string,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      this.logger.warn("SMTP not configured — skipping bulk broadcast");
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await this.sendBroadcastToOne(
          recipient.email,
          recipient.name,
          subject,
          title,
          body,
          ctaText,
          ctaUrl,
        );
        sent++;
        this.logger.log(`Broadcast sent to ${recipient.email}`);
        // Small delay to avoid SMTP rate limits (300ms between sends)
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        failed++;
        this.logger.error(
          `Broadcast failed for ${recipient.email}: ${err.message}`,
        );
      }
    }

    this.logger.log(`Broadcast complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Pre-built discount/promo announcement template
   */
  async sendDiscountAnnouncement(
    recipients: Array<{ email: string; name: string }>,
    opts: {
      subject: string;
      headline: string;
      discountCode?: string;
      discountPercent?: number;
      message: string;
      ctaText?: string;
      ctaUrl?: string;
      expiresAt?: string;
    },
  ): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) return { sent: 0, failed: 0 };

    const discountBlock = opts.discountCode
      ? `<div style="text-align:center;margin:30px 0;">
           <p style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Your Discount Code</p>
           <div style="display:inline-block;border:2px dashed ${this.colors.gold};border-radius:6px;padding:16px 40px;">
             <span style="font-size:26px;font-weight:700;color:${this.colors.primary};letter-spacing:6px;font-family:'Courier New',monospace;">${opts.discountCode}</span>
             ${opts.discountPercent ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">Save ${opts.discountPercent}% on your order</p>` : ""}
           </div>
           ${opts.expiresAt ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Valid until: ${opts.expiresAt}</p>` : ""}
         </div>`
      : "";

    const ctaBlock =
      opts.ctaText && opts.ctaUrl
        ? `<div style="text-align:center;margin-top:32px;">
           <a href="${opts.ctaUrl}" class="btn">${opts.ctaText}</a>
         </div>`
        : "";

    const body = `
      <h2 style="font-size:24px;color:${this.colors.secondary};font-weight:600;text-align:center;margin-bottom:20px;">${opts.headline}</h2>
      <div style="font-size:15px;color:#475569;line-height:1.8;text-align:center;margin-bottom:10px;">${opts.message}</div>
      ${discountBlock}
      ${ctaBlock}
    `;

    return this.sendBulkBroadcast(
      recipients,
      opts.subject,
      opts.headline,
      body,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMON TABLE COMPONENTS
  // ─────────────────────────────────────────────────────────────────────────────

  private itemsTableHTML(items: OrderEmailData["items"]): string {
    const rows = items
      .map(
        (item) => `
      <tr>
        <td style="padding:15px 0 15px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;vertical-align:top;">
          ${item.name}
        </td>
        <td style="padding:15px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center;vertical-align:top;">${item.quantity}</td>
        <td style="padding:15px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:right;vertical-align:top;">₹${item.price.toLocaleString("en-IN")}</td>
        <td style="padding:15px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right;font-weight:500;vertical-align:top;">₹${item.total.toLocaleString("en-IN")}</td>
      </tr>`,
      )
      .join("");

    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;">
      <thead>
        <tr>
          <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Product</th>
          <th style="padding:10px 0;text-align:center;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Qty</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Price</th>
          <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  private totalsHTML(data: OrderEmailData): string {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      <tr>
        <td width="60%"></td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#64748b;">Subtotal</td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#334155;">₹${data.subtotal.toLocaleString("en-IN")}</td>       
      </tr>
      <tr>
        <td width="60%"></td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#64748b;">Shipping</td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#334155;">${data.shippingCost === 0 ? "Free" : `₹${data.shippingCost.toLocaleString("en-IN")}`}</td>                                                                                                </tr>
      <tr>
        <td width="60%"></td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#64748b;">Tax</td>
        <td width="20%" style="padding:8px 0;text-align:right;font-size:13px;color:#334155;">₹${data.tax.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>                                                                                                </tr>
      <tr>
        <td width="60%"></td>
        <td width="20%" style="padding:15px 0;text-align:right;font-size:15px;font-weight:600;color:${this.colors.primary};border-top:1px solid #e2e8f0;">Total</td>
        <td width="20%" style="padding:15px 0;text-align:right;font-size:15px;font-weight:600;color:${this.colors.primary};border-top:1px solid #e2e8f0;">₹${data.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>                                                                                                     </tr>
    </table>`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT FORM EMAIL
  // ─────────────────────────────────────────────────────────────────────────────

  async sendContactEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn("SMTP not configured — skipping contact email");
      return;
    }

    const adminEmail = process.env.SMTP_USER || this.companyInfo.email;

    // Email to admin
    const adminHtml = this.baseWrapper(
      `
      <h2 style="font-size:20px;color:${this.colors.secondary};font-weight:700;margin-bottom:6px;">New Contact Message</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:24px;">A customer submitted the contact form on Exovita Herbal.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Name</strong><br/><span style="font-size:15px;color:#1e293b;">${data.name}</span></td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</strong><br/><a href="mailto:${data.email}" style="font-size:15px;color:${this.colors.primary};">${data.email}</a></td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;"><strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Subject</strong><br/><span style="font-size:15px;color:#1e293b;">${data.subject}</span></td></tr>
        <tr><td style="padding:12px 16px;"><strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Message</strong><br/><span style="font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${data.message}</span></td></tr>
      </table>

      <div style="text-align:center;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;background:${this.colors.primary};color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Reply to ${data.name}</a>
      </div>
    `,
      "New Contact Message",
    );

    // Auto-reply to customer
    const customerHtml = this.baseWrapper(
      `
      <h2 style="font-size:20px;color:${this.colors.secondary};font-weight:700;margin-bottom:8px;text-align:center;">Thanks for reaching out!</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.6;text-align:center;margin-bottom:24px;">
        Hi <strong>${data.name}</strong>, we've received your message and will get back to you within <strong>24–48 hours</strong>.
      </p>

      <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your message</p>
        <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1e293b;">${data.subject}</p>
        <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${data.message}</p>
      </div>

      <p style="font-size:14px;color:#64748b;line-height:1.6;text-align:center;">
        In the meantime, feel free to browse our range of Ayurvedic products or reach us directly at
        <a href="mailto:${this.companyInfo.email}" style="color:${this.colors.primary};">${this.companyInfo.email}</a>.
      </p>

      <div style="text-align:center;margin-top:28px;">
        <a href="${this.companyInfo.website}/shop" style="display:inline-block;background:${this.colors.primary};color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Explore Products</a>
      </div>
    `,
      "Message Received",
    );

    await Promise.allSettled([
      this.getTransporter().sendMail({
        from: this.fromAddress,
        to: adminEmail,
        subject: `[Contact] ${data.subject} — ${data.name}`,
        html: adminHtml,
        replyTo: data.email,
      }),
      this.getTransporter().sendMail({
        from: this.fromAddress,
        to: data.email,
        subject: `We received your message — Exovita Herbal`,
        html: customerHtml,
      }),
    ]);

    this.logger.log(`Contact email sent: ${data.email} / "${data.subject}"`);
  }
}
