import { useState } from "react";
import { Eye, EyeOff, Plane, Lock, ArrowRight,
         AlertCircle, CheckCircle, Store, Building2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { MOCK_USERS } from "../../data/users";
import { loginWithBackend, LoginError } from "../../api/auth";
import { API_ENABLED, DEMO_LOGIN_ENABLED } from "../../config";

type LoginMode = "all" | "retailer" | "airline";

const AIRLINES = [
  {code:"AI",  name:"Air India",        color:"#ef4444",icon:"🔴"},
  {code:"6E",  name:"IndiGo",           color:"#0ea5e9",icon:"🔵"},
  {code:"UK",  name:"Vistara",          color:"#8b5cf6",icon:"🟣"},
  {code:"EK",  name:"Emirates",         color:"#f59e0b",icon:"🟡"},
  {code:"SG",  name:"SpiceJet",         color:"#f97316",icon:"🟠"},
  {code:"QP",  name:"Akasa Air",        color:"#22c55e",icon:"🟢"},
  {code:"IX",  name:"Air India Express",color:"#dc2626",icon:"✈"},
  {code:"G8",  name:"Go First",         color:"#0284c7",icon:"✈"},
];

const AIRLINE_DEMOS: Record<string,{l:string;e:string;p:string;badge:string;c:string}[]> = {
  AI:[
    {l:"Air India Operations Head", e:"ops@airindia.aerobase.in",      p:"AI@Ops2024",      badge:"Ops Head",  c:"#ef4444"},
    {l:"Capt. Arjun Sharma (AI)",   e:"captain@airindia.aerobase.in",  p:"AI@Captain2024",  badge:"Captain",   c:"#8b5cf6"},
    {l:"F/O Rahul Mehta (AI)",      e:"fo@airindia.aerobase.in",       p:"AI@FO2024",       badge:"F/O",       c:"#6366f1"},
  ],
  "6E":[
    {l:"IndiGo Operations Head",    e:"ops@indigo.aerobase.in",        p:"6E@Ops2024",      badge:"Ops Head",  c:"#0ea5e9"},
    {l:"Capt. Vikram Gupta (6E)",   e:"captain@indigo.aerobase.in",    p:"6E@Captain2024",  badge:"Captain",   c:"#8b5cf6"},
  ],
  EK:[
    {l:"Emirates Operations Head",  e:"ops@emirates.aerobase.in",      p:"EK@Ops2024",      badge:"Ops Head",  c:"#f59e0b"},
  ],
  SG:[
    {l:"SpiceJet Operations Head",  e:"ops@spicejet.aerobase.in",      p:"SG@Ops2024",      badge:"Ops Head",  c:"#f97316"},
  ],
  UK:[
    {l:"Vistara Operations Head",   e:"ops@vistara.aerobase.in",       p:"UK@Ops2024",      badge:"Ops Head",  c:"#8b5cf6"},
  ],
  QP:[
    {l:"Akasa Operations Head",     e:"ops@akasa.aerobase.in",         p:"QP@Ops2024",      badge:"Ops Head",  c:"#22c55e"},
  ],
};

const AIRPORT_DEMOS = [
  {l:"Delhi Airport Director",    e:"admin@del.aerobase.in",   p:"DEL@Admin2024", badge:"Admin",    c:"#0ea5e9"},
  {l:"Mumbai Airport Director",   e:"admin@bom.aerobase.in",   p:"BOM@Admin2024", badge:"Admin",    c:"#0ea5e9"},
  {l:"Bangalore Director",        e:"admin@blr.aerobase.in",   p:"BLR@Admin2024", badge:"Admin",    c:"#0ea5e9"},
  {l:"Security Staff",            e:"security@del.aerobase.in",p:"Sec@2024",      badge:"Security", c:"#ef4444"},
  {l:"Ground Ops Staff",          e:"staff@del.aerobase.in",   p:"Staff@2024",    badge:"Staff",    c:"#14b8a6"},
  {l:"Passenger",                 e:"passenger@aerobase.in",   p:"Pass@2024",     badge:"Passenger",c:"#8b5cf6"},
];

const RETAILER_DEMOS = [
  {l:"Aqua Blue Water Bar",    e:"retailer@del.aerobase.in",  p:"Retail@2024",badge:"Retailer",c:"#f97316"},
  {l:"Starbucks DEL T3",       e:"starbucks@del.aerobase.in", p:"Star@2024",  badge:"Retailer",c:"#f97316"},
  {l:"KFC Terminal 2",         e:"kfc@del.aerobase.in",       p:"KFC@2024",   badge:"Retailer",c:"#f97316"},
];

const ROLE_LABELS: Record<string,string> = {
  airport_admin:"✈ Airport Director",
  staff:        "⚙ Airport Staff",
  passenger:    "🧳 Passenger",
  retailer:     "🏪 Shop Owner",
  superadmin:   "🌐 Super Admin",
};

export function LoginPage() {
  const { login }  = useAuthStore();
  const [mode,     setMode]    = useState<LoginMode>("all");
  const [selAirline,setAirline]= useState("AI");
  const [email,    setEmail]   = useState("");
  const [password, setPass]    = useState("");
  const [showPass, setShow]    = useState(false);
  const [error,    setError]   = useState("");
  const [loading,  setLoad]    = useState(false);
  const [detected, setDetected]= useState<string|null>(null);

  const detectRole = (val:string) => {
    setEmail(val); setError("");
    const u = MOCK_USERS.find(x=>x.email.toLowerCase()===val.toLowerCase());
    setDetected(u ? (ROLE_LABELS[u.role]||null) : null);
  };

  const handleLogin = async (e:React.FormEvent) => {
    e.preventDefault(); setLoad(true); setError("");
    const demoUser = () => MOCK_USERS.find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.password===password);
    try {
      // 1. Real server first (only when VITE_API_URL is configured)
      let fallbackReason = "";
      if (API_ENABLED) {
        try {
          const s = await loginWithBackend(email, password);
          login(s.user, s.token, { source:"backend", expiresAt:s.expiresAt });
          return;
        } catch (err) {
          if (!(err instanceof LoginError)) throw err;
          const canFallBack = DEMO_LOGIN_ENABLED && !!demoUser();
          if (!canFallBack) {
            setError(err.kind==="invalid" ? err.message
              : DEMO_LOGIN_ENABLED ? "Account not found. Check your credentials."
              : err.message);
            return;
          }
          fallbackReason = err.kind==="invalid" ? "Not a server account"
            : err.kind==="unavailable" ? "Server unreachable" : "Server login unavailable";
        }
      }
      // 2. Built-in demo accounts (dev / demo builds only)
      if (!DEMO_LOGIN_ENABLED) { setError("Sign-in is unavailable: no server is configured."); return; }
      await new Promise(r=>setTimeout(r,500));
      const u = demoUser();
      if (u) {
        const {password:_,...safe}=u;
        login(safe as any,"tok_"+safe.id,{source:"demo"});
        if (fallbackReason) console.info(`Signed in with a demo account (${fallbackReason}).`);
      }
      else if (MOCK_USERS.find(x=>x.email.toLowerCase()===email.toLowerCase())) setError("Incorrect password.");
      else setError("Account not found. Check your credentials.");
    } finally { setLoad(false); }
  };

  const fill = (e:string,p:string) => { detectRole(e); setPass(p); };
  const airlineColor = AIRLINES.find(a=>a.code===selAirline)?.color||"#0ea5e9";
  const airlineName  = AIRLINES.find(a=>a.code===selAirline)?.name||"Airline";

  return (
    <div className="min-h-screen flex" style={{background:"#050912"}}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 relative overflow-hidden"
        style={{background:"linear-gradient(160deg,#0a1628 0%,#060e1c 100%)"}}>
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{background:`radial-gradient(circle,${mode==="airline"?airlineColor:mode==="retailer"?"#f97316":"#0ea5e9"} 0%,transparent 70%)`}}/>

        <div className="relative z-10 flex-1 flex flex-col p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
              <Plane className="w-6 h-6 text-white"/>
            </div>
            <div>
              <div className="text-lg font-bold text-white">AeroBase India</div>
              <div className="text-xs text-sky-400">Airport Management Platform</div>
            </div>
          </div>

          {/* Mode selector — 3 tabs */}
          <div className="grid grid-cols-3 gap-1.5 mb-6">
            {([
              {k:"all",      l:"Airport\nStaff",    icon:"✈"},
              {k:"retailer", l:"Shop\nOwner",        icon:"🏪"},
              {k:"airline",  l:"Airline\nDept",      icon:"🛫"},
            ] as const).map(({k,l,icon})=>(
              <button key={k} onClick={()=>{setMode(k);setEmail("");setPass("");setDetected(null);setError("");}}
                className="p-2.5 rounded-xl border text-center transition-all"
                style={mode===k
                  ?{background:`${k==="airline"?airlineColor:k==="retailer"?"#f97316":"#0ea5e9"}20`,
                    borderColor:`${k==="airline"?airlineColor:k==="retailer"?"#f97316":"#0ea5e9"}50`}
                  :{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
                <div className="text-lg">{icon}</div>
                <div className="text-xs font-semibold text-white leading-tight whitespace-pre">{l}</div>
              </button>
            ))}
          </div>

          {/* ─── AIRPORT MODE ─── */}
          {mode==="all" && (
            <>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                Your airport.<br/>Your access.<br/>Automatically.
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Enter your email — role detected automatically.
              </p>
              <div className="space-y-1.5 mb-5">
                {[
                  {icon:"✈",from:"Admin email →",   to:"Full airport dashboard"},
                  {icon:"🛡",from:"Security email →",to:"Security ops & CCTV"},
                  {icon:"⚙",from:"Staff email →",   to:"Operations panel"},
                  {icon:"🧳",from:"Passenger email →",to:"Personal travel portal"},
                ].map(({icon,from,to})=>(
                  <div key={from} className="flex items-center gap-2 text-xs">
                    <span className="w-4">{icon}</span>
                    <span className="text-slate-400">{from}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600"/>
                    <span className="text-slate-200 font-medium">{to}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden"
                style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider"
                  style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  Demo Accounts — Click to fill
                </div>
                {AIRPORT_DEMOS.map(({l,e,p,badge,c})=>(
                  <button key={e} onClick={()=>fill(e,p)}
                    className="w-full flex items-center justify-between px-4 py-2.5"
                    onMouseEnter={ev=>(ev.currentTarget.style.background="rgba(255,255,255,0.04)")}
                    onMouseLeave={ev=>(ev.currentTarget.style.background="")}
                    style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div className="text-left">
                      <div className="text-xs font-medium text-slate-200">{l}</div>
                      <div className="text-xs text-slate-600">{e}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{background:`${c}20`,color:c}}>{badge}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─── RETAILER MODE ─── */}
          {mode==="retailer" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🏪</div>
                <div>
                  <h2 className="text-xl font-black text-white">Retailer Portal</h2>
                  <p className="text-xs text-orange-400">Shop Owners & Franchise Partners</p>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {["📊 Sales & revenue analytics","⚠️ Airport authority notices",
                  "⭐ Customer reviews & ratings","📐 Apply for space expansion",
                  "✈ Book flights at retailer rates","🎁 Exclusive retailer perks",
                ].map(t=>(
                  <div key={t} className="flex items-center gap-2 text-xs">
                    <span>{t.split(" ")[0]}</span>
                    <span className="text-slate-300">{t.slice(2)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden"
                style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.2)"}}>
                <div className="px-4 py-2 text-xs font-bold text-orange-400 uppercase"
                  style={{borderBottom:"1px solid rgba(249,115,22,0.1)"}}>
                  Demo Retailer Accounts
                </div>
                {RETAILER_DEMOS.map(({l,e,p,badge,c})=>(
                  <button key={e} onClick={()=>fill(e,p)}
                    className="w-full flex items-center justify-between px-4 py-2.5"
                    onMouseEnter={ev=>(ev.currentTarget.style.background="rgba(249,115,22,0.05)")}
                    onMouseLeave={ev=>(ev.currentTarget.style.background="")}
                    style={{borderBottom:"1px solid rgba(249,115,22,0.06)"}}>
                    <div className="text-left">
                      <div className="text-xs font-medium text-slate-200">{l}</div>
                      <div className="text-xs text-slate-600">{e}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{background:`${c}20`,color:c}}>{badge}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─── AIRLINE MODE ─── */}
          {mode==="airline" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🛫</div>
                <div>
                  <h2 className="text-xl font-black text-white">Airline Department</h2>
                  <p className="text-xs text-slate-400">Select your airline to sign in</p>
                </div>
              </div>

              {/* Airline selector grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {AIRLINES.map(a=>(
                  <button key={a.code}
                    onClick={()=>{ setAirline(a.code); setEmail(""); setPass(""); setDetected(null); }}
                    className="p-2 rounded-xl border text-center transition-all hover:scale-105"
                    style={selAirline===a.code
                      ?{background:`${a.color}20`,borderColor:`${a.color}50`}
                      :{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
                    <div className="text-lg">{a.icon}</div>
                    <div className="text-xs font-bold" style={{color:selAirline===a.code?a.color:"#94a3b8"}}>
                      {a.code}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected airline info */}
              <div className="p-3 rounded-xl mb-4"
                style={{background:`${airlineColor}10`,border:`1px solid ${airlineColor}30`}}>
                <div className="font-bold text-white mb-1">
                  {AIRLINES.find(a=>a.code===selAirline)?.icon} {airlineName} — Delhi Operations
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>✓ Pilot scheduling & roster management</div>
                  <div>✓ Fleet & aircraft status</div>
                  <div>✓ Ticket sales & check-in data</div>
                  <div>✓ Ground crew & baggage operations</div>
                  <div>✓ Revenue & financial reports</div>
                  <div>✓ Gate & terminal allocation</div>
                </div>
              </div>

              {/* Demo accounts for selected airline */}
              <div className="rounded-2xl overflow-hidden"
                style={{background:`${airlineColor}06`,border:`1px solid ${airlineColor}25`}}>
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  style={{color:airlineColor,borderBottom:`1px solid ${airlineColor}15`}}>
                  {airlineName} Demo Accounts
                </div>
                {(AIRLINE_DEMOS[selAirline]||[]).length>0
                  ? (AIRLINE_DEMOS[selAirline]||[]).map(({l,e,p,badge,c})=>(
                    <button key={e} onClick={()=>fill(e,p)}
                      className="w-full flex items-center justify-between px-4 py-2.5"
                      onMouseEnter={ev=>(ev.currentTarget.style.background=`${airlineColor}08`)}
                      onMouseLeave={ev=>(ev.currentTarget.style.background="")}
                      style={{borderBottom:`1px solid ${airlineColor}10`}}>
                      <div className="text-left">
                        <div className="text-xs font-medium text-slate-200">{l}</div>
                        <div className="text-xs text-slate-600">{e}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{background:`${c}20`,color:c}}>{badge}</span>
                    </button>
                  ))
                  : <div className="px-4 py-3 text-xs text-slate-500">
                      No demo accounts for {airlineName} yet.
                    </div>
                }
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
              <Plane className="w-5 h-5 text-white"/>
            </div>
            <div className="text-lg font-bold text-white">AeroBase India</div>
          </div>

          {/* Mobile mode tabs */}
          <div className="lg:hidden grid grid-cols-3 gap-2 mb-5">
            {([
              {k:"all",l:"Airport / Staff",icon:"✈"},
              {k:"retailer",l:"Shop Owner",icon:"🏪"},
              {k:"airline",l:"Airline",icon:"🛫"},
            ] as const).map(({k,l,icon})=>(
              <button key={k} onClick={()=>setMode(k)}
                className="flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all"
                style={mode===k
                  ?{background:"rgba(14,165,233,0.15)",borderColor:"rgba(56,189,248,0.4)",color:"#38bdf8"}
                  :{borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                <span>{icon}</span>{l}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="rounded-3xl p-7"
            style={{
              background:"rgba(15,22,41,0.95)",
              border:`1px solid ${mode==="airline"?`${airlineColor}35`:mode==="retailer"?"rgba(249,115,22,0.25)":"rgba(255,255,255,0.07)"}`,
              backdropFilter:"blur(20px)"
            }}>
            <div className="text-center mb-6">
              <div className="text-3xl mb-1">
                {mode==="airline"
                  ? AIRLINES.find(a=>a.code===selAirline)?.icon||"✈"
                  : mode==="retailer"?"🏪":"✈"}
              </div>
              <h1 className="text-xl font-bold text-white">
                {mode==="airline"
                  ? `${airlineName} Sign In`
                  : mode==="retailer"?"Retailer Sign In":"Welcome back"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {mode==="airline"
                  ? `${airlineName} Department — Delhi IGI`
                  : mode==="retailer"?"Shop owner credentials":"Enter your credentials to continue"}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Email Address</label>
                <input type="email" value={email} onChange={e=>detectRole(e.target.value)} required
                  placeholder={
                    mode==="airline" ? `ops@${selAirline.toLowerCase()}.aerobase.in`
                    : mode==="retailer" ? "shopname@del.aerobase.in"
                    : "your@email.com"
                  }
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none transition-all"
                  style={{
                    background:"rgba(255,255,255,0.06)",
                    border:`1px solid ${mode==="airline"?`${airlineColor}40`:mode==="retailer"?"rgba(249,115,22,0.3)":"rgba(255,255,255,0.1)"}`
                  }}/>
                {detected && (
                  <div className="flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background:mode==="airline"?`${airlineColor}10`:"rgba(14,165,233,0.1)",
                      color:mode==="airline"?airlineColor:"#38bdf8"
                    }}>
                    <CheckCircle className="w-3 h-3"/>Account found: {detected}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Password</label>
                <div className="relative">
                  <input type={showPass?"text":"password"} value={password}
                    onChange={e=>setPass(e.target.value)} required
                    placeholder="Your password"
                    className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm text-white outline-none transition-all"
                    style={{
                      background:"rgba(255,255,255,0.06)",
                      border:`1px solid ${mode==="airline"?`${airlineColor}40`:mode==="retailer"?"rgba(249,115,22,0.3)":"rgba(255,255,255,0.1)"}`
                    }}/>
                  <button type="button" onClick={()=>setShow(p=>!p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                  style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5"}}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all"
                style={{
                  background:loading?"rgba(14,165,233,0.4)":
                    mode==="airline"?`linear-gradient(135deg,${airlineColor},${airlineColor}bb)`:
                    mode==="retailer"?"linear-gradient(135deg,#f97316,#ea580c)":
                    "linear-gradient(135deg,#0ea5e9,#14b8a6)"
                }}>
                {loading
                  ?<><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>Signing in...</>
                  :mode==="airline"
                    ?<><Building2 className="w-4 h-4"/>Sign In to {airlineName}</>
                    :mode==="retailer"
                      ?<><Store className="w-4 h-4"/>Sign In to Retailer Portal</>
                      :<><Lock className="w-4 h-4"/>Sign In<ArrowRight className="w-4 h-4"/></>
                }
              </button>

              <p className="text-center text-xs text-slate-600 pt-1">
                {mode==="airline"
                  ? `${airlineName} airline credentials only`
                  : mode==="retailer"
                    ? "Shop credentials issued by airport authority"
                    : "Role detected automatically from your email"}
              </p>
            </form>
          </div>

          {/* Mobile demo accounts */}
          <div className="lg:hidden mt-4 rounded-2xl overflow-hidden"
            style={{background:"rgba(15,22,41,0.8)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase"
              style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>Demo Accounts</div>
            {(mode==="airline"
              ? (AIRLINE_DEMOS[selAirline]||[])
              : mode==="retailer"
                ? RETAILER_DEMOS
                : AIRPORT_DEMOS
            ).map(({l,e,p})=>(
              <button key={e} onClick={()=>fill(e,p)}
                className="w-full flex items-center justify-between px-4 py-2.5"
                style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div className="text-xs text-slate-300">{l}</div>
                <div className="text-xs text-slate-600 font-mono">{e.split("@")[0]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
