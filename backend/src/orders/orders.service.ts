import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { ShiprocketService } from "../shipping/shiprocket.service";
import { EmailService, OrderEmailData } from "../email/email.service";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private prisma: PrismaService,
    private shiprocket: ShiprocketService,
    private email: EmailService,
  ) {}

  // ─── Email helpers ───────────────────────────────────────────────────────────

  private buildEmailData(order: any): OrderEmailData {
    return {
      orderNumber: order.orderNumber,
      customerName:
        order.address?.fullName ||
        `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
        "Customer",
      customerEmail: order.user?.email || "",
      phone: order.address?.phone || order.user?.phone || undefined,
      items: (order.items || []).map((i: any) => ({
        name: i.product?.name || "Product",
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      total: order.total,
      paymentMethod: order.payment?.method || "COD",
      address: {
        street: order.address?.addressLine1 || order.address?.street || "",
        city: order.address?.city || "",
        state: order.address?.state || "",
        zipCode: order.address?.postalCode || order.address?.zipCode || "",
        country: order.address?.country || "India",
      },
      createdAt: order.createdAt,
      awbCode: order.shipment?.awbCode || undefined,
      courierName: order.shipment?.courierName || undefined,
    };
  }

  private async sendOrderEmail(
    orderId: string,
    type: "confirmation" | "invoice" | "shipped" | "delivered",
  ): Promise<void> {
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
      const data = this.buildEmailData(order);
      if (type === "confirmation") await this.email.sendOrderConfirmation(data);
      else if (type === "invoice") await this.email.sendInvoice(data);
      else if (type === "shipped")
        await this.email.sendShippedNotification(data);
      else if (type === "delivered") {
        await this.email.sendDeliveredNotification(data);
        if (order.payment?.method === "COD") await this.email.sendInvoice(data);
      }
    } catch (err) {
      this.logger.error(
        `Email (${type}) failed for ${orderId}: ${err.message}`,
      );
    }
  }

  // Create new order from cart
  async createOrder(userId: string, createOrderDto: any) {
    const { addressId, paymentMethod, notes } = createOrderDto;

    if (![PaymentMethod.COD, PaymentMethod.RAZORPAY].includes(paymentMethod)) {
      throw new BadRequestException(
        "Invalid payment method. Supported methods: COD, RAZORPAY",
      );
    }

    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException("Address not found");
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    const orderItems = [];
    const usedCoupons = new Set();

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}`,
        );
      }

      const originalPrice = item.originalPrice || item.product.price;
      const itemPrice =
        item.discountedPrice || item.originalPrice || item.product.price;
      const discountPerItem = item.originalPrice
        ? item.originalPrice - itemPrice
        : 0;
      const pricePerItem = originalPrice - discountPerItem;
      const itemTotal = pricePerItem * item.quantity;
      const itemDiscount = discountPerItem * item.quantity;

      subtotal += originalPrice * item.quantity;
      totalDiscount += itemDiscount;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: pricePerItem,
        total: itemTotal,
      });

      // Track used coupons
      if (item.couponId) {
        usedCoupons.add(item.couponId);
      }
    }

    const tax = (subtotal - totalDiscount) * 0.18; // 18% GST on discounted amount
    const shippingCost = subtotal - totalDiscount > 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal - totalDiscount + tax + shippingCost;

    // Generate order number
    const orderNumber = `EXOV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: OrderStatus.PENDING,
          subtotal,
          tax,
          shippingCost,
          total,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
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
      });

      // Create payment record
      // COD stays PENDING until order is DELIVERED and cash is actually collected
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: total,
          currency: "INR",
          method: paymentMethod,
          status: "PENDING",
        },
      });

      // Create shipment record
      await tx.shipment.create({
        data: {
          orderId: newOrder.id,
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Track coupon usage
      for (const couponId of usedCoupons) {
        await tx.couponUsage.create({
          data: {
            id: `cu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            couponId: couponId as string,
            orderId: newOrder.id,
          },
        });

        // Increment coupon used count
        await tx.coupon.update({
          where: { id: couponId as string },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      return newOrder;
    });

    // Fire order confirmation email (async, non-blocking)
    this.sendOrderEmail(order.id, "confirmation").catch(() => {});

    return {
      success: true,
      order,
      message: "Order placed successfully",
    };
  }

  // Get user's orders
  async getUserOrders(userId: string) {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
                slug: true,
              },
            },
          },
        },
        address: true,
        payment: true,
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get single order for user
  async getUserOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        payment: true,
        shipment: true,
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
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  // Cancel order (user)
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        address: true,
        payment: true,
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException("Cannot cancel order at this stage");
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Restore stock
      for (const item of updated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updated;
    });

    // Send cancellation email (don't await — fire & forget)
    const customerEmail = order.user?.email;
    if (customerEmail) {
      const isOnlinePayment =
        !!order.payment && order.payment.method !== PaymentMethod.COD;

      const emailData = {
        orderNumber: order.orderNumber,
        customerName:
          order.address?.fullName ||
          `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
          "Customer",
        customerEmail,
        items: order.items.map((i: any) => ({
          name: i.product?.name || "Product",
          quantity: i.quantity,
          price: Number(i.price),
          total: Number(i.price) * i.quantity,
        })),
        subtotal: Number(order.subtotal ?? order.total),
        tax: Number(order.tax ?? 0),
        shippingCost: Number(order.shippingCost ?? 0),
        total: Number(order.total),
        paymentMethod: order.payment?.method || "COD",
        address: {
          street: order.address?.addressLine1 || "",
          city: order.address?.city || "",
          state: order.address?.state || "",
          zipCode: order.address?.postalCode || "",
          country: order.address?.country || "India",
        },
        createdAt: order.createdAt,
      };

      this.email
        .sendCancellationEmail(emailData, isOnlinePayment)
        .catch((err) =>
          this.logger.error(`Cancellation email failed: ${err.message}`),
        );
    }

    return {
      success: true,
      order: updatedOrder,
      message: "Order cancelled successfully",
    };
  }

  // === ADMIN METHODS ===

  // Get all orders with filters
  async getAllOrders(filters: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, page = 1, limit = 50, search } = filters;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
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
              product: {
                select: {
                  id: true,
                  name: true,
                  thumbnail: true,
                },
              },
            },
          },
          payment: true,
          address: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get order by ID (admin)
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
            product: true,
          },
        },
        address: true,
        payment: true,
        shipment: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  // Update order status (admin)
  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException("Invalid order status");
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
        notes: notes || undefined,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If status is SHIPPED, update shipment shippedAt
    if (status === OrderStatus.SHIPPED) {
      await this.prisma.shipment.update({
        where: { orderId },
        data: { shippedAt: new Date() },
      });
      this.sendOrderEmail(orderId, "shipped").catch(() => {});
    }

    // If status is CONFIRMED → auto-push order to Shiprocket
    if (status === OrderStatus.CONFIRMED && this.shiprocket.isConfigured) {
      const fullOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
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
          items: { include: { product: true } },
          address: true,
          payment: true,
          shipment: true,
        },
      });
      if (fullOrder && !fullOrder.shipment?.shiprocketOrderId) {
        try {
          const srRes = await this.shiprocket.createOrder(fullOrder as any);
          await this.prisma.shipment.update({
            where: { orderId },
            data: {
              shiprocketOrderId: String(srRes.order_id),
              shiprocketShipmentId: String(srRes.shipment_id),
              awbCode: srRes.awb_code || null,
              courierName: srRes.courier_name || null,
              shiprocketStatus: srRes.status || null,
              carrier: srRes.courier_name || null,
              trackingNumber: srRes.awb_code || null,
            },
          });
          this.logger.log(
            `Shiprocket order pushed for ${orderId}: awb=${srRes.awb_code}`,
          );
        } catch (err) {
          // Non-fatal — log but don't block the status update
          this.logger.error(
            `Shiprocket push failed for ${orderId}: ${err.message}`,
          );
        }
      }
    }

    // If status is CANCELLED → cancel on Shiprocket
    if (status === OrderStatus.CANCELLED && this.shiprocket.isConfigured) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { orderId },
      });
      if (shipment?.shiprocketOrderId) {
        try {
          await this.shiprocket.cancelOrder([
            Number(shipment.shiprocketOrderId),
          ]);
        } catch (err) {
          this.logger.error(
            `Shiprocket cancel failed for ${orderId}: ${err.message}`,
          );
        }
      }
    }

    // If status is DELIVERED, update shipment deliveredAt
    if (status === OrderStatus.DELIVERED) {
      await this.prisma.shipment.update({
        where: { orderId },
        data: { deliveredAt: new Date() },
      });

      // Update payment if COD
      await this.prisma.payment.updateMany({
        where: { orderId, method: "COD" },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
      this.sendOrderEmail(orderId, "delivered").catch(() => {});
    }

    return {
      success: true,
      order,
      message: `Order status updated to ${status}`,
    };
  }

  // Update shipment info (admin)
  async updateShipment(orderId: string, shipmentDto: any) {
    const shipment = await this.prisma.shipment.update({
      where: { orderId },
      data: {
        carrier: shipmentDto.carrier,
        trackingNumber: shipmentDto.trackingNumber,
        trackingUrl: shipmentDto.trackingUrl,
        estimatedDelivery: shipmentDto.estimatedDelivery
          ? new Date(shipmentDto.estimatedDelivery)
          : undefined,
        notes: shipmentDto.notes,
      },
    });

    return {
      success: true,
      shipment,
      message: "Shipment info updated",
    };
  }

  // Get order statistics (admin)
  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
    };
  }

  // Export orders to CSV (admin)
  async exportOrdersCSV(status?: string) {
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert to CSV format
    const csvRows = [
      [
        "Order Number",
        "Date",
        "Customer Name",
        "Email",
        "Phone",
        "Status",
        "Payment Method",
        "Subtotal",
        "Tax",
        "Shipping",
        "Total",
      ].join(","),
    ];

    orders.forEach((order) => {
      csvRows.push(
        [
          order.orderNumber,
          new Date(order.createdAt).toLocaleDateString(),
          `${order.user.firstName} ${order.user.lastName}`,
          order.user.email,
          order.user.phone || "N/A",
          order.status,
          order.payment?.method || "N/A",
          order.subtotal,
          order.tax,
          order.shippingCost,
          order.total,
        ].join(","),
      );
    });

    return {
      csv: csvRows.join("\n"),
      filename: `orders-${new Date().toISOString().split("T")[0]}.csv`,
    };
  }

  // Public: Track order by order number (no auth required)
  async trackOrderPublic(orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
      include: {
        shipment: true,
        items: {
          include: {
            product: { select: { name: true, thumbnail: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    let liveTracking: any = null;

    // Fetch live tracking from Shiprocket if AWB available
    if (order.shipment?.awbCode && this.shiprocket.isConfigured) {
      try {
        const srData = await this.shiprocket.trackByAWB(order.shipment.awbCode);
        const td = srData?.tracking_data;
        if (td) {
          liveTracking = {
            currentStatus: td.current_status,
            courierName: td.courier_name,
            awb: td.awb_code,
            etd: td.etd,
            activities: (td.shipment_track_activities || [])
              .slice(0, 10)
              .map((a: any) => ({
                date: a.date,
                activity: a.activity,
                location: a.location,
              })),
          };
          // Update shiprocketStatus in DB
          await this.prisma.shipment.update({
            where: { orderId: order.id },
            data: { shiprocketStatus: td.current_status },
          });
        }
      } catch (err) {
        this.logger.warn(
          `Live tracking fetch failed for ${orderNumber}: ${err.message}`,
        );
      }
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.product.name,
        thumbnail: i.product.thumbnail,
        quantity: i.quantity,
        price: i.price,
      })),
      shipment: order.shipment
        ? {
            carrier: order.shipment.courierName || order.shipment.carrier,
            awbCode: order.shipment.awbCode,
            trackingNumber: order.shipment.trackingNumber,
            trackingUrl: order.shipment.trackingUrl,
            shippedAt: order.shipment.shippedAt,
            deliveredAt: order.shipment.deliveredAt,
            estimatedDelivery: order.shipment.estimatedDelivery,
            shiprocketStatus: order.shipment.shiprocketStatus,
          }
        : null,
      liveTracking,
    };
  }
}
