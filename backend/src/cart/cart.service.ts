import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number = 1,
    couponId?: string,
  ) {
    const cart = await this.getCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    // Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    let appliedCouponId = couponId;
    let discountAmount = 0;
    const originalPrice = product.price;
    let coupon: any = null;

    // Apply coupon if provided
    if (couponId) {
      coupon = await this.prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (coupon && coupon.isActive) {
        // Check if user has already used this coupon
        const existingUsage = await this.prisma.couponUsage.findUnique({
          where: {
            couponId_userId: {
              couponId,
              userId,
            },
          },
        });

        if (existingUsage) {
          throw new Error("You have already used this coupon");
        }

        // Validate coupon applicability
        const isApplicable = await this.validateCouponForProduct(
          coupon,
          product,
        );

        if (isApplicable) {
          // Calculate discount
          if (coupon.type === "PERCENTAGE") {
            discountAmount = (originalPrice * coupon.discount) / 100;
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
          } else {
            discountAmount = coupon.discount;
          }
        } else {
          appliedCouponId = undefined;
        }
      } else {
        appliedCouponId = undefined;
        coupon = null;
      }
    }

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          couponId: appliedCouponId,
          couponCode: coupon?.code,
          originalPrice,
          discountedPrice:
            appliedCouponId && discountAmount > 0
              ? originalPrice - discountAmount
              : null,
        },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        couponId: appliedCouponId,
        couponCode: coupon?.code,
        originalPrice,
        discountedPrice:
          appliedCouponId && discountAmount > 0
            ? originalPrice - discountAmount
            : null,
      },
      include: { product: true },
    });
  }

  private async validateCouponForProduct(coupon: any, product: any) {
    // Check minimum purchase (for single product)
    if (coupon.minPurchase && product.price < coupon.minPurchase) {
      return false;
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return false;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return false;
    }

    // Check product applicability
    if (
      coupon.applicableProducts &&
      coupon.applicableProducts.length > 0 &&
      !coupon.applicableProducts.includes(product.id)
    ) {
      return false;
    }

    // Check category applicability
    if (
      coupon.applicableCategories &&
      coupon.applicableCategories.length > 0 &&
      !coupon.applicableCategories.includes(product.categoryId)
    ) {
      return false;
    }

    return true;
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { message: "Cart cleared" };
  }

  async applyCouponToCart(userId: string, couponCode: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new Error("This coupon is not active");
    }

    // Check if user has already used this coupon
    const existingUsage = await this.prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId,
        },
      },
    });

    if (existingUsage) {
      throw new Error("You have already used this coupon");
    }

    return coupon;
  }
}
