import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Public endpoint for frontend
  @Get("public")
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("grouped")
  async getSettingsGroupedByCategory() {
    return this.settingsService.getSettingsGroupedByCategory();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("category/:category")
  async getSettingsByCategory(@Param("category") category: string) {
    return this.settingsService.getSettingsByCategory(category);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("key/:key")
  async getSettingByKey(@Param("key") key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("key/:key")
  async updateSetting(@Param("key") key: string, @Body("value") value: string) {
    return this.settingsService.updateSetting(key, value);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("bulk")
  async updateMultipleSettings(
    @Body() updates: { key: string; value: string }[],
  ) {
    return this.settingsService.updateMultipleSettings(updates);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put("category/:category")
  async updateSettingsByCategory(
    @Param("category") category: string,
    @Body() settings: Record<string, string>,
  ) {
    return this.settingsService.updateSettingsByCategory(category, settings);
  }
}
