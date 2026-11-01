import { describe, it, expect, afterEach } from "vitest";
import { jwtSecret } from "../src/config";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("jwtSecret", () => {
  it("uses JWT_SECRET when it is set", () => {
    process.env.JWT_SECRET = "from-env";
    process.env.NODE_ENV = "production";
    expect(jwtSecret()).toBe("from-env");
  });

  it("allows the dev fallback only in development and test", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";
    expect(jwtSecret()).toBe("dev-only-secret-change-me");
    process.env.NODE_ENV = "test";
    expect(jwtSecret()).toBe("dev-only-secret-change-me");
  });

  it("throws in production, staging, or when NODE_ENV is unset", () => {
    delete process.env.JWT_SECRET;
    for (const env of ["production", "staging"]) {
      process.env.NODE_ENV = env;
      expect(() => jwtSecret()).toThrow("JWT_SECRET must be set");
    }
    delete process.env.NODE_ENV;
    expect(() => jwtSecret()).toThrow("JWT_SECRET must be set");
  });
});