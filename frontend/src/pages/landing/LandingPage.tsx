import { useEffect, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Plane, Radar, CloudSun, ShieldCheck, Leaf, BrainCircuit, Building2, Wrench, Store, UserRound, ArrowRight, Fingerprint, Map, Luggage, Users, Bot, Accessibility, ScanLine, DoorOpen, CheckCircle2 } from "lucide-react";
import { useThreeScene } from "../../components/three/useThree";
import { Icon3D } from "../../components/ui/Icon3D";
import { fetchAirports, type AirportInfo } from "../../api/account";
import { API_ENABLED } from "../../config";

/** Real coordinates of the airports we model (lat, lon). */
const NODES: Record<string, [number, number]> = {
  DEL: [28.56, 77.1], BOM: [19.09, 72.87], BLR: [13.2, 77.71], HYD: [17.24, 78.43], CCU: [22.65, 88.45], MAA: [12.99, 80.17],
  COK: [10.15, 76.4], GOI: [15.74, 73.86], AMD: [23.07, 72.63], PNQ: [18.58, 73.92], JAI: [26.82, 75.81], GAU: [26.11, 91.59],
  SXR: [33.99, 74.77], LKO: [26.76, 80.88], TRV: [8.48, 76.92],
};

function Hero3D() {
  const { ref, ok } = useThreeScene(({ scene, camera }) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 4, 6); scene.add(dl);
    const globe = new THREE.Group(); scene.add(globe);
    const R = 2;
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshStandardMaterial({ color: 0x07142b, roughness: 0.85 })));
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 40, 28), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.05, side: THREE.BackSide })));
    const ll = (lat: number, lon: number, r = R) => { const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)); };
    const gridMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.22 });
    for (let lat = -60; lat <= 80; lat += 20) globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 73 }, (_, i) => ll(lat, -180 + i * 5, R * 1.003))), gridMat));
    for (let lon = -180; lon < 180; lon += 20) globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 37 }, (_, i) => ll(-90 + i * 5, lon, R * 1.003))), gridMat));
    const pins = Object.entries(NODES).map(([k, [a, b]]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(k === "DEL" || k === "BOM" || k === "BLR" ? 0.032 : 0.022, 12, 12), new THREE.MeshBasicMaterial({ color: k === "DEL" ? 0xfbbf24 : 0x5eead4 }));
      m.position.copy(ll(a, b, R * 1.01)); globe.add(m); return m;
    });
    // great-circle arcs lifted off the surface, with a glowing dot flying along each
    const arcs: { pts: THREE.Vector3[]; dot: THREE.Mesh; off: number; speed: number }[] = [];
    const hubs = ["DEL", "BOM", "BLR"]; const rest = Object.keys(NODES);
    hubs.forEach((h, hi) => rest.filter(k => k !== h && (hi === 0 || ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "COK", "GOI"].includes(k))).slice(0, hi === 0 ? 12 : 4).forEach((k, i) => {
      const a = ll(NODES[h][0], NODES[h][1], 1).normalize(), b = ll(NODES[k][0], NODES[k][1], 1).normalize(), pts: THREE.Vector3[] = [];
      const ang = a.angleTo(b);
      for (let s = 0; s <= 48; s++) { const t = s / 48, v = a.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(b.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang) || 1).normalize(); pts.push(v.multiplyScalar(R * (1.01 + Math.sin(t * Math.PI) * 0.12 * Math.min(1, ang * 1.6)))); }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 })));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); globe.add(dot);
      arcs.push({ pts, dot, off: (i * 0.37 + hi * 0.21) % 1, speed: 0.07 + ((i * 7 + hi * 3) % 5) * 0.012 });
    }));
    const g = new THREE.BufferGeometry(), pts = new Float32Array(1200);
    for (let i = 0; i < pts.length; i++) pts[i] = (Math.random() - 0.5) * 46;
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.035 })));
    camera.position.set(0.3, 0.5, 4.9); camera.lookAt(0, 0, 0);
    globe.rotation.x = 0.35;
    return (t) => {
      globe.rotation.y = 3.35 + t * 0.05;                         // India faces the viewer at start, then slowly turns
      arcs.forEach(a => { const f = (a.off + t * a.speed) % 1; a.dot.position.copy(a.pts[Math.floor(f * (a.pts.length - 1))]); });
      pins.forEach((p, i) => p.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.3));
    };
  });
  if (!ok) return <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#0c4a6e55,transparent_60%)]" />;
  return <div ref={ref} aria-hidden className="absolute inset-0" />;
}

