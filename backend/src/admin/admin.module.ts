import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [AdminController, AdminAuthController, NotificationsController],
  providers: [AdminService, AdminAuthService],
})
export class AdminModule {}
