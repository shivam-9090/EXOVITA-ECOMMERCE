import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  // Admin: Create banner
  async create(data: {
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    buttonText?: string;
    position?: number;
    isActive?: boolean;
  }) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        image: data.image,
        link: data.link,
        buttonText: data.buttonText,
        position: data.position || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  // Admin: Get all banners
  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.banner.findMany({
      where,
      orderBy: { position: "asc" },
    });
  }

  // Public: Get active banners only
  async findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    });
  }

  // Admin: Get one banner
  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException("Banner not found");
    }

    return banner;
  }

  // Admin: Update banner
  async update(
    id: string,
    data: {
      title?: string;
      subtitle?: string;
      image?: string;
      link?: string;
      buttonText?: string;
      position?: number;
      isActive?: boolean;
    },
  ) {
    const banner = await this.findOne(id);

    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  // Admin: Toggle active status
  async toggleActive(id: string) {
    const banner = await this.findOne(id);

    return this.prisma.banner.update({
      where: { id },
      data: {
        isActive: !banner.isActive,
      },
    });
  }

  // Admin: Delete banner
  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.banner.delete({
      where: { id },
    });
  }

  // Admin: Reorder banners
  async reorder(updates: Array<{ id: string; position: number }>) {
    const operations = updates.map((update) =>
      this.prisma.banner.update({
        where: { id: update.id },
        data: { position: update.position },
      }),
    );

    await Promise.all(operations);

    return { message: "Banners reordered successfully" };
  }
}
