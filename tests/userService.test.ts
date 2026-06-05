import { describe, expect, test } from "vitest";
import { UserService } from "../src/core/users/user.service.js";

describe("UserService", () => {
  test("bootstraps the first allowed user as admin when no admin exists", async () => {
    const prisma = {
      user: {
        count: async () => 0,
        upsert: async ({ create }: any) => create
      }
    };

    const user = await new UserService(prisma as never).findOrCreateFromTelegram({ id: 428925787, first_name: "Minoc" });

    expect(user.isAdmin).toBe(true);
  });
});