const ROLES = [
  { k: "director", l: "Airport director", i: Building2, c: "#38bdf8", t: "See the whole airport in one place", pts: ["Live flight board with delays, gates and terminals", "Revenue, analytics and an Ops Copilot you can question in plain English", "Crowd and queue pressure with one-click fixes", "Add and manage your own staff, security and airline accounts"] },
  { k: "staff", l: "Ground & security", i: Wrench, c: "#2dd4bf", t: "Run the shift, not the spreadsheet", pts: ["Check-in, baggage tracking and turnaround timers", "Accessibility requests routed to the nearest free staff member", "Security events, emergencies and weather playbooks", "Gate optimiser that finds double-booked gates"] },
  { k: "airline", l: "Airlines & pilots", i: Plane, c: "#fbbf24", t: "Your fleet, your flights, nobody else's", pts: ["Only your airline's flights, gates and delays", "Crew duty and briefing for the day", "Disruption autopilot with rebooking options", "Carbon scorecard for your operations"] },
  { k: "retail", l: "Shop owners", i: Store, c: "#fb923c", t: "Bid for space and track your unit", pts: ["Open units and retail bids from the airport", "Your own records, visible to you and the airport only", "Notices and messages from management"] },
  { k: "pax", l: "Passengers", i: UserRound, c: "#c084fc", t: "Everything for your journey", pts: ["Your flight, gate and boarding time", "Biometric check-in with a passkey on your phone", "Airport map and gate finder, live weather", "Report lost items and request assistance"] },
];

const JOURNEY = [
  { i: Fingerprint, t: "Check in", d: "Passkey check-in with Face ID or fingerprint; no password, no queue." },
  { i: ScanLine, t: "Security", d: "Queue pressure shown per terminal so teams open lanes early." },
  { i: DoorOpen, t: "Gate", d: "Smart gate assignment avoids double-booked and wrong-size gates." },
  { i: Plane, t: "Flight", d: "Delay reasons, rebooking options and announcements in several languages." },
  { i: Luggage, t: "Baggage", d: "Every bag tracked from check-in to the belt, with a claim ETA." },
];

const FEATURES = [
  { i: Plane, c: "#0ea5e9", t: "Live flight operations", d: "Flights, gates, terminals and delays for each airport, from real route data." },
  { i: Bot, c: "#a78bfa", t: "Ops Copilot", d: "Ask “how many passengers booked Air India today?” and get an answer, by role." },
  { i: Users, c: "#f472b6", t: "Crowd & queues", d: "Expected pressure at check-in, security and gates, with levers to relieve it." },
  { i: CloudSun, c: "#f59e0b", t: "Live weather", d: "Current conditions per airport and ready-made response playbooks." },
  { i: Radar, c: "#14b8a6", t: "3D digital twin", d: "Rotate the apron and see every gate's status at a glance." },
  { i: Leaf, c: "#22c55e", t: "Carbon-aware ops", d: "Per-flight and per-airline emission savings from taxi and APU choices." },
  { i: Accessibility, c: "#38bdf8", t: "Accessibility", d: "Assisted-travel requests assigned to the nearest available staff." },
  { i: Map, c: "#fb7185", t: "Wayfinding", d: "Airport maps and a live gate finder for passengers." },
  { i: BrainCircuit, c: "#818cf8", t: "Delay prediction", d: "Early warning from weather and congestion signals." },
  { i: Fingerprint, c: "#34d399", t: "Passkey check-in", d: "Passengers check in with Face ID or a fingerprint (WebAuthn): no password to forget." },
  { i: Store, c: "#fb923c", t: "Retail bids", d: "Shop owners bid on open units; the airport reviews and accepts." },
  { i: ShieldCheck, c: "#ef4444", t: "Secure by design", d: "Per-airport data isolation, role-based access, signed sessions, full audit trail." },
];

