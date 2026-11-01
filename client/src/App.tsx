import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth";
import InspectionDetailPage from "@/pages/InspectionDetailPage";
import InspectionsPage from "@/pages/InspectionsPage";
import LoginPage from "@/pages/LoginPage";

function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            Site Safety Inspection Tracker
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span>{user.email}</span>
            <Badge variant="secondary">{user.role}</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<InspectionsPage />} />
            <Route path="/inspections/:id" element={<InspectionDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}