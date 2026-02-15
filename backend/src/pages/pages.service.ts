import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  // Admin: Create page
  async create(data: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished?: boolean;
  }) {
    return this.prisma.page.create({
      data: {
        slug: data.slug.toLowerCase().replace(/\s+/g, "-"),
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
      },
    });
  }

  // Admin: Get all pages
  async findAll(includeUnpublished = false) {
    const where = includeUnpublished ? {} : { isPublished: true };
    return this.prisma.page.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  // Public: Get published page by slug
  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException(`Page with slug "${slug}" not found`);
    }

    if (!page.isPublished) {
      throw new NotFoundException("Page is not published");
    }

    return page;
  }

  // Admin: Get page by ID
  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException("Page not found");
    }

    return page;
  }

  // Admin: Update page
  async update(
    id: string,
    data: {
      slug?: string;
      title?: string;
      content?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    await this.findOne(id);

    if (data.slug) {
      data.slug = data.slug.toLowerCase().replace(/\s+/g, "-");
    }

    return this.prisma.page.update({
      where: { id },
      data,
    });
  }

  // Admin: Toggle published status
  async togglePublished(id: string) {
    const page = await this.findOne(id);

    return this.prisma.page.update({
      where: { id },
      data: {
        isPublished: !page.isPublished,
      },
    });
  }

  // Admin: Delete page
  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.page.delete({
      where: { id },
    });
  }
}
