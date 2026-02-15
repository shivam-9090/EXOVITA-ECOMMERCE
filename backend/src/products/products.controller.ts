import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("featured") featured?: string,
  ) {
    const skip = page ? (parseInt(page) - 1) * (parseInt(limit) || 20) : 0;
    const take = limit ? parseInt(limit) : 20;

    return this.productsService.findAll({
      skip,
      take,
      categoryId: category,
      search,
      isFeatured: featured === "true",
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id")
  updatePut(@Param("id") id: string, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  // === INVENTORY MANAGEMENT ENDPOINTS ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("inventory/stats")
  getInventoryStats() {
    return this.productsService.getInventoryStats();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("inventory/low-stock")
  getLowStockProducts(@Query("threshold") threshold?: string) {
    return this.productsService.getLowStockProducts(
      threshold ? parseInt(threshold) : 10,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("inventory/out-of-stock")
  getOutOfStockProducts() {
    return this.productsService.getOutOfStockProducts();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch("inventory/:id/stock")
  updateStock(
    @Param("id") id: string,
    @Body() updateDto: { quantity: number; operation: "ADD" | "SUBTRACT" },
  ) {
    return this.productsService.updateStock(
      id,
      updateDto.quantity,
      updateDto.operation,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post("inventory/bulk-update")
  bulkUpdateStock(
    @Body()
    bulkUpdateDto: {
      updates: Array<{ productId: string; stock: number }>;
    },
  ) {
    return this.productsService.bulkUpdateStock(bulkUpdateDto.updates);
  }
}
