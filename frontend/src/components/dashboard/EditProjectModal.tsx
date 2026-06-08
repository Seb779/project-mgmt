"use client";

import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { projectsApi, Project, ProjectPhase, ProjectStatus } from "@/lib/api";

const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "initialisation", label: "🔷 Initialisation" },
  { value: "conception",     label: "💡 Conception"     },
  { value: "realisation",    label: "⚙️ Réalisation"    },
  { value: "deploiement",    label: "🚀 Déploiement"    },
  { value: "cloture",        label: "✅ Clôture"        },
];

const STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "green",  label: "🟢 En bonne santé", color: "border-green-400 bg-green-50 text-green-800"  },
  { value: "orange", label: "🟠 À surveiller",   color: "border-orange-400 bg-orange-50 text-orange-800" },
  { value: "red",    label: "🔴 En difficulté",  color: "border-red-400 bg-red-50 text-red-800"   },
  { value: "closed", label: "⚫ Clôturé",        color: "border-gray-400 bg-gray-50 text-gray-700" },
];

interface Props {
  project: Project;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function EditProjectModal({ project, onClose, onUpdated, onDeleted }: Props) {
  const [form, setForm] = useState({
    name:             project.name,
    client:           project.client,
    project_manager:  project.project_manager,
    description:      project.description ?? "",
    budget_chf:       project.budget_chf?.toString() ?? "",
    start_date:       project.start_date ?? "",
    end_date_planned: project.end_date_planned ?? "",
    phase:            project.phase,
    status:           project.status,
    progress_pct:     project.progress_pct,
    next_milestone:       project.next_milestone ?? "",
    next_milestone_date:  project.next_milestone_date ?? "",
  });

  const [loading, setLoading]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError]             = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client.trim() || !form.project_manager.trim()) {
      setError("Nom, client et chef de projet sont obligatoires.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await projectsApi.update(project.id, {
        name:             form.name.trim(),
        client:           form.client.trim(),
        project_manager:  form.project_manager.trim(),
        description:      form.description.trim() || undefined,
        budget_chf:       form.budget_chf ? parseFloat(form.budget_chf) : undefined,
        start_date:       form.start_date || undefined,
        end_date_planned: form.end_date_planned || undefined,
        phase:            form.phase,
        status:           form.status,
        progress_pct:     form.progress_pct,
        next_milestone:      form.next_milestone.trim() || undefined,
        next_milestone_date: form.next_milestone_date || undefined,
      });
      onUpdated();
      onClose();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await projectsApi.archive(project.id);
      onDeleted();
      onClose();
    } catch {
      setError("Erreur lors de l'archivage.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="font-bold text-sm text-gray-900">{project.name}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Modifier le projet</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Statut RAG */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
              Statut RAG
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("status", s.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    form.status === s.value
                      ? s.color + " border-2 shadow-sm"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Avancement */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Avancement — <span className="text-blue-600 font-bold">{form.progress_pct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress_pct}
              onChange={(e) => set("progress_pct", parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Client + CP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Commanditaire <span className="text-red-500">*</span>
              </label>
              <input
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Chef de projet <span className="text-red-500">*</span>
              </label>
              <input
                value={form.project_manager}
                onChange={(e) => set("project_manager", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Phase</label>
            <select
              value={form.phase}
              onChange={(e) => set("phase", e.target.value as ProjectPhase)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Description / Contexte
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Prochain jalon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Prochain jalon
              </label>
              <input
                value={form.next_milestone}
                onChange={(e) => set("next_milestone", e.target.value)}
                placeholder="Ex : Revue Conception"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Date du jalon
              </label>
              <input
                type="date"
                value={form.next_milestone_date}
                onChange={(e) => set("next_milestone_date", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Budget + dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Budget (CHF)</label>
              <input
                type="number"
                value={form.budget_chf}
                onChange={(e) => set("budget_chf", e.target.value)}
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Début</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fin prévue</label>
              <input
                type="date"
                value={form.end_date_planned}
                onChange={(e) => set("end_date_planned", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          {/* Archive / suppression */}
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            >
              <Trash2 size={13} />
              Archiver
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700">Confirmer l&apos;archivage ?</span>
              <button
                onClick={handleArchive}
                disabled={loading}
                className="text-xs font-semibold text-red-700 underline ml-1"
              >
                Oui
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-xs text-gray-500 ml-1"
              >
                Non
              </button>
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sauvegarde…
                </>
              ) : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
