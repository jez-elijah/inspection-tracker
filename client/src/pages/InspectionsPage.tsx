import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { NewInspectionDialog } from "@/components/NewInspectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import {
  api,
  ApiError,
  SEVERITIES,
  type InspectionWithFindings,
  type Severity,
  type Status,
  type Summary,
} from "@/lib/api";

type StatusFilter = "all" | Status;
type SeverityFilter = "all" | Severity;

function highestSeverity(inspection: InspectionWithFindings): Severity | null {
  let best = -1;
  for (const f of inspection.findings) best = Math.max(best, SEVERITIES.indexOf(f.severity));
  return best >= 0 ? SEVERITIES[best] : null;
}

export default function InspectionsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [data, setData] = useState<{ inspections: InspectionWithFindings[]; summary: Summary } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listInspections({
        status: status === "all" ? undefined : status,
        severity: severity === "all" ? undefined : severity,
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not reach the server");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, severity]);

  const summary = data?.summary;
  const cards = [
    { label: "Open", value: summary?.open },
    { label: "Resolved", value: summary?.resolved },
    { label: "Total", value: summary?.total },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{c.value ?? "-"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus((v ?? "all") as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severity} onValueChange={(v) => setSeverity((v ?? "all") as SeverityFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {user?.role === "inspector" && (
          <Button className="ml-auto" onClick={() => setDialogOpen(true)}>
            New inspection
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Highest severity</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.inspections.map((i) => {
                const top = highestSeverity(i);
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link to={`/inspections/${i.id}`} className="font-medium underline-offset-4 hover:underline">
                        {i.title}
                      </Link>
                    </TableCell>
                    <TableCell>{i.site}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell>{i.findings.length}</TableCell>
                    <TableCell>{top ? <SeverityBadge severity={top} /> : "-"}</TableCell>
                    <TableCell>{i.createdAt.slice(0, 10)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {loading && !data && <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>}
          {data && data.inspections.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No inspections match these filters.</p>
          )}
        </CardContent>
      </Card>

      <NewInspectionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}