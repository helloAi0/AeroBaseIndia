import { useEffect, useState } from "react";
import { Eye, EyeOff, Plane, ArrowRight, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Store, UserRound, Wrench, Building2, Radar, Mail, KeyRound } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { MOCK_USERS } from "../../data/users";
import { loginWithBackend, LoginError } from "../../api/auth";
import { fetchAirlines, type AirlineInfo, fetchAirports, signup, forgotPassword, resetPassword, passwordProblem, type AirportInfo } from "../../api/account";
import { API_ENABLED, DEMO_LOGIN_ENABLED, SHOW_DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../config";

type Mode = "signin" | "signup" | "forgot" | "reset";

const FALLBACK_AIRPORTS: AirportInfo[] = [
  { code: "DEL", name: "Indira Gandhi Intl" }, { code: "BOM", name: "Mumbai CSMIA" }, { code: "BLR", name: "Kempegowda Intl" },
  { code: "HYD", name: "Rajiv Gandhi Intl" }, { code: "CCU", name: "Netaji Subhas Chandra Bose Intl" }, { code: "MAA", name: "Chennai Intl" },
];

/** Who each kind of account is for, and the seeded demo login for it (pattern from scripts/seed_demo.py). */
const ROLES = [
  { key: "admin", label: "Airport director", icon: Building2, color: "#38bdf8", blurb: "Runs the whole airport: flights, gates, revenue, team.", email: (a: string) => `admin@${a}.aerobase.in` },
  { key: "staff", label: "Ground staff", icon: Wrench, color: "#2dd4bf", blurb: "Check-in, baggage, turnaround, assistance requests.", email: (a: string) => `staff@${a}.aerobase.in` },
  { key: "security", label: "Security", icon: ShieldCheck, color: "#f87171", blurb: "Security events, CCTV, emergencies.", email: (a: string) => `security@${a}.aerobase.in` },
  { key: "airline", label: "Airline ops", icon: Plane, color: "#fbbf24", blurb: "Your airline's flights, fleet, crew and revenue.", email: (a: string, x?: string) => `ops.${(x || "6e").toLowerCase()}@${a}.aerobase.in` },
  { key: "sechead", label: "Security head", icon: ShieldCheck, color: "#fb7185", blurb: "Your officers by reference ID; send them instructions.", email: (a: string) => `head.security@${a}.aerobase.in` },
  { key: "pilot", label: "Pilot", icon: Radar, color: "#a78bfa", blurb: "Duty roster, briefing, weather and gate for your flights.", email: (a: string) => `captain@airindia.${a}.aerobase.in` },
  { key: "retailer", label: "Shop owner", icon: Store, color: "#fb923c", blurb: "Your unit, bids, sales and notices from the airport.", email: (a: string) => `shop@${a}.aerobase.in` },
  { key: "passenger", label: "Passenger", icon: UserRound, color: "#c084fc", blurb: "Your flight, boarding pass, bags and wayfinding.", email: (a: string) => `passenger@${a}.aerobase.in` },
];

const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-sky-400/70 focus:bg-white/[0.07] transition";

export function LoginPage() {
  const login = useAuthStore(s => s.login);
  const [mode, setMode] = useState<Mode>(() => (location.hash.startsWith("#/reset") ? "reset" : "signin"));
  const [airports, setAirports] = useState<AirportInfo[]>(FALLBACK_AIRPORTS);
  const [airport, setAirport] = useState("DEL"); const [demoRole, setDemoRole] = useState<string | null>(null); const [airlines, setAirlines] = useState<AirlineInfo[]>([]); const [airline, setAirline] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [acct, setAcct] = useState<"PASSENGER" | "RETAILER" | "PILOT">("PASSENGER"); const [shop, setShop] = useState(""); const [crewRef, setCrewRef] = useState(""); const [license, setLicense] = useState("");
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [info, setInfo] = useState(""); const [link, setLink] = useState("");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(location.hash.split("?")[1] ?? "").get("token") ?? "");
  useEffect(() => {   // the emailed / on-screen link only changes the hash, so follow it
    const onHash = () => { if (location.hash.startsWith("#/reset")) { setResetToken(new URLSearchParams(location.hash.split("?")[1] ?? "").get("token") ?? ""); setMode("reset"); setError(""); setInfo(""); setLink(""); setPassword(""); } };
    window.addEventListener("hashchange", onHash); return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { if (API_ENABLED) fetchAirlines(airport).then(a => { setAirlines(a); setAirline(x => a.some(y => y.code === x) ? x : (a.find(y => y.code === "6E") ?? a[0])?.code ?? ""); }).catch(() => setAirlines([])); }, [airport]);
  useEffect(() => { if (API_ENABLED) fetchAirports().then(a => a.length && setAirports(a)).catch(() => undefined); }, []);
  const go = (m: Mode) => { setMode(m); setError(""); setInfo(""); setLink(""); };

  const demoUser = () => MOCK_USERS.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);

  const doSignin = async (em = email, pw = password) => {
    setBusy(true); setError("");
    try {
      if (API_ENABLED) {
        try { const s = await loginWithBackend(em, pw); login(s.user, s.token, { source: "backend", expiresAt: s.expiresAt }); return; }
        catch (err) { if (!(err instanceof LoginError)) throw err; setError(err.message); return; }
      }
      const u = DEMO_LOGIN_ENABLED ? MOCK_USERS.find(x => x.email.toLowerCase() === em.toLowerCase() && x.password === pw) : undefined;
      if (u) { const { password: _p, ...safe } = u; login(safe as never, "tok_" + safe.id, { source: "demo" }); return; }
      setError(API_ENABLED ? "Incorrect email or password." : "No server is configured for this build.");
    } finally { setBusy(false); }
  };
  void demoUser;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setInfo("");
    if (mode === "signin") return doSignin();
    setBusy(true);
    try {
      if (mode === "signup") {
        const p = passwordProblem(password); if (p) { setError(p); return; }
        await signup({ name: name.trim(), email: email.trim(), password, airport, account_type: acct, shop: shop.trim(), crew_ref: crewRef.trim(), license: license.trim() });
        setInfo("Account created. Signing you in…"); await doSignin(email.trim(), password);
      } else if (mode === "forgot") {
        const r = await forgotPassword(email.trim()); setInfo(r.message); setLink(r.resetLink ?? "");
      } else {
        const p = passwordProblem(password); if (p) { setError(p); return; }
        setInfo(await resetPassword(resetToken, password)); history.replaceState(null, "", "#login"); setPassword(""); setTimeout(() => go("signin"), 1200);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setBusy(false); }
  };

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to your airport workspace"], signup: ["Create your account", "Passengers, shop owners and airline crew can sign up here"],
    forgot: ["Forgot your password?", "We'll email you a link to choose a new one"], reset: ["Choose a new password", "At least 10 characters, with a letter and a number"],
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[#050b17] text-slate-200">
      {/* Brand side */}
      <aside className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden" style={{ background: "radial-gradient(1200px 600px at 0% 0%, rgba(14,165,233,.18), transparent 60%), radial-gradient(800px 500px at 100% 100%, rgba(45,212,191,.12), transparent 60%)" }}>
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center"><Plane className="w-6 h-6 text-white" /></div>
          <div><div className="text-lg font-black text-white leading-none">AeroBase India</div><div className="text-xs text-sky-300 mt-1">Airport operations platform</div></div></div>
        <div>
          <h1 className="text-4xl font-black text-white leading-tight">One workspace for<br /><span className="text-sky-400">everyone</span> who keeps an airport moving.</h1>
          <p className="text-slate-400 mt-4 max-w-md">Directors, ground teams, security, airlines, pilots, shop owners and passengers each get their own view of the same live airport.</p>
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
            {ROLES.slice(0, 6).map(r => (<div key={r.key} className="flex items-start gap-3 rounded-xl p-3 bg-white/[0.03] border border-white/5">
              <r.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: r.color }} /><div><div className="text-sm font-semibold text-white">{r.label}</div><div className="text-[11px] text-slate-500 leading-snug">{r.blurb}</div></div></div>))}
          </div>
        </div>
        <div className="text-xs text-slate-600">{airports.length} Indian airports · live board, gates, baggage, weather</div>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6"><Plane className="w-6 h-6 text-sky-400" /><span className="font-black text-white">AeroBase India</span></div>
          <div className="rounded-3xl p-6 sm:p-8 bg-white/[0.035] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white">{titles[mode][0]}</h2>
            <p className="text-sm text-slate-400 mt-1 mb-6">{titles[mode][1]}</p>

            {(mode === "signin" || mode === "signup") && (
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 mb-5" role="tablist">
                {(["signin", "signup"] as const).map(m => (<button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => go(m)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${mode === m ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>{m === "signin" ? "Sign in" : "Create account"}</button>))}
              </div>)}

            <form onSubmit={submit} className="space-y-4" noValidate={false}>
              {mode === "signup" && (<>
                <div className="grid grid-cols-3 gap-2">
                  {([["PASSENGER", "Passenger", UserRound], ["RETAILER", "Shop owner", Store], ["PILOT", "Pilot / crew", Plane]] as const).map(([v, l, I]) => (
                    <button key={v} type="button" onClick={() => setAcct(v)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm border transition ${acct === v ? "border-sky-400 bg-sky-500/10 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}><I className="w-4 h-4" />{l}</button>))}
                </div>
                <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full name</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Asha Rao" /></div>
                {acct === "RETAILER" && <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Shop or brand name</label><input className={inputCls} value={shop} onChange={e => setShop(e.target.value)} required placeholder="Blue Tokai Coffee" /></div>}
                {acct === "PILOT" && <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[11px] text-slate-400">Your airline's operations team issues a crew reference ID and you give them your licence number. Enter your name exactly as they registered it.</div>
                  <input className={inputCls} placeholder="Crew reference ID e.g. EK-FD-3FA21C" value={crewRef} onChange={e => setCrewRef(e.target.value)} required autoCapitalize="characters" aria-label="Crew reference ID" />
                  <input className={inputCls} placeholder="Licence number e.g. ATPL-IN-4471" value={license} onChange={e => setLicense(e.target.value)} required aria-label="Licence number" /></div>}
                {acct !== "PILOT" && <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Airport</label>
                  <select className={inputCls} value={airport} onChange={e => setAirport(e.target.value)}>{airports.map(a => <option key={a.code} value={a.code} className="bg-slate-900">{a.code} — {a.name}</option>)}</select></div>}
              </>)}

              {mode !== "reset" && (<div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></div>)}

              {mode !== "forgot" && (<div><div className="flex justify-between mb-1.5"><label className="text-xs font-semibold text-slate-400">{mode === "reset" ? "New password" : "Password"}</label>
                {mode === "signin" && <button type="button" onClick={() => go("forgot")} className="text-xs text-sky-400 hover:underline">Forgot password?</button>}</div>
                <div className="relative"><input className={inputCls + " pr-11"} type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Your password" : "10+ characters, letters and numbers"} />
                  <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>)}

              {error && <div role="alert" className="flex gap-2 items-start text-sm rounded-xl px-3 py-2.5 bg-red-500/10 border border-red-500/30 text-red-300"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
              {info && <div role="status" className="flex gap-2 items-start text-sm rounded-xl px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{info}</div>}
              {link && <a href={link} className="flex gap-2 items-center text-sm rounded-xl px-3 py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-300 break-all"><KeyRound className="w-4 h-4 shrink-0" /><span>No email provider is set up here, so use this link directly: <u>open reset page</u></span></a>}

              <button disabled={busy} className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-500 to-teal-400 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 transition">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "forgot" ? <Mail className="w-4 h-4" /> : null}
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Save new password"}{!busy && mode !== "forgot" && <ArrowRight className="w-4 h-4" />}
              </button>
              {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => go("signin")} className="w-full text-sm text-slate-400 hover:text-white">← Back to sign in</button>}
            </form>
          </div>

          {SHOW_DEMO_ACCOUNTS && mode === "signin" && (
            <div className="mt-5 rounded-2xl p-4 bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div><div className="text-sm font-bold text-white">Try a demo account</div><div className="text-[11px] text-slate-500">One click fills the form · password <code className="text-slate-300">{DEMO_PASSWORD}</code></div></div>
                <select aria-label="Demo airport" className="rounded-lg px-2 py-1.5 text-xs bg-white/5 border border-white/10 text-white" value={airport} onChange={e => { setAirport(e.target.value); const r = ROLES.find(x => x.key === demoRole); if (r) setEmail((r.email as (a: string, x?: string) => string)(e.target.value.toLowerCase(), airline)); }}>
                  {airports.map(a => <option key={a.code} value={a.code} className="bg-slate-900">{a.code}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (<button key={r.key} type="button" onClick={() => { setDemoRole(r.key); setEmail((r.email as (a: string, x?: string) => string)(airport.toLowerCase(), airline)); setPassword(DEMO_PASSWORD); setError(""); }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left border border-white/10 hover:border-white/30 hover:bg-white/5 transition">
                  <r.icon className="w-4 h-4 shrink-0" style={{ color: r.color }} /><span className="text-xs font-semibold text-slate-200">{r.label}</span></button>))}
                <button type="button" onClick={() => { setEmail("owner@aerobase.in"); setPassword(DEMO_PASSWORD); setError(""); }} className="col-span-2 flex items-center gap-2 rounded-xl px-3 py-2 text-left border border-amber-400/30 hover:bg-amber-400/5 transition">
                  <Building2 className="w-4 h-4 text-amber-400" /><span className="text-xs font-semibold text-amber-200">Platform owner</span><span className="text-[11px] text-slate-500">— switches between all airports</span></button>
              </div>
              {demoRole === "airline" && airlines.length > 0 && <div className="mt-3"><label className="text-[11px] text-slate-400 block mb-1">Which airline? (only airlines flying at {airport})</label>
                <select aria-label="Demo airline" className="w-full rounded-lg px-2 py-2 text-xs bg-white/5 border border-white/10 text-white" value={airline} onChange={e => { setAirline(e.target.value); setEmail(`ops.${e.target.value.toLowerCase()}@${airport.toLowerCase()}.aerobase.in`); }}>
                  {airlines.map(a => <option key={a.code} value={a.code} className="bg-slate-900">{a.name} ({a.code})</option>)}</select></div>}
              {email && <div className="text-[11px] text-slate-500 mt-3">Filled: <span className="text-slate-300">{email}</span> — press <b>Sign in</b></div>}
            </div>)}
        </div>
      </main>
    </div>
  );
}
