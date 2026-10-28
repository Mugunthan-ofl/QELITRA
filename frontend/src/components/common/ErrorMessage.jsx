import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorMessage({
  title = "Data Fetch Error",
  message = "Failed to communicate with the liquidity analytics backend.",
  onRetry
}) {
  return (
    <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
          <p className="text-xs text-rose-300/90 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
