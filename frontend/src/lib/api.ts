import axios from "axios";

// En production (Docker+nginx) : URL relative "/api/v1" → nginx route vers le backend
// En dev local : surcharger avec NEXT_PUBLIC_API_URL=http://localhost:8000/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Types communs ─────────────────────────────────────────────────
export type ProjectPhase =
  | "initialisation"
  | "conception"
  | "realisation"
  | "deploiement"
  | "cloture";

export type ProjectStatus = "green" | "orange" | "red" | "closed";

export type BucketStatus =
  | "backlog"
  | "in_progress"
  | "to_validate"
  | "validated"
  | "archived";

export type DeliverableType = "hermes_doc" | "milestone" | "task" | "risk";

// ── Bucket (configurable) ────────────────────────────────────────
export interface Bucket {
  id: BucketStatus;
  label: string;
  emoji: string;
  color: string;          // Tailwind bg class for the dot
  aiTrigger: boolean;     // true = déclenchement IA quand une HERMES_DOC arrive ici
}

export const DEFAULT_BUCKETS: Bucket[] = [
  { id: "backlog",     label: "Backlog",     emoji: "📋", color: "bg-gray-400",   aiTrigger: false },
  { id: "in_progress", label: "En cours",    emoji: "⚡", color: "bg-blue-500",   aiTrigger: false },
  { id: "to_validate", label: "À valider",   emoji: "🔍", color: "bg-orange-500", aiTrigger: true  },
  { id: "validated",   label: "Validé",      emoji: "✅", color: "bg-green-500",  aiTrigger: false },
  { id: "archived",    label: "Archivé",     emoji: "🗄", color: "bg-gray-300",   aiTrigger: false },
];

// Templates HERMES disponibles
export const HERMES_TEMPLATES = [
  { key: "mandat_initialisation", label: "Mandat d'initialisation (MI)" },
  { key: "mandat_projet",         label: "Mandat de projet (MP)"         },
  { key: "planning_jalons",       label: "Planning avec jalons"           },
];

// ── Project ───────────────────────────────────────────────────────
export interface Project {
  id: number;
  uid: string;
  name: string;
  description?: string;
  client: string;
  project_manager: string;
  budget_chf?: number;
  start_date?: string;
  end_date_planned?: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  progress_pct: number;
  next_milestone?: string;
  next_milestone_date?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  deliverables_count?: number;
  ai_docs_count?: number;
}

export interface PortfolioKPIs {
  total_active: number;
  green: number;
  orange: number;
  red: number;
  ai_docs_generated: number;
}

// ── Deliverable ───────────────────────────────────────────────────
export interface Deliverable {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  deliverable_type: DeliverableType;
  bucket_status: BucketStatus;
  phase: ProjectPhase;
  assigned_to?: string;
  due_date?: string;
  hermes_template_key?: string;
  ai_generated: boolean;
  ai_sections_complete: number;
  ai_sections_total: number;
  document_path?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliverableCreate {
  project_id: number;
  title: string;
  description?: string;
  deliverable_type: DeliverableType;
  bucket_status?: BucketStatus;
  phase: ProjectPhase;
  assigned_to?: string;
  due_date?: string;
  hermes_template_key?: string;
}

export interface BucketMoveResult {
  id: number;
  bucket_status: BucketStatus;
  ai_triggered: boolean;
  message?: string;
}

// ── API calls ─────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: { status?: ProjectStatus; phase?: ProjectPhase; archived?: boolean }) =>
    api.get<Project[]>("/projects", { params }).then((r) => r.data),

  kpis: () => api.get<PortfolioKPIs>("/projects/kpis").then((r) => r.data),

  get: (id: number) => api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: Partial<Project>) =>
    api.post<Project>("/projects", data).then((r) => r.data),

  update: (id: number, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  archive: (id: number) => api.delete(`/projects/${id}`),
};

export const deliverablesApi = {
  listByProject: (projectId: number, bucketStatus?: BucketStatus) =>
    api
      .get<Deliverable[]>(`/deliverables/project/${projectId}`, {
        params: bucketStatus ? { bucket_status: bucketStatus } : undefined,
      })
      .then((r) => r.data),

  create: (data: DeliverableCreate) =>
    api.post<Deliverable>("/deliverables", data).then((r) => r.data),

  moveTobucket: (id: number, newStatus: BucketStatus) =>
    api
      .patch<BucketMoveResult>(`/deliverables/${id}/status`, null, {
        params: { new_status: newStatus },
      })
      .then((r) => r.data),
};
