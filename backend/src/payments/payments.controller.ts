import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Headers,
  Req,
  UseGuards,
  Query,
  Param,
} from "@nestjs/common";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("create-order")
  createPaymentOrder(@Req() req: any, @Body() body: { orderId: string }) {
    return this.paymentsService.createPaymentOrder(
      body.orderId,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("create-intent")
  createPaymentOrderAlias(@Req() req: any, @Body() body: { orderId: string }) {
    return this.paymentsService.createPaymentOrder(
      body.orderId,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("verify")
  verifyPayment(
    @Req() req: any,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId?: string;
    },
  ) {
    return this.paymentsService.verifyPayment(req.user.userId, body);
  }

  @Post("webhook")
  handleWebhook(
    @Headers("x-razorpay-signature") signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing webhook signature");
    }

    const payload = Buffer.isBuffer(req.body) ? req.body : (req as any).rawBody;

    if (!payload || !Buffer.isBuffer(payload)) {
      throw new BadRequestException("Missing webhook payload");
    }

    return this.paymentsService.handleWebhook(signature, payload);
  }

  // ─── Admin routes ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/all")
  getAdminPayments(
    @Query("status") status?: string,
    @Query("method") method?: string,
    @Query("search") search?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.paymentsService.getAdminPayments({
      status,
      method,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/stats")
  getAdminStats() {
    return this.paymentsService.getAdminStats();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/:id")
  getAdminPaymentById(@Param("id") id: string) {
    return this.paymentsService.getAdminPaymentById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("admin/:id/status")
  updatePaymentStatus(
    @Param("id") id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return this.paymentsService.updatePaymentStatus(id, body.status, body.note);
  }
}
