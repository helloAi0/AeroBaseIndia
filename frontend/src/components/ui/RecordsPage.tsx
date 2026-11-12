import { useMemo, useState } from "react";
import { Plus, Search, Download, Pencil, Trash2, X } from "lucide-react";
import { useCollection, type Rec } from "../../hooks/useCollection";

export interface Field {
  key: string; label: string; type?: "text" | "textarea" | "select" | "number" | "date"; options?: string[];
  required?: boolean; placeholder?: string; table?: boolean; min?: number; max?: number;
}
export interface Kpi { label: string; value: (rows: Rec<any>[]) => string | number; tone?: "sky" | "red" | "yellow" | "green" }
export interface RecordsConfig {
  collection: string; title: string; subtitle: string; noun: string; prefix: string;
  fields: Field[]; titleKey: string; statusKey?: string; kpis: Kpi[];
  seed?: Rec<any>[]; canDelete?: boolean; validate?: (d: Record<string, any>) => string | null;
}
const TONE: Record<string, string> = { sky: "text-sky-400", red: "text-red-400", yellow: "text-yellow-400", green: "text-green-400" };
const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Schema-driven list + create/edit form + search/filter + CSV export, persisted through useCollection. */
export function RecordsPage({ cfg }: { cfg: RecordsConfig }) {
  const col = useCollection<Record<string, any>>(cfg.collection, cfg.seed ?? []);
  const [q, setQ] = useState(""); const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<Rec<any> | "new" | null>(null);
  const [form, setForm] = useState<Record<string, any>>({}); const [formErr, setFormErr] = useState(""); const [busy, setBusy] = useState(false);

  const statusField = cfg.fields.find(f => f.key === cfg.statusKey);
  const rows = col.items;
  const shown = useMemo(() => rows.filter(r =>
    (filter === "All" || r[cfg.statusKey ?? ""] === filter) &&
    (!q || cfg.fields.some(f => String(r[f.key] ?? "").toLowerCase().includes(q.toLowerCase())) || String(r.ref ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, filter, cfg]);

  const open = (r: Rec<any> | "new") => { setFormErr(""); setEditing(r); setForm(r === "new" ? Object.fromEntries(cfg.fields.map(f => [f.key, f.type === "select" ? f.options![0] : ""])) : { ...r }); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr("");
    const data: Record<string, any> = {};
    for (const f of cfg.fields) {
      let v = form[f.key]; if (typeof v === "string") v = v.trim();
      if (f.required && (v === "" || v === undefined)) return setFormErr(`${f.label} is required`);
      if (f.type === "number" && v !== "") { v = Number(v); if (!Number.isFinite(v) || (f.min !== undefined && v < f.min) || (f.max !== undefined && v > f.max)) return setFormErr(`${f.label} must be ${f.min ?? ""}–${f.max ?? ""}`.replace(/–$/, " or more")); }
      data[f.key] = v;
    }
    const bad = cfg.validate?.(data); if (bad) return setFormErr(bad);
    setBusy(true);
    const ok = editing === "new" ? await col.add({ ...data, ref: `${cfg.prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}` }) : await col.update((editing as Rec<any>).id, data);
    setBusy(false);
    if (ok) setEditing(null); else setFormErr("The server refused this change (you may not have permission).");
  };
  const exportCsv = () => {
    const head = ["ref", ...cfg.fields.map(f => f.key)]; const body = shown.map(r => head.map(k => csvCell(r[k])).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `${cfg.collection}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const inp = "w-full bg-navy-900 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none";
  const cols = cfg.fields.filter(f => f.table !== false).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-white">{cfg.title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{cfg.subtitle}{col.live ? "" : " · demo data, kept in this tab"}</p></div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-navy-700 border border-navy-600 text-slate-200"><Download className="w-4 h-4" />CSV</button>
          <button onClick={() => open("new")} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium"><Plus className="w-4 h-4" />New {cfg.noun}</button></div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{cfg.kpis.map(k => <div key={k.label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600"><div className={`text-2xl font-bold font-mono ${TONE[k.tone ?? "sky"]}`}>{k.value(rows)}</div><div className="text-sm text-slate-400">{k.label}</div></div>)}</div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" /><input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${cfg.noun}s`} aria-label="Search" className={inp + " pl-9"} /></div>
        {statusField && <div className="flex gap-1 flex-wrap">{["All", ...statusField.options!].map(s => <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl text-xs border ${filter === s ? "bg-sky-500 text-white border-sky-500" : "bg-navy-800 text-slate-300 border-navy-600"}`}>{s}</button>)}</div>}
      </div>
      {col.error && <div className="text-sm text-red-400">{col.error}</div>}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-3">Ref</th>{cols.map(c => <th key={c.key} className="p-3">{c.label}</th>)}<th className="p-3" /></tr></thead>
          <tbody>{shown.map(r => <tr key={r.id} className="border-b border-navy-700 text-slate-200">
            <td className="p-3 font-mono text-xs text-sky-300">{r.ref ?? r.id.toString().slice(0, 6)}</td>
            {cols.map(c => <td key={c.key} className="p-3 max-w-[260px] truncate">{String(r[c.key] ?? "")}</td>)}
            <td className="p-3 text-right whitespace-nowrap"><button onClick={() => open(r)} aria-label="Edit" className="p-1 text-slate-400 hover:text-white"><Pencil className="w-4 h-4" /></button>
              {cfg.canDelete !== false && <button onClick={() => { if (confirm("Delete this record?")) void col.remove(r.id); }} aria-label="Delete" className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}</td></tr>)}
            {shown.length === 0 && <tr><td colSpan={cols.length + 2} className="p-8 text-center text-slate-500">{col.loading ? "Loading…" : `No ${cfg.noun}s yet. Click “New ${cfg.noun}” to add the first one.`}</td></tr>}</tbody></table>
      </div>
      {editing && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <form onSubmit={save} className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-white font-semibold">{editing === "new" ? `New ${cfg.noun}` : `Edit ${cfg.noun}`}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-slate-400"><X className="w-5 h-5" /></button></div>
          {cfg.fields.map(f => <label key={f.key} className="block text-xs text-slate-400">{f.label}{f.required ? " *" : ""}
            {f.type === "select" ? <select className={inp + " mt-1"} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
              : f.type === "textarea" ? <textarea rows={3} className={inp + " mt-1 resize-none"} maxLength={1000} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              : <input className={inp + " mt-1"} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} maxLength={200} placeholder={f.placeholder} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />}</label>)}
          {formErr && <div className="text-xs text-red-400">{formErr}</div>}
          <div className="flex gap-3"><button disabled={busy} className="bg-sky-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium">{busy ? "Saving…" : "Save"}</button><button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl text-sm bg-navy-700 text-slate-300">Cancel</button></div>
        </form></div>}
    </div>
  );
}
