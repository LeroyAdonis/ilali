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
        <p className="text-sm text-ink-faint">{emptyMessage}</p>
      </div>
    );
  }

  const tableHead = (
    <thead>
      <tr className="bg-paper-warm/80 border-b border-ink/10">
        {headers.map((header, i) => (
          <th
            key={i}
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );

  const tableBody = (
    <tbody className="divide-y divide-ink/10">
      {rows.map((row, ri) => (
        <tr key={ri} className="hover:bg-paper-warm/50">
          {row.map((cell, ci) => (
            <td
              key={ci}
              className={`px-4 py-3 text-sm tabular-nums text-ink-soft ${
                ci === 0 ? "font-medium text-ink" : ""
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
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          {tableHead}
          {tableBody}
        </table>
      </div>
    </div>
  );
}
