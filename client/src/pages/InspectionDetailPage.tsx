import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { api, ApiError, SEVERITIES, type InspectionWithFindings, type Severity } from "@/lib/api";

export default function InspectionDetailPage() {
  const { id } = useParams();
  const inspectionId = Number(id);
  const { user } = useAuth();
  const canEdit = user?.role === "inspector";

  const [inspection, setInspection] = useState<InspectionWithFindings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");

  const load = useCallback(async () => {
    try {
      setInspection(await api.getInspection(inspectionId));
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.status === 404
            ? "Inspection not found"
            : err.message
          : "Could not reach the server"
      );
    }
  }, [inspectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStatus() {
    if (!inspection) return;
    setActionError(null);
    setBusy(true);
    try {
      await api.updateInspection(inspection.id, {
        status: inspection.status === "open" ? "resolved" : "open",
      });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  async function addFinding(e: FormEvent) {
    e.preventDefault();
    if (!inspection) return;
    setActionError(null);
    setBusy(true);
    try {
      await api.addFinding(inspection.id, { description, severity });
      setDescription("");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{loadError}</p>
        <Link to="/" className="text-sm underline">
          Back to inspections
        </Link>
      </div>
    );
  }

  if (!inspection) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm underline">
        Back to inspections
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{inspection.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {inspection.site} - created {inspection.createdAt.slice(0, 10)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={inspection.status} />
            {canEdit && (
              <Button variant="outline" size="sm" onClick={toggleStatus} disabled={busy}>
                {inspection.status === "open" ? "Mark resolved" : "Reopen"}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Findings ({inspection.findings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {inspection.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspection.findings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <SeverityBadge severity={f.severity} />
                    </TableCell>
                    <TableCell>{f.description}</TableCell>
                    <TableCell>{f.createdAt.slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Add a finding</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addFinding} className="flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1 space-y-2">
                <Label htmlFor="finding-description">Description</Label>
                <Input
                  id="finding-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity((v ?? "medium") as Severity)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={busy}>
                Add finding
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}