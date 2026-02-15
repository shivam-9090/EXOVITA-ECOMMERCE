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
import { PagesService } from "./pages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("pages")
export class PagesController {
  constructor(private pagesService: PagesService) {}

  // PUBLIC: Get page by slug
  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  // ADMIN: Get all pages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query("includeUnpublished") includeUnpublished?: string) {
    return this.pagesService.findAll(includeUnpublished === "true");
  }

  // ADMIN: Get one page
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.pagesService.findOne(id);
  }

  // ADMIN: Create page
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(
    @Body()
    createPageDto: {
      slug: string;
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    return this.pagesService.create(createPageDto);
  }

  // ADMIN: Update page
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body()
    updatePageDto: {
      slug?: string;
      title?: string;
      content?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    },
  ) {
    return this.pagesService.update(id, updatePageDto);
  }

  // ADMIN: Toggle published status
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/toggle")
  togglePublished(@Param("id") id: string) {
    return this.pagesService.togglePublished(id);
  }

  // ADMIN: Delete page
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.pagesService.delete(id);
  }
}
