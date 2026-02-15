import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(startDate?: Date, endDate?: Date) {
    const where: any = {
      status: { not: "CANCELLED" },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [orders, totalRevenue, avgOrderValue] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where,
        _avg: { total: true },
      }),
    ]);

    // Group by date for trends
    const dateFilter = [];
    if (startDate) dateFilter.push(Prisma.sql`AND "createdAt" >= ${startDate}`);
    if (endDate) dateFilter.push(Prisma.sql`AND "createdAt" <= ${endDate}`);

    const dailySales = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as orders,
          SUM("total")::float as revenue
        FROM orders
        WHERE status != 'CANCELLED'
        ${dateFilter.length > 0 ? Prisma.join(dateFilter, " ") : Prisma.empty}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,
    );

    // Payment method breakdown
    const paymentMethodStats = await this.prisma.payment.groupBy({
      by: ["method"],
      where: {
        status: "COMPLETED",
        order: { createdAt: where.createdAt },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Status breakdown
    const statusBreakdown = await this.prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: where.createdAt },
      _sum: { total: true },
      _count: true,
    });

    // Monthly revenue and orders for current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(MONTH FROM "createdAt")::int as month,
          COUNT(*)::int as orders,
          SUM("total")::float as revenue
        FROM orders
        WHERE status != 'CANCELLED'
          AND EXTRACT(YEAR FROM "createdAt") = ${currentYear}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month
      `,
    );

    // Format monthly data with month names
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyRevenue = monthNames.map((name, index) => {
      const monthData = monthlyStats.find((m) => m.month === index + 1);
      return {
        name,
        value: monthData?.revenue || 0,
      };
    });

    const monthlyOrders = monthNames.map((name, index) => {
      const monthData = monthlyStats.find((m) => m.month === index + 1);
      return {
        name,
        orders: monthData?.orders || 0,
      };
    });

    return {
      totalOrders: orders.length,
      totalRevenue: totalRevenue._sum.total || 0,
      avgOrderValue: avgOrderValue._avg.total || 0,
      orders,
      dailySales,
      monthlyRevenue,
      monthlyOrders,
      paymentMethodStats,
      statusBreakdown,
      dateRange: { startDate, endDate },
    };
  }

  async getProductPerformanceReport(startDate?: Date, endDate?: Date) {
    const where: any = {
      order: {
        status: { not: "CANCELLED" },
      },
    };

    if (startDate || endDate) {
      where.order = {
        ...where.order,
        createdAt: {},
      };
      if (startDate) where.order.createdAt.gte = startDate;
      if (endDate) where.order.createdAt.lte = endDate;
    }

    // Top selling products
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      where,
      _sum: {
        quantity: true,
        price: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    // Get product details
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          product,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.price || 0,
          orderCount: item._count,
        };
      }),
    );

    // Low performing products
    const allProducts = await this.prisma.product.findMany({
      include: {
        category: true,
        orderItems: {
          where: {
            order: where.order,
          },
        },
      },
    });

    const lowPerforming = allProducts
      .filter((p) => p.orderItems.length === 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        price: p.price,
        category: p.category?.name,
      }));

    // Category performance
    const categoryStats = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      where,
      _sum: {
        quantity: true,
        price: true,
      },
    });

    const categoryMap = new Map<
      string,
      { revenue: number; quantity: number }
    >();

    for (const stat of categoryStats) {
      const product = await this.prisma.product.findUnique({
        where: { id: stat.productId },
        include: { category: true },
      });

      if (product?.category) {
        const categoryName = product.category.name;
        const existing = categoryMap.get(categoryName) || {
          revenue: 0,
          quantity: 0,
        };
        categoryMap.set(categoryName, {
          revenue: existing.revenue + (stat._sum.price || 0),
          quantity: existing.quantity + (stat._sum.quantity || 0),
        });
      }
    }

    const categoryPerformance = Array.from(categoryMap.entries()).map(
      ([name, stats]) => ({
        category: name,
        revenue: stats.revenue,
        quantity: stats.quantity,
      }),
    );

    return {
      topProducts: topProductsWithDetails,
      lowPerforming,
      categoryPerformance,
      dateRange: { startDate, endDate },
    };
  }

  async getCustomerReport(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Total customers
    const totalCustomers = await this.prisma.user.count({
      where: { role: "CUSTOMER", ...where },
    });

    // Active customers (with orders)
    const activeCustomers = await this.prisma.user.count({
      where: {
        role: "CUSTOMER",
        orders: { some: {} },
        ...where,
      },
    });

    // Top customers by revenue
    const topCustomers = await this.prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        orders: {
          where: {
            status: { not: "CANCELLED" },
            createdAt: where.createdAt,
          },
        },
      },
      take: 100,
    });

    const topCustomersWithStats = topCustomers
      .map((user) => {
        const totalSpent = user.orders.reduce(
          (sum, order) => sum + Number(order.total),
          0,
        );
        const orderCount = user.orders.length;
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          totalSpent,
          orderCount,
          avgOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
          joinDate: user.createdAt,
        };
      })
      .filter((c) => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // New customers trend
    const userDateFilter = [];
    if (startDate)
      userDateFilter.push(Prisma.sql`AND "createdAt" >= ${startDate}`);
    if (endDate) userDateFilter.push(Prisma.sql`AND "createdAt" <= ${endDate}`);

    const newCustomersTrend = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM users
        WHERE role = 'CUSTOMER'
        ${userDateFilter.length > 0 ? Prisma.join(userDateFilter, " ") : Prisma.empty}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,
    );

    // Customer lifetime value distribution
    const allCustomersWithOrders = await this.prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        orders: {
          where: { status: { not: "CANCELLED" } },
        },
      },
    });

    const lifetimeValueDistribution = {
      "0-1000": 0,
      "1000-5000": 0,
      "5000-10000": 0,
      "10000+": 0,
    };

    allCustomersWithOrders.forEach((user) => {
      const ltv = user.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      );
      if (ltv === 0) return;
      if (ltv < 1000) lifetimeValueDistribution["0-1000"]++;
      else if (ltv < 5000) lifetimeValueDistribution["1000-5000"]++;
      else if (ltv < 10000) lifetimeValueDistribution["5000-10000"]++;
      else lifetimeValueDistribution["10000+"]++;
    });

    return {
      totalCustomers,
      activeCustomers,
      topCustomers: topCustomersWithStats,
      newCustomersTrend,
      lifetimeValueDistribution,
      dateRange: { startDate, endDate },
    };
  }

  async getTaxReport(startDate?: Date, endDate?: Date) {
    const where: any = {
      status: { not: "CANCELLED" },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Calculate tax (assuming 18% GST on all products)
    const TAX_RATE = 0.18;

    const taxData = orders.map((order) => {
      const subtotal = Number(order.total) / (1 + TAX_RATE);
      const tax = Number(order.total) - subtotal;

      return {
        orderId: order.id,
        date: order.createdAt,
        customer: `${order.user.firstName} ${order.user.lastName}`,
        subtotal,
        tax,
        total: Number(order.total),
        status: order.status,
      };
    });

    const totalTaxCollected = taxData.reduce((sum, item) => sum + item.tax, 0);
    const totalSalesBeforeTax = taxData.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const totalSalesWithTax = taxData.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    // Monthly tax breakdown
    const taxDateFilter = [];
    if (startDate)
      taxDateFilter.push(Prisma.sql`AND "createdAt" >= ${startDate}`);
    if (endDate) taxDateFilter.push(Prisma.sql`AND "createdAt" <= ${endDate}`);

    const monthlyTax = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*)::int as orders,
          SUM("total")::float as total,
          (SUM("total") * ${TAX_RATE} / (1 + ${TAX_RATE}))::float as tax
        FROM orders
        WHERE status != 'CANCELLED'
        ${Prisma.join(taxDateFilter, " ")}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
      `,
    );

    return {
      totalTaxCollected,
      totalSalesBeforeTax,
      totalSalesWithTax,
      taxRate: TAX_RATE,
      orders: taxData,
      monthlyTax,
      dateRange: { startDate, endDate },
    };
  }

  async getOverviewStats() {
    const [totalRevenue, totalOrders, totalCustomers, totalProducts] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { total: true },
        }),
        this.prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
        this.prisma.user.count({ where: { role: "CUSTOMER" } }),
        this.prisma.product.count(),
      ]);

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
    };
  }
}
