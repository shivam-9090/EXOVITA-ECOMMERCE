import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
      passReqToCallback: true, // Pass request to callback
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const requestInfo = {
      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        null,
      userAgent: req.headers["user-agent"] || null,
    };

    const user = await this.authService.validateUser(
      email,
      password,
      requestInfo,
    );
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }
}
