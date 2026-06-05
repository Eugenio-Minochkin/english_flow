import type { PrismaClient, User } from "@prisma/client";

export type TelegramUserProfile = {
  id: number | bigint;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async findOrCreateFromTelegram(profile: TelegramUserProfile): Promise<User> {
    const adminCount = await this.prisma.user.count({ where: { isAdmin: true } });
    const shouldBootstrapAdmin = adminCount === 0;
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(profile.id) },
      create: {
        telegramId: BigInt(profile.id),
        username: profile.username,
        firstName: profile.first_name,
        lastName: profile.last_name,
        isAdmin: shouldBootstrapAdmin
      },
      update: {
        username: profile.username,
        firstName: profile.first_name,
        lastName: profile.last_name,
        ...(shouldBootstrapAdmin ? { isAdmin: true } : {})
      }
    });
  }
}
