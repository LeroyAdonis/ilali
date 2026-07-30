import type { ReactNode } from "react";

interface AdminTableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
  /** When true, renders without outer border/rounded wrapper — for embedding inside existing card containers */
  bare?: boolean;
}

export function AdminTable({
  headers,
  rows,
  emptyMessage = "No data available.",
  bare = false,
}: AdminTableProps) {
  if (rows.length === 0) {
    if (bare) {
      return (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const tableHead = (
    <thead>
      <tr className="border-b border-slate-100">
        {headers.map((header, i) => (
          <th
            key={i}
            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );

  const tableBody = (
    <tbody className="divide-y divide-slate-100">
      {rows.map((row, ri) => (
        <tr key={ri} className="hover:bg-slate-50">
          {row.map((cell, ci) => (
            <td key={ci} className="px-6 py-4 text-sm text-slate-600">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  return (
    <>
      {/* Desktop table */}
      {bare ? (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            {tableHead}
            {tableBody}
          </table>
        </div>
      ) : (
        <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              {tableHead}
              {tableBody}
            </table>
          </div>
        </div>
      )}

      {/* Mobile card list */}
      <div className={`space-y-3 ${bare ? "" : "md:hidden"}`}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`bg-white p-4 ${bare ? "border-t border-slate-100" : "md:hidden rounded-xl border border-slate-200"}`}
          >
            {headers.map((header, hi) => {
              const cell = row[hi];
              if (cell === undefined || cell === null) return null;
              return (
                <div
                  key={hi}
                  className={`flex items-center justify-between ${
                    hi > 0 ? "mt-2 pt-2 border-t border-slate-100" : ""
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {header}
                  </span>
                  <span className="text-sm text-slate-700 text-right ml-4">
                    {cell}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
