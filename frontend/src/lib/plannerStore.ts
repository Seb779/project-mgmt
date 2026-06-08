/**
 * Store Zustand pour le Planner Kanban.
 * Gère l'état local des cards et les optimistic updates lors du drag & drop.
 */
import { create } from "zustand";
import {
  Deliverable,
  BucketStatus,
  DEFAULT_BUCKETS,
  Bucket,
  deliverablesApi,
} from "./api";

interface AiToast {
  deliverableTitle: string;
  message: string;
}

interface PlannerState {
  // Données
  deliverables: Deliverable[];
  buckets: Bucket[];
  selectedProjectId: number | null;
  isLoading: boolean;

  // Toast IA
  aiToast: AiToast | null;

  // Actions
  setProject: (id: number) => void;
  setDeliverables: (items: Deliverable[]) => void;
  setLoading: (v: boolean) => void;
  setBuckets: (b: Bucket[]) => void;

  moveCard: (deliverableId: number, newBucket: BucketStatus) => Promise<void>;
  addDeliverable: (d: Deliverable) => void;
  dismissAiToast: () => void;

  // Sélecteur : cards par bucket
  cardsByBucket: (bucketId: BucketStatus) => Deliverable[];
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  deliverables: [],
  buckets: DEFAULT_BUCKETS,
  selectedProjectId: null,
  isLoading: false,
  aiToast: null,

  setProject: (id) => set({ selectedProjectId: id }),
  setDeliverables: (items) => set({ deliverables: items }),
  setLoading: (v) => set({ isLoading: v }),
  setBuckets: (b) => set({ buckets: b }),
  dismissAiToast: () => set({ aiToast: null }),
  addDeliverable: (d) =>
    set((s) => ({ deliverables: [d, ...s.deliverables] })),

  moveCard: async (deliverableId, newBucket) => {
    // Optimistic update
    set((s) => ({
      deliverables: s.deliverables.map((d) =>
        d.id === deliverableId ? { ...d, bucket_status: newBucket } : d
      ),
    }));

    try {
      const result = await deliverablesApi.moveTobucket(deliverableId, newBucket);

      // Déclencher le toast IA si la génération a été lancée
      if (result.ai_triggered) {
        const card = get().deliverables.find((d) => d.id === deliverableId);
        set({
          aiToast: {
            deliverableTitle: card?.title ?? "Livrable",
            message: result.message ?? "Génération IA déclenchée",
          },
          // Marquer la card comme AI en cours
          deliverables: get().deliverables.map((d) =>
            d.id === deliverableId
              ? { ...d, bucket_status: newBucket, ai_generated: false }
              : d
          ),
        });
      }
    } catch {
      // Rollback en cas d'erreur
      set((s) => ({
        deliverables: s.deliverables.map((d) =>
          d.id === deliverableId
            ? { ...d, bucket_status: s.deliverables.find((x) => x.id === deliverableId)?.bucket_status ?? d.bucket_status }
            : d
        ),
      }));
    }
  },

  cardsByBucket: (bucketId) =>
    get().deliverables.filter((d) => d.bucket_status === bucketId),
}));
