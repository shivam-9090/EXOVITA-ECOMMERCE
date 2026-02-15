import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminAuthService {
  private readonly totpSecretSettingKey = "admin.totp.secret";

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async get2faStatus() {
    const secret = await this.getStoredTotpSecret();
    return { enabled: !!secret };
  }

  async setup2fa(password: string) {
    const adminUser = await this.validateAdminPassword(password);

    const generatedSecret = speakeasy.generateSecret({
      name: `EXOVITA Admin (${adminUser.email})`,
      issuer: "EXOVITA",
      length: 32,
    });

    if (!generatedSecret.base32 || !generatedSecret.otpauth_url) {
      throw new UnauthorizedException("Failed to generate 2FA secret");
    }

    await this.prisma.setting.upsert({
      where: { key: this.totpSecretSettingKey },
      update: {
        value: generatedSecret.base32,
        category: "GENERAL",
        description: "Admin panel TOTP secret",
        isPublic: false,
      },
      create: {
        key: this.totpSecretSettingKey,
        value: generatedSecret.base32,
        category: "GENERAL",
        description: "Admin panel TOTP secret",
        isPublic: false,
      },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(generatedSecret.otpauth_url);

    return {
      enabled: true,
      manualEntryKey: generatedSecret.base32,
      qrCodeDataUrl,
    };
  }

  async login(password: string, twoFactorCode?: string) {
    const adminUser = await this.validateAdminPassword(password);

    const totpSecret = await this.getStoredTotpSecret();
    if (!totpSecret) {
      const authResult = await this.authService.login(adminUser);
      return {
        ...authResult,
        requires2faSetup: true,
      };
    }

    const isValidCode = speakeasy.totp.verify({
      secret: totpSecret,
      encoding: "base32",
      token: (twoFactorCode || "").replace(/\s+/g, ""),
      window: 1,
    });

    if (!isValidCode) {
      throw new UnauthorizedException("Invalid 2FA code");
    }

    return {
      ...(await this.authService.login(adminUser)),
      requires2faSetup: false,
    };
  }

  async resetPassword(
    adminUserId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPassword || !newPassword) {
      throw new UnauthorizedException("Current and new passwords are required");
    }

    if (newPassword.length < 8) {
      throw new UnauthorizedException(
        "New password must be at least 8 characters",
      );
    }

    const adminUser = await this.usersService.findById(adminUserId);
    if (!adminUser) {
      throw new UnauthorizedException("Admin user not found");
    }

    if (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      throw new UnauthorizedException("Admin access required");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      adminUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      adminUser.password,
    );
    if (isSamePassword) {
      throw new UnauthorizedException(
        "New password must be different from current password",
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: hashedNewPassword,
        refreshToken: null,
      },
    });

    return { message: "Admin password reset successfully" };
  }

  private async validateAdminPassword(password: string) {
    if (!password) {
      throw new UnauthorizedException("Admin password is required");
    }

    const adminPanelPassword = this.configService.get<string>(
      "ADMIN_PANEL_PASSWORD",
    );
    const adminPanelEmail =
      this.configService.get<string>("ADMIN_PANEL_EMAIL") ||
      "admin@exovita.com";

    if (!adminPanelPassword) {
      throw new UnauthorizedException("Admin panel password is not configured");
    }

    if (password !== adminPanelPassword) {
      throw new UnauthorizedException("Invalid admin password");
    }

    const adminUser = await this.getOrCreateAdminUser(
      adminPanelEmail,
      adminPanelPassword,
    );

    return adminUser;
  }

  private async getOrCreateAdminUser(email: string, rawPassword: string) {
    let adminUser = await this.usersService.findByEmail(email);

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      adminUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: "Admin",
          lastName: "Exovita",
          role: "ADMIN",
          isVerified: true,
        },
      });
    }

    if (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      throw new UnauthorizedException("Configured admin account is not admin");
    }

    return adminUser;
  }

  private async getStoredTotpSecret() {
    const setting = await this.prisma.setting.findUnique({
      where: { key: this.totpSecretSettingKey },
    });

    return setting?.value || null;
  }
}
