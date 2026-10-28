import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X
} from "lucide-react";

/**
 * Enterprise-grade DataTable component.
 * Features:
 *  - Client-side search and filtering across all record attributes
 *  - Interactive column sorting with asc/desc indicators
 *  - Customizable pagination with page size selector
 *  - Browser-side CSV Export via Blob (strictly zero disk writes on server)
 */
export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = "No records found",
  title = "",
  subtitle = "",
  exportFileName = "export_data.csv",
  searchable = true,
  searchPlaceholder = "Search by ID, category, counterparty...",
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  extraActions = null,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter((row) => {
      return Object.entries(row).some(([key, val]) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      // Numeric comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String / Date comparison
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 3. Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (accessor) => {
    if (!accessor) return;
    if (sortColumn === accessor) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(accessor);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // 4. In-Browser CSV Export (Zero server write)
  const handleExportCSV = () => {
    if (!sortedData || sortedData.length === 0) return;

    // Build headers from visible columns
    const exportColumns = columns.filter((col) => col.accessor || col.header);
    const headers = exportColumns.map((col) => `"${(col.header || "").replace(/"/g, '""')}"`);

    // Build data rows
    const rows = sortedData.map((row) => {
      return exportColumns.map((col) => {
        let val = row[col.accessor];
        if (val === null || val === undefined) val = "";
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-navy-900/70 border border-navy-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
      {/* Table Header / Action Toolbar */}
      <div className="p-4 border-b border-navy-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-navy-950/40">
        <div>
          {title && <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>}
          {subtitle ? (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">
                Total matching: <strong className="text-teal-400 font-mono">{totalItems}</strong>
              </span>
              {searchTerm && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                  Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          {searchable && (
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-7 py-1.5 bg-navy-900 border border-navy-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-52 sm:w-64 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Extra custom filters/buttons slot */}
          {extraActions}

          {/* Client-side CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={sortedData.length === 0}
            title="Download currently filtered rows directly to CSV in browser"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-700/80 rounded-lg text-xs font-medium text-slate-200 hover:text-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-teal-400" />
            <span>Export CSV</span>
            <span className="text-[10px] text-slate-400 font-mono">({sortedData.length})</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Scroll Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-navy-950/80 border-b border-navy-800 text-slate-400 uppercase font-mono tracking-wider select-none">
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false && col.accessor;
                const isSorted = sortColumn === col.accessor;
                return (
                  <th
                    key={idx}
                    onClick={() => isSortable && handleSort(col.accessor)}
                    className={`py-3 px-4 ${col.className || ""} ${
                      isSortable ? "cursor-pointer hover:bg-navy-800/60 hover:text-slate-200 transition-colors" : ""
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.headerAlign === "right" ? "justify-end" : ""}`}>
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5 text-teal-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-teal-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-slate-600 hover:text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 text-slate-300">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Filter className="h-6 w-6 text-slate-600" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-xs text-teal-400 hover:underline"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-navy-800/40 transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-2.5 px-4 ${col.cellClassName || ""}`}
                    >
                      {col.render ? col.render(row) : (row[col.accessor] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-navy-900 border border-navy-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-slate-500">
            Showing {(validPage - 1) * pageSize + 1} - {Math.min(validPage * pageSize, totalItems)} of {totalItems}
          </span>
        </div>

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={validPage <= 1}
            title="First Page"
            className="p-1.5 rounded hover:bg-navy-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage <= 1}
            title="Previous Page"
            className="p-1.5 rounded hover:bg-navy-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-mono text-xs text-slate-200">
            Page {validPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage >= totalPages}
            title="Next Page"
            className="p-1.5 rounded hover:bg-navy-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={validPage >= totalPages}
            title="Last Page"
            className="p-1.5 rounded hover:bg-navy-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
