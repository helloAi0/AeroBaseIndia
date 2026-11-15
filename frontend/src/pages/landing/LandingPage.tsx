import { useEffect, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Plane, Radar, CloudSun, ShieldCheck, Leaf, BrainCircuit, Building2, Wrench, Store, UserRound, ArrowRight, Fingerprint, Map, Luggage, Users, Bot, Accessibility, ScanLine, DoorOpen, CheckCircle2 } from "lucide-react";
import { useThreeScene } from "../../components/three/useThree";
import { Icon3D } from "../../components/ui/Icon3D";
import { fetchAirports, type AirportInfo } from "../../api/account";
import { API_ENABLED } from "../../config";
import { LAND_DOTS } from "../../data/landDots";

/** Real coordinates of the airports we model (lat, lon). */
const NODES: Record<string, [number, number]> = {
  DEL: [28.56, 77.1], BOM: [19.09, 72.87], BLR: [13.2, 77.71], HYD: [17.24, 78.43], CCU: [22.65, 88.45], MAA: [12.99, 80.17],
  COK: [10.15, 76.4], GOI: [15.74, 73.86], AMD: [23.07, 72.63], PNQ: [18.58, 73.92], JAI: [26.82, 75.81], GAU: [26.11, 91.59],
  SXR: [33.99, 74.77], LKO: [26.76, 80.88], TRV: [8.48, 76.92],
};

const HUBS_ABROAD: Record<string, [number, number]> = { DXB: [25.25, 55.36], AUH: [24.43, 54.65], DOH: [25.27, 51.61], LHR: [51.47, -0.45], SIN: [1.36, 103.99] };
const ROUTES: [string, string][] = [["DEL", "BOM"], ["DEL", "BLR"], ["DEL", "CCU"], ["DEL", "HYD"], ["DEL", "MAA"], ["DEL", "GOI"], ["DEL", "GAU"], ["DEL", "SXR"], ["BOM", "BLR"], ["BOM", "COK"], ["BOM", "AMD"], ["BOM", "JAI"], ["BLR", "MAA"], ["HYD", "CCU"],
  ["DEL", "DXB"], ["DEL", "LHR"], ["BOM", "DXB"], ["BOM", "SIN"], ["BLR", "SIN"], ["DEL", "DOH"], ["HYD", "AUH"], ["COK", "DXB"], ["MAA", "SIN"]];

