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
  Request,
  Patch,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("reviews")
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // PUBLIC: Get reviews for a product
  @Get("product/:productId")
  findByProduct(@Param("productId") productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  // PUBLIC: Get product rating summary
  @Get("product/:productId/summary")
  getProductRatingSummary(@Param("productId") productId: string) {
    return this.reviewsService.getProductRatingSummary(productId);
  }

  // CUSTOMER: Create a review
  @UseGuards(JwtAuthGuard)
  @Post("product/:productId")
  create(
    @Request() req,
    @Param("productId") productId: string,
    @Body()
    createReviewDto: { rating: number; title?: string; comment?: string },
  ) {
    return this.reviewsService.create(
      req.user.userId,
      productId,
      createReviewDto,
    );
  }

  // CUSTOMER: Get my reviews
  @UseGuards(JwtAuthGuard)
  @Get("my-reviews")
  findMyReviews(@Request() req) {
    return this.reviewsService.findByUser(req.user.userId);
  }

  // CUSTOMER: Update my review
  @UseGuards(JwtAuthGuard)
  @Put(":reviewId")
  updateMyReview(
    @Request() req,
    @Param("reviewId") reviewId: string,
    @Body()
    updateReviewDto: { rating?: number; title?: string; comment?: string },
  ) {
    return this.reviewsService.update(
      reviewId,
      req.user.userId,
      updateReviewDto,
    );
  }

  // CUSTOMER: Delete my review
  @UseGuards(JwtAuthGuard)
  @Delete(":reviewId")
  deleteMyReview(@Request() req, @Param("reviewId") reviewId: string) {
    return this.reviewsService.deleteByUser(reviewId, req.user.userId);
  }

  // ================== ADMIN ENDPOINTS ==================

  // ADMIN: Get all reviews with filters
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/all")
  findAllReviews(
    @Query("search") search?: string,
    @Query("status") status?: "published" | "unpublished" | "all",
    @Query("rating") rating?: string,
    @Query("isVerified") isVerified?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reviewsService.findAll({
      search,
      status,
      rating: rating ? parseInt(rating) : undefined,
      isVerified:
        isVerified === "true"
          ? true
          : isVerified === "false"
            ? false
            : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // ADMIN: Get review statistics
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/stats")
  getStats() {
    return this.reviewsService.getStats();
  }

  // ADMIN: Toggle publish status
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("admin/:reviewId/toggle-publish")
  togglePublish(@Param("reviewId") reviewId: string) {
    return this.reviewsService.togglePublish(reviewId);
  }

  // ADMIN: Delete review
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete("admin/:reviewId")
  adminDeleteReview(@Param("reviewId") reviewId: string) {
    return this.reviewsService.delete(reviewId);
  }
}
