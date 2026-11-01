export const STATUSES = ["open", "resolved"] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export type Role = "inspector" | "viewer";
export type Status = (typeof STATUSES)[number];
export type Severity = (typeof SEVERITIES)[number];

export interface User {
  id: number;
  email: string;
  role: Role;
}
export interface Finding {
  id: number;
  inspectionId: number;
  description: string;
  severity: Severity;
  createdAt: string;
}
export interface Inspection {
  id: number;
  title: string;
  site: string;
  status: Status;
  createdBy: number;
  createdAt: string;
}
export interface InspectionWithFindings extends Inspection {
  findings: Finding[];
}
export interface Summary {
  open: number;
  resolved: number;
  total: number;
}

const BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const SESSION_KEY = "inspection-tracker-session";

interface Session {
  token: string;
  user: User;
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (private mode, etc.): the session just won't persist.
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = loadSession()?.token;
  const hasBody = options.body !== undefined;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // An expired or invalid token while logged in: tell the app to log out.
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(res.status, data?.error ?? "Request failed");
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: { email, password } }),

  listInspections: (filters: { status?: Status; severity?: Severity }) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.severity) params.set("severity", filters.severity);
    const qs = params.toString();
    return request<{ inspections: InspectionWithFindings[]; summary: Summary }>(
      `/inspections${qs ? `?${qs}` : ""}`
    );
  },

  getInspection: (id: number) => request<InspectionWithFindings>(`/inspections/${id}`),

  createInspection: (input: { title: string; site: string }) =>
    request<Inspection>("/inspections", { method: "POST", body: input }),

  addFinding: (id: number, input: { description: string; severity: Severity }) =>
    request<Finding>(`/inspections/${id}/findings`, { method: "POST", body: input }),

  updateInspection: (id: number, input: { title?: string; site?: string; status?: Status }) =>
    request<Inspection>(`/inspections/${id}`, { method: "PATCH", body: input }),
};