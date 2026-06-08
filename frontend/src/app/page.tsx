"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, Project, ProjectStatus, ProjectPhase } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { EditProjectModal } from "@/components/dashboard/EditProjectModal";
import { Download, Plus, RefreshCw } from "lucide-react";

const STATUS_FILTERS: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "🟢 En bonne santé", value: "green" },
  { label: "🟠 À surveiller", value: "orange" },
  { label: "🔴 En difficulté", value: "red" },
];

const PHASE_FILTERS: { label: string; value: ProjectPhase | "all" }[] = [
  { label: "Toutes les phases", value: "all" },
  { label: "🔷 Initialisation", value: "initialisation" },
  { label: "💡 Conception", value: "conception" },
  { label: "⚙️ Réalisation", value: "realisation" },
  { label: "🚀 Déploiement", value: "deploiement" },
  { label: "✅ Clôture", value: "cloture" },
];

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<ProjectPhase | "all">("all");
  const [showNewProject, setShowNewProject] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["portfolio-kpis"],
    queryFn: projectsApi.kpis,
  });

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects", statusFilter, phaseFilter],
    queryFn: () =>
      projectsApi.list({
        status: statusFilter !== "all" ? statusFilter : undefined,
        phase: phaseFilter !== "all" ? phaseFilter : undefined,
      }),
  });

  const handleExportXlsx = async () => {
    const XLSX = (await import("xlsx")).default;
    const rows = projects.map((p) => ({
      Projet: p.name,
      Client: p.client,
      "Chef de projet": p.project_manager,
      Phase: p.phase,
      Statut: p.status,
      "Avancement (%)": p.progress_pct,
      "Budget (CHF)": p.budget_chf ?? "",
      "Prochain jalon": p.next_milestone ?? "",
      "Date jalon": p.next_milestone_date ?? "",
      "Docs IA": p.ai_docs_count ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portefeuille");
    XLSX.writeFile(wb, "portefeuille_hermes.xlsx");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
        <h1 className="font-bold text-base text-gray-900">Portefeuille projets</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={12} />
            Actualiser
          </button>
          <button
            onClick={handleExportXlsx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50"
          >
            <Download size={12} />
            Exporter XLSX
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
          >
            <Plus size={12} />
            Nouveau projet
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* KPI */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="Projets actifs"
            value={kpiLoading ? "…" : (kpis?.total_active ?? 0)}
            sub="Hors archivés"
            accent
          />
          <KpiCard
            label="Statut global"
            value={
              kpiLoading
                ? "…"
                : `🟢 ${kpis?.green ?? 0}  🟠 ${kpis?.orange ?? 0}  🔴 ${kpis?.red ?? 0}`
            }
            sub="RAG — Rouge / Orange / Vert"
          />
          <KpiCard
            label="Livrables générés (IA)"
            value={kpiLoading ? "…" : (kpis?.ai_docs_generated ?? 0)}
            sub="Documents HERMES produits"
          />
          <KpiCard
            label="Projets en difficulté"
            value={kpiLoading ? "…" : (kpis?.red ?? 0)}
            sub="Nécessitent une attention immédiate"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                statusFilter === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="border-l border-gray-200 mx-1" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value as ProjectPhase | "all")}
            className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            {PHASE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">
              {isLoading ? "Chargement…" : `Projets (${projects.length})`}
            </p>
            <p className="text-[10px] text-gray-400">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-CH")}
            </p>
          </div>
          <ProjectTable
            projects={projects}
            onOpen={(p) => setEditProject(p)}
          />
        </div>
      </div>

      {/* Modale nouveau projet */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-kpis"] });
            setShowNewProject(false);
          }}
        />
      )}

      {/* Modale édition projet */}
      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-kpis"] });
          }}
          onDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["portfolio-kpis"] });
          }}
        />
      )}
    </div>
  );
}