function Hero3D() {
  const { ref, ok } = useThreeScene(({ scene, camera, el }) => {
    const R = 2; const all: Record<string, [number, number]> = { ...NODES, ...HUBS_ABROAD };
    const ll = (lat: number, lon: number, r = R) => { const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)); };
    const globe = new THREE.Group(); scene.add(globe);
    // soft round sprite for dots and glows
    const c = document.createElement("canvas"); c.width = c.height = 64; const g2 = c.getContext("2d")!; const gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(c);

    // ocean: near-black with a faint warm gradient, hides the far side of the dots
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 48), new THREE.MeshBasicMaterial({ color: 0x0c0a07 })));
    // atmosphere: fresnel rim glow
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 64, 48), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { c1: { value: new THREE.Color(0xff9d8a) }, c2: { value: new THREE.Color(0x7fe3c9) } },
      vertexShader: "varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "uniform vec3 c1; uniform vec3 c2; varying vec3 n; varying vec3 v; void main(){ float f = pow(0.78 - dot(-n, v), 2.6); gl_FragColor = vec4(mix(c1, c2, 0.35)*f, clamp(f,0.0,0.85)); }" }));
    scene.add(atmo);

    // land as dots; India and the Gulf glow brighter
    const lp: number[] = [], lc: number[] = []; const base = new THREE.Color(0xc9b2ff), hi = new THREE.Color(0xffd9a0);
    for (const [a, b] of LAND_DOTS) { const lat = a / 2, lon = b / 2; const v = ll(lat, lon, R * 1.003); lp.push(v.x, v.y, v.z);
      const near = Math.hypot((lat - 21) / 16, (lon - 80) / 20) < 1; const col = near ? hi : base; lc.push(col.r, col.g, col.b); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute("color", new THREE.Float32BufferAttribute(lc, 3));
    globe.add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 0.05, map: sprite, vertexColors: true, transparent: true, alphaTest: 0.2, depthWrite: false, opacity: 0.95 })));

    // airports: dots plus pulsing rings at the hubs
    const rings: THREE.Mesh[] = [];
    Object.entries(all).forEach(([k, [a, b]]) => {
      const hub = ["DEL", "BOM", "BLR", "DXB", "LHR", "SIN"].includes(k); const p = ll(a, b, R * 1.012);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(hub ? 0.034 : 0.02, 12, 12), new THREE.MeshBasicMaterial({ color: k in HUBS_ABROAD ? 0x7fe3c9 : 0xfbbf24 })); dot.position.copy(p); globe.add(dot);
      if (hub) { const r = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.062, 40), new THREE.MeshBasicMaterial({ color: k in HUBS_ABROAD ? 0x7fe3c9 : 0xffb8a8, transparent: true, side: THREE.DoubleSide, depthWrite: false })); r.position.copy(p); r.lookAt(p.clone().multiplyScalar(2)); globe.add(r); rings.push(r); }
    });

    // flight arcs with a fading tail, and a small aircraft flying each
    const planeGeo = (() => { const m = new THREE.MeshBasicMaterial({ color: 0xfff4ea }); const gp = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 10), m); body.rotation.x = Math.PI / 2; gp.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 10), m); nose.rotation.x = Math.PI / 2; nose.position.z = 0.26; gp.add(nose);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.11), m); wing.position.z = 0.02; gp.add(wing);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.09, 0.08), m); fin.position.set(0, 0.045, -0.17); gp.add(fin);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.008, 0.05), m); tail.position.z = -0.17; gp.add(tail); return gp; })();
    const flights: { pts: THREE.Vector3[]; plane: THREE.Group; off: number; speed: number }[] = [];
    ROUTES.forEach(([f, t], i) => {
      const a = ll(all[f][0], all[f][1], 1).normalize(), b = ll(all[t][0], all[t][1], 1).normalize(), ang = a.angleTo(b); const lift = 0.04 + ang * 0.14; const N = 64, pts: THREE.Vector3[] = [], col: number[] = [];
      for (let s = 0; s <= N; s++) { const u = s / N; const v = a.clone().multiplyScalar(Math.sin((1 - u) * ang)).add(b.clone().multiplyScalar(Math.sin(u * ang))).divideScalar(Math.sin(ang) || 1).normalize(); pts.push(v.multiplyScalar(R * (1.012 + Math.sin(u * Math.PI) * lift))); const k = 0.25 + 0.75 * Math.sin(u * Math.PI); col.push(0.94 * k, 0.82 * k, 0.54 * k); }
      const lg2 = new THREE.BufferGeometry().setFromPoints(pts); lg2.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      globe.add(new THREE.Line(lg2, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })));
      const plane = planeGeo.clone(); plane.scale.setScalar(0.17 + Math.min(ang, 1.2) * 0.05); globe.add(plane);
      flights.push({ pts, plane, off: (i * 0.173) % 1, speed: 0.028 + ((i * 7) % 5) * 0.006 });
    });

    // a thin orbit ring with a moving satellite, plus layered stars
    const orbit = new THREE.Group(); orbit.rotation.set(1.2, 0.2, 0.5); scene.add(orbit);
    orbit.add(new THREE.Mesh(new THREE.RingGeometry(R * 1.42, R * 1.425, 160), new THREE.MeshBasicMaterial({ color: 0xff9d8a, transparent: true, opacity: 0.25, side: THREE.DoubleSide })));
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); orbit.add(sat);
    const star = (n: number, size: number, op: number, spread: number) => { const p = new Float32Array(n * 3); for (let i = 0; i < p.length; i++) p[i] = (Math.random() - 0.5) * spread; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffb8a8, size, map: sprite, transparent: true, opacity: op, depthWrite: false })); scene.add(s); return s; };
    const far = star(700, 0.05, 0.55, 70), near = star(160, 0.1, 0.8, 30);

    // pointer parallax
    const pt = { x: 0, y: 0, cx: 0, cy: 0 };
    const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); pt.x = ((e.clientX - r.left) / r.width - 0.5) * 2; pt.y = ((e.clientY - r.top) / r.height - 0.5) * 2; };
    window.addEventListener("pointermove", onMove);
    const up = new THREE.Vector3(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), m4 = new THREE.Matrix4();
    let last = 0; const OFFSET = -0.55;
    return (t) => {
      const dt = Math.min(t - last, 0.1); last = t; pt.cx += (pt.x - pt.cx) * 0.04; pt.cy += (pt.y - pt.cy) * 0.04;
      const wide = camera.aspect >= 1; camera.position.set(wide ? -1.7 + pt.cx * 0.35 : pt.cx * 0.3, 0.4 - pt.cy * 0.25, wide ? 7.6 : 10.5); camera.lookAt(wide ? -1.7 : 0, 0, 0);
      globe.rotation.set(0.35 + pt.cy * 0.06, 3.35 + OFFSET + t * 0.045 + pt.cx * 0.12, 0);
      flights.forEach(f => { const u = (f.off + t * f.speed) % 1; const i = Math.min(f.pts.length - 2, Math.floor(u * (f.pts.length - 1))); const fr = u * (f.pts.length - 1) - i;
        const p = f.pts[i].clone().lerp(f.pts[i + 1], fr); f.plane.position.copy(p);
        fwd.copy(f.pts[i + 1]).sub(f.pts[i]).normalize(); up.copy(p).normalize(); side.crossVectors(up, fwd).normalize(); up.crossVectors(fwd, side).normalize();
        f.plane.quaternion.setFromRotationMatrix(m4.makeBasis(side, up, fwd)); });
      rings.forEach((r, i) => { const k = (t * 0.7 + i * 0.37) % 1; r.scale.setScalar(1 + k * 2.4); (r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7; });
      sat.position.set(Math.cos(t * 0.35) * R * 1.42, Math.sin(t * 0.35) * R * 1.42, 0);
      far.rotation.y = t * 0.004; near.rotation.y = t * 0.009 + pt.cx * 0.03; near.rotation.x = pt.cy * 0.02; void dt;
    };
  });
  if (!ok) return <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#6b2f4a55,transparent_60%)]" />;
  return <div ref={ref} aria-hidden className="absolute inset-0 opacity-50 md:opacity-100" />;
}

