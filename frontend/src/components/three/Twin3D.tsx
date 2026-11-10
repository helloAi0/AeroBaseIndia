import * as THREE from "three";
import { useThreeScene } from "./useThree";

export interface TwinGate { g: string; status: string; flight?: string }
const COLOR: Record<string, number> = { occupied: 0x0ea5e9, available: 0x22c55e, boarding: 0x2dd4bf, delayed: 0xf59e0b, cleaning: 0x6b7280 };

/** Drag to orbit, wheel to zoom. Gates are columns coloured by status; aircraft sit at occupied/boarding/delayed gates. */
export function Twin3D({ gates, terminals }: { gates: TwinGate[]; terminals: { id: string; gates: string[]; color: string }[] }) {
  const key = gates.map(g => g.g + g.status).join();
  const { ref, ok } = useThreeScene(({ scene, camera, renderer, el }) => {
    scene.background = null;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(30, 50, 20); scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 70), new THREE.MeshStandardMaterial({ color: 0x0b1224 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const runway = new THREE.Mesh(new THREE.BoxGeometry(110, 0.1, 7), new THREE.MeshStandardMaterial({ color: 0x1b2540 }));
    runway.position.set(0, 0.05, 24); scene.add(runway);
    for (let i = -50; i < 50; i += 8) { const m = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: 0x94a3b8 })); m.position.set(i, 0.1, 24); scene.add(m); }

    const gateMeshes: THREE.Object3D[] = [];
    terminals.forEach((t, ti) => {
      const cx = (ti - (terminals.length - 1) / 2) * 34;
      const term = new THREE.Mesh(new THREE.BoxGeometry(28, 3, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color(t.color), transparent: true, opacity: 0.55 }));
      term.position.set(cx, 1.5, -14); scene.add(term);
      t.gates.forEach((gid, gi) => {
        const st = gates.find(x => x.g === gid)?.status ?? "available";
        const x = cx - 10.5 + gi * 7;
        const gate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1 + (st === "available" ? 0 : 1.2), 2.4), new THREE.MeshStandardMaterial({ color: COLOR[st] ?? 0x888888, emissive: COLOR[st] ?? 0, emissiveIntensity: 0.25 }));
        gate.position.set(x, gate.geometry.parameters.height / 2, -8); scene.add(gate); gateMeshes.push(gate);
        if (st !== "available" && st !== "cleaning") {          // simple aircraft: fuselage + wings + tail
          const ac = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 6, 12), mat); body.rotation.x = Math.PI / 2;
          const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 1.3), mat); wing.position.z = 0.4;
          const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.9), new THREE.MeshStandardMaterial({ color: COLOR[st] }));
          tail.position.set(0, 0.7, 2.6);
          ac.add(body, wing, tail); ac.position.set(x, 0.9, -2.2); scene.add(ac);
        }
      });
    });

    camera.position.set(0, 32, 52); camera.lookAt(0, 0, 0);
    // minimal orbit controls (no extra dependency)
    let yaw = 0, pitch = 0.62, dist = 66, drag = false, lx = 0, ly = 0;
    const down = (e: PointerEvent) => { drag = true; lx = e.clientX; ly = e.clientY; };
    const up = () => { drag = false; };
    const move = (e: PointerEvent) => { if (!drag) return; yaw -= (e.clientX - lx) * 0.005; pitch = Math.min(1.35, Math.max(0.15, pitch + (e.clientY - ly) * 0.005)); lx = e.clientX; ly = e.clientY; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); dist = Math.min(110, Math.max(25, dist + e.deltaY * 0.05)); };
    const cv = renderer.domElement; cv.style.touchAction = "none";
    cv.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); cv.addEventListener("pointermove", move); cv.addEventListener("wheel", wheel, { passive: false });
    void el;
    return (t) => {
      const a = yaw + Math.sin(t * 0.15) * 0.08;
      camera.position.set(Math.sin(a) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(a) * Math.cos(pitch) * dist);
      camera.lookAt(0, 0, 0);
    };
  }, [key]);

  if (!ok) return <div className="p-8 text-center text-slate-400 text-sm">3D view needs WebGL, which isn’t available in this browser. The 2D view shows the same data.</div>;
  return <div ref={ref} role="img" aria-label="3D airport digital twin: terminals, gates and aircraft" className="w-full h-[420px] cursor-grab" />;
}
