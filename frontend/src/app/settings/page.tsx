"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlannerStore } from "@/lib/plannerStore";
import { Bucket, DEFAULT_BUCKETS, api } from "@/lib/api";
import {
  GripVertical, Trash2, Plus, Sparkles, Save,
  Upload, FileText, X, ChevronDown, ChevronUp, Info,
} from "lucide-react";

// ─── Types templates ─────────────────────────────────────────────
interface TemplateInfo {
  filename: string;
  name: string;
  template_key: string | null;
  is_custom: boolean;
  size_kb: number;
}

const TEMPLATE_KEY_LABELS: Record<string, string> = {
  mandat_initialisation: "Mandat d'initialisation",
  mandat_projet:         "Mandat de projet",
  planning_jalons:       "Planning avec jalons",
};

// Variables disponibles par type de document
const PLACEHOLDERS: Record<string, { key: string; desc: string }[]> = {
  mandat_initialisation: [
    { key: "{{name}}",                   desc: "Nom du projet" },
    { key: "{{client}}",                 desc: "Commanditaire / Client" },
    { key: "{{project_manager}}",        desc: "Chef de projet" },
    { key: "{{situation_initiale}}",     desc: "Situation initiale (rédigée par l'IA)" },
    { key: "{{objectifs_initialisation}}",desc: "Objectifs d'initialisation (IA)" },
    { key: "{{perimetre}}",              desc: "Périmètre (IA)" },
    { key: "{{organisation_projet}}",    desc: "Organisation du projet (IA)" },
    { key: "{{risques_initiaux}}",       desc: "Risques initiaux (IA)" },
    { key: "{{criteres_succes}}",        desc: "Critères de succès (IA)" },
  ],
  mandat_projet: [
    { key: "{{name}}",                   desc: "Nom du projet" },
    { key: "{{client}}",                 desc: "Commanditaire / Client" },
    { key: "{{project_manager}}",        desc: "Chef de projet" },
    { key: "{{budget_chf}}",             desc: "Budget en CHF" },
    { key: "{{end_date_planned}}",       desc: "Date de fin prévue" },
    { key: "{{situation_initiale}}",     desc: "Situation initiale (IA)" },
    { key: "{{objectifs_projet}}",       desc: "Objectifs du projet (IA)" },
    { key: "{{perimetre_exclusions}}",   desc: "Périmètre et exclusions (IA)" },
    { key: "{{organisation_projet}}",    desc: "Organisation du projet (IA)" },
    { key: "{{planning_jalons}}",        desc: "Planning et jalons (IA)" },
    { key: "{{risques_identifies}}",     desc: "Risques identifiés (IA)" },
    { key: "{{budget_ressources_note}}", desc: "Note budget et ressources (IA)" },
    { key: "{{criteres_succes}}",        desc: "Critères de succès (IA)" },
  ],
  planning_jalons: [
    { key: "{{name}}",                   desc: "Nom du projet" },
    { key: "{{client}}",                 desc: "Commanditaire / Client" },
    { key: "{{project_manager}}",        desc: "Chef de projet" },
    { key: "{{jalons_liste}}",           desc: "Liste des jalons (IA)" },
    { key: "{{dependances}}",            desc: "Dépendances (IA)" },
    { key: "{{ressources_critiques}}",   desc: "Ressources critiques (IA)" },
  ],
};

const COLOR_OPTIONS = [
  { label: "Gris",   value: "bg-gray-400"   },
  { label: "Bleu",   value: "bg-blue-500"   },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Vert",   value: "bg-green-500"  },
  { label: "Rouge",  value: "bg-red-500"    },
  { label: "Violet", value: "bg-violet-500" },
];

