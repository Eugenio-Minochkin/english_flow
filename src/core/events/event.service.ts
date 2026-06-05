import type { PrismaClient } from "@prisma/client";

export class EventService {
  constructor(private readonly prisma: PrismaClient) {}

  async record(eventType: string, userId?: string, payload?: unknown) {
    return this.prisma.eventLog.create({
      data: {
        eventType,
        userId,
        payload: payload as object | undefined
      }
    });
  }
}
