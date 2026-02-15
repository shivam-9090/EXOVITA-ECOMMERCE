import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { LogsService } from "../logs/logs.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logsService: LogsService,
  ) {}

  async validateUser(
    email: string,
    password: string,
    requestInfo?: any,
  ): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;

      // Log successful login attempt
      if (requestInfo) {
        await this.logsService.createLoginHistory({
          userId: user.id,
          email,
          status: "SUCCESS",
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        });
      }

      return result;
    }

    // Log failed login attempt
    if (requestInfo) {
      await this.logsService.createLoginHistory({
        userId: user?.id,
        email,
        status: "FAILED",
        failReason: user ? "Invalid password" : "User not found",
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });
    }

    return null;
  }

  async login(user: any, requestInfo?: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN") || "30d",
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    const { password, refreshToken: storedRefreshToken, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto, requestInfo?: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Split name into first and last name
    const nameParts = registerDto.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: registerDto.phone,
    });

    // Log registration (successful login after register)
    if (requestInfo) {
      await this.logsService.createLoginHistory({
        userId: user.id,
        email: user.email,
        status: "SUCCESS",
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });
    }

    // user already doesn't include password from service
    return this.login(user, requestInfo);
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const isValidToken = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isValidToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.login(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async googleLogin(user: any) {
    // Check if user exists
    let existingUser = await this.usersService.findByEmail(user.email);

    if (!existingUser) {
      // Create new user from Google profile
      // Generate a random password for OAuth users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const newUser = await this.usersService.create({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: randomPassword,
        role: "CUSTOMER",
      });

      // Fetch the full user to get all fields
      existingUser = await this.usersService.findByEmail(newUser.email);
    }

    return this.login(existingUser);
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    const { password, refreshToken, ...userProfile } = user;
    return userProfile;
  }
}