const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5 } };

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [role, setRole] = useState(ROLES[0].k);
  const [airports, setAirports] = useState<AirportInfo[]>([]);
  useEffect(() => { if (API_ENABLED) fetchAirports().then(setAirports).catch(() => undefined); }, []);
  const r = ROLES.find(x => x.k === role)!;

  return (
    <div className="min-h-screen bg-[#050b17] text-white relative overflow-x-hidden">
      <header className="absolute z-20 inset-x-0 top-0 flex items-center justify-between px-5 lg:px-12 py-5">
        <div className="flex items-center gap-2 font-bold text-lg"><Icon3D size={34} tilt={false}><Plane className="w-5 h-5" /></Icon3D>AeroBase India</div>
        <nav className="flex items-center gap-2">
          <a href="#roles" className="hidden sm:block px-3 py-2 text-sm text-slate-300 hover:text-white">Who it's for</a>
          <a href="#features" className="hidden sm:block px-3 py-2 text-sm text-slate-300 hover:text-white">Features</a>
          <button onClick={onEnter} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">Sign in</button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0 lg:left-[28%]"><Hero3D /></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050b17] via-[#050b17]/70 to-transparent lg:via-[#050b17]/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050b17] to-transparent" />
        <div className="relative z-10 px-5 lg:px-12 pt-28 pb-16 max-w-2xl">
          <motion.div {...fade} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sky-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Built on real airport, airline and route data
          </motion.div>
          <motion.h1 {...fade} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">One control tower for <span className="bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">every airport</span> you run.</motion.h1>
          <motion.p {...fade} className="mt-5 text-slate-300 text-lg">Flights, gates, baggage, crowds, weather and carbon in one live workspace — with a separate, safe view for directors, ground teams, airlines, pilots, shop owners and passengers.</motion.p>
          <motion.div {...fade} className="mt-8 flex flex-wrap gap-3">
            <button onClick={onEnter} className="group px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg shadow-sky-500/30 flex items-center gap-2">Open the console<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" /></button>
            <a href="#roles" className="px-6 py-3 rounded-2xl border border-white/15 hover:bg-white/5 font-semibold">See who it's for</a>
          </motion.div>
          <motion.dl {...fade} className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[[String(airports.length || 15), "airports"], ["958", "real routes"], ["74", "airlines"]].map(([n, l]) => (
              <div key={l}><dt className="text-2xl font-black text-white">{n}</dt><dd className="text-xs text-slate-400">{l}</dd></div>))}
          </motion.dl>
        </div>
      </section>

      {/* Passenger journey */}
      <section className="px-5 lg:px-12 py-16 max-w-6xl mx-auto">
        <motion.h2 {...fade} className="text-2xl lg:text-3xl font-extrabold">Every step of the journey, covered</motion.h2>
        <motion.p {...fade} className="text-slate-400 mt-2 max-w-2xl">From the moment a passenger checks in to the moment the bag reaches the belt, the people running the airport see the same live picture.</motion.p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {JOURNEY.map((s, i) => (
            <motion.div key={s.t} {...fade} transition={{ duration: 0.5, delay: i * 0.06 }} className="relative rounded-2xl p-5 bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-bold text-sky-400 mb-3">STEP {i + 1}</div><s.i className="w-6 h-6 text-sky-300" />
              <div className="font-bold mt-3">{s.t}</div><div className="text-sm text-slate-400 mt-1">{s.d}</div>
            </motion.div>))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="px-5 lg:px-12 py-16 max-w-6xl mx-auto scroll-mt-4">
        <motion.h2 {...fade} className="text-2xl lg:text-3xl font-extrabold">One platform, a different view for everyone</motion.h2>
        <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-6">
          <div role="tablist" className="flex lg:flex-col gap-2 overflow-x-auto pb-1">
            {ROLES.map(x => (
              <button key={x.k} role="tab" aria-selected={role === x.k} onClick={() => setRole(x.k)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left whitespace-nowrap transition ${role === x.k ? "bg-white/10 border-white/25" : "border-white/10 hover:bg-white/5"}`}>
                <x.i className="w-5 h-5 shrink-0" style={{ color: x.c }} /><span className="font-semibold text-sm">{x.l}</span></button>))}
          </div>
          <motion.div key={r.k} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl p-6 lg:p-8 border border-white/10" style={{ background: `linear-gradient(135deg, ${r.c}18, transparent 60%)` }}>
            <r.i className="w-8 h-8" style={{ color: r.c }} /><h3 className="text-xl lg:text-2xl font-bold mt-3">{r.t}</h3>
            <ul className="mt-5 space-y-3">{r.pts.map(p => (<li key={p} className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: r.c }} />{p}</li>))}</ul>
            <button onClick={onEnter} className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm">Try the {r.l.toLowerCase()} view<ArrowRight className="w-4 h-4" /></button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-5 lg:px-12 py-16 max-w-6xl mx-auto scroll-mt-4">
        <motion.h2 {...fade} className="text-2xl lg:text-3xl font-extrabold">What's inside</motion.h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.t} {...fade} transition={{ duration: 0.45, delay: (i % 3) * 0.06 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07] transition">
              <Icon3D color={f.c} size={42}><f.i className="w-5 h-5" /></Icon3D>
              <div className="mt-4 font-semibold">{f.t}</div><div className="text-sm text-slate-400 mt-1">{f.d}</div>
            </motion.div>))}
        </div>
      </section>

      {/* Airports + CTA */}
      <section className="px-5 lg:px-12 py-16 max-w-6xl mx-auto">
        <div className="rounded-3xl p-8 lg:p-12 border border-white/10 bg-gradient-to-br from-sky-500/10 via-transparent to-teal-400/10">
          <h2 className="text-2xl lg:text-3xl font-extrabold">Pick your airport and get started</h2>
          <p className="text-slate-400 mt-2">Passengers and shop owners can create an account in a minute. Airport teams are added by their director.</p>
          {airports.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{airports.map(a => <span key={a.code} title={a.name} className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300"><b className="text-white">{a.code}</b> {a.name.replace(/ Intl.*| \(.*/, "")}</span>)}</div>}
          <button onClick={onEnter} className="mt-8 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 font-semibold shadow-lg shadow-sky-500/30">Sign in or create an account</button>
        </div>
      </section>
      <footer className="px-5 lg:px-12 py-8 text-xs text-slate-500 text-center">AeroBase India · Airport data from OurAirports and OpenFlights · Weather from Open-Meteo · Maps © OpenStreetMap contributors</footer>
    </div>
  );
}
