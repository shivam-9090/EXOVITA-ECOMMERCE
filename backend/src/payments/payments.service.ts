import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import Razorpay from "razorpay";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;
  private razorpayKeyId: string;
  private razorpayKeySecret: string;
  private razorpayWebhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.razorpayKeyId =
      this.configService.get<string>("RAZORPAY_KEY_ID") || "";
    this.razorpayKeySecret =
      this.configService.get<string>("RAZORPAY_KEY_SECRET") || "";
    this.razorpayWebhookSecret =
      this.configService.get<string>("RAZORPAY_WEBHOOK_SECRET") || "";
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
