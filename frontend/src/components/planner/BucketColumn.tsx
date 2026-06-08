"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Deliverable, Bucket } from "@/lib/api";
import { PlannerCard } from "./PlannerCard";
import { Plus } from "lucide-react";
import { clsx } from "clsx";

interface BucketColumnProps {
  bucket: Bucket;
  deliverables: Deliverable[];
  onAddCard: (bucketId: string) => void;
}

export function BucketColumn({ bucket, deliverables, onAddCard }: BucketColumnProps) {
  return (
    <div className="flex flex-col w-56 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pb-2 mb-1">
        <span
          className={clsx("w-2.5 h-2.5 rounded-full flex-shrink-0", bucket.color)}
        />
        <span className="text-xs font-bold text-gray-700 flex-1 truncate">
          {bucket.emoji} {bucket.label}
        </span>
        <span className="text-[10px] bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 text-gray-500 font-medium">
          {deliverables.length}
        </span>
        {bucket.aiTrigger && (
          <span
            title="Déclenche la génération IA pour les docs HERMES"
            className="text-[9px] bg-violet-100 text-violet-600 rounded px-1 border border-violet-200"
          >
            ✨IA
          </span>
        )}
      </div>

      {/* Drop zone */}
      <Droppable droppableId={bucket.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              "flex-1 rounded-xl p-2 flex flex-col gap-2 min-h-[120px] transition-colors border",
              snapshot.isDraggingOver
                ? "bg-blue-50 border-blue-300 border-dashed"
                : "bg-gray-50 border-gray-200"
            )}
          >
            {deliverables.map((d, i) => (
              <PlannerCard key={d.id} deliverable={d} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      <button
        onClick={() => onAddCard(bucket.id)}
        className="mt-2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors w-full border border-transparent hover:border-gray-200"
      >
        <Plus size={12} />
        Ajouter un livrable
      </button>
    </div>
  );
}
