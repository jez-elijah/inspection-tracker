import bcrypt from "bcryptjs";
import { createDb, type Db } from "./index";
import { users, inspections, findings } from "./schema";

export function seed(db: Db) {
  if (db.select().from(users).all().length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const [inspector, viewer] = db
    .insert(users)
    .values([
      {
        email: "inspector@example.com",
        passwordHash: bcrypt.hashSync("inspector123", 10),
        role: "inspector",
      },
      {
        email: "viewer@example.com",
        passwordHash: bcrypt.hashSync("viewer123", 10),
        role: "viewer",
      },
    ])
    .returning()
    .all();

  const [warehouse, plant] = db
    .insert(inspections)
    .values([
      { title: "Warehouse fire exits", site: "Warehouse A", status: "open", createdBy: inspector.id },
      { title: "Electrical panel audit", site: "Plant 2", status: "resolved", createdBy: inspector.id },
    ])
    .returning()
    .all();

  db.insert(findings)
    .values([
      { inspectionId: warehouse.id, description: "Exit door blocked by pallets", severity: "high" },
      { inspectionId: warehouse.id, description: "Exit sign light out", severity: "low" },
      { inspectionId: plant.id, description: "Missing panel label", severity: "medium" },
    ])
    .run();

  console.log(`Seeded users (${inspector.email}, ${viewer.email}), 2 inspections, 3 findings.`);
}

if (require.main === module) {
  seed(createDb(process.env.DB_PATH ?? "inspections.db"));
}