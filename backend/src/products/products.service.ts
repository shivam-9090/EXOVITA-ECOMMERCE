import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    categoryId?: string;
    search?: string;
    isFeatured?: boolean;
  }) {
    const {
      skip = 0,
      take = 20,
      categoryId,
      search,
      isFeatured,
    } = params || {};

    const where: any = {};

    // Only filter by isActive if take is not 100+ (admin request shows all)
    if (take < 100) {
      where.isActive = true;
    }

    if (categoryId) where.categoryId = categoryId;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          where: { isPublished: true },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  async create(data: any) {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // === INVENTORY MANAGEMENT ===

  async getInventoryStats() {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({
        where: { stock: { lte: 10, gt: 0 }, isActive: true },
      }),
      this.prisma.product.count({
        where: { stock: 0 },
      }),
    ]);

    const totalStockValue = await this.prisma.product.aggregate({
      _sum: { stock: true },
      where: { isActive: true },
    });

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockUnits: totalStockValue._sum.stock || 0,
    };
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: threshold, gt: 0 },
        isActive: true,
      },
      include: { category: true },
      orderBy: { stock: "asc" },
    });
  }

  async getOutOfStockProducts() {
    return this.prisma.product.findMany({
      where: { stock: 0 },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: "ADD" | "SUBTRACT",
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const newStock =
      operation === "ADD"
        ? product.stock + quantity
        : Math.max(0, product.stock - quantity);

    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: { category: true },
    });
  }

  async bulkUpdateStock(updates: Array<{ productId: string; stock: number }>) {
    const results = await Promise.all(
      updates.map((update) =>
        this.prisma.product.update({
          where: { id: update.productId },
          data: { stock: update.stock },
        }),
      ),
    );

    return { updated: results.length, products: results };
  }
}
