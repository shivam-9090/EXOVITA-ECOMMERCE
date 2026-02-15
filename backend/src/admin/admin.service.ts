import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      todayOrders,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count(),
      
      // Total users (excluding admins)
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      
      // Total products
      this.prisma.product.count({ where: { isActive: true } }),
      
      // Today's orders
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      
      // Pending orders
      this.prisma.order.count({
        where: { status: 'PENDING' },
      }),
      
      // Low stock products (stock < 10)
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: { lt: 10 },
        },
      }),
    ]);

    // Calculate total revenue
    const orders = await this.prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { total: true },
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate today's revenue
    const todayOrdersData = await this.prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      select: { total: true },
    });
    const todayRevenue = todayOrdersData.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    return {
      totalOrders,
      totalUsers,
      totalProducts,
      todayOrders,
      pendingOrders,
      lowStockProducts,
      totalRevenue,
      todayRevenue,
    };
  }
}
