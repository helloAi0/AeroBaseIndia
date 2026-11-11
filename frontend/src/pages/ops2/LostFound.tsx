import { useState } from "react";
import { Search, Upload } from "lucide-react";
import { COLOURS, dominantColour } from "../../lib/colour";
import { Card, PageHead } from "../../components/ui/PageHead";

interface Item { id: number; desc: string; cat: string; colour: string; where: string; when: string }
const CATS = ["Bag", "Phone", "Wallet", "Laptop", "Jacket", "Documents", "Other"];
const SEED: Item[] = [
  { id: 1, desc: "Black laptop backpack with name tag", cat: "Bag", colour: "black", where: "T3 gate B12", when: "Today 08:10" },
  { id: 2, desc: "Blue suitcase, broken wheel", cat: "Bag", colour: "blue", where: "T2 baggage belt 4", when: "Yesterday" },
  { id: 3, desc: "Red leather wallet", cat: "Wallet", colour: "red", where: "T1 security", when: "Today 06:45" },
  { id: 4, desc: "Grey hoodie", cat: "Jacket", colour: "grey", where: "T3 food court", when: "Yesterday" },
  { id: 5, desc: "White earbuds case, iPhone", cat: "Phone", colour: "white", where: "T2 gate A4", when: "2 days ago" },
];

export function LostFound() {
  const [items, setItems] = useState(SEED);
  const [cat, setCat] = useState("Bag"); const [colour, setColour] = useState("black"); const [kw, setKw] = useState("");
  const [note, setNote] = useState(""); const [nd, setNd] = useState({ desc: "", where: "" });

  const score = (i: Item) => (i.cat === cat ? 3 : 0) + (i.colour === colour ? 3 : 0) + kw.toLowerCase().split(/\s+/).filter(Boolean).filter(w => i.desc.toLowerCase().includes(w)).length * 2;
  const ranked = items.map(i => ({ i, s: score(i) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);

  const onPhoto = async (f?: File) => {
    if (!f) return; setNote("Reading photo…");
    try { const c = await dominantColour(f); setColour(c); setNote(`Detected main colour: ${c}. Adjust if wrong.`); } catch { setNote("Could not read that photo. Choose the colour manually."); }
  };
  const add = (e: React.FormEvent) => { e.preventDefault(); if (!nd.desc.trim()) return; setItems(p => [{ id: Date.now(), desc: nd.desc.trim(), cat, colour, where: nd.where.trim() || "Unknown", when: "Just now" }, ...p]); setNd({ desc: "", where: "" }); };
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 w-full";
  return (
    <div className="space-y-6">
      <PageHead title="Lost & Found" sub="Upload a photo or describe the item and see the closest matches."
        note="Matching uses category, the photo's dominant colour (analysed in your browser, never uploaded) and keywords. It is not object recognition, so always confirm with the owner before release." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-sky-300 cursor-pointer"><Upload className="w-4 h-4" />Choose photo<input type="file" accept="image/*" className="hidden" onChange={e => void onPhoto(e.target.files?.[0])} /></label>
          {note && <div className="text-xs text-slate-400">{note}</div>}
          <div className="grid grid-cols-2 gap-3"><select className={inp} value={cat} onChange={e => setCat(e.target.value)} aria-label="Category">{CATS.map(c => <option key={c}>{c}</option>)}</select>
            <select className={inp} value={colour} onChange={e => setColour(e.target.value)} aria-label="Colour">{COLOURS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" /><input className={inp + " pl-9"} placeholder="Keywords (wheel, tag, brand…)" value={kw} onChange={e => setKw(e.target.value)} /></div>
          <form onSubmit={add} className="pt-3 border-t border-navy-600 space-y-2"><div className="text-xs text-slate-400">Found something? Log it with the category and colour above.</div>
            <input className={inp} placeholder="Description" value={nd.desc} onChange={e => setNd({ ...nd, desc: e.target.value })} /><input className={inp} placeholder="Where found" value={nd.where} onChange={e => setNd({ ...nd, where: e.target.value })} />
            <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Log found item</button></form>
        </Card>
        <div className="space-y-3">
          <div className="text-sm text-slate-300">{ranked.length} possible match{ranked.length === 1 ? "" : "es"}</div>
          {ranked.map(({ i, s }) => <Card key={i.id}><div className="flex justify-between gap-3"><div className="min-w-0"><div className="text-white text-sm break-words">{i.desc}</div><div className="text-xs text-slate-400 mt-1">{i.cat} · {i.colour} · {i.where} · {i.when}</div></div>
            <span className={`text-xs h-fit px-2 py-1 rounded-full border ${s >= 6 ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"}`}>{s >= 6 ? "Strong" : "Possible"}</span></div></Card>)}
        </div>
      </div>
    </div>
  );
}
