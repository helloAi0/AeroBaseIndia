import { useEffect, useRef, useState } from "react";
import { Mic, Send, Bot, User } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { answer, type CopilotAnswer } from "../../lib/opsEngine";
import { useAppStore } from "../../store/appStore";
import { speak, voiceSupported } from "../../lib/voice";

interface Msg { who: "me" | "bot"; text: string; actions?: CopilotAnswer["actions"] }
const SUGGEST = ["Why is 6E-925 late?", "Which gates are free in 30 min?", "How many flights are delayed?", "Flights to Mumbai", "Which terminal is busiest?"];

export function Copilot() {
  const { flights } = useBoard();
  const setPage = useAppStore(s => s.setActivePage);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "bot", text: "Hi, I'm the ops copilot. Ask about flights, gates or delays. I answer from the current flight board." }]);
  const [q, setQ] = useState(""); const [speakOn, setSpeakOn] = useState(false); const [listening, setListening] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  const ask = (text: string) => {
    const t = text.trim(); if (!t) return;
    const now = new Date(); const a = answer(t, flights, now.getHours() * 60 + now.getMinutes());
    setMsgs(m => [...m, { who: "me", text: t }, { who: "bot", text: a.text, actions: a.actions }]); setQ("");
    if (speakOn && voiceSupported()) void speak(a.text);
  };
  const SR = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;
  const listen = () => {
    if (!SR) return; const r = new SR(); r.lang = "en-IN"; r.onresult = (e: any) => ask(e.results[0][0].transcript);
    r.onend = () => setListening(false); r.onerror = () => setListening(false); setListening(true); r.start();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-white">Ops Copilot</h1><p className="text-slate-400 text-sm mt-0.5">Ask in plain English, by typing or voice. Answers come from the flight board with one-click actions.</p></div>
      <div className="flex flex-wrap gap-2">{SUGGEST.map(s => <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-2 rounded-full bg-navy-700 text-slate-200 border border-navy-600 hover:border-sky-500">{s}</button>)}</div>
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.who === "me" ? "justify-end" : ""}`}>
            {m.who === "bot" && <Bot className="w-5 h-5 text-sky-400 mt-1 shrink-0" />}
            <div className={`max-w-[85%] text-sm rounded-xl px-3 py-2 break-words ${m.who === "me" ? "bg-sky-500 text-white" : "bg-navy-900 text-slate-200 border border-navy-600"}`}>{m.text}
              {m.actions && <div className="flex gap-2 mt-2 flex-wrap">{m.actions.map(a => <button key={a.label} onClick={() => setPage(a.page)} className="text-xs px-2 py-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">{a.label}</button>)}</div>}</div>
            {m.who === "me" && <User className="w-5 h-5 text-slate-400 mt-1 shrink-0" />}
          </div>))}
        <div ref={end} />
      </div>
      <form onSubmit={e => { e.preventDefault(); ask(q); }} className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask the copilot…" className="flex-1 min-w-0 bg-navy-800 border border-navy-600 rounded-xl px-4 py-3 text-white text-sm" />
        {SR && <button type="button" onClick={listen} aria-label="Speak" className={`px-3 rounded-xl border ${listening ? "bg-red-500/20 border-red-500 text-red-400" : "bg-navy-800 border-navy-600 text-slate-300"}`}><Mic className="w-4 h-4" /></button>}
        <button className="px-4 rounded-xl bg-sky-500 text-white" aria-label="Send"><Send className="w-4 h-4" /></button>
      </form>
      <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={speakOn} onChange={e => setSpeakOn(e.target.checked)} /> Read answers aloud</label>
    </div>
  );
}