// ─── Section Templates custom ────────────────────────────────────
function TemplatesSection() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadKey, setUploadKey] = useState("mandat_projet");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<TemplateInfo[]>("/documents/templates").then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !uploadName.trim()) throw new Error("Nom et fichier requis");
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("name", uploadName.trim());
      form.append("template_key", uploadKey);
      return api.post<TemplateInfo>("/documents/templates/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setUploadFile(null);
      setUploadName("");
      setUploadError("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => setUploadError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) =>
      api.delete(`/documents/templates/${encodeURIComponent(filename)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const customTemplates = templates.filter((t) => t.is_custom);
  const builtinTemplates = templates.filter((t) => !t.is_custom);

  return (
    <div className="space-y-5">
      {/* Templates built-in */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Templates intégrés HERMES 5.1
        </h3>
        <div className="space-y-1.5">
          {isLoading && <p className="text-xs text-gray-400">Chargement…</p>}
          {builtinTemplates.map((t) => (
            <div
              key={t.filename}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5"
            >
              <FileText size={14} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{t.name}</p>
                <p className="text-[10px] text-gray-400">{t.size_kb} KB</p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                Intégré
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Templates custom */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Mes templates ({customTemplates.length})
          </h3>
          <div className="space-y-1.5">
            {customTemplates.map((t) => (
              <div
                key={t.filename}
                className="flex items-center gap-3 bg-white border border-green-200 rounded-xl px-4 py-2.5"
              >
                <FileText size={14} className="text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {t.template_key ? TEMPLATE_KEY_LABELS[t.template_key] : "Personnalisé"} · {t.size_kb} KB
                  </p>
                </div>
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Custom
                </span>
                <button
                  onClick={() => deleteMutation.mutate(t.filename)}
                  className="text-gray-300 hover:text-red-400 ml-1"
                  title="Supprimer"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
          <Upload size={13} />
          Importer un template .docx
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
              Nom du template *
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Mon mandat de projet"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
              Type de document *
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
              value={uploadKey}
              onChange={(e) => setUploadKey(e.target.value)}
            >
              {Object.entries(TEMPLATE_KEY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
            Fichier .docx *
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadFile && (
            <p className="text-[10px] text-green-600 mt-1">
              ✓ {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
            </p>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{uploadError}</p>
        )}

        <button
          onClick={() => uploadMutation.mutate()}
          disabled={!uploadFile || !uploadName.trim() || uploadMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Upload size={12} />
          {uploadMutation.isPending ? "Import en cours…" : "Importer le template"}
        </button>
      </div>

      {/* Variables disponibles */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
          <Info size={13} />
          Variables disponibles dans vos templates
        </p>
        <p className="text-[11px] text-amber-700 mb-3">
          Insérez ces variables dans votre fichier .docx — elles seront remplacées automatiquement par les
          données du projet et le contenu généré par l&apos;IA.
        </p>
        <div className="space-y-2">
          {Object.entries(PLACEHOLDERS).map(([key, vars]) => (
            <div key={key}>
              <button
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 w-full text-left mb-1"
                onClick={() => setExpandedKey(expandedKey === key ? null : key)}
              >
                {expandedKey === key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {TEMPLATE_KEY_LABELS[key]}
              </button>
              {expandedKey === key && (
                <div className="grid grid-cols-1 gap-0.5 ml-4">
                  {vars.map((v) => (
                    <div key={v.key} className="flex items-center gap-2 text-[11px]">
                      <code className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                        {v.key}
                      </code>
                      <span className="text-amber-700">{v.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────
export default function SettingsPage() {
  const { buckets, setBuckets } = usePlannerStore();
  const [local, setLocal] = useState<Bucket[]>(buckets);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"buckets" | "templates">("buckets");

  const update = (id: string, patch: Partial<Bucket>) =>
    setLocal((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

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
        <h1 className="font-bold text-base text-gray-900">⚙️ Paramétrage</h1>
        {tab === "buckets" && (
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
                saved ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Save size={12} />
              {saved ? "Sauvegardé ✓" : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 bg-white">
        {(["buckets", "templates"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "buckets" ? "⚡ Buckets Planner" : "📄 Templates Word"}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 max-w-2xl">
        {/* ── Onglet Buckets ── */}
        {tab === "buckets" && (
          <>
            <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <p className="font-semibold mb-1">Comment fonctionnent les buckets</p>
              <p className="text-xs text-blue-700">
                Les buckets représentent les statuts d&apos;avancement d&apos;un livrable dans le Planner.
                Activez le <strong>déclencheur IA</strong> sur un bucket pour que les cards de type
                &quot;Doc HERMES&quot; génèrent automatiquement leur document Word via Claude.
              </p>
            </div>

            <div className="space-y-3">
              {local.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
                >
                  <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                  <select
                    value={bucket.color}
                    onChange={(e) => update(bucket.id, { color: e.target.value })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${bucket.color}`} />
                  <input
                    type="text"
                    value={bucket.emoji}
                    onChange={(e) => update(bucket.id, { emoji: e.target.value })}
                    className="w-10 text-center border border-gray-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={bucket.label}
                    onChange={(e) => update(bucket.id, { label: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={bucket.aiTrigger}
                        onChange={(e) => update(bucket.id, { aiTrigger: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-9 h-5 rounded-full transition-colors ${bucket.aiTrigger ? "bg-violet-500" : "bg-gray-200"}`} />
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bucket.aiTrigger ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                      <Sparkles size={10} className={bucket.aiTrigger ? "text-violet-500" : "text-gray-300"} />
                      IA
                    </span>
                  </label>
                  <button onClick={() => remove(bucket.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setLocal((prev) => [
                  ...prev,
                  { id: `custom_${Date.now()}` as never, label: "Nouveau bucket", emoji: "📌", color: "bg-gray-400", aiTrigger: false },
                ])
              }
              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
            >
              <Plus size={14} />
              Ajouter un bucket
            </button>

            <div className="mt-6 p-4 rounded-xl bg-violet-50 border border-violet-200">
              <p className="text-xs font-bold text-violet-800 mb-2 flex items-center gap-1.5">
                <Sparkles size={13} /> Règles de déclenchement IA actives
              </p>
              {local.filter((b) => b.aiTrigger).length === 0 ? (
                <p className="text-xs text-violet-600">Aucun déclencheur actif.</p>
              ) : (
                local.filter((b) => b.aiTrigger).map((b) => (
                  <p key={b.id} className="text-xs text-violet-700 mb-1">
                    • Quand un <strong>Doc HERMES</strong> entre dans <strong>&quot;{b.emoji} {b.label}&quot;</strong> → génération automatique via Claude
                  </p>
                ))
              )}
            </div>
          </>
        )}

        {/* ── Onglet Templates ── */}
        {tab === "templates" && <TemplatesSection />}
      </div>
    </div>
  );
}
