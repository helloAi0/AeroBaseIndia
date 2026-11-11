import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowRight, Users, Megaphone } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { ASSUME, buildDisruptions, fmt, toMin } from "../../lib/opsEngine";
import { notifyUser } from "../../lib/notify";
import { speak, voiceSupported } from "../../lib/voice";

export function Autopilot() {
  const { flights, live } = useBoard();
  const items = useMemo(() => buildDisruptions(flights), [flights]);
  const log = useCollection<{ kind: string; flight: string; to: string; alt: string; pax: number; note: string }>("actions");
  const [done, setDone] = useState<Record<string, string>>({});

  const approve = (id: string, flight: string, to: string, alt: string, atRisk: number) => {
    setDone(d => ({ ...d, [id]: alt }));
    void log.add({ kind: "REBOOKING_APPROVED", flight, to, alt, pax: atRisk, note: `${atRisk} passengers rebooked ${flight} → ${alt}` });
    const msg = `Flight ${flight} is disrupted. ${atRisk} passengers are being rebooked on ${alt} to ${to}.`;
    notifyUser("Disruption plan approved", msg, `autopilot-${id}`);
    if (voiceSupported()) void speak(msg);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Disruption Autopilot</h1>
        <p className="text-slate-400 text-sm mt-0.5">Finds disrupted flights, estimates passengers whose connections break, and proposes rebooking. Staff approve each plan.{live ? " Approvals are recorded in the shared action log." : ""}</p>
      </div>
      <div className="text-xs text-slate-500 bg-navy-800 border border-navy-600 rounded-xl px-4 py-3">
        Planning model, not live airline data: about {Math.round(ASSUME.connectingShare * 100)}% of passengers are assumed to be connecting, with a {ASSUME.minConnectMin}-minute minimum connection. Replace with real PNR data when available.
      </div>
      {items.length === 0 && <div className="bg-navy-800 border border-navy-600 rounded-2xl p-8 text-center text-slate-400"><CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />No disrupted flights. Nothing to do.</div>}
      <div className="space-y-4">
        {items.map(d => {
          const f = d.flight; const chosen = log.items.find(i => i.kind === "REBOOKING_APPROVED" && i.flight === f.flight)?.alt ?? done[String(f.id)];
          return (
            <div key={f.id} className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="font-mono font-bold text-white">{f.flight}</span>
                    <span className="text-slate-300 text-sm">{f.from} → {f.to}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">{d.cancelled ? "Cancelled" : `+${d.delay} min`}</span></div>
                  <div className="text-xs text-slate-400 mt-1 break-words">{d.reason} · scheduled {f.dep} · new {d.cancelled ? "—" : fmt(toMin(f.dep) + d.delay)} · gate {f.gate}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><Users className="w-4 h-4 text-sky-400" />
                  <span><b className="text-white">{d.atRisk}</b> at risk <span className="text-slate-500">of {f.pax}</span></span></div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Rebooking options (same route, later departure, spare seats)</div>
                {d.alternatives.length === 0 && <div className="text-sm text-slate-400">No later same-route flight with free seats. Escalate to the airline for protection on another carrier.</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {d.alternatives.map(a => (
                    <div key={a.flight.id} className="bg-navy-900 border border-navy-600 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between"><span className="font-mono text-white">{a.flight.flight}</span><span className="text-slate-400">{a.flight.dep}</span></div>
                      <div className="text-xs text-slate-400 mt-1">{a.flight.airline} · {a.seats} seats free · waits {a.waitMin} min</div>
                      <button disabled={!!chosen || d.atRisk === 0} onClick={() => approve(String(f.id), f.flight, f.to, a.flight.flight, d.atRisk)}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-sky-500 text-white disabled:bg-navy-700 disabled:text-slate-500">
                        {chosen === a.flight.flight ? "Approved" : <>Approve rebooking <ArrowRight className="w-3 h-3" /></>}</button>
                    </div>
                  ))}
                </div>
                {chosen && <div className="mt-3 text-xs text-green-400 flex items-center gap-1"><Megaphone className="w-3 h-3" /> Plan approved: {Math.min(d.atRisk, d.alternatives.find(a => a.flight.flight === chosen)?.seats ?? 0)} of {d.atRisk} passengers moved to {chosen}. Staff notified{voiceSupported() ? " and announced" : ""}.</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
