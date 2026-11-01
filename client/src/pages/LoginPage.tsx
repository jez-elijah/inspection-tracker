import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "Invalid email or password"
            : err.message
          : "Could not reach the server"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Site Safety Inspection Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Demo accounts</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("inspector@example.com");
                  setPassword("inspector123");
                }}
              >
                Inspector
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail("viewer@example.com");
                  setPassword("viewer123");
                }}
              >
                Viewer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}