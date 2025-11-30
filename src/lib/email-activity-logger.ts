import { prisma } from "./db";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
export type LogType = "CONNECTION" | "FETCH" | "SEND" | "ERROR" | "INFO";

interface LogEntry {
  channelId?: string | null;
  channelName?: string | null;
  type: LogType;
  level?: LogLevel;
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

class EmailActivityLogger {
  async log(entry: LogEntry): Promise<void> {
    try {
      await prisma.emailActivityLog.create({
        data: {
          channelId: entry.channelId || null,
          channelName: entry.channelName || null,
          type: entry.type,
          level: entry.level || "INFO",
          message: entry.message,
          details: entry.details ? JSON.stringify(entry.details) : null,
          duration: entry.duration || null,
        },
      });
    } catch (error) {
      // Don't let logging errors break the app
      console.error("[EmailActivityLogger] Failed to log:", error);
    }
  }

  async info(
    message: string,
    options?: Omit<LogEntry, "message" | "level" | "type">
  ): Promise<void> {
    await this.log({ ...options, type: "INFO", level: "INFO", message });
  }

  async warn(
    message: string,
    options?: Omit<LogEntry, "message" | "level" | "type">
  ): Promise<void> {
    await this.log({ ...options, type: "INFO", level: "WARN", message });
  }

  async error(
    message: string,
    options?: Omit<LogEntry, "message" | "level" | "type">
  ): Promise<void> {
    await this.log({ ...options, type: "ERROR", level: "ERROR", message });
  }

  async connection(
    message: string,
    options?: Omit<LogEntry, "message" | "type">
  ): Promise<void> {
    await this.log({
      ...options,
      type: "CONNECTION",
      level: options?.level || "INFO",
      message,
    });
  }

  async fetch(
    message: string,
    options?: Omit<LogEntry, "message" | "type">
  ): Promise<void> {
    await this.log({
      ...options,
      type: "FETCH",
      level: options?.level || "INFO",
      message,
    });
  }

  async send(
    message: string,
    options?: Omit<LogEntry, "message" | "type">
  ): Promise<void> {
    await this.log({
      ...options,
      type: "SEND",
      level: options?.level || "INFO",
      message,
    });
  }

  // Get recent logs with optional filters
  async getRecent(options?: {
    channelId?: string;
    type?: LogType;
    level?: LogLevel;
    limit?: number;
  }) {
    return prisma.emailActivityLog.findMany({
      where: {
        ...(options?.channelId && { channelId: options.channelId }),
        ...(options?.type && { type: options.type }),
        ...(options?.level && { level: options.level }),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
    });
  }

  // Clear old logs (keep last 7 days)
  async cleanup(daysToKeep = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.emailActivityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}

// Export singleton instance
export const emailLogger = new EmailActivityLogger();
