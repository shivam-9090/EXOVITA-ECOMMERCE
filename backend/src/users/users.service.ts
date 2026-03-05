import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        refreshToken: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  // === ADMIN METHODS ===

  async getAllUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, status, search, page = 1, limit = 50 } = filters;

    const where: any = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status === "BLOCKED") {
      where.isVerified = false;
    } else if (status === "ACTIVE") {
      where.isVerified = true;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calculate total spent for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await this.prisma.order.aggregate({
          where: {
            userId: user.id,
            status: { in: ["DELIVERED", "SHIPPED"] },
          },
          _sum: { total: true },
        });

        return {
          ...user,
          totalOrders: user._count.orders,
          totalSpent: orders._sum.total || 0,
        };
      }),
    );

    return {
      users: usersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Calculate total spent
    const orders = await this.prisma.order.aggregate({
      where: {
        userId: id,
        status: { in: ["DELIVERED", "SHIPPED"] },
      },
      _sum: { total: true },
    });

    return {
      ...user,
      totalSpent: orders._sum.total || 0,
    };
  }

  async blockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: false },
    });
  }

  async unblockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async getUserStats() {
    const [totalUsers, activeUsers, blockedUsers, todayUsers, adminUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.count({ where: { isVerified: false } }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.user.count({
          where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      todayUsers,
      adminUsers,
      customerUsers: totalUsers - adminUsers,
    };
  }

  async getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createUserAddress(userId: string, data: any) {
    const requiredFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "country",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (!data?.[field]) {
        throw new BadRequestException(`${field} is required`);
      }
    }

    const shouldSetDefault = !!data.isDefault;

    return this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const existingCount = await tx.address.count({ where: { userId } });

      return tx.address.create({
        data: {
          userId,
          fullName: data.fullName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          isDefault: shouldSetDefault || existingCount === 0,
        },
      });
    });
  }

  async updateUserAddress(userId: string, addressId: string, data: any) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException("Address not found");
    }

    return this.prisma.$transaction(async (tx) => {
      if (data?.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          fullName: data.fullName ?? existing.fullName,
          phone: data.phone ?? existing.phone,
          addressLine1: data.addressLine1 ?? existing.addressLine1,
          addressLine2:
            data.addressLine2 !== undefined
              ? data.addressLine2 || null
              : existing.addressLine2,
          city: data.city ?? existing.city,
          state: data.state ?? existing.state,
          country: data.country ?? existing.country,
          postalCode: data.postalCode ?? existing.postalCode,
          isDefault: data.isDefault ?? existing.isDefault,
        },
      });
    });
  }

  async deleteUserAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException("Address not found");
    }

    const orderCount = await this.prisma.order.count({
      where: { addressId, userId },
    });

    if (orderCount > 0) {
      throw new BadRequestException(
        "Cannot delete address used in previous orders",
      );
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const latestAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (latestAddress) {
        await this.prisma.address.update({
          where: { id: latestAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }
}
