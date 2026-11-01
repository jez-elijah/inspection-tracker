import jwt from "jsonwebtoken";
import { jwtSecret } from "../config";
import { ROLES } from "../db/schema";

export type Role = (typeof ROLES)[number];
export type AuthUser = { id: number; role: Role };

export function signToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, jwtSecret(), {
    subject: String(user.id),
    expiresIn: "1h",
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"] });
  if (typeof payload === "string") throw new Error("Invalid token payload");

  const id = Number(payload.sub);
  const role = payload.role;
  if (!Number.isInteger(id) || !ROLES.includes(role)) {
    throw new Error("Invalid token claims");
  }
  return { id, role };
}