import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { createDb } from "../src/db";
import { seed } from "../src/db/seed";
import { signToken } from "../src/auth/token";

// Seed data: user 1 = inspector, user 2 = viewer.
// Inspection 1 "Warehouse fire exits" (open; high + low findings)
// Inspection 2 "Electrical panel audit" (resolved; medium finding)
const as = (role: "inspector" | "viewer") => ({
  Authorization: `Bearer ${signToken({ id: role === "inspector" ? 1 : 2, role })}`,
});

describe("inspections API", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    const db = createDb();
    seed(db);
    app = createApp(db);
  });

  it("rejects unauthenticated requests with 401", async () => {
    expect((await request(app).get("/inspections")).status).toBe(401);
    expect((await request(app).get("/inspections/1")).status).toBe(401);
  });

  it("lets a viewer read the list, with overall summary counts", async () => {
    const res = await request(app).get("/inspections").set(as("viewer"));
    expect(res.status).toBe(200);
    expect(res.body.inspections).toHaveLength(2);
    expect(res.body.summary).toEqual({ open: 1, resolved: 1, total: 2 });
  });

  it("filters by status and by severity", async () => {
    const byStatus = await request(app).get("/inspections?status=resolved").set(as("viewer"));
    expect(byStatus.body.inspections.map((i: { id: number }) => i.id)).toEqual([2]);

    const bySeverity = await request(app).get("/inspections?severity=high").set(as("viewer"));
    expect(bySeverity.body.inspections.map((i: { id: number }) => i.id)).toEqual([1]);
  });

  it("rejects an invalid filter value with 400", async () => {
    const res = await request(app).get("/inspections?severity=bogus").set(as("viewer"));
    expect(res.status).toBe(400);
  });

  it("returns an inspection with its findings, 404 if missing, 400 if bad id", async () => {
    const ok = await request(app).get("/inspections/1").set(as("viewer"));
    expect(ok.status).toBe(200);
    expect(ok.body.findings).toHaveLength(2);

    expect((await request(app).get("/inspections/999").set(as("viewer"))).status).toBe(404);
    expect((await request(app).get("/inspections/abc").set(as("viewer"))).status).toBe(400);
  });

  it("forbids a viewer from every write route with 403", async () => {
    const attempts = [
      request(app).post("/inspections").set(as("viewer")).send({ title: "t", site: "s" }),
      request(app).post("/inspections/1/findings").set(as("viewer")).send({ description: "d", severity: "low" }),
      request(app).patch("/inspections/1").set(as("viewer")).send({ status: "resolved" }),
    ];
    for (const res of await Promise.all(attempts)) {
      expect(res.status).toBe(403);
    }
  });

  it("lets an inspector create an inspection, owned by them and open by default", async () => {
    const res = await request(app)
      .post("/inspections")
      .set(as("inspector"))
      .send({ title: "Loading dock check", site: "Dock 4" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Loading dock check", status: "open", createdBy: 1 });
  });

  it("validates writes: empty title, bad severity, empty patch", async () => {
    const empty = await request(app).post("/inspections").set(as("inspector")).send({ title: "  ", site: "x" });
    expect(empty.status).toBe(400);

    const badSeverity = await request(app)
      .post("/inspections/1/findings")
      .set(as("inspector"))
      .send({ description: "x", severity: "bogus" });
    expect(badSeverity.status).toBe(400);

    const emptyPatch = await request(app).patch("/inspections/1").set(as("inspector")).send({});
    expect(emptyPatch.status).toBe(400);
  });

  it("lets an inspector add a finding and resolve an inspection", async () => {
    const added = await request(app)
      .post("/inspections/1/findings")
      .set(as("inspector"))
      .send({ description: "Extinguisher expired", severity: "critical" });
    expect(added.status).toBe(201);

    const detail = await request(app).get("/inspections/1").set(as("viewer"));
    expect(detail.body.findings).toHaveLength(3);

    const resolved = await request(app).patch("/inspections/1").set(as("inspector")).send({ status: "resolved" });
    expect(resolved.status).toBe(200);
    expect(resolved.body.status).toBe("resolved");

    const list = await request(app).get("/inspections").set(as("viewer"));
    expect(list.body.summary).toEqual({ open: 0, resolved: 2, total: 2 });
  });
});