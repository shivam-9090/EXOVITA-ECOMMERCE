import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from "@nestjs/common";
import { BannersService } from "./banners.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("banners")
export class BannersController {
  constructor(private bannersService: BannersService) {}

  // PUBLIC: Get active banners
  @Get("active")
  findActive() {
    return this.bannersService.findActive();
  }

  // ADMIN: Get all banners
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query("includeInactive") includeInactive?: string) {
    return this.bannersService.findAll(includeInactive === "true");
  }

  // ADMIN: Get one banner
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bannersService.findOne(id);
  }

  // ADMIN: Create banner
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(
    @Body()
    createBannerDto: {
      title: string;
      subtitle?: string;
      image: string;
      link?: string;
      buttonText?: string;
      position?: number;
      isActive?: boolean;
    },
  ) {
    return this.bannersService.create(createBannerDto);
  }

  // ADMIN: Update banner
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body()
    updateBannerDto: {
      title?: string;
      subtitle?: string;
      image?: string;
      link?: string;
      buttonText?: string;
      position?: number;
      isActive?: boolean;
    },
  ) {
    return this.bannersService.update(id, updateBannerDto);
  }

  // ADMIN: Toggle active status
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/toggle")
  toggleActive(@Param("id") id: string) {
    return this.bannersService.toggleActive(id);
  }

  // ADMIN: Reorder banners
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post("reorder")
  reorder(@Body() updates: Array<{ id: string; position: number }>) {
    return this.bannersService.reorder(updates);
  }

  // ADMIN: Delete banner
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.bannersService.delete(id);
  }
}
