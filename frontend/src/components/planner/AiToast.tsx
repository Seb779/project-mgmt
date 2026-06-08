"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface AiToastProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export function AiToast({ title, message, onDismiss }: AiToastProps) {
  // Auto-dismiss après 6s
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-white border border-violet-300 shadow-xl rounded-xl px-4 py-3 w-80 animate-in slide-in-from-bottom-4">
      <div className="text-2xl leading-none">✨</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-violet-700 mb-0.5">Génération IA déclenchée</p>
        <p className="text-xs text-gray-700 font-medium truncate">{title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-300 hover:text-gray-500 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
