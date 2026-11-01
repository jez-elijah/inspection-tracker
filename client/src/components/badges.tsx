import { Badge } from "@/components/ui/badge";
import type { Severity, Status } from "@/lib/api";

const severityClass: Record<Severity, string> = {
  low: "bg-slate-200 text-slate-800 hover:bg-slate-200",
  medium: "bg-yellow-200 text-yellow-900 hover:bg-yellow-200",
  high: "bg-orange-200 text-orange-900 hover:bg-orange-200",
  critical: "bg-red-600 text-white hover:bg-red-600",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge className={severityClass[severity]}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={status === "open" ? "default" : "secondary"}>{status}</Badge>;
}