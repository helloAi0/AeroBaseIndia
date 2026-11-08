import { useState } from "react";
import { Star, DollarSign, AlertTriangle,
         CheckCircle, X, MessageSquare, Bell,
         Phone, Mail, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TOOLTIP = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11};

const fmt = (v:number) =>
  v>=100000?`₹${(v/100000).toFixed(1)}L`:v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`;

const INITIAL_STORES = [
  {id:"R001",name:"Duty Free World",   cat:"Duty Free",   terminal:"T3",loc:"Post-Security", revenue:280000,rating:4.2,status:"Open",  sq:450,contact:"9876543210",email:"manager@dutyfreeworld.in",gstin:"07AABCD1234E1Z5",warnings:0,lease:450000,leaseExpiry:"2025-12"},
  {id:"R002",name:"Starbucks",         cat:"F&B",         terminal:"T3",loc:"Level 3",       revenue:95000, rating:4.5,status:"Open",  sq:120,contact:"9876543211",email:"del@starbucks.in",         gstin:"07BAACD2345F2Z6",warnings:0,lease:120000,leaseExpiry:"2026-03"},
  {id:"R003",name:"Punjab Grill",      cat:"F&B",         terminal:"T3",loc:"Level 4",       revenue:145000,rating:4.7,status:"Open",  sq:200,contact:"9876543212",email:"ops@punjabgrill.com",       gstin:"07CABCE3456G3Z7",warnings:0,lease:200000,leaseExpiry:"2025-06"},
  {id:"R004",name:"WH Smith",          cat:"Books/News",  terminal:"T1",loc:"Pre-Security",  revenue:42000, rating:3.9,status:"Open",  sq:80, contact:"9876543213",email:"india@whsmith.co.uk",       gstin:"07DABCF4567H4Z8",warnings:1,lease:80000, leaseExpiry:"2025-09"},
  {id:"R005",name:"Titan Watches",     cat:"Retail",      terminal:"T1",loc:"Departures",    revenue:68000, rating:4.3,status:"Open",  sq:60, contact:"9876543214",email:"airport@titan.co.in",       gstin:"07EABCG5678I5Z9",warnings:0,lease:60000, leaseExpiry:"2026-01"},
  {id:"R006",name:"McDonald's",        cat:"F&B",         terminal:"T2",loc:"Arrivals",      revenue:78000, rating:4.0,status:"Open",  sq:150,contact:"9876543215",email:"franchisee@mcdonalds.in",   gstin:"07FABCH6789J6Z0",warnings:0,lease:150000,leaseExpiry:"2025-12"},
  {id:"R007",name:"Forest Essentials", cat:"Beauty",      terminal:"T3",loc:"Post-Security", revenue:112000,rating:4.6,status:"Open",  sq:90, contact:"9876543216",email:"airport@forestessentials.in",gstin:"07GABCI7890K7Z1",warnings:0,lease:90000, leaseExpiry:"2026-06"},
  {id:"R008",name:"Crossword Books",   cat:"Books/News",  terminal:"T3",loc:"Level 4",       revenue:35000, rating:4.1,status:"Closed",sq:100,contact:"9876543217",email:"airports@crossword.in",      gstin:"07HABCJ8901L8Z2",warnings:2,lease:100000,leaseExpiry:"2024-12"},
  {id:"R009",name:"Indigo Deli",       cat:"F&B",         terminal:"T3",loc:"Level 3",       revenue:89000, rating:4.4,status:"Open",  sq:130,contact:"9876543218",email:"del@indigodeli.com",         gstin:"07IABCK9012M9Z3",warnings:0,lease:130000,leaseExpiry:"2025-08"},
  {id:"R010",name:"Aqua Blue",         cat:"F&B",         terminal:"T2",loc:"Departures",    revenue:8000,  rating:2.1,status:"Warning",sq:40,contact:"9876543219",email:"owner@aquablue.in",          gstin:"07JABCL0123N0Z4",warnings:3,lease:40000, leaseExpiry:"2024-06"},
];

type Store = typeof INITIAL_STORES[0];

const monthly = [
  {m:"Jan",retail:820000,fnb:640000,dutyfree:380000},
  {m:"Feb",retail:780000,fnb:590000,dutyfree:340000},
  {m:"Mar",retail:950000,fnb:720000,dutyfree:420000},
  {m:"Apr",retail:890000,fnb:680000,dutyfree:395000},
  {m:"May",retail:1020000,fnb:780000,dutyfree:460000},
  {m:"Jun",retail:1150000,fnb:890000,dutyfree:520000},
];

const catData = [
  {name:"Duty Free",value:280000,color:"#0ea5e9"},
  {name:"F&B",      value:407000,color:"#14b8a6"},
  {name:"Retail",   value:144000,color:"#8b5cf6"},
  {name:"Beauty",   value:112000,color:"#f59e0b"},
  {name:"Books",    value:77000, color:"#22c55e"},
];

const STATUS_CFG: Record<string,string> = {
  "Open":   "bg-green-500/15 text-green-400 border-green-500/20",
  "Closed": "bg-red-500/15 text-red-400 border-red-500/20",
  "Warning":"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Suspended":"bg-red-700/15 text-red-300 border-red-700/20",
};

const CAT_COLOR: Record<string,string> = {
  "Duty Free":"sky","F&B":"teal","Retail":"purple","Beauty":"yellow","Books/News":"green",
};

export function RetailPage() {
  const [stores,   setStores]  = useState(INITIAL_STORES);
  const [search,   setSearch]  = useState("");
  const [cat,      setCat]     = useState("All");
  const [selected, setSelected]= useState<Store|null>(null);
  const [tab,      setTab]     = useState<"stores"|"applications">("stores");
  const [msgModal, setMsgModal]= useState<Store|null>(null);
  const [msgType,  setMsgType] = useState<"warning"|"notice"|"close">("warning");
  const [msgText,  setMsgText] = useState("");
  const [msgSent,  setMsgSent] = useState(false);
  const [apps,     setApps]    = useState([
    {id:"APP001",name:"Domino's Pizza",      type:"F&B",        sqft:180,terminal:"T3",rent:180000,status:"Pending",  submitted:"2024-04-10",contact:"franchise@dominos.in",  reason:"High footfall at T3 food court area"},
    {id:"APP002",name:"Lenskart",            type:"Retail",     sqft:60, terminal:"T2",rent:60000, status:"Review",   submitted:"2024-04-12",contact:"airports@lenskart.com",  reason:"Optical retail — no competition in airport"},
    {id:"APP003",name:"Fabindia",            type:"Retail",     sqft:200,terminal:"T1",rent:200000,status:"Approved", submitted:"2024-04-01",contact:"corporate@fabindia.com", reason:"Ethnic wear for international passengers"},
    {id:"APP004",name:"Chaayos",             type:"F&B",        sqft:80, terminal:"T2",rent:80000, status:"Pending",  submitted:"2024-04-15",contact:"ops@chaayos.com",         reason:"Premium chai café concept"},
    {id:"APP005",name:"Nykaa",              type:"Beauty",     sqft:90, terminal:"T3",rent:90000, status:"Rejected", submitted:"2024-03-28",contact:"retail@nykaa.com",         reason:"Beauty & cosmetics — duty free competition"},
  ]);

  const cats = ["All","Duty Free","F&B","Retail","Beauty","Books/News"];
  const filtered = stores.filter(s=>
    (cat==="All"||s.cat===cat)&&
    (!search||s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = stores.reduce((s,r)=>s+r.revenue,0);
  const openStores   = stores.filter(s=>s.status==="Open").length;
  const avgRating    = (stores.reduce((s,r)=>s+r.rating,0)/stores.length).toFixed(1);
  const warningCount = stores.filter(s=>s.warnings>0).length;

  const toggleStore = (id:string, newStatus:string) => {
    setStores(prev=>prev.map(s=>s.id===id?{...s,status:newStatus}:s));
    if(selected?.id===id) setSelected(prev=>prev?{...prev,status:newStatus}:null);
  };

  const issueWarning = (id:string) => {
    setStores(prev=>prev.map(s=>s.id===id?{...s,warnings:s.warnings+1,status:s.warnings>=2?"Warning":s.status}:s));
    if(selected?.id===id) setSelected(prev=>prev?{...prev,warnings:prev.warnings+1}:null);
  };

  const sendMessage = () => {
    if(!msgModal) return;
    if(msgType==="warning") issueWarning(msgModal.id);
    if(msgType==="close") toggleStore(msgModal.id,"Suspended");
    setMsgSent(true);
    setTimeout(()=>{ setMsgModal(null); setMsgSent(false); setMsgText(""); },1500);
  };

  const approveApp = (id:string, approved:boolean) =>
    setApps(prev=>prev.map(a=>a.id===id?{...a,status:approved?"Approved":"Rejected"}:a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Retail & Concessions</h1>
          <p className="text-slate-400 text-sm">Airport shops, F&B outlets & lease management</p>
        </div>
        <div className="flex gap-2">
          {warningCount>0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",color:"#fbbf24"}}>
              <AlertTriangle className="w-4 h-4"/>{warningCount} shops need attention
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Monthly Revenue",value:fmt(totalRevenue),icon:<DollarSign className="w-5 h-5"/>,color:"green"},
          {label:"Open Outlets",   value:openStores,        icon:<CheckCircle className="w-5 h-5"/>,color:"sky"},
          {label:"Avg Rating",     value:avgRating,         icon:<Star className="w-5 h-5"/>,       color:"yellow"},
          {label:"Alerts",         value:warningCount,      icon:<AlertTriangle className="w-5 h-5"/>,color:"red"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Monthly Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{left:-20}}>
              <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
              <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
              <Bar dataKey="retail"   fill="#8b5cf6" radius={[3,3,0,0]} name="Retail"    stackId="a"/>
              <Bar dataKey="fnb"      fill="#14b8a6" radius={[3,3,0,0]} name="F&B"       stackId="a"/>
              <Bar dataKey="dutyfree" fill="#0ea5e9" radius={[3,3,0,0]} name="Duty Free" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-3">Revenue Split</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                dataKey="value" stroke="none">
                {catData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {catData.map(({name,value,color})=>(
              <div key={name} className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:color}}/>
                  <span className="text-slate-400">{name}</span>
                </div>
                <span className="text-white font-mono">{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {([{k:"stores",l:"🏪 Manage Stores"},{k:"applications",l:`📋 Applications (${apps.filter(a=>a.status==="Pending"||a.status==="Review").length})`}] as const).map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab===k?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* STORES TAB */}
      {tab==="stores" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-500"/>
              <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                placeholder="Search stores..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {cats.map(c=>(
                <button key={c} onClick={()=>setCat(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    cat===c?"bg-sky-500 text-white border-sky-500":"bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
            {/* Table */}
            <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selected?"xl:col-span-2":""}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase">
                    {["Store","Category","Terminal","Revenue","Rating","Warnings","Status","Actions"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left border-b border-navy-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r=>(
                    <tr key={r.id} onClick={()=>setSelected(selected?.id===r.id?null:r)}
                      className={`border-b border-navy-700/50 cursor-pointer transition-all ${
                        selected?.id===r.id?"bg-sky-500/10":
                        r.warnings>=3?"bg-red-500/5":
                        r.warnings>0?"bg-yellow-500/3":"hover:bg-navy-700/30"}`}>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${CAT_COLOR[r.cat]||"slate"}-500/15 text-${CAT_COLOR[r.cat]||"slate"}-400`}>
                          {r.cat}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{r.terminal}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-white">{fmt(r.revenue)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star className={`w-3.5 h-3.5 ${r.rating>=4?"text-yellow-400 fill-yellow-400":r.rating>=3?"text-yellow-600":"text-red-400"}`}/>
                          <span className={r.rating<3?"text-red-400 font-bold":"text-white"}>{r.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.warnings>0
                          ? <span className="text-xs font-bold text-red-400">⚠️ {r.warnings} warning{r.warnings!==1?"s":""}</span>
                          : <span className="text-xs text-slate-500">None</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_CFG[r.status]||STATUS_CFG["Closed"]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5" onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setMsgModal(r)}
                            className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/15 transition-colors"
                            title="Send notice/warning">
                            <Bell className="w-3.5 h-3.5"/>
                          </button>
                          {r.status!=="Suspended" ? (
                            <button onClick={()=>toggleStore(r.id,r.status==="Open"?"Closed":"Open")}
                              className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${
                                r.status==="Open"
                                  ?"bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25"
                                  :"bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/25"}`}>
                              {r.status==="Open"?"Close":"Open"}
                            </button>
                          ) : (
                            <button onClick={()=>toggleStore(r.id,"Open")}
                              className="text-xs px-2 py-1 rounded-lg border bg-sky-500/15 text-sky-400 border-sky-500/20 hover:bg-sky-500/25">
                              Reinstate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
                <div className="flex justify-between">
                  <h2 className="font-semibold text-white">Store Management</h2>
                  <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                </div>

                <div className="p-4 bg-navy-700/50 rounded-xl text-center">
                  <div className="text-xl font-bold text-white mb-0.5">{selected.name}</div>
                  <div className={`text-xs px-2.5 py-1 rounded-full border w-fit mx-auto ${STATUS_CFG[selected.status]||STATUS_CFG["Closed"]}`}>
                    {selected.status}
                  </div>
                </div>

                {/* Store info */}
                <div className="space-y-2">
                  {[
                    {l:"Revenue",      v:fmt(selected.revenue)},
                    {l:"Rating",       v:`${selected.rating}/5`},
                    {l:"Floor Area",   v:`${selected.sq}m²`},
                    {l:"Terminal",     v:selected.terminal},
                    {l:"Location",     v:selected.loc},
                    {l:"Monthly Rent", v:fmt(selected.lease)},
                    {l:"Lease Expiry", v:selected.leaseExpiry},
                    {l:"GSTIN",        v:selected.gstin},
                  ].map(({l,v})=>(
                    <div key={l} className="flex justify-between p-2.5 bg-navy-700/40 rounded-xl">
                      <span className="text-xs text-slate-400">{l}</span>
                      <span className="text-xs font-medium text-white">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {selected.warnings>0 && (
                  <div className="p-3 rounded-xl"
                    style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}>
                    <div className="text-sm font-bold text-red-300 mb-1">⚠️ {selected.warnings} active warning{selected.warnings!==1?"s":""}</div>
                    <div className="text-xs text-red-400/70">
                      {selected.warnings>=3
                        ?"Shop at risk of suspension. Issue closure notice immediately."
                        :"Follow up with store management. Another violation may lead to closure."}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Contact</div>
                  <a href={`tel:${selected.contact}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <Phone className="w-4 h-4 text-sky-400"/>{selected.contact}
                  </a>
                  <a href={`mailto:${selected.email}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <Mail className="w-4 h-4 text-sky-400"/>{selected.email}
                  </a>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Actions</div>
                  <button onClick={()=>{setMsgModal(selected);setMsgType("warning");}}
                    className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all"
                    style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",color:"#fbbf24"}}>
                    <AlertTriangle className="w-4 h-4"/>Issue Warning Notice
                  </button>
                  <button onClick={()=>{setMsgModal(selected);setMsgType("notice");}}
                    className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all"
                    style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",color:"#38bdf8"}}>
                    <MessageSquare className="w-4 h-4"/>Send Notice / Email
                  </button>
                  {selected.status!=="Suspended" ? (
                    <button onClick={()=>{setMsgModal(selected);setMsgType("close");}}
                      className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all"
                      style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#f87171"}}>
                      <X className="w-4 h-4"/>Suspend / Force Close
                    </button>
                  ) : (
                    <button onClick={()=>toggleStore(selected.id,"Open")}
                      className="w-full flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                      style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",color:"#4ade80"}}>
                      <CheckCircle className="w-4 h-4"/>Reinstate Shop
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab==="applications" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border text-sm"
            style={{background:"rgba(14,165,233,0.05)",borderColor:"rgba(56,189,248,0.2)"}}>
            <div className="font-semibold text-sky-300 mb-1">📋 New Shop Applications</div>
            <div className="text-slate-400">
              Retailers apply through the platform to open shops at your airport.
              Review their proposal, location preference, and approve or reject below.
            </div>
          </div>

          <div className="space-y-4">
            {apps.map(app=>{
              const statusColor = app.status==="Approved"?"#22c55e":app.status==="Rejected"?"#ef4444":app.status==="Review"?"#8b5cf6":"#f59e0b";
              return (
                <div key={app.id} className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-white text-lg">{app.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{app.id} · Applied {app.submitted}</div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-bold"
                        style={{background:`${statusColor}20`,color:statusColor}}>
                        {app.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
                      {[
                        {l:"Category",     v:app.type},
                        {l:"Requested Area",v:`${app.sqft} sq ft`},
                        {l:"Terminal",     v:app.terminal},
                        {l:"Monthly Rent", v:fmt(app.rent)},
                      ].map(({l,v})=>(
                        <div key={l} className="p-2.5 rounded-xl text-center"
                          style={{background:"rgba(255,255,255,0.03)"}}>
                          <div className="text-xs text-slate-500">{l}</div>
                          <div className="font-bold text-white text-sm">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl mb-3 text-sm text-slate-300 italic"
                      style={{background:"rgba(255,255,255,0.02)"}}>
                      "{app.reason}"
                    </div>
                    <div className="flex items-center justify-between">
                      <a href={`mailto:${app.contact}`} className="text-xs text-sky-400 flex items-center gap-1 hover:text-sky-300">
                        <Mail className="w-3 h-3"/>{app.contact}
                      </a>
                      {(app.status==="Pending"||app.status==="Review") && (
                        <div className="flex gap-2">
                          <button onClick={()=>approveApp(app.id,false)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.2)"}}>
                            <X className="w-3.5 h-3.5"/>Reject
                          </button>
                          <button onClick={()=>approveApp(app.id,true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{background:"rgba(34,197,94,0.12)",color:"#4ade80",border:"1px solid rgba(34,197,94,0.2)"}}>
                            <CheckCircle className="w-3.5 h-3.5"/>Approve & Allocate Space
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message / Warning Modal */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)"}}>
          <div className="w-full max-w-md rounded-3xl p-6 border"
            style={{background:"#0f1629",borderColor:"rgba(14,165,233,0.3)"}}>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-white">
                {msgType==="warning"?"⚠️ Issue Warning":msgType==="close"?"🚫 Force Close Shop":"📢 Send Notice"}
              </h3>
              <button onClick={()=>setMsgModal(null)}><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            <div className="p-3 rounded-xl mb-4" style={{background:"rgba(255,255,255,0.03)"}}>
              <div className="font-semibold text-white">{msgModal.name}</div>
              <div className="text-xs text-slate-400">{msgModal.terminal} · {msgModal.contact}</div>
            </div>

            {msgType==="warning"||msgType==="notice" ? (
              <div className="space-y-2 mb-4">
                {[
                  msgType==="warning"
                    ? `Dear ${msgModal.name} Management, this is an official warning regarding customer complaints and hygiene standards at your ${msgModal.terminal} outlet. Immediate improvement is required within 7 days or further action will be taken. — Airport Authority`
                    : `Dear ${msgModal.name}, please be advised that your current rating of ${msgModal.rating}/5 is below airport minimum standards. We request you to address customer feedback immediately. — Airport Authority`,
                  `${msgModal.name}: Your GST filing for Q1 is overdue. Please submit within 48 hours to avoid shop suspension. — Airport Compliance Team`,
                  `Notice: Your store operating hours at ${msgModal.terminal} are not complying with airport regulations. Please adhere to mandated hours. — Airport Admin`,
                ].map((t,i)=>(
                  <button key={i} onClick={()=>setMsgText(t)}
                    className={`w-full text-left p-3 rounded-xl text-xs border transition-all ${
                      msgText===t?"border-sky-500/50 bg-sky-500/10 text-sky-300":"border-navy-600 bg-navy-700/50 text-slate-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl mb-4"
                style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)"}}>
                <div className="font-bold text-red-300 mb-1">⚠️ Force Close — Serious Action</div>
                <div className="text-xs text-red-400/80">
                  This will immediately suspend {msgModal.name}'s operations at {msgModal.terminal}.
                  Their access will be revoked and they will be notified via email and SMS.
                </div>
              </div>
            )}

            <textarea value={msgText} onChange={e=>setMsgText(e.target.value)} rows={3}
              placeholder={msgType==="close"?"Reason for closure...":"Custom message..."}
              className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none mb-4"/>

            {msgSent ? (
              <div className="text-center text-green-400 font-semibold py-3">
                ✓ {msgType==="warning"?"Warning issued":"Notification sent"} successfully
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={sendMessage}
                  className="py-3 rounded-xl font-bold text-sm text-white"
                  style={{background:msgType==="close"?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                  {msgType==="warning"?"Issue Warning":msgType==="close"?"Confirm Closure":"Send Notice"}
                </button>
                <button onClick={()=>setMsgModal(null)}
                  className="py-3 rounded-xl text-sm text-slate-400 border border-slate-700">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
