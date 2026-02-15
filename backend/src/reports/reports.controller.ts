import {
  Controller,
  Get,
  Query,
  UseGuards,
  StreamableFile,
  Response,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { Response as ExpressResponse } from "express";
import { Parser } from "json2csv";

@Controller("reports")
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get("overview")
  async getOverview() {
    return this.reportsService.getOverviewStats();
  }

  @Get("sales")
  async getSalesReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getSalesReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("sales/export")
  async exportSalesReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Response() res?: ExpressResponse,
  ) {
    const data = await this.reportsService.getSalesReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const csvData = data.orders.map((order) => ({
      "Order ID": order.id,
      Date: new Date(order.createdAt).toLocaleDateString(),
      Customer: `${order.user.firstName} ${order.user.lastName}`,
      Email: order.user.email,
      Status: order.status,
      "Total Amount": order.total,
      "Payment Status": order.payment?.status || "N/A",
      "Payment Method": order.payment?.method || "N/A",
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Get("products")
  async getProductPerformanceReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getProductPerformanceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("products/export")
  async exportProductReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Response() res?: ExpressResponse,
  ) {
    const data = await this.reportsService.getProductPerformanceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const csvData = data.topProducts.map((item) => ({
      "Product Name": item.product.name,
      SKU: item.product.sku,
      Category: item.product.category?.name || "N/A",
      "Total Quantity Sold": item.totalQuantity,
      "Total Revenue": item.totalRevenue,
      "Number of Orders": item.orderCount,
      "Current Stock": item.product.stock,
      Price: item.product.price,
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=product-performance-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Get("customers")
  async getCustomerReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getCustomerReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("customers/export")
  async exportCustomerReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Response() res?: ExpressResponse,
  ) {
    const data = await this.reportsService.getCustomerReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const csvData = data.topCustomers.map((customer) => ({
      Name: customer.name,
      Email: customer.email,
      "Total Spent": customer.totalSpent,
      "Order Count": customer.orderCount,
      "Average Order Value": customer.avgOrderValue.toFixed(2),
      "Join Date": new Date(customer.joinDate).toLocaleDateString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer-report-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  @Get("tax")
  async getTaxReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getTaxReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("tax/export")
  async exportTaxReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Response() res?: ExpressResponse,
  ) {
    const data = await this.reportsService.getTaxReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const csvData = data.orders.map((order) => ({
      "Order ID": order.orderId,
      Date: new Date(order.date).toLocaleDateString(),
      Customer: order.customer,
      "Subtotal (Before Tax)": order.subtotal.toFixed(2),
      "Tax Amount": order.tax.toFixed(2),
      "Total (With Tax)": order.total.toFixed(2),
      "Tax Rate": `${(data.taxRate * 100).toFixed(0)}%`,
      Status: order.status,
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tax-report-${Date.now()}.csv`,
    );
    res.send(csv);
  }
}
