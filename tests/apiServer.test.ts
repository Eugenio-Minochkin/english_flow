import { describe, expect, test } from "vitest";
import { buildServer } from "../src/apps/api/server.js";

describe("Fastify API server", () => {
  test("builds and serves health endpoint", async () => {
    const app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/health" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
