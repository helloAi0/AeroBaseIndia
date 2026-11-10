import type { ReactNode } from "react";

/** CSS-3D icon tile: layered depth, gradient face and tilt on hover (no WebGL needed). */
export function Icon3D({ children, color = "#0ea5e9", size = 40, tilt = true }: { children: ReactNode; color?: string; size?: number; tilt?: boolean }) {
  return (
    <span className="inline-block" style={{ perspective: 400 }}>
      <span className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 ${tilt ? "hover:[transform:rotateX(18deg)_rotateY(-22deg)]" : ""}`}
        style={{
          width: size, height: size, transformStyle: "preserve-3d", color: "#fff",
          background: `linear-gradient(145deg, ${color}, ${color}99)`,
          boxShadow: `0 1px 0 rgba(255,255,255,.35) inset, 3px 3px 0 ${color}66, 6px 6px 10px rgba(0,0,0,.45)`,
        }}>
        {children}
      </span>
    </span>
  );
}
