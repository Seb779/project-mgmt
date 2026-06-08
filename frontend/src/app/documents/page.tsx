"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Download, Sparkles, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { projectsApi, documentsApi, HERMES_TEMPLATES, Deliverable, GenerateDocumentRequest } from "@/lib/api";

const PHASE_LABELS: Record<string, string> = {
  initialisation: "Initialisation",
  conception: "Conception",
  realisation: "Réalisation",
  deploiement: "Déploiement",
  cloture: "Clôture",
};

export default function DocumentsPage() {
  const qc = useQueryClient();

  // Sélection
  const [projectId, setProjectId] = useState<number | null>(null);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lastResult, setLastResult] = useState<{ deliverable_id: number; sections: Record<string, string> } | null>(null);

  // Données
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => documentsApi.list(projectId ?? undefined),
  });

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedTemplate = HERMES_TEMPLATES.find((t) => t.key === templateKey);

  // Génération
  const generateMutation = useMutation({
    mutationFn: (data: GenerateDocumentRequest) => documentsApi.generate(data),
    onSuccess: (result) => {
      setLastResult({ deliverable_id: result.deliverable_id, sections: result.sections });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleGenerate = () => {
    if (!projectId || !templateKey) return;
    generateMutation.mutate({
      project_id: projectId,
      template_key: templateKey,
      title: title || undefined,
      description: description || undefined,
    });
    setLastResult(null);
  };

  const canGenerate = projectId && templateKey && !generateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900">Documents HERMES</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-1">
            Générés par IA
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Sélectionnez un projet et un template — Claude rédige les sections selon HERMES 5.1
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Panel gauche : sélection ──────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4 flex flex-col gap-4">
          {/* Projet */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">
              Projet
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Sélectionner —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedProject && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 space-y-0.5">
                <div><span className="font-medium">Client :</span> {selectedProject.client}</div>
                <div><span className="font-medium">CP :</span> {selectedProject.project_manager}</div>
                <div><span className="font-medium">Phase :</span> {PHASE_LABELS[selectedProject.phase]}</div>
              </div>
            )}
          </div>

          {/* Template */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">
              Template HERMES
            </label>
            <div className="space-y-1.5">
              {HERMES_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTemplateKey(t.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors flex items-center gap-2 ${
                    templateKey === t.key
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FileText size={13} />
                  <span className="flex-1">{t.label}</span>
                  {templateKey === t.key && <ChevronRight size={13} />}
                </button>
              ))}
            </div>
          </div>

          {/* Titre optionnel */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">
              Titre du document <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre personnalisé"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Contexte */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">
              Contexte additionnel <span className="font-normal text-gray-400">(optionnel)</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Informations supplémentaires pour l'IA…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {generateMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Générer le document
              </>
            )}
          </button>

          {generateMutation.isError && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              Erreur : {(generateMutation.error as Error)?.message}
            </div>
          )}
        </div>

        {/* ── Panel central : preview sections ──────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {!lastResult && !generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Sélectionnez un projet et un template</p>
              <p className="text-xs mt-1">Les sections générées par Claude apparaîtront ici</p>
            </div>
          )}

          {generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full text-center text-blue-600">
              <Sparkles size={36} className="mb-3 animate-pulse" />
              <p className="text-sm font-semibold">Claude rédige les sections…</p>
              <p className="text-xs text-gray-400 mt-1">
                Méthodologie HERMES 5.1 · {selectedTemplate?.label}
              </p>
              <div className="mt-4 w-48 bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {lastResult && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">Document généré avec succès</span>
                </div>
                <a
                  href={documentsApi.downloadUrl(lastResult.deliverable_id)}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  download
                >
                  <Download size={13} />
                  Télécharger .docx
                </a>
              </div>

              {Object.entries(lastResult.sections).map(([key, content]) => (
                <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                    {key.replace(/_/g, " ")}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Panel droit : historique ───────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Historique</h2>
          </div>

          {docsLoading && (
            <div className="p-4 text-xs text-gray-400 text-center">Chargement…</div>
          )}

          {docs.length === 0 && !docsLoading && (
            <div className="p-4 text-xs text-gray-400 text-center">Aucun document généré</div>
          )}

          {docs.map((doc: Deliverable) => (
            <div key={doc.id} className="px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${doc.ai_generated ? "bg-green-500" : "bg-gray-300"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate">{doc.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {doc.hermes_template_key?.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {doc.ai_generated ? (
                      <>
                        <CheckCircle size={10} className="text-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">Généré</span>
                      </>
                    ) : (
                      <>
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400">En attente</span>
                      </>
                    )}
                  </div>
                  {doc.ai_generated && (
                    <a
                      href={documentsApi.downloadUrl(doc.id)}
                      className="flex items-center gap-1 mt-1.5 text-[10px] text-blue-600 hover:text-blue-700"
                      download
                    >
                      <Download size={9} />
                      Télécharger
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
