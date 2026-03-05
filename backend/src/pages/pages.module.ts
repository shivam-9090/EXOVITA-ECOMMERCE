import { Module } from "@nestjs/common";
import { PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
