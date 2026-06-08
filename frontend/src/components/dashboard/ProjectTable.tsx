"use client";

import { Project, ProjectPhase, ProjectStatus } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil } from "lucide-react";

const PHASE_LABELS: Record<ProjectPhase, string> = {
  initialisation: "🔷 Initialisation",
  conception: "💡 Conception",
  realisation: "⚙️ Réalisation",
  deploiement: "🚀 Déploiement",
  cloture: "✅ Clôture",
};

const STATUS_BADGE: Record<ProjectStatus, string> = {
  green: "badge-green",
  orange: "badge-orange",
  red: "badge-red",
  closed: "badge-gray",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  green: "● En bonne santé",
  orange: "● À surveiller",
  red: "● En difficulté",
  closed: "● Clôturé",
};

const PROGRESS_COLOR: Record<ProjectStatus, string> = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  closed: "bg-gray-400",
};

interface ProjectTableProps {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export function ProjectTable({ projects, onOpen }: ProjectTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {[
              "Projet",
              "Phase",
              "Statut",
              "Avancement",
              "Chef de projet",
              "Prochain jalon",
              "Docs IA",
              "",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Projet */}
              <td className="px-3 py-3">
                <div className="font-semibold text-gray-900 text-xs">{p.name}</div>
                <div className="text-[10px] text-gray-400">
                  {p.client}
                  {p.budget_chf && ` · CHF ${p.budget_chf.toLocaleString("fr-CH")}`}
                </div>
              </td>

              {/* Phase */}
              <td className="px-3 py-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap">
                  {PHASE_LABELS[p.phase]}
                </span>
              </td>

              {/* Statut */}
              <td className="px-3 py-3">
                <span className={STATUS_BADGE[p.status]}>
                  {STATUS_LABEL[p.status]}
                </span>
              </td>

              {/* Avancement */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PROGRESS_COLOR[p.status]}`}
                      style={{ width: `${p.progress_pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {p.progress_pct}%
                  </span>
                </div>
              </td>

              {/* Chef de projet */}
              <td className="px-3 py-3 text-xs text-gray-600">
                {p.project_manager}
              </td>

              {/* Prochain jalon */}
              <td className="px-3 py-3">
                {p.next_milestone ? (
                  <>
                    <div className="text-xs text-gray-700">{p.next_milestone}</div>
                    {p.next_milestone_date && (
                      <div className="text-[10px] text-gray-400">
                        {format(new Date(p.next_milestone_date), "dd.MM.yyyy", {
                          locale: fr,
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-gray-300">—</span>
                )}
              </td>

              {/* Docs IA */}
              <td className="px-3 py-3">
                {(p.ai_docs_count ?? 0) > 0 ? (
                  <span className="badge-violet">✨ {p.ai_docs_count} docs</span>
                ) : (
                  <span className="text-[10px] text-gray-300">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-3 py-3">
                <button
                  onClick={() => onOpen(p)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier le projet"
                >
                  <Pencil size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {projects.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          Aucun projet trouvé
        </div>
      )}
    </div>
  );
}
