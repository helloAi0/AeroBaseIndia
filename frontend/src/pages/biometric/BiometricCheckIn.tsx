import { useCallback, useEffect, useState } from "react";
import { Fingerprint, ShieldCheck, Trash2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { useBoard } from "../../hooks/useBoard";
import { Card, PageHead } from "../../components/ui/PageHead";

/**
 * Real biometric check-in using passkeys (WebAuthn). The passenger's fingerprint / face / device PIN is checked by their own
 * device; this server only stores a public key and verifies a signed one-time challenge. No face or fingerprint data is ever
 * sent or stored, which is also what India's DPDP Act favours.
 */
const b64u = {
  enc: (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s: string) => { const p = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4); return Uint8Array.from(atob(p), c => c.charCodeAt(0)).buffer; },
};
type Cred = { id: string; label: string; created_at: string; last_used_at: string };

export function BiometricCheckIn() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend"; const { flights } = useBoard();
  const supported = typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
  const [creds, setCreds] = useState<Cred[]>([]); const [busy, setBusy] = useState(false);
  const [flight, setFlight] = useState(""); const [seat, setSeat] = useState(""); const [pnr, setPnr] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(() => { api.get("/api/biometric/credentials").then(r => setCreds(r.data.credentials ?? [])).catch(() => {}); }, []);
  useEffect(() => { if (live) load(); }, [live, load]);
  useEffect(() => { if (!flight && flights.length) setFlight(flights[0].flight); }, [flights, flight]);

  const err = (e: any) => e?.response?.data?.error ?? (e?.name === "NotAllowedError" ? "Cancelled or timed out on the device." : e?.message ?? "Something went wrong");

  const register = async () => {
    setBusy(true); setMsg(null);
    try {
      const o = (await api.post("/api/biometric/register/options")).data;
      const cred = (await navigator.credentials.create({ publicKey: {
        challenge: b64u.dec(o.challenge), rp: { name: o.rp.name }, user: { id: b64u.dec(o.user.id), name: o.user.name, displayName: o.user.displayName },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], timeout: o.timeout,
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" }, attestation: "none",
        excludeCredentials: o.excludeCredentials.map((id: string) => ({ type: "public-key" as const, id: b64u.dec(id) })),
      } })) as PublicKeyCredential | null;
      if (!cred) throw new Error("No credential returned");
      const r = cred.response as AuthenticatorAttestationResponse;
      await api.post("/api/biometric/register/verify", { clientDataJSON: b64u.enc(r.clientDataJSON), attestationObject: b64u.enc(r.attestationObject), label: navigator.platform || "This device" });
      setMsg({ ok: true, t: "Device registered. You can now check in with your fingerprint, face or device PIN." }); load();
    } catch (e) { setMsg({ ok: false, t: err(e) }); } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setMsg(null);
    try {
      const o = (await api.post("/api/biometric/assert/options")).data;
      const cred = (await navigator.credentials.get({ publicKey: { challenge: b64u.dec(o.challenge), timeout: o.timeout, userVerification: "required",
        allowCredentials: o.allowCredentials.map((id: string) => ({ type: "public-key" as const, id: b64u.dec(id) })) } })) as PublicKeyCredential | null;
      if (!cred) throw new Error("No credential returned");
      const r = cred.response as AuthenticatorAssertionResponse;
      await api.post("/api/biometric/assert/verify", { credentialId: b64u.enc(cred.rawId), clientDataJSON: b64u.enc(r.clientDataJSON), authenticatorData: b64u.enc(r.authenticatorData), signature: b64u.enc(r.signature), flight, seat, pnr });
      setMsg({ ok: true, t: `Identity verified. ${flight || "Your"} check-in is recorded.` }); load();
    } catch (e) { setMsg({ ok: false, t: err(e) }); } finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!confirm("Remove this device?")) return; try { await api.delete(`/api/biometric/credentials/${id}`); load(); } catch (e) { setMsg({ ok: false, t: err(e) }); } };
  const inp = "mt-1 w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm";

  if (!live) return <div className="space-y-6 max-w-3xl"><PageHead title="Biometric Check-in" sub="Passkey (fingerprint / face / PIN) check-in" /><Card><div className="text-sm text-yellow-400">Biometric check-in needs the live backend (sign in with a real account).</div></Card></div>;
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHead title="Biometric Check-in" sub="Verified by your own device's fingerprint, face or PIN. No biometric data leaves your device." />
      {!supported && <Card><div className="text-sm text-red-400">This browser doesn't support passkeys. Use a current Chrome, Edge, Safari or Firefox over HTTPS (or localhost).</div></Card>}
      <Card>
        <div className="flex items-start gap-3 mb-4"><ShieldCheck className="w-6 h-6 text-sky-400 shrink-0" /><p className="text-sm text-slate-300">Optional and consent-based: you can always use the manual counter. The server stores only a public key and a signed one-time challenge is checked on each use.</p></div>
        <div className="text-sm text-slate-300 mb-2 flex items-center gap-2"><Smartphone className="w-4 h-4" />Your registered devices</div>
        {creds.length === 0 ? <div className="text-xs text-slate-500 mb-3">None yet.</div> :
          <ul className="mb-3 space-y-2">{creds.map(c => <li key={c.id} className="flex items-center justify-between text-xs bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-slate-300"><span>{c.label} · added {c.created_at}{c.last_used_at && ` · last used ${c.last_used_at}`}</span><button aria-label="Remove device" onClick={() => void remove(c.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button></li>)}</ul>}
        <button disabled={busy || !supported} onClick={() => void register()} className="px-4 py-2 rounded-xl bg-navy-700 border border-navy-500 text-white text-sm disabled:opacity-50">Register this device</button>
      </Card>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <label className="text-sm text-slate-300">Flight<select className={inp} value={flight} onChange={e => setFlight(e.target.value)}>{flights.slice(0, 60).map(f => <option key={f.id}>{f.flight}</option>)}{flights.length === 0 && <option value="">No flights</option>}</select></label>
          <label className="text-sm text-slate-300">Seat<input className={inp} value={seat} maxLength={6} onChange={e => setSeat(e.target.value.toUpperCase())} placeholder="14C" /></label>
          <label className="text-sm text-slate-300">PNR<input className={inp} value={pnr} maxLength={10} onChange={e => setPnr(e.target.value.toUpperCase())} placeholder="AB12CD" /></label>
        </div>
        <button disabled={busy || !supported || creds.length === 0} onClick={() => void verify()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold disabled:opacity-50"><Fingerprint className="w-5 h-5" />Verify &amp; check in</button>
        {creds.length === 0 && <div className="text-xs text-slate-500 mt-2">Register a device first.</div>}
        {msg && <div className={`mt-4 flex items-center gap-2 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{msg.t}</div>}
      </Card>
    </div>
  );
}
