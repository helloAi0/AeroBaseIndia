import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useLiveFlights } from "../../hooks/useLiveFlights";
import { parseQuery, matchFlight } from "../../lib/nlSearch";
import type { Flight } from "../../types";

/**
 * Bot brain + simulator. The reply logic (`reply`) is channel-agnostic: connect it to the WhatsApp Cloud API webhook
 * (see the setup panel) to go live. The chat window below is a simulator — no WhatsApp message is sent from here.
 */
const DEMO: Flight[] = [
  { id: "1", flightNumber: "6E-202", origin: "DEL", destination: "BOM", status: "Delayed", gate: "B3", predictedDelay: 35 },
  { id: "2", flightNumber: "AI-101", origin: "DEL", destination: "BLR", status: "Boarding", gate: "A1" },
  { id: "3", flightNumber: "UK-303", origin: "DEL", destination: "HYD", status: "Scheduled", gate: "C2" },
  { id: "4", flightNumber: "SG-404", origin: "BOM", destination: "DEL", status: "Cancelled", gate: "—" },
];
const asRow = (f: Flight) => ({ flight: f.flightNumber, airline: "", airCode: f.flightNumber.split("-")[0], from: f.origin, to: f.destination, gate: f.gate, status: f.status });

export function replyTo(text: string, flights: Flight[]): string {
  const t = text.trim().toLowerCase();
  if (!t || /^(hi|hello|hey|help|menu|start)\b/.test(t))
    return "✈ *AeroBase Assistant*\nTry:\n• status 6E-202\n• gate AI-101\n• delayed flights\n• flights to Mumbai\n• baggage 6E-202";
  const numMatch = /\b([a-z0-9]{2})[ -]?(\d{2,4})\b/i.exec(text);
  const num = numMatch && /[a-z]/i.test(numMatch[1]) ? `${numMatch[1]}-${numMatch[2]}`.toUpperCase() : null;
  const byNum = num ? flights.find(f => f.flightNumber.toUpperCase() === num) : undefined;
  if (/baggage|bag|carousel|luggage/.test(t))
    return byNum ? `🧳 Baggage for ${byNum.flightNumber}: belt allocation is announced about 10 minutes after landing. Status now: ${byNum.status}.` : "Which flight? e.g. “baggage 6E-202”.";
  if (/gate/.test(t) && byNum) return `🚪 ${byNum.flightNumber} departs from Gate ${byNum.gate}.`;
  if (byNum) return `✈ ${byNum.flightNumber} ${byNum.origin} → ${byNum.destination}\nStatus: *${byNum.status}*\nGate: ${byNum.gate}` + (byNum.predictedDelay ? `\nExpected delay: ~${byNum.predictedDelay} min` : "");
  if (num) return `I couldn’t find flight ${num} today. Check the number and try again.`;
  const hits = flights.filter(f => matchFlight(asRow(f), parseQuery(text)));
  if (hits.length === 0) return "No matching flights. Try “delayed flights” or “flights to Mumbai”.";
  return hits.slice(0, 5).map(f => `• ${f.flightNumber} ${f.origin}→${f.destination} — ${f.status}, Gate ${f.gate}`).join("\n") + (hits.length > 5 ? `\n…and ${hits.length - 5} more` : "");
}

interface Msg { me: boolean; text: string }
export function WhatsAppBot() {
  const live = useLiveFlights();
  const flights = live.mode === "live" ? live.flights : DEMO;
  const [msgs, setMsgs] = useState<Msg[]>([{ me: false, text: replyTo("hi", flights) }]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);

  const send = (t = input) => {
    if (!t.trim()) return;
    setMsgs(m => [...m, { me: true, text: t }, { me: false, text: replyTo(t, flights) }]); setInput("");
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">WhatsApp Assistant</h1>
        <p className="text-slate-400 text-sm mt-0.5">Passengers ask for flight status, gates and delays in plain language. {live.mode === "live" ? "Using live flights." : "Using demo flights."}</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden flex flex-col h-[460px]">
          <div className="px-4 py-3 bg-green-600/20 border-b border-navy-600 flex items-center gap-2 text-white font-semibold"><MessageCircle className="w-5 h-5 text-green-400" />AeroBase Assistant <span className="text-[10px] text-slate-400 font-normal">(simulator)</span></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2" aria-live="polite">{msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.me ? "ml-auto bg-green-600/30 text-white" : "bg-navy-700 text-slate-200"}`}>{m.text}</div>))}<div ref={end} /></div>
          <div className="p-3 border-t border-navy-600 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            <button onClick={() => send()} aria-label="Send" className="p-2.5 rounded-xl bg-green-600 text-white"><Send className="w-4 h-4" /></button></div>
        </div>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 text-sm text-slate-300 space-y-3">
          <h2 className="font-semibold text-white">Connect to real WhatsApp</h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Create a Meta developer app and add the <b>WhatsApp</b> product (Cloud API). Meta provides a free test number.</li>
            <li>Expose a webhook endpoint (HTTPS) on your backend and subscribe to <code className="text-sky-300">messages</code>.</li>
            <li>Feed each incoming text to the same reply logic used by this simulator and send the answer back with the Cloud API.</li>
            <li>Replying within 24 hours of a user’s message is free-form; business-started messages need approved templates (Meta may charge).</li>
          </ol>
          <p className="text-xs text-slate-500">The webhook is not part of this repository yet; this page shows the conversation logic you would reuse.</p>
          <div className="flex flex-wrap gap-2 pt-1">{["status 6E-202", "delayed flights", "flights to Mumbai", "gate AI-101"].map(q => (
            <button key={q} onClick={() => send(q)} className="px-3 py-1.5 rounded-full bg-navy-700 text-xs text-slate-200 hover:bg-navy-600">{q}</button>))}</div>
        </div>
      </div>
    </div>
  );
}
