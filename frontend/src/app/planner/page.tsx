"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  DropResult,
} from "@hello-pangea/dnd";
import { useQuery } from "@tanstack/react-query";
import {
  projectsApi,
  deliverablesApi,
  Project,
  ProjectPhase,
  BucketStatus,
  DEFAULT_BUCKETS,
} from "@/lib/api";
import { usePlannerStore } from "@/lib/plannerStore";
import { BucketColumn } from "@/components/planner/BucketColumn";
import { AiToast } from "@/components/planner/AiToast";
import { AddDeliverableModal } from "@/components/planner/AddDeliverableModal";
import { Settings, Plus, RefreshCw, ChevronDown } from "lucide-react";

const PHASE_OPTIONS: { value: ProjectPhase | "all"; label: string }[] = [
  { value: "all",            label: "Toutes les phases" },
  { value: "initialisation", label: "🔷 Initialisation" },
  { value: "conception",     label: "💡 Conception"     },
  { value: "realisation",    label: "⚙️ Réalisation"    },
  { value: "deploiement",    label: "🚀 Déploiement"    },
  { value: "cloture",        label: "✅ Clôture"        },
];

export default function PlannerPage() {
  const {
    deliverables,
    buckets,
    selectedProjectId,
    isLoading,
    aiToast,
    setProject,
    setDeliverables,
    setLoading,
    moveCard,
    addDeliverable,
    dismissAiToast,
    cardsByBucket,
  } = usePlannerStore();

  const [phaseFilter, setPhaseFilter] = useState<ProjectPhase | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalBucket, setAddModalBucket] = useState<BucketStatus>("backlog");

  // Chargement des projets pour le sélecteur
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list({ archived: false }),
  });

  // Sélectionner le premier projet par défaut
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setProject(projects[0].id);
    }
  }, [projects, selectedProjectId, setProject]);

  // Chargement des livrables du projet sélectionné
  const loadDeliverables = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const items = await deliverablesApi.listByProject(selectedProjectId);
      setDeliverables(items);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, setDeliverables, setLoading]);

  useEffect(() => {
    loadDeliverables();
  }, [loadDeliverables]);

  // Filtrer par phase
  const filteredDeliverables = phaseFilter === "all"
    ? deliverables
    : deliverables.filter((d) => d.phase === phaseFilter);

  // Drag & drop
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { draggableId, destination } = result;
      const deliverableId = parseInt(draggableId, 10);
      const newBucket = destination.droppableId as BucketStatus;
      moveCard(deliverableId, newBucket);
    },
    [moveCard]
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleAddCard = (bucketId: string) => {
    setAddModalBucket(bucketId as BucketStatus);
    setShowAddModal(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
        <h1 className="font-bold text-base text-gray-900">🗂 Planner</h1>

        {/* Sélecteur projet */}
        <div className="relative">
          <select
            value={selectedProjectId ?? ""}
            onChange={(e) => setProject(parseInt(e.target.value))}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtre phase */}
        <div className="flex gap-1">
          {PHASE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPhaseFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                phaseFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={loadDeliverables}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => {/* TODO: page config buckets */}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50"
          >
            <Settings size={12} />
            Config. buckets
          </button>
          <button
            onClick={() => { setAddModalBucket("backlog"); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
          >
            <Plus size={12} />
            Livrable
          </button>
        </div>
      </div>

      {/* Project info bar */}
      {selectedProject && (
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 text-[11px] text-gray-500 flex-shrink-0">
          <span className="font-semibold text-gray-700">{selectedProject.name}</span>
          <span>Client : {selectedProject.client}</span>
          <span>CP : {selectedProject.project_manager}</span>
          <span
            className={`px-2 py-0.5 rounded-full font-medium border text-[10px] ${
              selectedProject.status === "green"
                ? "bg-green-50 text-green-700 border-green-200"
                : selectedProject.status === "orange"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {selectedProject.progress_pct}% complété
          </span>
          <span className="ml-auto text-[10px]">
            {filteredDeliverables.length} livrable{filteredDeliverables.length !== 1 ? "s" : ""}
            {phaseFilter !== "all" ? " · phase filtrée" : ""}
          </span>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Chargement des livrables…
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-4 h-full">
                {buckets.map((bucket) => {
                  const cards = filteredDeliverables.filter(
                    (d) => d.bucket_status === bucket.id
                  );
                  return (
                    <BucketColumn
                      key={bucket.id}
                      bucket={bucket}
                      deliverables={cards}
                      onAddCard={handleAddCard}
                    />
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="px-5 py-2 border-t border-gray-200 bg-white flex items-center gap-5 text-[10px] text-gray-400 flex-shrink-0">
        <span>
          <span className="inline-block w-2.5 h-2.5 rounded bg-violet-400 mr-1 align-middle" />
          Bordure violette = Doc HERMES avec déclencheur IA
        </span>
        <span>
          <span className="text-violet-600 font-bold">✨IA</span>
          &nbsp;sur le bucket = déclenchement automatique à l&apos;entrée
        </span>
        <span className="text-red-500">Date rouge = échéance dépassée</span>
        <span className="text-orange-500">Date orange = &lt; 7 jours</span>
      </div>

      {/* Modal ajout livrable */}
      {showAddModal && selectedProjectId && (
        <AddDeliverableModal
          projectId={selectedProjectId}
          defaultBucket={addModalBucket}
          onClose={() => setShowAddModal(false)}
          onCreated={(d) => {
            addDeliverable(d);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Toast IA */}
      {aiToast && (
        <AiToast
          title={aiToast.deliverableTitle}
          message={aiToast.message}
          onDismiss={dismissAiToast}
        />
      )}
    </div>
  );
}
