import type { ReactNode } from "react";
export function PageHead({ title, sub, note }: { title: string; sub: string; note?: string }) {
  return (<div className="space-y-3"><div><h1 className="text-2xl font-bold text-white">{title}</h1><p className="text-slate-400 text-sm mt-0.5">{sub}</p></div>
    {note && <div className="text-xs text-slate-500 bg-navy-800 border border-navy-600 rounded-xl px-4 py-3">{note}</div>}</div>);
}
export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <div className={`bg-navy-800 border border-navy-600 rounded-2xl p-5 ${className}`}>{children}</div>;
