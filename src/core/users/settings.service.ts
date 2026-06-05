import type { PrismaClient } from "@prisma/client";

export class SettingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserSettings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      timezone: user.timezone,
      dailyDrillCount: user.dailyDrillCount,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
      voiceFirst: user.voiceFirst,
      textAllowed: user.textAllowed,
      isPaused: user.isPaused
    };
  }
}
