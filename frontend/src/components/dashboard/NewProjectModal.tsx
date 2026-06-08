"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { projectsApi, Project, ProjectPhase, ProjectStatus } from "@/lib/api";

const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "initialisation", label: "🔷 Initialisation" },
  { value: "conception",     label: "💡 Conception"     },
  { value: "realisation",    label: "⚙️ Réalisation"    },
  { value: "deploiement",    label: "🚀 Déploiement"    },
  { value: "cloture",        label: "✅ Clôture"        },
];

interface Form {
  name: string;
  client: string;
  project_manager: string;
  description: string;
  budget_chf: string;
  start_date: string;
  end_date_planned: string;
  phase: ProjectPhase;
}

const EMPTY: Form = {
  name: "",
  client: "",
  project_manager: "",
  description: "",
  budget_chf: "",
  start_date: "",
  end_date_planned: "",
  phase: "initialisation",
};

interface Props {
  onClose: () => void;
  onCreated: (p: Project) => void;
}

export function NewProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Form>>({});

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Form> = {};
    if (!form.name.trim())           e.name           = "Obligatoire";
    if (!form.client.trim())         e.client         = "Obligatoire";
    if (!form.project_manager.trim()) e.project_manager = "Obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Partial<Project> = {
        name:            form.name.trim(),
        client:          form.client.trim(),
        project_manager: form.project_manager.trim(),
        description:     form.description.trim() || undefined,
        budget_chf:      form.budget_chf ? parseFloat(form.budget_chf) : undefined,
        start_date:      form.start_date  || undefined,
        end_date_planned: form.end_date_planned || undefined,
        phase:           form.phase,
        status:          "green" as ProjectStatus,
        progress_pct:    0,
      };
      const created = await projectsApi.create(payload);
      onCreated(created);
      onClose();
    } catch {
      setErrors({ name: "Erreur lors de la création, vérifiez la connexion au serveur." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="font-bold text-sm text-gray-900">Nouveau projet HERMES</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Nom */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex : Refonte SI RH — Canton Vaud"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-400 ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              autoFocus
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Client + CP sur 2 colonnes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Commanditaire / Client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
                placeholder="Canton Vaud, Commune…"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-400 ${errors.client ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors.client && <p className="text-[10px] text-red-500 mt-0.5">{errors.client}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Chef de projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.project_manager}
                onChange={(e) => set("project_manager", e.target.value)}
                placeholder="Prénom Nom"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-400 ${errors.project_manager ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors.project_manager && <p className="text-[10px] text-red-500 mt-0.5">{errors.project_manager}</p>}
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Phase de démarrage
            </label>
            <select
              value={form.phase}
              onChange={(e) => set("phase", e.target.value)}
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
              placeholder="Décrivez brièvement le projet, ses enjeux, les problèmes à résoudre… L'IA utilisera ce contexte pour générer les livrables HERMES."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
            <p className="text-[10px] text-violet-600 mt-0.5">
              ✨ Plus vous décrivez, mieux l&apos;IA générera les sections des documents HERMES
            </p>
          </div>

          {/* Budget + dates sur 3 colonnes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Budget (CHF)
              </label>
              <input
                type="number"
                value={form.budget_chf}
                onChange={(e) => set("budget_chf", e.target.value)}
                placeholder="450000"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Fin prévue
              </label>
              <input
                type="date"
                value={form.end_date_planned}
                onChange={(e) => set("end_date_planned", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Création…
              </>
            ) : "Créer le projet"}
          </button>
        </div>
      </div>
    </div>
  );
}
