import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  // Create admin activity log
  async createAdminLog(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.adminLog.create({
      data: {
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    });
  }

  // Create login history entry
  async createLoginHistory(data: {
    userId?: string;
    email: string;
    status: "SUCCESS" | "FAILED";
    failReason?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.loginHistory.create({
      data,
    });
  }

  // Get admin activity logs with filters
  async getAdminLogs(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.entity) {
      where.entity = params.entity;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: "insensitive" } },
        { entity: { contains: params.search, mode: "insensitive" } },
        { entityId: { contains: params.search, mode: "insensitive" } },
        { ipAddress: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    // Parse details JSON
    const logsWithParsedDetails = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return {
      logs: logsWithParsedDetails,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // Get login history with filters
  async getLoginHistory(params: {
    page?: number;
    limit?: number;
    userId?: string;
    email?: string;
    status?: "SUCCESS" | "FAILED";
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.email) {
      where.email = { contains: params.email, mode: "insensitive" };
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.createdAt.lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { ipAddress: { contains: params.search, mode: "insensitive" } },
        { failReason: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [history, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.loginHistory.count({ where }),
    ]);

    return {
      history,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // Get logs statistics
  async getLogsStats(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalLogs,
      todayLogs,
      loginSuccess,
      loginFailed,
      totalLogins,
      todayLogins,
      actionBreakdown,
      entityBreakdown,
    ] = await Promise.all([
      this.prisma.adminLog.count({ where: dateFilter }),
      this.prisma.adminLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.loginHistory.count({
        where: { ...dateFilter, status: "SUCCESS" },
      }),
      this.prisma.loginHistory.count({
        where: { ...dateFilter, status: "FAILED" },
      }),
      this.prisma.loginHistory.count({ where: dateFilter }),
      this.prisma.loginHistory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.adminLog.groupBy({
        by: ["action"],
        where: dateFilter,
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      this.prisma.adminLog.groupBy({
        by: ["entity"],
        where: dateFilter,
        _count: true,
        orderBy: { _count: { entity: "desc" } },
        take: 10,
      }),
    ]);

    return {
      activityLogs: {
        total: totalLogs,
        today: todayLogs,
        byAction: actionBreakdown.map((item) => ({
          action: item.action,
          count: item._count,
        })),
        byEntity: entityBreakdown.map((item) => ({
          entity: item.entity,
          count: item._count,
        })),
      },
      loginAttempts: {
        total: totalLogins,
        today: todayLogins,
        success: loginSuccess,
        failed: loginFailed,
        successRate:
          totalLogins > 0 ? ((loginSuccess / totalLogins) * 100).toFixed(2) : 0,
      },
    };
  }

  // Get recent failed login attempts (for security monitoring)
  async getRecentFailedLogins(limit = 20) {
    return this.prisma.loginHistory.findMany({
      where: { status: "FAILED" },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Get suspicious activity (multiple failed logins from same IP)
  async getSuspiciousActivity() {
    const recentFailedLogins = await this.prisma.loginHistory.findMany({
      where: {
        status: "FAILED",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by IP address
    const ipGroups = recentFailedLogins.reduce(
      (acc, login) => {
        if (!login.ipAddress) return acc;
        if (!acc[login.ipAddress]) {
          acc[login.ipAddress] = [];
        }
        acc[login.ipAddress].push(login);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Find IPs with 3 or more failed attempts
    const suspicious = Object.entries(ipGroups)
      .filter(([, attempts]) => attempts.length >= 3)
      .map(([ip, attempts]) => ({
        ipAddress: ip,
        failedAttempts: attempts.length,
        emails: [...new Set(attempts.map((a) => a.email))],
        lastAttempt: attempts[0].createdAt,
      }));

    return suspicious;
  }

  // Delete old logs (for maintenance)
  async deleteOldLogs(daysOld = 90) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysOld);

    const [deletedAdminLogs, deletedLoginHistory] = await Promise.all([
      this.prisma.adminLog.deleteMany({
        where: {
          createdAt: {
            lt: dateThreshold,
          },
        },
      }),
      this.prisma.loginHistory.deleteMany({
        where: {
          createdAt: {
            lt: dateThreshold,
          },
        },
      }),
    ]);

    return {
      deletedAdminLogs: deletedAdminLogs.count,
      deletedLoginHistory: deletedLoginHistory.count,
    };
  }
}
