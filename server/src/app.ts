import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import type { Db } from "./db";
import { authRouter } from "./routes/auth";

export function createApp(db: Db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter(db));

  // Return JSON errors (e.g. malformed JSON bodies) instead of Express's HTML.
  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? 500;
    res.status(status).json({ error: status < 500 ? "Bad request" : "Internal server error" });
  });

  return app;
}