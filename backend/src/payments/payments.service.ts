import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { EmailService } from "../email/email.service";

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;
  private razorpayKeyId: string;
  private razorpayKeySecret: string;
  private razorpayWebhookSecret: string;

  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private email: EmailService,
  ) {
    this.razorpayKeyId =
      this.configService.get<string>("RAZORPAY_KEY_ID") || "";
    this.razorpayKeySecret =
      this.configService.get<string>("RAZORPAY_KEY_SECRET") || "";
    this.razorpayWebhookSecret =
      this.configService.get<string>("RAZORPAY_WEBHOOK_SECRET") || "";
  }

  // ─── Email helper ─────────────────────────────────────────────────────────
  private async sendInvoiceEmail(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          items: { include: { product: { select: { name: true } } } },
          address: true,
          payment: true,
          shipment: true,
        },
      });
      if (!order?.user?.email) return;
      await this.email.sendInvoice({
        orderNumber: order.orderNumber,
        customerName:
          `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
          "Customer",
        customerEmail: order.user.email,
        items: order.items.map((i: any) => ({
          name: i.product?.name || "Product",
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        total: order.total,
        paymentMethod: order.payment?.method || "RAZORPAY",
        address: {
          street:
            order.address?.addressLine1 || (order.address as any)?.street || "",
          city: order.address?.city || "",
          state: order.address?.state || "",
          zipCode:
            order.address?.postalCode || (order.address as any)?.zipCode || "",
          country: order.address?.country || "India",
        },
        createdAt: order.createdAt,
        awbCode: order.shipment?.awbCode || undefined,
        courierName: order.shipment?.courierName || undefined,
      });
    } catch (err) {
      this.logger.error(`Invoice email failed for ${orderId}: ${err.message}`);
    }
  }

  private getRazorpayClient() {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new BadRequestException("Razorpay configuration missing");
    }

    if (!this.razorpay) {
      this.razorpay = new Razorpay({
        key_id: this.razorpayKeyId,
        key_secret: this.razorpayKeySecret,
      });
    }

    return this.razorpay;
  }

  async createPaymentOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (!order.payment) {
      throw new BadRequestException("Payment record missing for order");
    }

    if (order.payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException("Order is already paid");
    }

    if (order.payment.method !== PaymentMethod.RAZORPAY) {
      throw new BadRequestException(
        "This order is not configured for Razorpay payment",
      );
    }

    const amount = order.total;
    const amountInPaise = Math.round(amount * 100);
    const razorpayClient = this.getRazorpayClient();

    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId,
        userId,
      },
    });

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        amount,
        currency: "INR",
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.PENDING,
        transactionId: razorpayOrder.id,
        paymentGateway: "razorpay",
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          razorpayReceipt: razorpayOrder.receipt,
          userId,
        },
        failedAt: null,
      },
    });

    return {
      gateway: "razorpay",
      keyId: this.razorpayKeyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      exovitaOrderId: order.id,
      orderNumber: order.orderNumber,
    };
  }

  async verifyPayment(
    userId: string,
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId?: string;
    },
  ) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException("Missing payment verification payload");
    }

    if (!this.razorpayKeySecret) {
      throw new BadRequestException("Razorpay configuration missing");
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException("Invalid payment signature");
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        ...(orderId
          ? { orderId }
          : {
              transactionId: razorpay_order_id,
            }),
        order: {
          userId,
        },
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          failedAt: null,
          transactionId: razorpay_payment_id,
          paymentGateway: "razorpay",
          metadata: {
            ...(typeof payment.metadata === "object" && payment.metadata
              ? (payment.metadata as Record<string, unknown>)
              : {}),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            verifiedBy: "frontend-signature",
          },
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });
      // Send invoice email for Razorpay payment
      this.sendInvoiceEmail(payment.orderId).catch(() => {});
    }

    return { success: true };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.razorpayWebhookSecret) {
      throw new BadRequestException("Webhook configuration missing");
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.razorpayWebhookSecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new BadRequestException("Invalid webhook signature");
    }

    try {
      const event = JSON.parse(payload.toString("utf-8"));
      const paymentEntity = event?.payload?.payment?.entity;

      if (!paymentEntity) {
        return { received: true };
      }

      switch (event.type) {
        case "payment.captured":
        case "order.paid":
          await this.handlePaymentSuccess(paymentEntity);
          break;
        case "payment.failed":
          await this.handlePaymentFailed(paymentEntity);
          break;
      }

      return { received: true };
    } catch {
      throw new BadRequestException("Invalid webhook payload");
    }
  }

  private async handlePaymentSuccess(paymentEntity: any) {
    const payment = await this.findPaymentForWebhook(paymentEntity);

    if (!payment) {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        failedAt: null,
        transactionId: paymentEntity.id,
        paymentGateway: "razorpay",
        metadata: {
          ...(typeof payment.metadata === "object" && payment.metadata
            ? (payment.metadata as Record<string, unknown>)
            : {}),
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          eventStatus: paymentEntity.status,
        },
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });
    // Send invoice email via webhook
    this.sendInvoiceEmail(payment.orderId).catch(() => {});
  }

  private async handlePaymentFailed(paymentEntity: any) {
    const payment = await this.findPaymentForWebhook(paymentEntity);

    if (!payment) {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        paymentGateway: "razorpay",
        metadata: {
          ...(typeof payment.metadata === "object" && payment.metadata
            ? (payment.metadata as Record<string, unknown>)
            : {}),
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          eventStatus: paymentEntity.status,
        },
      },
    });
  }

  // ─── Admin methods ────────────────────────────────────────────────────────

  async getAdminPayments(filters: {
    status?: string;
    method?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { status, method, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (method && method !== "ALL") where.method = method;
    if (search) {
      where.OR = [
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        {
          order: { user: { email: { contains: search, mode: "insensitive" } } },
        },
        { transactionId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminStats() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPayments,
      completed,
      failed,
      pending,
      todayCompleted,
      monthCompleted,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      razorpayCount,
      codCount,
      razorpayRevenue,
      codRevenue,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: todayStart } },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: monthStart } },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: {
          method: PaymentMethod.RAZORPAY,
          status: PaymentStatus.COMPLETED,
        },
      }),
      this.prisma.payment.count({
        where: { method: PaymentMethod.COD, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.payment.aggregate({
        where: {
          method: PaymentMethod.RAZORPAY,
          status: PaymentStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { method: PaymentMethod.COD, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      completed,
      failed,
      pending,
      todayCompleted,
      monthCompleted,
      totalRevenue: totalRevenue._sum.amount || 0,
      todayRevenue: todayRevenue._sum.amount || 0,
      monthRevenue: monthRevenue._sum.amount || 0,
      razorpayCount,
      razorpayRevenue: razorpayRevenue._sum.amount || 0,
      codCount,
      codRevenue: codRevenue._sum.amount || 0,
    };
  }

  async getAdminPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: { select: { id: true, name: true, thumbnail: true } },
              },
            },
            address: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }

  async updatePaymentStatus(id: string, status: string, note?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException("Payment not found");

    const data: any = {
      status: status as PaymentStatus,
      metadata: {
        ...(typeof payment.metadata === "object" && payment.metadata
          ? (payment.metadata as Record<string, unknown>)
          : {}),
        adminNote: note,
        adminUpdatedAt: new Date().toISOString(),
      },
    };

    if (status === PaymentStatus.COMPLETED) data.paidAt = new Date();
    if (status === PaymentStatus.FAILED) data.failedAt = new Date();
    if (status === PaymentStatus.REFUNDED) data.refundedAt = new Date();

    return this.prisma.payment.update({ where: { id }, data });
  }

  private async findPaymentForWebhook(paymentEntity: any) {
    const exovitaOrderId = paymentEntity?.notes?.orderId;

    if (exovitaOrderId) {
      const paymentByOrder = await this.prisma.payment.findUnique({
        where: { orderId: exovitaOrderId },
      });

      if (paymentByOrder) {
        return paymentByOrder;
      }
    }

    if (!paymentEntity?.order_id) {
      return null;
    }

    return this.prisma.payment.findFirst({
      where: { transactionId: paymentEntity.order_id },
    });
  }
}
