"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  DeliverableCreate,
  DeliverableType,
  ProjectPhase,
  BucketStatus,
  HERMES_TEMPLATES,
  deliverablesApi,
} from "@/lib/api";

const TYPES: { value: DeliverableType; label: string }[] = [
  { value: "hermes_doc", label: "📄 Doc HERMES (IA)" },
  { value: "milestone",  label: "🏁 Jalon"           },
  { value: "task",       label: "✅ Tâche"            },
  { value: "risk",       label: "⚠ Risque"           },
];

const PHASES: { value: ProjectPhase; label: string }[] = [
  { value: "initialisation", label: "🔷 Initialisation" },
  { value: "conception",     label: "💡 Conception"     },
  { value: "realisation",    label: "⚙️ Réalisation"    },
  { value: "deploiement",    label: "🚀 Déploiement"    },
  { value: "cloture",        label: "✅ Clôture"        },
];

interface AddDeliverableModalProps {
  projectId: number;
  defaultBucket?: BucketStatus;
  onClose: () => void;
  onCreated: (d: ReturnType<typeof deliverablesApi.create> extends Promise<infer T> ? T : never) => void;
}

// Utiliser any pour onCreated car le type inféré est complexe
export function AddDeliverableModal({
  projectId,
  defaultBucket = "backlog",
  onClose,
  onCreated,
}: {
  projectId: number;
  defaultBucket?: BucketStatus;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreated: (d: any) => void;
}) {
  const [form, setForm] = useState<DeliverableCreate>({
    project_id: projectId,
    title: "",
    deliverable_type: "task",
    bucket_status: defaultBucket,
    phase: "conception",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof DeliverableCreate, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est obligatoire"); return; }
    setLoading(true);
    try {
      const created = await deliverablesApi.create(form);
      onCreated(created);
      onClose();
    } catch {
      setError("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-bold text-sm text-gray-900">Nouveau livrable</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {/* Titre */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Mandat de projet, Sprint review…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Type
            </label>
            <select
              value={form.deliverable_type}
              onChange={(e) => set("deliverable_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Template HERMES (conditionnel) */}
          {form.deliverable_type === "hermes_doc" && (
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <label className="block text-[11px] font-semibold text-violet-700 mb-1">
                ✨ Template HERMES (génération IA)
              </label>
              <select
                value={form.hermes_template_key ?? ""}
                onChange={(e) => set("hermes_template_key", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-violet-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
              >
                <option value="">— Choisir un template —</option>
                {HERMES_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-violet-600 mt-1">
                L&apos;IA générera automatiquement les sections quand la card passera en &quot;À valider&quot;.
              </p>
            </div>
          )}

          {/* Phase */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Phase HERMES
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

          {/* Assigné + date — sur 2 colonnes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Assigné à
              </label>
              <input
                type="text"
                value={form.assigned_to ?? ""}
                onChange={(e) => set("assigned_to", e.target.value)}
                placeholder="Prénom Nom"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Échéance
              </label>
              <input
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => set("due_date", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Contexte, critères d'acceptation…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Création…" : "Créer le livrable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
