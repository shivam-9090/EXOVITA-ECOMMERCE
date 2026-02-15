import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CouponType } from "@prisma/client";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    code: string;
    type: CouponType;
    discount: number;
    minPurchase?: number;
    maxDiscount?: number;
    expiresAt?: Date;
    usageLimit?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
    specificUsers?: string[];
    description?: string;
  }) {
    // Check if coupon code already exists
    const existing = await this.prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException("Coupon code already exists");
    }

    return this.prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        applicableProducts: data.applicableProducts || [],
        applicableCategories: data.applicableCategories || [],
        specificUsers: data.specificUsers || [],
      },
    });
  }

  async getAll(filters?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException("Coupon not found");
    }

    return coupon;
  }

  async update(
    id: string,
    data: {
      code?: string;
      type?: CouponType;
      discount?: number;
      minPurchase?: number;
      maxDiscount?: number;
      expiresAt?: Date;
      usageLimit?: number;
      isActive?: boolean;
      applicableProducts?: string[];
      applicableCategories?: string[];
      specificUsers?: string[];
      description?: string;
    },
  ) {
    const coupon = await this.getById(id);

    // If updating code, check if new code already exists
    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existing) {
        throw new BadRequestException("Coupon code already exists");
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async validateCoupon(
    code: string,
    userId?: string,
    productIds?: string[],
    categoryIds?: string[],
    totalAmount?: number,
  ) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new BadRequestException("Coupon is inactive");
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException("Coupon has expired");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Coupon usage limit reached");
    }

    // Check user-specific coupon
    if (coupon.specificUsers.length > 0 && userId) {
      if (!coupon.specificUsers.includes(userId)) {
        throw new BadRequestException(
          "This coupon is not available for your account",
        );
      }
    }

    // Check applicable products
    if (
      coupon.applicableProducts.length > 0 &&
      productIds &&
      productIds.length > 0
    ) {
      const hasApplicableProduct = productIds.some((id) =>
        coupon.applicableProducts.includes(id),
      );
      if (!hasApplicableProduct) {
        throw new BadRequestException(
          "Coupon not applicable to selected products",
        );
      }
    }

    // Check applicable categories
    if (
      coupon.applicableCategories.length > 0 &&
      categoryIds &&
      categoryIds.length > 0
    ) {
      const hasApplicableCategory = categoryIds.some((id) =>
        coupon.applicableCategories.includes(id),
      );
      if (!hasApplicableCategory) {
        throw new BadRequestException(
          "Coupon not applicable to selected categories",
        );
      }
    }

    // Check minimum purchase
    if (coupon.minPurchase && totalAmount && totalAmount < coupon.minPurchase) {
      throw new BadRequestException(
        `Minimum purchase of ₹${coupon.minPurchase} required`,
      );
    }

    return {
      valid: true,
      coupon,
    };
  }

  async applyCoupon(
    code: string,
    totalAmount: number,
    userId?: string,
    productIds?: string[],
    categoryIds?: string[],
  ) {
    const { coupon } = await this.validateCoupon(
      code,
      userId,
      productIds,
      categoryIds,
      totalAmount,
    );

    let discountAmount = 0;

    if (coupon.type === "PERCENTAGE") {
      discountAmount = (totalAmount * coupon.discount) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === "FLAT") {
      discountAmount = coupon.discount;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    return {
      originalAmount: totalAmount,
      discountAmount,
      finalAmount,
      couponCode: coupon.code,
      couponType: coupon.type,
      couponDiscount: coupon.discount,
      coupon: coupon, // Add full coupon object
    };
  }

  async incrementUsage(code: string) {
    return this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }

  async getCouponStats() {
    const [total, active, expired, used] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.coupon.count({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      }),
      this.prisma.coupon.count({
        where: {
          usedCount: {
            gt: 0,
          },
        },
      }),
    ]);

    return {
      total,
      active,
      expired,
      used,
    };
  }

  async checkUserCouponUsage(userId: string, couponCode: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      return { used: false, canUse: false, message: "Invalid coupon code" };
    }

    const usage = await this.prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId,
        },
      },
    });

    if (usage) {
      return {
        used: true,
        canUse: false,
        message: "You have already used this coupon",
        usedAt: usage.usedAt,
      };
    }

    return {
      used: false,
      canUse: true,
      message: "Coupon can be applied",
      coupon,
    };
  }
}
