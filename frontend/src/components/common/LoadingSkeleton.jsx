import React from "react";

export function KPISkeleton() {
  return (
    <div className="bg-navy-900/60 border border-navy-800 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-navy-800 rounded"></div>
        <div className="h-7 w-7 bg-navy-800 rounded-lg"></div>
      </div>
      <div className="h-8 w-36 bg-navy-800 rounded"></div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 bg-navy-800 rounded"></div>
        <div className="h-3 w-28 bg-navy-800 rounded"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-72" }) {
  return (
    <div
      className={`bg-navy-900/60 border border-navy-800 rounded-xl p-5 ${height} animate-pulse flex flex-col justify-between`}
    >
      <div className="flex justify-between items-center">
        <div className="h-4 w-40 bg-navy-800 rounded"></div>
        <div className="h-4 w-20 bg-navy-800 rounded"></div>
      </div>
      <div className="flex-1 my-4 flex items-end gap-2 px-2">
        <div className="h-1/3 flex-1 bg-navy-800/80 rounded-t"></div>
        <div className="h-2/3 flex-1 bg-navy-800/80 rounded-t"></div>
        <div className="h-1/2 flex-1 bg-navy-800/80 rounded-t"></div>
        <div className="h-3/4 flex-1 bg-navy-800/80 rounded-t"></div>
        <div className="h-2/5 flex-1 bg-navy-800/80 rounded-t"></div>
        <div className="h-4/5 flex-1 bg-navy-800/80 rounded-t"></div>
      </div>
      <div className="h-3 w-full bg-navy-800/50 rounded"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-navy-900/60 border border-navy-800 rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-navy-800">
        <div className="h-4 w-36 bg-navy-800 rounded"></div>
        <div className="h-4 w-24 bg-navy-800 rounded"></div>
      </div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="h-3.5 w-24 bg-navy-800/80 rounded"></div>
            <div className="h-3.5 w-32 bg-navy-800/60 rounded"></div>
            <div className="h-3.5 w-20 bg-navy-800/70 rounded"></div>
            <div className="h-3.5 w-16 bg-navy-800/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <KPISkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-80" />
        </div>
        <div>
          <ChartSkeleton height="h-80" />
        </div>
      </div>
    </div>
  );
}
