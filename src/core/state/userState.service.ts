import type { PrismaClient, UserStateKind } from "@prisma/client";

export class UserStateService {
  constructor(private readonly prisma: PrismaClient) {}

  async get(userId: string) {
    const state = await this.prisma.userState.findUnique({ where: { userId } });
    if (!state) return null;
    if (state.expiresAt && state.expiresAt < new Date()) {
      return this.set(userId, "IDLE", {});
    }
    return state;
  }

  async set(userId: string, state: UserStateKind, payload: unknown = {}, expiresAt?: Date | null) {
    return this.prisma.userState.upsert({
      where: { userId },
      create: { userId, state, payload: payload as object, expiresAt },
      update: { state, payload: payload as object, expiresAt }
    });
  }

  async reset(userId: string) {
    return this.set(userId, "IDLE", {});
  }
}
