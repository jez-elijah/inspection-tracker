import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { createDb } from "../src/db";
import { seed } from "../src/db/seed";
import { jwtSecret } from "../src/config";

describe("auth", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    const db = createDb();
    seed(db);
    app = createApp(db);
  });

  const login = (email: string, password: string) =>
    request(app).post("/auth/login").send({ email, password });

  describe("POST /auth/login", () => {
    it("returns a token and role for valid credentials", async () => {
      const res = await login("inspector@example.com", "inspector123");
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe("string");
      expect(res.body.user.role).toBe("inspector");
      expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("rejects a wrong password with 401", async () => {
      const res = await login("inspector@example.com", "wrong");
      expect(res.status).toBe(401);
    });

    it("gives the same error for an unknown email (no account enumeration)", async () => {
      const wrongPw = await login("inspector@example.com", "wrong");
      const unknown = await login("nobody@example.com", "whatever");
      expect(unknown.status).toBe(401);
      expect(unknown.body).toEqual(wrongPw.body);
    });

    it("rejects missing fields with 400", async () => {
      const res = await request(app).post("/auth/login").send({ email: "inspector@example.com" });
      expect(res.status).toBe(400);
    });

    it("rejects a malformed email with 400", async () => {
      const res = await login("not-an-email", "x");
      expect(res.status).toBe(400);
    });

    it("returns a JSON 400 for a malformed JSON body", async () => {
      const res = await request(app)
        .post("/auth/login")
        .set("Content-Type", "application/json")
        .send("{bad json");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /auth/me (token validation)", () => {
    it("rejects a request with no Authorization header", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
    });

    it("rejects a malformed token", async () => {
      const res = await request(app).get("/auth/me").set("Authorization", "Bearer not.a.jwt");
      expect(res.status).toBe(401);
    });

    it("rejects an expired token", async () => {
      const expired = jwt.sign({ role: "viewer" }, jwtSecret(), { subject: "2", expiresIn: -10 });
      const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it("rejects a token signed with the wrong secret", async () => {
      const forged = jwt.sign({ role: "inspector" }, "attacker-secret", { subject: "1" });
      const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });

    it("accepts a valid token and returns the user", async () => {
      const { body } = await login("viewer@example.com", "viewer123");
      const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("viewer");
    });
  });
});