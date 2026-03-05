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
import { ShiprocketService } from "../shipping/shiprocket.service";

@Controller("orders")
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private shiprocket: ShiprocketService,
  ) {}

  // === ADMIN ENDPOINTS (must come before :id routes) ===

  // Admin: Get all orders with filters
  @Get("admin/all")
  @UseGuards(JwtAuthGuard, AdminGuard)
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  // Admin: Download orders CSV (must be before admin/:id)
  @Get("admin/export/csv")
  @UseGuards(JwtAuthGuard, AdminGuard)
  exportOrders(@Query("status") status?: string) {
    return this.ordersService.exportOrdersCSV(status);
  }

  // Admin: Get order details
  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOrderDetails(@Param("id") id: string) {
    return this.ordersService.getOrderById(id);
  }

  // Admin: Update order status
  @Patch("admin/:id/status")
  @UseGuards(JwtAuthGuard, AdminGuard)
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
  @UseGuards(JwtAuthGuard, AdminGuard)
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

  // Admin: Manually push order to Shiprocket
  @Post("admin/:id/push-shiprocket")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async pushToShiprocket(
    @Param("id") id: string,
  ): Promise<Record<string, any>> {
    const order = await this.ordersService.getOrderById(id);
    const srRes = await this.shiprocket.createOrder(order as any);
    // Persist the AWB + IDs back to our shipment record
    return { success: true, shiprocket: srRes as any };
  }

  // === PUBLIC ENDPOINTS (no auth required) ===

  // Public: Track order by order number (used on customer tracking page)
  @Get("track/:orderNumber")
  trackOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.trackOrderPublic(orderNumber);
  }

  // === CUSTOMER ENDPOINTS ===

  // Customer: Create new order
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createOrderDto: any) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  // Customer: Get their own orders
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  // Customer: Get single order
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req, @Param("id") id: string) {
    return this.ordersService.getUserOrder(req.user.userId, id);
  }

  // Customer: Cancel order
  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancelOrder(@Request() req, @Param("id") id: string) {
    return this.ordersService.cancelOrder(req.user.userId, id);
  }
}
