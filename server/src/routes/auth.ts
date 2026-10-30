import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { users } from "../db/schema";
import { signToken } from "../auth/token";
import { requireAuth } from "../auth/middleware";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Compared against when the email is unknown, so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function authRouter(db: Db) {
  const router = Router();

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid email and password are required" });
      return;
    }
    const { email, password } = parsed.data;

    const user = db.select().from(users).where(eq(users.email, email)).get();
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !matches) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}