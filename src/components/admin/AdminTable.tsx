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
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const tableHead = (
    <thead>
      <tr className="border-b border-slate-200">
        {headers.map((header, i) => (
          <th
            key={i}
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
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
        <tr key={ri} className="hover:bg-slate-50/50">
          {row.map((cell, ci) => (
            <td
              key={ci}
              className={`px-4 py-3 text-sm tabular-nums text-slate-600 ${
                ci === 0 ? "font-medium text-slate-900" : ""
              }`}
            >
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  if (bare) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          {tableHead}
          {tableBody}
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          {tableHead}
          {tableBody}
        </table>
      </div>
    </div>
  );
}
