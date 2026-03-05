import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { IsString, IsOptional, IsNumber, IsIn } from "class-validator";

export class BroadcastDto {
  @IsString()
  subject: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @IsOptional()
  @IsIn(["all", "customers"])
  audience?: "all" | "customers";
}

export class DiscountBroadcastDto {
  @IsString()
  subject: string;

  @IsString()
  headline: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsString()
  ctaText?: string;

  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsIn(["all", "customers"])
  audience?: "all" | "customers";
}

@Controller("admin/notifications")
@UseGuards(JwtAuthGuard, AdminGuard)
export class NotificationsController {
  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  /**
   * GET /admin/notifications/audience-count
   * Returns how many users will receive the broadcast
   */
  @Get("audience-count")
  async getAudienceCount() {
    const [all, customers] = await Promise.all([
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({
        where: { role: "CUSTOMER", isVerified: true },
      }),
    ]);
    return { all, customers };
  }

  /**
   * POST /admin/notifications/broadcast
   * Send a custom announcement to all users
   */
  @Post("broadcast")
  async sendBroadcast(@Body() dto: BroadcastDto) {
    const recipients = await this.getRecipients(dto.audience ?? "customers");

    if (recipients.length === 0) {
      throw new BadRequestException("No verified users found to send to.");
    }

    const result = await this.emailService.sendBulkBroadcast(
      recipients,
      dto.subject,
      dto.title,
      dto.body,
      dto.ctaText,
      dto.ctaUrl,
    );

    return {
      message: `Broadcast complete`,
      ...result,
      total: recipients.length,
    };
  }

  /**
   * POST /admin/notifications/discount
   * Send a discount / promo announcement to users
   */
  @Post("discount")
  async sendDiscountAnnouncement(@Body() dto: DiscountBroadcastDto) {
    const recipients = await this.getRecipients(dto.audience ?? "customers");

    if (recipients.length === 0) {
      throw new BadRequestException("No verified users found to send to.");
    }

    const result = await this.emailService.sendDiscountAnnouncement(
      recipients,
      {
        subject: dto.subject,
        headline: dto.headline,
        message: dto.message,
        discountCode: dto.discountCode,
        discountPercent: dto.discountPercent,
        ctaText: dto.ctaText ?? "Shop Now",
        ctaUrl: dto.ctaUrl ?? "https://exovitaherbal.com/shop",
        expiresAt: dto.expiresAt,
      },
    );

    return {
      message: `Discount announcement sent`,
      ...result,
      total: recipients.length,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async getRecipients(
    audience: "all" | "customers",
  ): Promise<Array<{ email: string; name: string }>> {
    const where =
      audience === "all"
        ? { isVerified: true }
        : { role: "CUSTOMER" as const, isVerified: true };

    const users = await this.prisma.user.findMany({
      where,
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return users.map((u) => ({
      email: u.email,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Customer",
    }));
  }
}