const ROLES = [
  { k: "director", l: "Airport director", i: Building2, c: "#ff9d8a", t: "See the whole airport in one place", pts: ["Live flight board with delays, gates and terminals, for the airport you chose at sign-up", "Revenue, analytics and an Ops Copilot you can question in plain English", "Crowd and queue pressure with one-click fixes", "Add your own staff and approve lounge and Pro requests"] },
  { k: "staff", l: "Ground staff", i: Wrench, c: "#7fe3c9", t: "Run the shift, not the spreadsheet", pts: ["Passenger Desk: check in, drop bags, clear security and board each traveller", "Baggage tracking and turnaround timers", "Accessibility requests routed to the nearest free staff member", "Gate optimiser that finds double-booked gates"] },
  { k: "security", l: "Security", i: ShieldCheck, c: "#e07a5f", t: "A head who can see and command every officer", pts: ["Officers get a reference ID and work at any airport", "The security head sends instructions such as “Rohan, go to the toilet section”", "Officers acknowledge and resolve from their own screen", "Emergency centre and weather playbooks"] },
  { k: "airline", l: "Airlines & pilots", i: Plane, c: "#fbbf24", t: "Your fleet, your flights, nobody else's", pts: ["Airline ops see only their own airline's flights and bookings", "Issue crew reference IDs; a pilot signs up with the ID and is placed on the airline, aircraft and flights", "Moving airline? A new reference ID re-assigns the pilot", "Disruption autopilot and carbon scorecard"] },
  { k: "retail", l: "Shop owners", i: Store, c: "#fb923c", t: "Create your shop and run it", pts: ["Open your own shop: products, stock, prices and opening status", "Orders from passengers arrive live: accept, prepare, deliver to the gate or pickup", "Stock is reserved when an order is placed and restored on cancel", "Sales and top-product reports"] },
  { k: "pax", l: "Passengers", i: UserRound, c: "#c084fc", t: "Everything for your journey", pts: ["Book for yourself, family and friends with a passenger ID; they see their own boarding pass", "Pro membership takes 10% off fares", "Order food and coffee to your gate", "Lounge finder, bag tracking, assistance and lost items"] },
];

