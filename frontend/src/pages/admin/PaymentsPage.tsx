import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { CreditCard, TrendingUp, TrendingDown, Plus, Search,
         CheckCircle, Clock, AlertTriangle, X, FileText,
         Plane, Building2, Users,
         Download, ArrowRight } from "lucide-react";

// ── Airport financial data ───────────────────────────────────────────────────
const VENDOR_BILLS = [
  {id:"BILL-001",vendor:"Tata Projects Ltd",    category:"Construction",  amount:28500000,status:"Paid",    date:"2024-04-15",due:"2024-04-15",desc:"T3 Expansion Phase 2 — Milestone 3"},
  {id:"BILL-002",vendor:"Celebi Ground Svc",    category:"Operations",    amount:6800000, status:"Paid",    date:"2024-04-10",due:"2024-04-10",desc:"Ground handling services — March 2024"},
  {id:"BILL-003",vendor:"CISF HQ Delhi",        category:"Security",      amount:12000000,status:"Paid",    date:"2024-04-01",due:"2024-04-01",desc:"Security services Q1 2024"},
  {id:"BILL-004",vendor:"Siemens India",        category:"Maintenance",   amount:4200000, status:"Pending", date:"2024-04-20",due:"2024-05-01",desc:"BHS conveyor system overhaul"},
  {id:"BILL-005",vendor:"IndiGo Airlines",      category:"Revenue Share", amount:-8400000,status:"Received",date:"2024-04-18",due:"2024-04-18",desc:"Landing fees + pax charges — April"},
  {id:"BILL-006",vendor:"Air India",            category:"Revenue Share", amount:-12600000,status:"Received",date:"2024-04-15",due:"2024-04-15",desc:"Landing + pax + cargo handling"},
  {id:"BILL-007",vendor:"Sodexo Facilities",    category:"Housekeeping",  amount:2100000, status:"Pending", date:"2024-04-22",due:"2024-05-05",desc:"Cleaning & facility management"},
  {id:"BILL-008",vendor:"Staff Salaries",       category:"Payroll",       amount:45000000,status:"Paid",    date:"2024-04-01",due:"2024-04-01",desc:"April 2024 payroll — 1240 staff"},
  {id:"BILL-009",vendor:"L&T Infrastructure",  category:"Construction",  amount:38000000,status:"Overdue", date:"2024-04-05",due:"2024-04-15",desc:"Runway 29R resurfacing project"},
  {id:"BILL-010",vendor:"Emirates",             category:"Revenue Share", amount:-18000000,status:"Received",date:"2024-04-12",due:"2024-04-12",desc:"International route charges — April"},
  {id:"BILL-011",vendor:"Airtel India",         category:"IT/Telecom",    amount:380000,  status:"Paid",    date:"2024-04-08",due:"2024-04-08",desc:"Airport WiFi & telecom services"},
  {id:"BILL-012",vendor:"Oracle India",         category:"IT/Software",   amount:1200000, status:"Pending", date:"2024-04-25",due:"2024-05-10",desc:"AMS software license renewal"},
  {id:"BILL-013",vendor:"Duty Free World",      category:"Concession",    amount:-3200000,status:"Received",date:"2024-04-20",due:"2024-04-20",desc:"Monthly concession fee + rev share"},
  {id:"BILL-014",vendor:"Indira Gandhi Trust",  category:"Regulatory",    amount:5600000, status:"Paid",    date:"2024-04-01",due:"2024-04-01",desc:"AERA regulatory charges Q1"},
  {id:"BILL-015",vendor:"SpiceJet",             category:"Revenue Share", amount:-4800000,status:"Pending", date:"2024-04-22",due:"2024-04-30",desc:"April pax + landing fees"},
];

const SALARY_DATA = [
  {dept:"Operations",    count:285, basic:18000, hra:7200, total:7268250, paid:true},
  {dept:"Security",      count:420, basic:22000, hra:8800, total:13482000,paid:true},
  {dept:"Engineering",   count:180, basic:35000, hra:14000,total:8910000, paid:true},
  {dept:"Admin & HR",    count:95,  basic:28000, hra:11200,total:3724200, paid:true},
  {dept:"Ground Crew",   count:160, basic:20000, hra:8000, total:4512000, paid:true},
  {dept:"Medical",       count:45,  basic:42000, hra:16800,total:2646750, paid:true},
  {dept:"IT & Systems",  count:55,  basic:55000, hra:22000,total:4235250, paid:false},
];

