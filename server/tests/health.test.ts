import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { createDb } from "../src/db";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(createApp(createDb())).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});