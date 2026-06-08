"use client";

import { useState } from "react";
import { usePlannerStore } from "@/lib/plannerStore";
import { Bucket, DEFAULT_BUCKETS } from "@/lib/api";
import { GripVertical, Trash2, Plus, Sparkles, Save } from "lucide-react";

const COLOR_OPTIONS = [
  { label: "Gris",   value: "bg-gray-400"   },
  { label: "Bleu",   value: "bg-blue-500"   },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Vert",   value: "bg-green-500"  },
  { label: "Rouge",  value: "bg-red-500"    },
  { label: "Violet", value: "bg-violet-500" },
];

export default function SettingsPage() {
  const { buckets, setBuckets } = usePlannerStore();
  const [local, setLocal] = useState<Bucket[]>(buckets);
  const [saved, setSaved] = useState(false);

  const update = (id: string, patch: Partial<Bucket>) =>
    setLocal((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );

  const remove = (id: string) =>
    setLocal((prev) => prev.filter((b) => b.id !== id));

  const handleSave = () => {
    setBuckets(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => setLocal(DEFAULT_BUCKETS);

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50">
      {/* Topbar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
        <h1 className="font-bold text-base text-gray-900">⚙️ Paramétrage des buckets</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Save size={12} />
            {saved ? "Sauvegardé ✓" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-2xl">
        {/* Info */}
        <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <p className="font-semibold mb-1">Comment fonctionnent les buckets</p>
          <p className="text-xs text-blue-700">
            Les buckets représentent les statuts d&apos;avancement d&apos;un livrable dans le Planner.
            Activez le <strong>déclencheur IA</strong> sur un bucket pour que les cards de type
            &quot;Doc HERMES&quot; génèrent automatiquement leur document Word via Claude quand elles y arrivent.
          </p>
        </div>

        {/* Liste des buckets */}
        <div className="space-y-3">
          {local.map((bucket) => (
            <div
              key={bucket.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              {/* Drag handle (visuel) */}
              <GripVertical size={16} className="text-gray-300 flex-shrink-0" />

              {/* Couleur */}
              <select
                value={bucket.color}
                onChange={(e) => update(bucket.id, { color: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {/* Dot preview */}
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${bucket.color}`} />

              {/* Emoji */}
              <input
                type="text"
                value={bucket.emoji}
                onChange={(e) => update(bucket.id, { emoji: e.target.value })}
                className="w-10 text-center border border-gray-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                maxLength={2}
              />

              {/* Label */}
              <input
                type="text"
                value={bucket.label}
                onChange={(e) => update(bucket.id, { label: e.target.value })}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />

              {/* Déclencheur IA */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={bucket.aiTrigger}
                    onChange={(e) => update(bucket.id, { aiTrigger: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors ${
                      bucket.aiTrigger ? "bg-violet-500" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      bucket.aiTrigger ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  <Sparkles size={10} className={bucket.aiTrigger ? "text-violet-500" : "text-gray-300"} />
                  IA
                </span>
              </label>

              {/* Supprimer */}
              <button
                onClick={() => remove(bucket.id)}
                className="text-gray-300 hover:text-red-400 flex-shrink-0"
                title="Supprimer ce bucket"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Ajouter un bucket */}
        <button
          onClick={() =>
            setLocal((prev) => [
              ...prev,
              {
                id: `custom_${Date.now()}` as never,
                label: "Nouveau bucket",
                emoji: "📌",
                color: "bg-gray-400",
                aiTrigger: false,
              },
            ])
          }
          className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
        >
          <Plus size={14} />
          Ajouter un bucket
        </button>

        {/* Règles de déclenchement */}
        <div className="mt-6 p-4 rounded-xl bg-violet-50 border border-violet-200">
          <p className="text-xs font-bold text-violet-800 mb-2 flex items-center gap-1.5">
            <Sparkles size={13} /> Règles de déclenchement IA actives
          </p>
          {local.filter((b) => b.aiTrigger).length === 0 ? (
            <p className="text-xs text-violet-600">Aucun déclencheur actif.</p>
          ) : (
            local
              .filter((b) => b.aiTrigger)
              .map((b) => (
                <p key={b.id} className="text-xs text-violet-700 mb-1">
                  • Quand un <strong>Doc HERMES</strong> entre dans{" "}
                  <strong>&quot;{b.emoji} {b.label}&quot;</strong> → génération automatique via Claude
                </p>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
