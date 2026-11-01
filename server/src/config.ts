export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return "dev-only-secret-change-me";
  }
  throw new Error("JWT_SECRET must be set");
}