import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post("items")
  addItem(
    @Request() req,
    @Body() body: { productId: string; quantity?: number; couponId?: string },
  ) {
    return this.cartService.addItem(
      req.user.userId,
      body.productId,
      body.quantity,
      body.couponId,
    );
  }

  @Patch("items/:id")
  updateItem(
    @Request() req,
    @Param("id") id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItem(req.user.userId, id, body.quantity);
  }

  @Delete("items/:id")
  removeItem(@Request() req, @Param("id") id: string) {
    return this.cartService.removeItem(req.user.userId, id);
  }

  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }

  @Post("apply-coupon")
  applyCoupon(@Request() req, @Body() body: { code: string }) {
    return this.cartService.applyCouponToCart(req.user.userId, body.code);
  }
}
