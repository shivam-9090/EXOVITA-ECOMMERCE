import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Get all settings
  async getAllSettings() {
    return this.prisma.setting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
  }

  // Get settings by category
  async getSettingsByCategory(category: string) {
    return this.prisma.setting.findMany({
      where: { category: category as any },
      orderBy: { key: "asc" },
    });
  }

  // Get single setting by key
  async getSettingByKey(key: string) {
    return this.prisma.setting.findUnique({
      where: { key },
    });
  }

  // Get public settings (for frontend)
  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        category: true,
      },
    });

    // Convert to key-value object
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  // Update single setting
  async updateSetting(key: string, value: string) {
    return this.prisma.setting.update({
      where: { key },
      data: { value },
    });
  }

  // Update multiple settings
  async updateMultipleSettings(updates: { key: string; value: string }[]) {
    const updatePromises = updates.map((update) =>
      this.prisma.setting.update({
        where: { key: update.key },
        data: { value: update.value },
      }),
    );

    return Promise.all(updatePromises);
  }

  // Update settings by category
  async updateSettingsByCategory(
    category: string,
    settings: Record<string, string>,
  ) {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    return this.updateMultipleSettings(updates);
  }

  // Get settings as key-value object by category
  async getSettingsObject(category?: string) {
    const where = category ? { category: category as any } : {};
    const settings = await this.prisma.setting.findMany({ where });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  // Get all settings grouped by category
  async getSettingsGroupedByCategory() {
    const settings = await this.prisma.setting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    const grouped: Record<string, any[]> = {};

    settings.forEach((setting) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });

    return grouped;
  }

  // Create or update setting
  async upsertSetting(data: {
    key: string;
    value: string;
    category: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return this.prisma.setting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        description: data.description,
        isPublic: data.isPublic,
      },
      create: {
        key: data.key,
        value: data.value,
        category: data.category as any,
        description: data.description,
        isPublic: data.isPublic || false,
      },
    });
  }

  // Reset settings to default (dangerous - admin only)
  async resetToDefaults() {
    // This would delete all settings and re-run the migration
    // Implementation depends on requirements
    throw new Error("Reset to defaults not implemented for safety");
  }
}
