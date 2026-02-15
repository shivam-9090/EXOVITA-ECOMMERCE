import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // === ADMIN ENDPOINTS (must come first) ===

  // Admin: Get all users with filters
  @Get("admin/all")
  @UseGuards(AdminGuard)
  getAllUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.usersService.getAllUsers({
      role,
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // Admin: Get user stats
  @Get("admin/stats/overview")
  @UseGuards(AdminGuard)
  getUserStats() {
    return this.usersService.getUserStats();
  }

  // Admin: Get user details
  @Get("admin/:id")
  @UseGuards(AdminGuard)
  getUserDetails(@Param("id") id: string) {
    return this.usersService.getUserDetails(id);
  }

  // Admin: Block user
  @Patch("admin/:id/block")
  @UseGuards(AdminGuard)
  blockUser(@Param("id") id: string) {
    return this.usersService.blockUser(id);
  }

  // Admin: Unblock user
  @Patch("admin/:id/unblock")
  @UseGuards(AdminGuard)
  unblockUser(@Param("id") id: string) {
    return this.usersService.unblockUser(id);
  }

  // === CUSTOMER ENDPOINTS ===

  @Get("me")
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch("me")
  updateProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.update(req.user.userId, updateData);
  }
}
