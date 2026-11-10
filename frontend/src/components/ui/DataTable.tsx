import { useState } from "react";
import type { ReactNode } from "react";
import { LayoutGrid, Table2 } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** Shown as the card title in card view (use for the main identifier). */
  primary?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}

/** Table on desktop, cards on phones, with a manual Table/Cards toggle. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty }: Props<T>) {
  const [view, setView] = useState<"auto" | "table" | "cards">("auto");
  const primary = columns.find(c => c.primary) ?? columns[0];
  const rest = columns.filter(c => c !== primary);

  const showTable = view === "table" ? "block" : view === "cards" ? "hidden" : "hidden md:block";
  const showCards = view === "cards" ? "block" : view === "table" ? "hidden" : "md:hidden";

  if (rows.length === 0) return <>{empty ?? <div className="p-8 text-center text-slate-500 text-sm">No results</div>}</>;

  return (
    <div>
      <div className="flex justify-end px-4 pt-3 gap-1">
        {([["table", <Table2 key="t" className="w-4 h-4" />, "Table view"], ["cards", <LayoutGrid key="c" className="w-4 h-4" />, "Card view"]] as const).map(([v, icon, label]) => (
          <button key={v} aria-label={label} title={label}
            onClick={() => setView(view === v ? "auto" : v)}
            className={`p-2 rounded-lg border transition-colors ${view === v ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "border-white/10 text-slate-500 hover:text-white"}`}>
            {icon}
          </button>
        ))}
      </div>

      <div className={`table-scroll ${showTable}`}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2d4d" }}>
              {columns.map(c => <th key={c.key} className="px-4 py-3 text-left text-xs uppercase" style={{ color: "#475569" }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-white/[0.025]" : ""}
                style={{ borderBottom: "1px solid rgba(30,45,77,0.5)" }}>
                {columns.map(c => <td key={c.key} className="px-4 py-3.5">{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${showCards} p-3 space-y-3`}>
        {rows.map(r => (
          <div key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="font-semibold text-white mb-2">{primary.render(r)}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {rest.map(c => (
                <div key={c.key}>
                  <dt className="text-slate-500 uppercase tracking-wide">{c.label}</dt>
                  <dd className="text-slate-200 mt-0.5">{c.render(r)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
