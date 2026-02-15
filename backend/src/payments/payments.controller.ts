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
  @Post("create-intent")
  createPaymentIntent(@Req() req: any, @Body() body: { orderId: string }) {
    return this.paymentsService.createPaymentIntent(
      body.orderId,
      req.user.userId,
    );
  }

  @Post("webhook")
  handleWebhook(
    @Headers("stripe-signature") signature: string,
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
