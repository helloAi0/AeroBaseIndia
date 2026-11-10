import * as THREE from "three";
import { Plane, Radar, CloudSun, ShieldCheck, Leaf, BrainCircuit } from "lucide-react";
import { useThreeScene } from "../../components/three/useThree";
import { Icon3D } from "../../components/ui/Icon3D";

function Hero3D() {
  const { ref, ok } = useThreeScene(({ scene, camera }) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(5, 5, 5); scene.add(dl);
    const globe = new THREE.Group(); scene.add(globe);
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(2, 40, 28), new THREE.MeshStandardMaterial({ color: 0x0b1b3a, roughness: 0.8 })));
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(2.01, 28, 20), new THREE.MeshBasicMaterial({ color: 0x0ea5e9, wireframe: true, transparent: true, opacity: 0.25 })));
    // airport markers (DEL, BOM, BLR) on the globe
    const ll = (lat: number, lon: number, r = 2.03) => { const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)); };
    [[28.6, 77.1], [19.1, 72.9], [13.2, 77.7]].forEach(([a, b]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf59e0b })); m.position.copy(ll(a, b)); globe.add(m); });
    globe.rotation.y = -1.6;
    // orbiting aircraft
    const plane = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), mat); body.rotation.z = Math.PI / 2;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.5), mat);
    plane.add(body, wing); plane.scale.setScalar(1.3); scene.add(plane);
    // stars
    const g = new THREE.BufferGeometry(), pts = new Float32Array(900);
    for (let i = 0; i < pts.length; i++) pts[i] = (Math.random() - 0.5) * 40;
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.04 })));
    camera.position.set(2.4, 0, 8.2); camera.lookAt(2.4, 0, 0);
    return (t) => {
      globe.rotation.y = -1.6 + t * 0.12;
      const a = t * 0.6; plane.position.set(Math.cos(a) * 2.7, Math.sin(a * 0.7) * 0.9 - 0.4, Math.sin(a) * 2.7);
      plane.rotation.y = -a;
    };
  });
  if (!ok) return <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#0c4a6e55,transparent_60%)]" />;
  return <div ref={ref} aria-hidden className="absolute inset-0" />;
}

const FEATURES = [
  { i: Plane, c: "#0ea5e9", t: "Live flight operations", d: "Flights, gates, baggage and check-in in one console." },
  { i: BrainCircuit, c: "#8b5cf6", t: "AI delay prediction", d: "Spot delays early from weather and congestion." },
  { i: CloudSun, c: "#f59e0b", t: "Weather for DEL · BOM · BLR", d: "Live conditions and operational alerts." },
  { i: Radar, c: "#14b8a6", t: "3D digital twin", d: "Rotate the apron and see gate status at a glance." },
  { i: Leaf, c: "#22c55e", t: "Carbon tracking", d: "Estimated emissions per airline and per passenger." },
  { i: ShieldCheck, c: "#ef4444", t: "Multi-tenant & secure", d: "Per-airport data, role-based access, JWT sessions." },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-[#060b18] text-white relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[560px]"><Hero3D /></div>
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-2 font-bold text-lg"><Icon3D size={34} tilt={false}><Plane className="w-5 h-5" /></Icon3D>AeroBase India</div>
        <button onClick={onEnter} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">Sign in</button>
      </header>
      <section className="relative z-10 px-6 lg:px-12 pt-16 pb-24 lg:pb-40 max-w-3xl">
        <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">One control tower for <span className="text-sky-400">every airport</span> you run.</h1>
        <p className="mt-5 text-slate-300 text-lg max-w-xl">Airport operations, airline portals, passenger services and analytics — built for Indian airports and their airline partners.</p>
        <button onClick={onEnter} className="mt-8 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-lg shadow-lg shadow-sky-500/30">Open the console</button>
      </section>
      <section className="relative z-10 px-6 lg:px-12 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
        {FEATURES.map(f => (
          <div key={f.t} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
            <Icon3D color={f.c} size={44}><f.i className="w-6 h-6" /></Icon3D>
            <div className="mt-4 font-semibold">{f.t}</div><div className="text-sm text-slate-400 mt-1">{f.d}</div>
          </div>))}
      </section>
    </div>
  );
}
