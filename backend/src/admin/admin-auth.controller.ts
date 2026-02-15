import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get("2fa/status")
  async get2faStatus() {
    return this.adminAuthService.get2faStatus();
  }

  @Post("2fa/setup")
  @HttpCode(HttpStatus.OK)
  async setup2fa(@Body("password") password: string) {
    return this.adminAuthService.setup2fa(password);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body("password") password: string,
    @Body("twoFactorCode") twoFactorCode?: string,
  ) {
    return this.adminAuthService.login(password, twoFactorCode);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Request() req,
    @Body("currentPassword") currentPassword: string,
    @Body("newPassword") newPassword: string,
  ) {
    return this.adminAuthService.resetPassword(
      req.user.userId,
      currentPassword,
      newPassword,
    );
  }
}
