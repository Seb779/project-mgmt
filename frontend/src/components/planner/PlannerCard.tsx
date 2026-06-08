"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Deliverable, DeliverableType, ProjectPhase } from "@/lib/api";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Flag, AlertTriangle, CheckSquare } from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  DeliverableType,
  { icon: React.ElementType; label: string; iconClass: string }
> = {
  hermes_doc: { icon: FileText,      label: "Doc HERMES",  iconClass: "text-violet-500" },
  milestone:  { icon: Flag,          label: "Jalon",       iconClass: "text-blue-500"   },
  task:       { icon: CheckSquare,   label: "Tâche",       iconClass: "text-gray-400"   },
  risk:       { icon: AlertTriangle, label: "Risque",      iconClass: "text-red-500"    },
};

const PHASE_LABELS: Record<ProjectPhase, string> = {
  initialisation: "Init",
  conception:     "Concept.",
  realisation:    "Réal.",
  deploiement:    "Dépl.",
  cloture:        "Clôture",
};

function DueLabel({ date }: { date?: string }) {
  if (!date) return null;
  const d = new Date(date);
  const overdue = isPast(d);
  const soon    = isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 7) });
  return (
    <span
      className={clsx("text-[10px] font-medium", {
        "text-red-600": overdue,
        "text-orange-500": !overdue && soon,
        "text-gray-400": !overdue && !soon,
      })}
    >
      {overdue && "⚠ "}
      {format(d, "dd.MM.yyyy", { locale: fr })}
    </span>
  );
}

function Avatar({ name }: { name?: string }) {
  if (!name) return null;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────
interface PlannerCardProps {
  deliverable: Deliverable;
  index: number;
}

export function PlannerCard({ deliverable: d, index }: PlannerCardProps) {
  const typeConf = TYPE_CONFIG[d.deliverable_type];
  const Icon = typeConf.icon;
  const isHermesDoc = d.deliverable_type === "hermes_doc";

  return (
    <Draggable draggableId={String(d.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            "rounded-lg border bg-white p-3 cursor-grab select-none transition-shadow",
            snapshot.isDragging
              ? "shadow-lg border-blue-400 rotate-1"
              : "shadow-sm border-gray-200 hover:border-blue-300 hover:shadow-md",
            isHermesDoc && "border-l-4 border-l-violet-400"
          )}
        >
          {/* Titre + icône type */}
          <div className="flex items-start gap-2 mb-2">
            <Icon size={13} className={clsx("mt-0.5 flex-shrink-0", typeConf.iconClass)} />
            <p className="text-xs font-semibold text-gray-800 leading-snug">
              {d.title}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {/* Type */}
            {isHermesDoc && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-medium">
                📄 {typeConf.label}
              </span>
            )}
            {d.deliverable_type === "milestone" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                🏁 {typeConf.label}
              </span>
            )}
            {d.deliverable_type === "risk" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                ⚠ {typeConf.label}
              </span>
            )}

            {/* Phase */}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
              {PHASE_LABELS[d.phase]}
            </span>

            {/* Template HERMES */}
            {d.hermes_template_key && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                {d.hermes_template_key.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* IA status */}
          {isHermesDoc && (
            <div className="mb-2 px-2 py-1 rounded bg-violet-50 border border-violet-100">
              {d.ai_generated ? (
                <p className="text-[9px] text-violet-700 font-medium">
                  ✨ Rédigé par IA — {d.ai_sections_complete}/{d.ai_sections_total} sections
                </p>
              ) : (
                <p className="text-[9px] text-gray-400">
                  IA : déclenchement à &quot;À valider&quot;
                </p>
              )}
            </div>
          )}

          {/* Footer — avatar + date */}
          <div className="flex items-center justify-between mt-1">
            <Avatar name={d.assigned_to} />
            <DueLabel date={d.due_date} />
          </div>
        </div>
      )}
    </Draggable>
  );
}
