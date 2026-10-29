import { createApp } from "./app";
import { createDb } from "./db";

const port = Number(process.env.PORT) || 3000;
const db = createDb(process.env.DB_PATH ?? "inspections.db");

createApp(db).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});