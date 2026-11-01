import { createApp } from "./app";
import { createDb } from "./db";
import { seed } from "./db/seed";
import { jwtSecret } from "./config";

jwtSecret(); // throws at startup if JWT_SECRET is missing in production

const port = Number(process.env.PORT) || 3000;
const db = createDb(process.env.DB_PATH ?? "inspections.db");

if (process.env.SEED === "true") {
  seed(db); // no-op if users already exist
}

createApp(db).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});