import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function webglAvailable(): boolean {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** Mounts a THREE renderer in a div, runs `setup` once, and cleans up (renderer, geometry, listeners). */
export function useThreeScene(
  setup: (ctx: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; el: HTMLDivElement }) => (t: number) => void,
  deps: unknown[] = [],
) {
  const ref = useRef<HTMLDivElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!webglAvailable()) { setOk(false); return; }
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 500);
    const frame = setup({ scene, camera, renderer, el });
    let raf = 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const loop = (t: number) => { frame(reduce ? 0 : t / 1000); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onResize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(onResize); ro.observe(el);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mat = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => x.dispose()); });
      renderer.dispose(); renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ref, ok };
}
