import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Customer: Create a review
  async create(
    userId: string,
    productId: string,
    data: { rating: number; title?: string; comment?: string },
  ) {
    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException("You have already reviewed this product");
    }

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    // Check if user has purchased this product
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: "DELIVERED",
        },
      },
    });

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerified: !!hasPurchased, // Verified badge if purchased
        isPublished: true, // Auto-publish, admin can unpublish if needed
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  // Public: Get published reviews for a product
  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: {
        productId,
        isPublished: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Public: Get product rating summary
  async getProductRatingSummary(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        isPublished: true,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = parseFloat((totalRating / totalReviews).toFixed(1));

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }

  // Customer: Get user's reviews
  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Customer: Update own review
  async update(
    reviewId: string,
    userId: string,
    data: { rating?: number; title?: string; comment?: string },
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (review.userId !== userId) {
      throw new BadRequestException("You can only update your own reviews");
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            name: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  // Customer: Delete own review
  async deleteByUser(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    if (review.userId !== userId) {
      throw new BadRequestException("You can only delete your own reviews");
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  // ADMIN: Get all reviews with filters
  async findAll(filters?: {
    search?: string;
    status?: "published" | "unpublished" | "all";
    rating?: number;
    isVerified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (filters?.status === "published") {
      where.isPublished = true;
    } else if (filters?.status === "unpublished") {
      where.isPublished = false;
    }

    // Rating filter
    if (filters?.rating) {
      where.rating = filters.rating;
    }

    // Verified filter
    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    // Search filter (product name or user name or comment)
    if (filters?.search) {
      where.OR = [
        { comment: { contains: filters.search, mode: "insensitive" } },
        { title: { contains: filters.search, mode: "insensitive" } },
        {
          user: {
            firstName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          user: { lastName: { contains: filters.search, mode: "insensitive" } },
        },
        {
          product: { name: { contains: filters.search, mode: "insensitive" } },
        },
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ADMIN: Get review statistics
  async getStats() {
    const [
      total,
      published,
      unpublished,
      avgRating,
      ratingCounts,
      verifiedCount,
    ] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { isPublished: true } }),
      this.prisma.review.count({ where: { isPublished: false } }),
      this.prisma.review.aggregate({
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ["rating"],
        _count: true,
      }),
      this.prisma.review.count({ where: { isVerified: true } }),
    ]);

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingCounts.forEach((item) => {
      ratingDistribution[item.rating] = item._count;
    });

    return {
      total,
      published,
      unpublished,
      verified: verifiedCount,
      averageRating: avgRating._avg.rating
        ? parseFloat(avgRating._avg.rating.toFixed(1))
        : 0,
      ratingDistribution,
    };
  }

  // ADMIN: Publish/unpublish review
  async togglePublish(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isPublished: !review.isPublished,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // ADMIN: Delete review (hard delete)
  async delete(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}
