import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createDb, type Db } from "../src/db";
import { seed } from "../src/db/seed";
import { users, inspections, findings } from "../src/db/schema";

describe("database", () => {
  let db: Db;

  beforeEach(() => {
    db = createDb(); // fresh in-memory database per test
    seed(db);
  });

  it("seeds one inspector and one viewer", () => {
    const roles = db.select().from(users).all().map((u) => u.role).sort();
    expect(roles).toEqual(["inspector", "viewer"]);
  });

  it("stores hashed passwords, never plaintext", () => {
    const u = db.select().from(users).where(eq(users.email, "viewer@example.com")).get()!;
    expect(u.passwordHash).not.toBe("viewer123");
    expect(bcrypt.compareSync("viewer123", u.passwordHash)).toBe(true);
  });

  it("enforces unique emails", () => {
    expect(() =>
      db.insert(users).values({ email: "viewer@example.com", passwordHash: "x", role: "viewer" }).run()
    ).toThrow();
  });

  it("rejects an invalid severity", () => {
    expect(() =>
      db.insert(findings).values({ inspectionId: 1, description: "x", severity: "bogus" as "low" }).run()
    ).toThrow();
  });

  it("deletes findings when their inspection is deleted", () => {
    db.delete(inspections).where(eq(inspections.id, 1)).run();
    const remaining = db.select().from(findings).where(eq(findings.inspectionId, 1)).all();
    expect(remaining).toHaveLength(0);
  });
});