const CONSTRUCTION = [
  {project:"T3 International Gates Expansion", contractor:"Tata Projects",  budget:450000000,spent:312000000,pct:69,status:"Active"},
  {project:"Runway 29R Resurfacing",           contractor:"L&T Infra",      budget:180000000,spent:98000000, pct:54,status:"Delayed"},
  {project:"Smart Parking System P4",          contractor:"Siemens",        budget:85000000, spent:85000000, pct:100,status:"Complete"},
  {project:"T1 Departure Hall Renovation",     contractor:"Shapoorji",      budget:120000000,spent:24000000, pct:20,status:"Planning"},
  {project:"Solar Power Installation",         contractor:"Adani Green",    budget:220000000,spent:165000000,pct:75,status:"Active"},
];

const fmt = (v:number,abs=false) => {
  const n = abs?Math.abs(v):v;
  if(Math.abs(n)>=10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
  if(Math.abs(n)>=100000)   return `₹${(n/100000).toFixed(1)}L`;
  return `₹${(n/1000).toFixed(0)}K`;
};

// ── Ticket booking data ──────────────────────────────────────────────────────
const AVAILABLE_FLIGHTS = [
  {id:"F1", flight:"AI-101",  airline:"Air India",   from:"DEL",to:"BOM", dep:"10:30",arr:"12:40",date:"2024-04-28",
   prices:{economy:4299,business:12999,first:28999}, seats:{economy:42,business:8,first:2}, stops:"Non-stop"},
  {id:"F2", flight:"6E-2341", airline:"IndiGo",      from:"DEL",to:"BLR", dep:"11:00",arr:"13:15",date:"2024-04-28",
   prices:{economy:3199,business:9499,first:0},       seats:{economy:28,business:4,first:0}, stops:"Non-stop"},
  {id:"F3", flight:"UK-925",  airline:"Vistara",     from:"DEL",to:"HYD", dep:"09:45",arr:"11:55",date:"2024-04-28",
   prices:{economy:3799,business:11499,first:0},      seats:{economy:35,business:6,first:0}, stops:"Non-stop"},
  {id:"F4", flight:"AI-819",  airline:"Air India",   from:"DEL",to:"LHR", dep:"13:45",arr:"19:15",date:"2024-04-28",
   prices:{economy:32999,business:89999,first:189999},seats:{economy:18,business:5,first:1}, stops:"Non-stop"},
  {id:"F5", flight:"EK-511",  airline:"Emirates",    from:"DEL",to:"DXB", dep:"16:00",arr:"18:30",date:"2024-04-28",
   prices:{economy:18999,business:54999,first:124999},seats:{economy:55,business:12,first:4},stops:"Non-stop"},
  {id:"F6", flight:"QP-1401", airline:"Akasa Air",   from:"DEL",to:"JAI", dep:"15:30",arr:"16:15",date:"2024-04-28",
   prices:{economy:1899,business:0,first:0},          seats:{economy:62,business:0,first:0}, stops:"Non-stop"},
];

const FOOD_MENU = [
  {id:"M1", outlet:"KFC",            item:"Zinger Burger Meal",  price:349, cat:"Fast Food",  time:"15 min",img:"🍔"},
  {id:"M2", outlet:"KFC",            item:"Hot & Crispy Bucket", price:599, cat:"Fast Food",  time:"20 min",img:"🍗"},
  {id:"M3", outlet:"Starbucks",      item:"Caramel Latte + Muffin",price:489,cat:"Café",      time:"10 min",img:"☕"},
  {id:"M4", outlet:"Starbucks",      item:"Frappuccino",         price:349, cat:"Café",        time:"8 min", img:"🧋"},
  {id:"M5", outlet:"Punjab Grill",   item:"Dal Makhani Thali",   price:649, cat:"Indian",     time:"25 min",img:"🍛"},
  {id:"M6", outlet:"Punjab Grill",   item:"Butter Chicken",      price:549, cat:"Indian",     time:"25 min",img:"🍖"},
  {id:"M7", outlet:"McDonald's",     item:"McVeggie Meal",       price:279, cat:"Fast Food",  time:"12 min",img:"🍟"},
  {id:"M8", outlet:"McDonald's",     item:"McChicken Burger",    price:199, cat:"Fast Food",  time:"12 min",img:"🍔"},
  {id:"M9", outlet:"Indigo Deli",    item:"Club Sandwich",       price:399, cat:"Café",       time:"15 min",img:"🥪"},
  {id:"M10",outlet:"Indigo Deli",    item:"Fresh Juice + Cookie",price:249, cat:"Café",       time:"8 min", img:"🥤"},
];

// ── ADMIN PAYMENT VIEW ───────────────────────────────────────────────────────
function AdminPaymentView() {
  const [tab,     setTab]    = useState<"bills"|"payroll"|"construction"|"summary">("summary");
  const [search,  setSearch] = useState("");
  const [catFilt, setCat]    = useState("All");
  const [showNew, setShowNew]= useState(false);
  const [newBill, setNewBill]= useState({vendor:"",category:"Operations",amount:"",desc:"",due:""});

  const income  = VENDOR_BILLS.filter(b=>b.amount<0).reduce((s,b)=>s+Math.abs(b.amount),0);
  const expense = VENDOR_BILLS.filter(b=>b.amount>0).reduce((s,b)=>s+b.amount,0);
  const pending = VENDOR_BILLS.filter(b=>b.status==="Pending").length;
  const overdue = VENDOR_BILLS.filter(b=>b.status==="Overdue").length;
  const totalSalary = SALARY_DATA.reduce((s,d)=>s+d.total,0);
  const conBudget   = CONSTRUCTION.reduce((s,c)=>s+c.budget,0);
  const conSpent    = CONSTRUCTION.reduce((s,c)=>s+c.spent,0);

  const cats = ["All","Construction","Operations","Security","Payroll","Revenue Share","Maintenance","IT/Telecom","Concession","Regulatory","Housekeeping"];
  const filtered = VENDOR_BILLS.filter(b=>
    (catFilt==="All"||b.category===catFilt) &&
    (!search||b.vendor.toLowerCase().includes(search.toLowerCase())||b.id.toLowerCase().includes(search.toLowerCase()))
  );

  const STATUS_CFG: Record<string,string> = {
    "Paid":    "bg-green-500/15 text-green-400 border-green-500/20",
    "Pending": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    "Received":"bg-sky-500/15 text-sky-400 border-sky-500/20",
    "Overdue": "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Operations</h1>
          <p className="text-slate-400 text-sm">Airport bills, payroll, revenue & construction — Delhi IGI</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
          <Plus className="w-4 h-4"/>Create Bill / Order
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {label:"Revenue Received",   value:fmt(income),       color:"#22c55e",icon:<TrendingUp className="w-5 h-5"/>,sub:"This month"},
          {label:"Total Expenses",     value:fmt(expense),      color:"#ef4444",icon:<TrendingDown className="w-5 h-5"/>,sub:"Bills & ops"},
          {label:"Net Position",       value:fmt(income-expense),color:income>expense?"#22c55e":"#ef4444",icon:<CreditCard className="w-5 h-5"/>,sub:"Surplus/deficit"},
          {label:"Pending Bills",      value:String(pending),   color:"#f59e0b",icon:<Clock className="w-5 h-5"/>,sub:"Awaiting payment"},
          {label:"Overdue",            value:String(overdue),   color:"#ef4444",icon:<AlertTriangle className="w-5 h-5"/>,sub:"Past due date"},
        ].map(({label,value,color,icon,sub})=>(
          <div key={label} className="rounded-2xl p-5 border"
            style={{background:`${color}08`,borderColor:`${color}20`}}>
            <div className="mb-2" style={{color}}>{icon}</div>
            <div className="text-2xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Add bill modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)"}}>
          <div className="w-full max-w-lg rounded-3xl p-6 border"
            style={{background:"#0f1629",borderColor:"rgba(14,165,233,0.3)"}}>
            <div className="flex justify-between mb-5">
              <h2 className="font-bold text-white text-lg">Create Bill / Purchase Order</h2>
              <button onClick={()=>setShowNew(false)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="space-y-3">
              {[
                {l:"Vendor / Supplier Name", k:"vendor", ph:"e.g. L&T Infrastructure"},
                {l:"Description",            k:"desc",   ph:"e.g. Runway resurfacing — Phase 2"},
                {l:"Amount (₹)",             k:"amount", ph:"e.g. 5000000"},
                {l:"Due Date",               k:"due",    ph:"YYYY-MM-DD"},
              ].map(({l,k,ph})=>(
                <div key={k}>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">{l}</label>
                  <input value={(newBill as any)[k]} onChange={e=>setNewBill({...newBill,[k]:e.target.value})}
                    placeholder={ph}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Category</label>
                <select value={newBill.category} onChange={e=>setNewBill({...newBill,category:e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                  {cats.filter(c=>c!=="All").map(c=><option key={c} style={{background:"#0f1629"}}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={()=>setShowNew(false)}
                className="py-3 rounded-xl font-bold text-sm text-white"
                style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                ✓ Create Bill
              </button>
              <button onClick={()=>setShowNew(false)}
                className="py-3 rounded-xl text-sm text-slate-400 border border-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit max-w-full overflow-x-auto"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {([
          {k:"summary",      l:"📊 Summary"},
          {k:"bills",        l:"🧾 Bills & Revenue"},
          {k:"payroll",      l:"👥 Payroll"},
          {k:"construction", l:"🏗 Projects"},
        ] as const).map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab===k?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {tab==="summary" && (
        <div className="space-y-5">
          {/* P&L card */}
          <div className="rounded-2xl border p-6" style={{background:"rgba(14,165,233,0.04)",borderColor:"rgba(14,165,233,0.15)"}}>
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400"/>Monthly P&L — April 2024
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {[
                {label:"Total Revenue",   items:[
                  {n:"Landing & Pax Fees",  v:43800000},
                  {n:"Concession Revenue",  v:14200000},
                  {n:"Parking Revenue",     v:3800000},
                  {n:"Cargo Handling",      v:6900000},
                ],color:"#22c55e"},
                {label:"Operating Expenses",items:[
                  {n:"Staff Payroll",       v:45000000},
                  {n:"Ground Handling",     v:6800000},
                  {n:"Security (CISF)",     v:12000000},
                  {n:"Maintenance",         v:4200000},
                ],color:"#ef4444"},
                {label:"Capital Expenditure",items:[
                  {n:"T3 Expansion",        v:28500000},
                  {n:"Runway Project",      v:38000000},
                  {n:"IT Systems",          v:1580000},
                  {n:"Regulatory",          v:5600000},
                ],color:"#f59e0b"},
              ].map(({label,items,color})=>(
                <div key={label} className="p-4 rounded-xl border"
                  style={{background:`${color}06`,borderColor:`${color}15`}}>
                  <div className="font-semibold mb-3" style={{color}}>{label}</div>
                  <div className="space-y-2">
                    {items.map(({n,v})=>(
                      <div key={n} className="flex justify-between text-sm">
                        <span className="text-slate-400">{n}</span>
                        <span className="font-mono font-bold text-white">{fmt(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3" style={{borderColor:`${color}20`}}>
                    <div className="flex justify-between font-bold">
                      <span style={{color}}>Total</span>
                      <span style={{color}}>{fmt(items.reduce((s,i)=>s+i.v,0))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue alert */}
          {overdue>0 && (
            <div className="p-4 rounded-xl border flex items-center gap-3"
              style={{background:"rgba(239,68,68,0.08)",borderColor:"rgba(239,68,68,0.25)"}}>
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0"/>
              <div>
                <div className="font-semibold text-red-300">Overdue Payments — Immediate Action Required</div>
                {VENDOR_BILLS.filter(b=>b.status==="Overdue").map(b=>(
                  <div key={b.id} className="text-xs text-red-400/80 mt-0.5">
                    {b.vendor} — {fmt(b.amount,true)} (due {b.due})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Construction overview */}
          <div className="rounded-2xl border p-5" style={{background:"#0a0e1a",borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400"/>Construction Projects Overview
            </h2>
            <div className="grid xl:grid-cols-2 gap-3">
              {CONSTRUCTION.map(c=>{
                const color = c.status==="Delayed"?"#ef4444":c.status==="Complete"?"#22c55e":c.status==="Planning"?"#8b5cf6":"#0ea5e9";
                return (
                  <div key={c.project} className="p-4 rounded-xl border"
                    style={{background:`${color}06`,borderColor:`${color}20`}}>
                    <div className="flex justify-between mb-2">
                      <div className="font-semibold text-white text-sm">{c.project}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{background:`${color}20`,color}}>{c.status}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{c.contractor}</div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Budget: {fmt(c.budget)}</span>
                      <span style={{color}}>{c.pct}% complete · {fmt(c.spent)} spent</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                      <div className="h-full rounded-full" style={{width:`${c.pct}%`,background:color}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-xl flex flex-wrap gap-x-3 gap-y-1 justify-between text-sm"
              style={{background:"rgba(255,255,255,0.03)"}}>
              <span className="text-slate-400">Total Construction Budget</span>
              <span className="font-black text-white">{fmt(conBudget)}</span>
              <span className="text-slate-400">Spent so far</span>
              <span className="font-black text-yellow-400">{fmt(conSpent)}</span>
              <span className="text-slate-400">Remaining</span>
              <span className="font-black text-green-400">{fmt(conBudget-conSpent)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BILLS & REVENUE ── */}
      {tab==="bills" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border flex-1 max-w-xs"
              style={{background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)"}}>
              <Search className="w-4 h-4 text-slate-500"/>
              <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                placeholder="Search vendor or bill ID..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["All","Construction","Operations","Payroll","Revenue Share","Security"].map(c=>(
                <button key={c} onClick={()=>setCat(c)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={catFilt===c
                    ?{background:"#0ea5e9",color:"white",borderColor:"#0ea5e9"}
                    :{background:"transparent",color:"#64748b",borderColor:"rgba(255,255,255,0.08)"}}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{borderColor:"#1e2d4d",background:"#080d18"}}>
            <div className="table-scroll"><table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Bill ID","Vendor","Category","Description","Amount","Due Date","Status","Action"].map(h=>(
                    <th key={h} className="px-4 py-3.5 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b=>(
                  <tr key={b.id} style={{borderBottom:"1px solid rgba(30,45,77,0.5)"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-sky-300">{b.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-white">{b.vendor}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{b.category}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 max-w-48 truncate">{b.desc}</td>
                    <td className="px-4 py-3.5">
                      <span className={`font-black font-mono text-sm ${b.amount<0?"text-green-400":"text-white"}`}>
                        {b.amount<0?"+":""}{fmt(Math.abs(b.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400">{b.due}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_CFG[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {(b.status==="Pending"||b.status==="Overdue") && (
                        <button className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/25 transition-colors">
                          Pay Now
                        </button>
                      )}
                      {b.status==="Received" && (
                        <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                          <Download className="w-3 h-3"/>Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ── PAYROLL ── */}
      {tab==="payroll" && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-white">Staff Payroll — April 2024</h2>
                <p className="text-xs text-slate-500">Total staff: {SALARY_DATA.reduce((s,d)=>s+d.count,0)} · Total: {fmt(totalSalary)}</p>
              </div>
              <button className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl border transition-all"
                style={{borderColor:"rgba(14,165,233,0.3)",color:"#38bdf8",background:"rgba(14,165,233,0.06)"}}>
                <Download className="w-3.5 h-3.5"/>Download Payslips
              </button>
            </div>
            <div className="table-scroll"><table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Department","Headcount","Basic Salary","HRA","Total Payout","Status"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SALARY_DATA.map(d=>(
                  <tr key={d.dept} style={{borderBottom:"1px solid rgba(30,45,77,0.5)"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-400"/>
                        <span className="font-semibold text-white">{d.dept}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{d.count}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">₹{d.basic.toLocaleString()}/mo</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">₹{d.hra.toLocaleString()}/mo</td>
                    <td className="px-4 py-3.5 font-black font-mono text-white">{fmt(d.total)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                        d.paid?"bg-green-500/15 text-green-400 border-green-500/20":"bg-yellow-500/15 text-yellow-400 border-yellow-500/20"}`}>
                        {d.paid?"Disbursed":"Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"1px solid #1e2d4d",background:"rgba(14,165,233,0.05)"}}>
                  <td className="px-4 py-4 font-bold text-white">Total</td>
                  <td className="px-4 py-4 font-bold text-white">{SALARY_DATA.reduce((s,d)=>s+d.count,0)}</td>
                  <td colSpan={2}/>
                  <td className="px-4 py-4 font-black text-sky-300 text-lg">{fmt(totalSalary)}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">6/7 disbursed</td>
                </tr>
              </tfoot>
            </table></div>
          </div>
        </div>
      )}

      {/* ── CONSTRUCTION ── */}
      {tab==="construction" && (
        <div className="space-y-5">
          {CONSTRUCTION.map(c=>{
            const color = c.status==="Delayed"?"#ef4444":c.status==="Complete"?"#22c55e":c.status==="Planning"?"#8b5cf6":"#0ea5e9";
            return (
              <div key={c.project} className="rounded-2xl border p-6"
                style={{background:`${color}05`,borderColor:`${color}20`}}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">{c.project}</h3>
                    <div className="text-sm text-slate-400 mt-0.5">Contractor: {c.contractor}</div>
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full font-bold"
                    style={{background:`${color}20`,color}}>{c.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    {l:"Total Budget",  v:fmt(c.budget),  c:"#94a3b8"},
                    {l:"Amount Spent",  v:fmt(c.spent),   c:color},
                    {l:"Remaining",     v:fmt(c.budget-c.spent), c:"#22c55e"},
                  ].map(({l,v,c})=>(
                    <div key={l} className="p-3 rounded-xl text-center"
                      style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="text-xs text-slate-500 mb-1">{l}</div>
                      <div className="font-black text-lg" style={{color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-bold" style={{color}}>{c.pct}%</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                    <div className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                      style={{width:`${c.pct}%`,background:`linear-gradient(90deg,${color}80,${color})`}}>
                      <span className="text-xs font-bold text-white">{c.pct}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button className="text-xs px-4 py-2 rounded-xl border font-medium transition-all"
                    style={{borderColor:`${color}30`,color,background:`${color}08`}}>
                    View Invoices
                  </button>
                  <button className="text-xs px-4 py-2 rounded-xl border font-medium border-slate-700 text-slate-400 hover:text-white transition-all">
                    Add Milestone
                  </button>
                  <button className="text-xs px-4 py-2 rounded-xl border font-medium border-slate-700 text-slate-400 hover:text-white transition-all">
                    <Download className="w-3.5 h-3.5 inline mr-1"/>Reports
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PASSENGER PAYMENT VIEW ───────────────────────────────────────────────────
function PassengerPaymentView() {
  const [tab,      setTab]   = useState<"tickets"|"food"|"services">("tickets");
  const [from,     setFrom]  = useState("DEL");
  const [to,       setTo]    = useState("");
  const [cls,      setCls]   = useState<"economy"|"business"|"first">("economy");
  const [cart,     setCart]  = useState<{id:string;name:string;price:number;qty:number}[]>([]);
  const [gateNo,   setGate]  = useState("A1");
  const [ordered,  setOrdered]= useState(false);
  const [booking,  setBooking]= useState<typeof AVAILABLE_FLIGHTS[0]|null>(null);
  const [paid,     setPaid]  = useState(false);

  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  const addToCart = (id:string,name:string,price:number) => {
    setCart(prev=>{
      const ex = prev.find(i=>i.id===id);
      if(ex) return prev.map(i=>i.id===id?{...i,qty:i.qty+1}:i);
      return [...prev,{id,name,price,qty:1}];
    });
  };

  const filteredFlights = AVAILABLE_FLIGHTS.filter(f=>
    (!to||f.to.toLowerCase().includes(to.toUpperCase()))
  );

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Passenger Services & Payments</h1>
        <p className="text-slate-400 text-sm">Book tickets · Order food · Airport services</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {([
          {k:"tickets",  l:"✈ Book Flight",   desc:"Search & book tickets"},
          {k:"food",     l:"🍔 Food & Drinks", desc:"Delivered to your gate"},
          {k:"services", l:"🛎 Services",      desc:"Lounge, taxi, more"},
        ] as const).map(({k,l,desc})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]"
            style={tab===k
              ?{background:"linear-gradient(135deg,rgba(14,165,233,0.2),rgba(20,184,166,0.1))",borderColor:"rgba(56,189,248,0.4)"}
              :{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
            <div className="font-bold text-white text-sm">{l}</div>
            <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
          </button>
        ))}
      </div>

      {/* ── BOOK TICKETS ── */}
      {tab==="tickets" && !booking && !paid && (
        <div className="space-y-4">
          {/* Search */}
          <div className="p-5 rounded-2xl border" style={{background:"rgba(14,165,233,0.06)",borderColor:"rgba(56,189,248,0.2)"}}>
            <h2 className="font-semibold text-white mb-4">Search Flights</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">From</label>
                <select value={from} onChange={e=>setFrom(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                  style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                  {["DEL","BOM","BLR","HYD","CCU"].map(c=><option key={c} style={{background:"#0f1629"}}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">To</label>
                <input value={to} onChange={e=>setTo(e.target.value.toUpperCase())}
                  placeholder="BOM, LHR, DXB..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                  style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Class</label>
                <select value={cls} onChange={e=>setCls(e.target.value as any)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                  style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                  <option value="economy"  style={{background:"#0f1629"}}>Economy</option>
                  <option value="business" style={{background:"#0f1629"}}>Business</option>
                  <option value="first"    style={{background:"#0f1629"}}>First Class</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" defaultValue="2024-04-28"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                  style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)",colorScheme:"dark"}}/>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <div className="text-xs text-slate-500">{filteredFlights.filter(f=>(f.prices as any)[cls]>0).length} flights found</div>
            {filteredFlights.filter(f=>(f.prices as any)[cls]>0).map(f=>{
              const price = (f.prices as any)[cls];
              const seats = (f.seats as any)[cls];
              return (
                <div key={f.id} className="p-5 rounded-2xl border transition-all hover:border-sky-500/30 hover:scale-[1.005]"
                  style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black font-mono text-sky-300 text-lg">{f.flight}</span>
                          <span className="text-xs text-slate-400">{f.airline}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                            style={{background:"rgba(255,255,255,0.05)"}}>{f.stops}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-white">{f.from}</span>
                          <span className="text-slate-600">{f.dep}</span>
                          <Plane className="w-3.5 h-3.5 text-sky-400"/>
                          <span className="text-slate-600">{f.arr}</span>
                          <span className="font-bold text-white">{f.to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">₹{price.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">per person · {cls}</div>
                      <div className={`text-xs mt-1 ${seats<5?"text-red-400":seats<15?"text-yellow-400":"text-green-400"}`}>
                        {seats} seats left
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>✈ {f.stops}</span>
                      <span>📅 {f.date}</span>
                    </div>
                    <button onClick={()=>setBooking(f)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                      Book Now <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking checkout */}
      {tab==="tickets" && booking && !paid && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={()=>setBooking(null)} className="text-sky-400 text-sm hover:text-sky-300">← Back to search</button>
          </div>
          <div className="p-5 rounded-2xl border" style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.25)"}}>
            <div className="font-bold text-white text-xl mb-1">{booking.flight} — {booking.airline}</div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="font-bold text-white">{booking.from}</span>
              <Plane className="w-4 h-4 text-sky-400"/>
              <span className="font-bold text-white">{booking.to}</span>
              <span>·</span><span>{booking.dep} → {booking.arr}</span>
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-navy-600 space-y-4" style={{background:"rgba(15,22,41,0.8)"}}>
            <h3 className="font-semibold text-white">Passenger Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{l:"Full Name",ph:"As on ID"},{l:"Email",ph:"your@email.com"},{l:"Phone",ph:"+91 xxxxx"},{l:"ID Number",ph:"Passport/Aadhaar"}].map(({l,ph})=>(
                <div key={l}>
                  <label className="text-xs text-slate-400 mb-1 block">{l}</label>
                  <input placeholder={ph}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-2xl border" style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
            <h3 className="font-semibold text-white mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-400">Base fare ({cls})</span><span className="text-white">₹{((booking.prices as any)[cls]*0.85).toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Taxes & fees</span><span className="text-white">₹{((booking.prices as any)[cls]*0.15).toFixed(0)}</span></div>
              <div className="border-t mt-2 pt-2" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                <div className="flex justify-between font-black text-lg"><span className="text-white">Total</span><span className="text-sky-300">₹{(booking.prices as any)[cls].toLocaleString()}</span></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <label className="text-xs text-slate-400 font-medium block">Pay via</label>
              {["UPI / PhonePe / GPay","Credit / Debit Card","Net Banking","Razorpay"].map(m=>(
                <label key={m} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{background:"rgba(255,255,255,0.03)"}}>
                  <input type="radio" name="pay" className="accent-sky-500"/> <span className="text-sm text-slate-200">{m}</span>
                </label>
              ))}
            </div>
            <button onClick={()=>setPaid(true)}
              className="w-full py-4 rounded-xl font-black text-white text-base"
              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
              💳 Pay ₹{(booking.prices as any)[cls].toLocaleString()} & Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* Booking confirmed */}
      {tab==="tickets" && paid && booking && (
        <div className="text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400"/>
          </div>
          <h2 className="text-2xl font-bold text-white">Booking Confirmed! 🎉</h2>
          <p className="text-slate-400">{booking.flight} · {booking.from} → {booking.to} · {booking.dep}</p>
          <div className="p-4 rounded-2xl border font-mono text-sky-300 text-center"
            style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.25)"}}>
            PNR: XYZ{Math.random().toString(36).slice(2,8).toUpperCase()}
          </div>
          <button onClick={()=>{setPaid(false);setBooking(null);}}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm">
            Book Another Flight
          </button>
        </div>
      )}

      {/* ── FOOD & DRINKS ── */}
      {tab==="food" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <span className="text-2xl">🚀</span>
            <div>
              <div className="font-semibold text-white text-sm">Delivery to Your Gate / Seat</div>
              <div className="text-xs text-slate-400">Order now — delivered in 10-25 minutes. No need to leave your gate!</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Your gate/area:</label>
            <input value={gateNo} onChange={e=>setGate(e.target.value)}
              className="w-24 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none border"
              style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
          </div>

          {!ordered ? (
            <div className="grid xl:grid-cols-2 gap-3">
              {FOOD_MENU.map(item=>(
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-sky-500/20"
                  style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                  <div className="text-4xl flex-shrink-0">{item.img}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{item.item}</div>
                    <div className="text-xs text-slate-400">{item.outlet} · {item.time} delivery</div>
                    <div className="text-xs text-slate-500">{item.cat}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-white">₹{item.price}</div>
                    <button onClick={()=>addToCart(item.id,item.item,item.price)}
                      className="mt-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all"
                      style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400"/>
              </div>
              <h2 className="text-xl font-bold text-white">Order Placed! 🍔</h2>
              <p className="text-slate-400">Your food will be delivered to Gate {gateNo} in ~20 minutes.</p>
              <button onClick={()=>{setOrdered(false);setCart([]);}}
                className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm">
                Order More
              </button>
            </div>
          )}

          {/* Cart */}
          {cart.length>0 && !ordered && (
            <div className="sticky bottom-0 p-5 rounded-2xl border"
              style={{background:"linear-gradient(135deg,#0f1629,#0a0e1a)",borderColor:"rgba(56,189,248,0.3)"}}>
              <h3 className="font-bold text-white mb-3">Your Order</h3>
              <div className="space-y-2 mb-4">
                {cart.map(i=>(
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-slate-300">{i.name} × {i.qty}</span>
                    <span className="font-bold text-white">₹{i.price*i.qty}</span>
                  </div>
                ))}
                <div className="border-t pt-2" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                  <div className="flex justify-between font-black text-white">
                    <span>Total</span><span className="text-sky-300">₹{cartTotal}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>setOrdered(true)}
                className="w-full py-3.5 rounded-xl font-bold text-white"
                style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                💳 Pay ₹{cartTotal} & Order to Gate {gateNo}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SERVICES ── */}
      {tab==="services" && (
        <div className="space-y-4">
          <div className="grid xl:grid-cols-2 gap-4">
            {[
              {title:"Airport Lounge Access",   price:"₹1,500",desc:"GVK Lounge T3 · WiFi, meals, shower, TV · Valid 6hr",icon:"🛋",color:"#8b5cf6"},
              {title:"Fast Track Security",     price:"₹500", desc:"Skip the queue · Average 3 min clearance",           icon:"⚡",color:"#f59e0b"},
              {title:"Porter / Baggage Help",   price:"₹200", desc:"Dedicated porter for your bags · T1 to T3",          icon:"🧳",color:"#0ea5e9"},
              {title:"Airport Taxi",            price:"₹650+",desc:"Pre-paid taxi to city · 30-60 min · AC",            icon:"🚖",color:"#22c55e"},
              {title:"Business Center",         price:"₹800", desc:"Private meeting room · T3 Level 4 · 2hr slot",       icon:"💼",color:"#14b8a6"},
              {title:"Duty Free Shopping",      price:"Free", desc:"Shop post-security · Show boarding pass",            icon:"🛍",color:"#ec4899"},
              {title:"Currency Exchange",       price:"0% fee",desc:"Competitive rates · T3 Arrivals & Departures",      icon:"💱",color:"#f97316"},
              {title:"Medical Assistance",      price:"Free", desc:"24hr doctor on call · Terminal Medical Bay",         icon:"🏥",color:"#ef4444"},
            ].map(({title,price,desc,icon,color})=>(
              <div key={title} className="flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                style={{background:`${color}06`,borderColor:`${color}18`}}>
                <span className="text-3xl flex-shrink-0">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-white">{title}</div>
                    <div className="font-black ml-3 flex-shrink-0" style={{color}}>{price}</div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{desc}</div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export function PaymentsPage() {
  const { user } = useAuthStore();
  return user?.role==="passenger" ? <PassengerPaymentView/> : <AdminPaymentView/>;
}
