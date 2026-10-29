import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const ROLES = ["inspector", "viewer"] as const;
export const STATUSES = ["open", "resolved"] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull(),
});

export const inspections = sqliteTable("inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  site: text("site").notNull(),
  status: text("status", { enum: STATUSES }).notNull().default("open"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const findings = sqliteTable("findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inspectionId: integer("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  severity: text("severity", { enum: SEVERITIES }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type Finding = typeof findings.$inferSelect;