const JOURNEY = [
  { i: Fingerprint, t: "Check in", d: "Passkey check-in with Face ID or fingerprint; no password, no queue." },
  { i: ScanLine, t: "Security", d: "Queue pressure shown per terminal so teams open lanes early." },
  { i: DoorOpen, t: "Gate", d: "Smart gate assignment avoids double-booked and wrong-size gates." },
  { i: Plane, t: "Flight", d: "Delay reasons, rebooking options and announcements in several languages." },
  { i: Luggage, t: "Baggage", d: "Every bag tracked from check-in to the belt, with a claim ETA." },
];

const FEATURES = [
  { i: Plane, c: "#ff7a66", t: "Live flight operations", d: "Flights, gates, terminals and delays for each airport, from real route data." },
  { i: Bot, c: "#a78bfa", t: "Ops Copilot", d: "Ask “how many passengers booked Air India today?” and get an answer, by role." },
  { i: Users, c: "#f472b6", t: "Crowd & queues", d: "Expected pressure at check-in, security and gates, with levers to relieve it." },
  { i: CloudSun, c: "#f59e0b", t: "Live weather", d: "Current conditions per airport and ready-made response playbooks." },
  { i: Radar, c: "#4fd1b0", t: "3D digital twin", d: "Rotate the apron and see every gate's status at a glance." },
  { i: Leaf, c: "#22c55e", t: "Carbon-aware ops", d: "Per-flight and per-airline emission savings from taxi and APU choices." },
  { i: Accessibility, c: "#ff9d8a", t: "Accessibility", d: "Assisted-travel requests assigned to the nearest available staff." },
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
    <div className="min-h-screen bg-[#0f0a16] text-white relative overflow-x-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0a16] via-[#0f0a16]/70 to-transparent lg:via-[#0f0a16]/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f0a16] to-transparent" />
        <div className="relative z-10 px-5 lg:px-12 pt-28 pb-16 max-w-2xl">
          <motion.div {...fade} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sky-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Built on real airport, airline and route data
          </motion.div>
          <motion.h1 {...fade} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">Fly, run and serve <span className="bg-gradient-to-r from-sky-300 via-sky-400 to-teal-400 bg-clip-text text-transparent">every airport</span> from one place.</motion.h1>
          <motion.p {...fade} className="mt-5 text-slate-300 text-lg">Directors, security, airlines, pilots, shop owners and passengers each get their own real workspace: book family trips, order food to your gate, dispatch officers, run your shop, and see the whole airport live.</motion.p>
          <motion.div {...fade} className="mt-8 flex flex-wrap gap-3">
            <button onClick={onEnter} className="group px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg shadow-sky-500/30 flex items-center gap-2">Open the console<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" /></button>
            <a href="#roles" className="px-6 py-3 rounded-2xl border border-white/15 hover:bg-white/5 font-semibold">See who it's for</a>
          </motion.div>
          <motion.dl {...fade} className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[[String(airports.length || 20), "airports"], ["958", "real routes"], ["74", "airlines"]].map(([n, l]) => (
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
