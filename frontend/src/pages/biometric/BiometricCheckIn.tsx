import { useEffect, useRef, useState } from "react";
import { ScanFace, ShieldCheck, Camera, CheckCircle2, XCircle } from "lucide-react";

/**
 * DEMONSTRATION ONLY. The camera preview is real; the "match" is simulated. No image is stored, uploaded or analysed,
 * and no face template is created. A production biometric flow needs a certified matching service and explicit consent
 * under India's DPDP Act (see the notice shown on this page).
 */
type Step = "consent" | "scan" | "result";
const PAX = [
  { pnr: "AB12CD", name: "Rahul Sharma", flight: "6E-202", seat: "14C", ok: true },
  { pnr: "XY98ZT", name: "Priya Nair", flight: "AI-101", seat: "7A", ok: true },
  { pnr: "NO00MT", name: "Unregistered traveller", flight: "UK-303", seat: "—", ok: false },
];

export function BiometricCheckIn() {
  const [step, setStep] = useState<Step>("consent");
  const [pax, setPax] = useState(PAX[0]);
  const [cam, setCam] = useState<"idle" | "on" | "denied">("idle");
  const [progress, setProgress] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  useEffect(() => stop, []);

  const start = async () => {
    setStep("scan"); setProgress(0);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (video.current) video.current.srcObject = stream.current;
      setCam("on");
    } catch { setCam("denied"); }
  };
  useEffect(() => {
    if (step !== "scan") return;
    const t = setInterval(() => setProgress(p => Math.min(100, p + 5)), 120);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => { if (progress >= 100 && step === "scan") { stop(); setStep("result"); } }, [progress, step]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-white">Biometric Check-in <span className="text-xs align-middle ml-2 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/20">Demo</span></h1>
        <p className="text-slate-400 text-sm mt-0.5">Simulated face-verification flow — no biometric data is captured or stored.</p></div>

      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
        {step === "consent" && (<div className="space-y-4">
          <div className="flex items-start gap-3"><ShieldCheck className="w-6 h-6 text-sky-400 shrink-0" />
            <p className="text-sm text-slate-300">Face verification is optional. In a real deployment the passenger must give explicit consent, may choose the manual counter instead, and the template is deleted after boarding (DPDP Act, 2023).</p></div>
          <label className="block text-sm text-slate-300">Passenger (demo)
            <select value={pax.pnr} onChange={e => setPax(PAX.find(p => p.pnr === e.target.value)!)} className="mt-1 w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white">
              {PAX.map(p => <option key={p.pnr} value={p.pnr}>{p.name} — {p.flight} ({p.pnr})</option>)}</select></label>
          <button onClick={start} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold"><Camera className="w-4 h-4" />I consent — start camera</button>
        </div>)}

        {step === "scan" && (<div className="space-y-4 text-center">
          <div className="relative mx-auto w-64 h-64 rounded-full overflow-hidden border-4 border-sky-500/60 bg-navy-900">
            <video ref={video} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            {cam !== "on" && <div className="absolute inset-0 flex items-center justify-center text-slate-500"><ScanFace className="w-16 h-16" /></div>}
            <div className="absolute left-0 right-0 h-0.5 bg-sky-400/80 animate-pulse" style={{ top: `${progress}%` }} />
          </div>
          {cam === "denied" && <p className="text-xs text-yellow-400">Camera unavailable or blocked — continuing the simulation without it.</p>}
          <div className="w-64 mx-auto h-2 rounded-full bg-navy-900 overflow-hidden"><div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="text-sm text-slate-400">Verifying… {progress}%</p>
        </div>)}

        {step === "result" && (<div className="text-center space-y-3">
          {pax.ok ? <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" /> : <XCircle className="w-14 h-14 text-red-400 mx-auto" />}
          <div className="text-xl font-bold text-white">{pax.ok ? "Verified — checked in" : "Verification failed"}</div>
          {pax.ok ? <div className="text-slate-300 text-sm">{pax.name} · {pax.flight} · Seat {pax.seat}</div>
                  : <div className="text-slate-300 text-sm">No matching booking. Please proceed to the manual check-in counter.</div>}
          <button onClick={() => setStep("consent")} className="px-4 py-2 rounded-lg bg-navy-700 text-slate-200 text-sm">Run again</button>
        </div>)}
      </div>
    </div>
  );
}
