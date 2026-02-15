import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetRequestInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ipAddress:
        request.headers["x-forwarded-for"] ||
        request.headers["x-real-ip"] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.ip ||
        null,
      userAgent: request.headers["user-agent"] || null,
    };
  },
);
