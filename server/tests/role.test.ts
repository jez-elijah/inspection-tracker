import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth, requireRole } from "../src/auth/middleware";
import { signToken } from "../src/auth/token";

const app = express();
app.post("/write", requireAuth, requireRole("inspector"), (_req, res) => {
  res.json({ ok: true });
});

describe("requireRole", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).post("/write");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a viewer", async () => {
    const token = signToken({ id: 2, role: "viewer" });
    const res = await request(app).post("/write").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows an inspector", async () => {
    const token = signToken({ id: 1, role: "inspector" });
    const res = await request(app).post("/write").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});