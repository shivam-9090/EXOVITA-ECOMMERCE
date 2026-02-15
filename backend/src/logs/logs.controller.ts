import {
  Controller,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
} from "@nestjs/common";
import { LogsService } from "./logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("logs")
@UseGuards(JwtAuthGuard, AdminGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get("admin-logs")
  async getAdminLogs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("entity") entity?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    return this.logsService.getAdminLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId,
      action,
      entity,
      startDate,
      endDate,
      search,
    });
  }

  @Get("login-history")
  async getLoginHistory(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("userId") userId?: string,
    @Query("email") email?: string,
    @Query("status") status?: "SUCCESS" | "FAILED",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("search") search?: string,
  ) {
    return this.logsService.getLoginHistory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId,
      email,
      status,
      startDate,
      endDate,
      search,
    });
  }

  @Get("stats")
  async getLogsStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.logsService.getLogsStats(startDate, endDate);
  }

  @Get("failed-logins")
  async getRecentFailedLogins(@Query("limit") limit?: string) {
    return this.logsService.getRecentFailedLogins(limit ? parseInt(limit) : 20);
  }

  @Get("suspicious-activity")
  async getSuspiciousActivity() {
    return this.logsService.getSuspiciousActivity();
  }

  @Delete("cleanup/:days")
  async deleteOldLogs(@Param("days") days: string) {
    return this.logsService.deleteOldLogs(parseInt(days));
  }
}
