import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // === ADMIN ENDPOINTS (must come before :id routes) ===

  // Admin: Get all orders with filters
  @Get("admin/all")
  @UseGuards(AdminGuard)
  getAllOrders(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.ordersService.getAllOrders({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      search,
    });
  }

  // Admin: Get order stats (must be before admin/:id)
  @Get("admin/stats/overview")
  @UseGuards(AdminGuard)
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  // Admin: Download orders CSV (must be before admin/:id)
  @Get("admin/export/csv")
  @UseGuards(AdminGuard)
  exportOrders(@Query("status") status?: string) {
    return this.ordersService.exportOrdersCSV(status);
  }

  // Admin: Get order details
  @Get("admin/:id")
  @UseGuards(AdminGuard)
  getOrderDetails(@Param("id") id: string) {
    return this.ordersService.getOrderById(id);
  }

  // Admin: Update order status
  @Patch("admin/:id/status")
  @UseGuards(AdminGuard)
  updateOrderStatus(
    @Param("id") id: string,
    @Body() updateDto: { status: string; notes?: string },
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      updateDto.status,
      updateDto.notes,
    );
  }

  // Admin: Update shipment info
  @Patch("admin/:id/shipment")
  @UseGuards(AdminGuard)
  updateShipment(
    @Param("id") id: string,
    @Body()
    shipmentDto: {
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
      notes?: string;
    },
  ) {
    return this.ordersService.updateShipment(id, shipmentDto);
  }
  // === CUSTOMER ENDPOINTS ===

  // Customer: Create new order
  @Post()
  create(@Request() req, @Body() createOrderDto: any) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  // Customer: Get their own orders
  @Get()
  findAll(@Request() req) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  // Customer: Get single order
  @Get(":id")
  findOne(@Request() req, @Param("id") id: string) {
    return this.ordersService.getUserOrder(req.user.userId, id);
  }

  // Customer: Cancel order
  @Patch(":id/cancel")
  cancelOrder(@Request() req, @Param("id") id: string) {
    return this.ordersService.cancelOrder(req.user.userId, id);
  }
}
