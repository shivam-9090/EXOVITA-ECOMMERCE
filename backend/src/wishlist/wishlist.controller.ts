import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post(":productId")
  addItem(@Request() req, @Param("productId") productId: string) {
    return this.wishlistService.addItem(req.user.userId, productId);
  }

  @Delete(":productId")
  removeItem(@Request() req, @Param("productId") productId: string) {
    return this.wishlistService.removeItem(req.user.userId, productId);
  }
}
