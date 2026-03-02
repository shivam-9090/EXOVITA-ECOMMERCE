import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

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
}
