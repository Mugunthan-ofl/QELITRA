import React from "react";
import { FileQuestion, RotateCcw } from "lucide-react";

export default function EmptyState({
  title = "No Data Found",
  message = "There are no records matching your current filter criteria.",
  icon: Icon = FileQuestion,
  actionLabel = "Reset Filters",
  onAction,
}) {
  return (
    <div className="bg-navy-900/60 border border-navy-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-lg">
      <div className="p-3 rounded-full bg-navy-850 border border-navy-750 text-slate-400">
        <Icon className="h-6 w-6 text-teal-400/70" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium transition shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
