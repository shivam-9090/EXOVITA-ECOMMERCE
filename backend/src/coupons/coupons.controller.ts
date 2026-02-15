import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CouponsService } from "./coupons.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { CouponType } from "@prisma/client";
import { GetUser } from "../auth/decorators/get-user.decorator";

@Controller("coupons")
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  // Admin endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post("admin")
  async create(
    @Body()
    data: {
      code: string;
      type: CouponType;
      discount: number;
      minPurchase?: number;
      maxDiscount?: number;
      expiresAt?: string;
      usageLimit?: number;
      applicableProducts?: string[];
      applicableCategories?: string[];
      specificUsers?: string[];
      description?: string;
    },
  ) {
    return this.couponsService.create({
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/all")
  async getAll(
    @Query("isActive") isActive?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.couponsService.getAll({
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/stats")
  async getStats() {
    return this.couponsService.getCouponStats();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/:id")
  async getById(@Param("id") id: string) {
    return this.couponsService.getById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("admin/:id")
  async update(
    @Param("id") id: string,
    @Body()
    data: {
      code?: string;
      type?: CouponType;
      discount?: number;
      minPurchase?: number;
      maxDiscount?: number;
      expiresAt?: string;
      usageLimit?: number;
      isActive?: boolean;
      applicableProducts?: string[];
      applicableCategories?: string[];
      specificUsers?: string[];
      description?: string;
    },
  ) {
    return this.couponsService.update(id, {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete("admin/:id")
  async delete(@Param("id") id: string) {
    return this.couponsService.delete(id);
  }

  // Public endpoints (for customers)
  @UseGuards(JwtAuthGuard)
  @Get("active")
  async getActiveCoupons() {
    return this.couponsService.getAll({
      isActive: true,
      limit: 100,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("validate")
  async validateCoupon(
    @Body()
    data: {
      code: string;
      productIds?: string[];
      categoryIds?: string[];
      totalAmount?: number;
    },
    @GetUser() user: any,
  ) {
    return this.couponsService.validateCoupon(
      data.code,
      user.id,
      data.productIds,
      data.categoryIds,
      data.totalAmount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("apply")
  async applyCoupon(
    @Body()
    data: {
      code: string;
      totalAmount: number;
      productIds?: string[];
      categoryIds?: string[];
    },
    @GetUser() user: any,
  ) {
    return this.couponsService.applyCoupon(
      data.code,
      data.totalAmount,
      user.id,
      data.productIds,
      data.categoryIds,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("check-usage/:code")
  async checkUsage(@Param("code") code: string, @GetUser() user: any) {
    return this.couponsService.checkUserCouponUsage(user.id, code);
  }
}
