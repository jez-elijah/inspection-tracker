import { Router } from "express";
import { z } from "zod";
import { and, count, desc, eq, exists, inArray, sql } from "drizzle-orm";
import type { Db } from "../db";
import { inspections, findings, STATUSES, SEVERITIES } from "../db/schema";
import { requireAuth, requireRole } from "../auth/middleware";

const idSchema = z.coerce.number().int().positive();
const text = z.string().trim().min(1).max(200);

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  severity: z.enum(SEVERITIES).optional(),
});
const createInspection = z.object({ title: text, site: text });
const updateInspection = z
  .object({ title: text.optional(), site: text.optional(), status: z.enum(STATUSES).optional() })
  .refine((o) => Object.keys(o).length > 0, { message: "Provide at least one field" });
const createFinding = z.object({
  description: z.string().trim().min(1).max(1000),
  severity: z.enum(SEVERITIES),
});

export function inspectionsRouter(db: Db) {
  const router = Router();
  const inspectorOnly = requireRole("inspector");

  router.use(requireAuth);

  router.get("/", (req, res) => {
    const q = listQuery.safeParse(req.query);
    if (!q.success) {
      res.status(400).json({ error: "Invalid filter" });
      return;
    }
    const { status, severity } = q.data;

    const rows = db
      .select()
      .from(inspections)
      .where(
        and(
          status ? eq(inspections.status, status) : undefined,
          severity
            ? exists(
                db
                  .select({ one: sql`1` })
                  .from(findings)
                  .where(and(eq(findings.inspectionId, inspections.id), eq(findings.severity, severity)))
              )
            : undefined
        )
      )
      .orderBy(desc(inspections.id))
      .all();

    const ids = rows.map((r) => r.id);
    const rowFindings = ids.length
      ? db.select().from(findings).where(inArray(findings.inspectionId, ids)).all()
      : [];

    const counts = db
      .select({ status: inspections.status, n: count() })
      .from(inspections)
      .groupBy(inspections.status)
      .all();
    const summary = { open: 0, resolved: 0, total: 0 };
    for (const c of counts) {
      summary[c.status] = c.n;
      summary.total += c.n;
    }

    res.json({
      inspections: rows.map((r) => ({
        ...r,
        findings: rowFindings.filter((f) => f.inspectionId === r.id),
      })),
      summary,
    });
  });

  router.get("/:id", (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const inspection = db.select().from(inspections).where(eq(inspections.id, id.data)).get();
    if (!inspection) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }
    const items = db.select().from(findings).where(eq(findings.inspectionId, id.data)).all();
    res.json({ ...inspection, findings: items });
  });

  router.post("/", inspectorOnly, (req, res) => {
    const body = createInspection.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "title and site are required" });
      return;
    }
    const created = db
      .insert(inspections)
      .values({ ...body.data, createdBy: req.user!.id })
      .returning()
      .get();
    res.status(201).json(created);
  });

  router.post("/:id/findings", inspectorOnly, (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const body = createFinding.safeParse(req.body);
    if (!id.success || !body.success) {
      res.status(400).json({ error: "Invalid id, description or severity" });
      return;
    }
    const inspection = db.select().from(inspections).where(eq(inspections.id, id.data)).get();
    if (!inspection) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }
    const created = db
      .insert(findings)
      .values({ inspectionId: id.data, ...body.data })
      .returning()
      .get();
    res.status(201).json(created);
  });

  router.patch("/:id", inspectorOnly, (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    const body = updateInspection.safeParse(req.body);
    if (!id.success || !body.success) {
      res.status(400).json({ error: "Invalid id or fields" });
      return;
    }
    const updated = db
      .update(inspections)
      .set(body.data)
      .where(eq(inspections.id, id.data))
      .returning()
      .get();
    if (!updated) {
      res.status(404).json({ error: "Inspection not found" });
      return;
    }
    res.json(updated);
  });

  return router;
}