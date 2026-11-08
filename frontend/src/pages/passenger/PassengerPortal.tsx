import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { DEMO_FLIGHTS } from "../../data/users";
import { Plane, Search, CheckCircle,
         ChevronRight, ArrowRight,
         AlertTriangle, Star,
         Phone, Bell,
         ShoppingCart, Plus, Minus } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────
const AVAILABLE_FLIGHTS = [
  {id:"F1",flight:"AI-101", airline:"Air India",  from:"DEL",to:"BOM",dep:"10:30",arr:"12:40",
   prices:{economy:4299,business:12999,first:28999},stops:"Non-stop",aircraft:"Boeing 787",duration:"2h 10m"},
  {id:"F2",flight:"6E-2341",airline:"IndiGo",     from:"DEL",to:"BLR",dep:"11:00",arr:"13:15",
   prices:{economy:3199,business:9499,first:0},   stops:"Non-stop",aircraft:"A320neo",  duration:"2h 15m"},
  {id:"F3",flight:"UK-925", airline:"Vistara",    from:"DEL",to:"HYD",dep:"09:45",arr:"11:55",
   prices:{economy:3799,business:11499,first:0},  stops:"Non-stop",aircraft:"A320",     duration:"2h 10m"},
  {id:"F4",flight:"AI-819", airline:"Air India",  from:"DEL",to:"LHR",dep:"13:45",arr:"19:15",
   prices:{economy:32999,business:89999,first:189999},stops:"Non-stop",aircraft:"Boeing 777",duration:"8h 30m"},
  {id:"F5",flight:"EK-511", airline:"Emirates",   from:"DEL",to:"DXB",dep:"16:00",arr:"18:30",
   prices:{economy:18999,business:54999,first:124999},stops:"Non-stop",aircraft:"A380",  duration:"3h 30m"},
  {id:"F6",flight:"QP-1401",airline:"Akasa Air",  from:"DEL",to:"JAI",dep:"15:30",arr:"16:15",
   prices:{economy:1899,business:0,first:0},      stops:"Non-stop",aircraft:"B737 MAX", duration:"45m"},
  {id:"F7",flight:"SG-3405",airline:"SpiceJet",   from:"DEL",to:"MAA",dep:"17:00",arr:"19:30",
   prices:{economy:2899,business:7499,first:0},   stops:"Non-stop",aircraft:"B737",     duration:"2h 30m"},
];

// Generate seat map for a flight
function generateSeats(cls:"economy"|"business"|"first") {
  const configs = {
    first:   {rows:3,  cols:["A","","C","","D","","F"], label:"1-3"},
    business:{rows:6,  cols:["A","C","","D","F"],       label:"4-9"},
    economy: {rows:20, cols:["A","B","C","","D","E","F"],label:"10-29"},
  };
  const cfg = configs[cls];
  const takenPct = cls==="economy"?0.55:cls==="business"?0.3:0.2;
  return Array.from({length:cfg.rows},(_,ri)=>{
    const rowNum = cls==="first"?ri+1:cls==="business"?ri+4:ri+10;
    return {
      row: rowNum,
      seats: cfg.cols.map(col=>{
        if(!col) return {col:"",type:"aisle"};
        const taken = Math.random()<takenPct;
        const type  = col==="A"||col==="F"?"window":col==="B"||col==="E"?"middle":"aisle_seat";
        return {col, type, taken, id:`${rowNum}${col}`};
      })
    };
  });
}

// Food & Beverages
const RESTAURANTS = [
  {
    id:"kfc",name:"KFC",icon:"🍗",category:"Fast Food",location:"T3 Level 3, Near Gate C2",
    rating:4.2,deliveryTime:"15-20 min",minOrder:199,
    menu:[
      {id:"k1",name:"Zinger Burger",        price:239,cal:"540 cal",popular:true,  veg:false,img:"🍔"},
      {id:"k2",name:"Popcorn Chicken",      price:199,cal:"320 cal",popular:true,  veg:false,img:"🍗"},
      {id:"k3",name:"Rice Bowl Meal",       price:289,cal:"680 cal",popular:false, veg:false,img:"🍱"},
      {id:"k4",name:"Pepsi 500ml",          price:79, cal:"210 cal",popular:false, veg:true, img:"🥤"},
      {id:"k5",name:"Krushers Milkshake",   price:149,cal:"380 cal",popular:false, veg:true, img:"🧋"},
    ]
  },
  {
    id:"starbucks",name:"Starbucks",icon:"☕",category:"Café",location:"T3 Level 3 & Level 4",
    rating:4.5,deliveryTime:"10-15 min",minOrder:149,
    menu:[
      {id:"s1",name:"Caramel Macchiato",    price:385,cal:"250 cal",popular:true,  veg:true, img:"☕"},
      {id:"s2",name:"Cold Brew Coffee",     price:345,cal:"110 cal",popular:true,  veg:true, img:"🧊"},
      {id:"s3",name:"Frappuccino",          price:365,cal:"420 cal",popular:false, veg:true, img:"🧋"},
      {id:"s4",name:"Croissant",            price:185,cal:"280 cal",popular:false, veg:true, img:"🥐"},
      {id:"s5",name:"Chicken Sandwich",     price:295,cal:"390 cal",popular:false, veg:false,img:"🥪"},
    ]
  },
  {
    id:"punjab",name:"Punjab Grill",icon:"🍛",category:"Indian",location:"T3 Level 4",
    rating:4.7,deliveryTime:"20-30 min",minOrder:399,
    menu:[
      {id:"p1",name:"Dal Makhani Thali",    price:595,cal:"820 cal",popular:true,  veg:true, img:"🍛"},
      {id:"p2",name:"Butter Chicken",       price:495,cal:"650 cal",popular:true,  veg:false,img:"🍖"},
      {id:"p3",name:"Paneer Tikka",         price:395,cal:"480 cal",popular:false, veg:true, img:"🧀"},
      {id:"p4",name:"Mango Lassi",          price:149,cal:"280 cal",popular:false, veg:true, img:"🥭"},
      {id:"p5",name:"Naan (2 pcs)",         price:99, cal:"240 cal",popular:false, veg:true, img:"🫓"},
    ]
  },
  {
    id:"mcdonalds",name:"McDonald's",icon:"🍟",category:"Fast Food",location:"T2 Arrivals & T1",
    rating:4.0,deliveryTime:"12-18 min",minOrder:149,
    menu:[
      {id:"m1",name:"McVeggie Burger",      price:199,cal:"430 cal",popular:true,  veg:true, img:"🍔"},
      {id:"m2",name:"McChicken Burger",     price:169,cal:"390 cal",popular:true,  veg:false,img:"🍔"},
      {id:"m3",name:"French Fries Large",   price:129,cal:"490 cal",popular:false, veg:true, img:"🍟"},
      {id:"m4",name:"McFlurry",             price:99, cal:"310 cal",popular:false, veg:true, img:"🍦"},
      {id:"m5",name:"Happy Meal Box",       price:249,cal:"620 cal",popular:false, veg:false,img:"📦"},
    ]
  },
  {
    id:"indigodeli",name:"Indigo Deli",icon:"🥗",category:"Café",location:"T3 Level 3",
    rating:4.4,deliveryTime:"10-20 min",minOrder:249,
    menu:[
      {id:"i1",name:"Club Sandwich",        price:349,cal:"520 cal",popular:true,  veg:false,img:"🥪"},
      {id:"i2",name:"Caesar Salad",         price:295,cal:"280 cal",popular:false, veg:true, img:"🥗"},
      {id:"i3",name:"Fresh Orange Juice",   price:199,cal:"120 cal",popular:true,  veg:true, img:"🍊"},
      {id:"i4",name:"Smoothie Bowl",        price:349,cal:"380 cal",popular:false, veg:true, img:"🫙"},
      {id:"i5",name:"Grilled Veg Wrap",     price:279,cal:"440 cal",popular:false, veg:true, img:"🌯"},
    ]
  },
  {
    id:"dominos",name:"Domino's",icon:"🍕",category:"Pizza",location:"T3 Food Court",
    rating:4.1,deliveryTime:"20-25 min",minOrder:199,
    menu:[
      {id:"d1",name:"Margherita Pizza 7\"", price:179,cal:"540 cal",popular:true,  veg:true, img:"🍕"},
      {id:"d2",name:"Chicken Dominator",   price:299,cal:"720 cal",popular:true,  veg:false,img:"🍕"},
      {id:"d3",name:"Garlic Bread",        price:99, cal:"280 cal",popular:false, veg:true, img:"🥖"},
      {id:"d4",name:"Pasta Arrabiata",     price:179,cal:"480 cal",popular:false, veg:true, img:"🍝"},
      {id:"d5",name:"Pepsi 2L",            price:129,cal:"840 cal",popular:false, veg:true, img:"🥤"},
    ]
  },
];

type CartItem = {id:string;name:string;price:number;qty:number;outlet:string};

const myFlight = DEMO_FLIGHTS[0];
const LIVE_UPDATES = [
  {time:"10:15",msg:"Gate changed A3 → A1",           icon:"🚪",urgent:true},
  {time:"10:10",msg:"Boarding started — proceed to A1",icon:"✈",urgent:true},
  {time:"09:50",msg:"UK-925 delayed 45 min (weather)", icon:"⏰",urgent:false},
  {time:"09:40",msg:"Security lanes 4-6 now open",     icon:"🔒",urgent:false},
  {time:"09:15",msg:"Gate B3 cleaning — 15 min delay", icon:"🧹",urgent:false},
];
const STATUS_STYLE: Record<string,string> = {
  Boarding: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  Scheduled:"bg-sky-500/15 text-sky-400 border-sky-500/20",
  Delayed:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Departed: "bg-green-500/15 text-green-400 border-green-500/20",
  Landed:   "bg-green-600/15 text-green-400 border-green-600/20",
};

// ─────────────────────────────────────────────────────────────────────────────
export function PassengerPortal() {
  const { user }       = useAuthStore();
  const { setActivePage } = useAppStore();
  const [activeTab, setTab] = useState<"mytrip"|"book"|"food"|"services">("mytrip");

  // ── Book flight state ──
  const [searchTo,  setSearchTo]  = useState("");
  const [cls,       setCls]       = useState<"economy"|"business"|"first">("economy");
  const [selFlight, setSelFlight] = useState<typeof AVAILABLE_FLIGHTS[0]|null>(null);
  const [seatMap,   setSeatMap]   = useState<ReturnType<typeof generateSeats>>([]);
  const [selSeat,   setSelSeat]   = useState<string|null>(null);
  const [seatFilter,setSeatFilter]= useState<"all"|"window"|"middle"|"aisle_seat">("all");
  const [bookStep,  setBookStep]  = useState<"search"|"seats"|"pay"|"done">("search");
  const [payMethod, setPayMethod] = useState("UPI");
  const [bookLoading,setBookLoad] = useState(false);

  // ── Food state ──
  const [selResto,  setSelResto]  = useState<typeof RESTAURANTS[0]|null>(null);
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [gateNo,    setGateNo]    = useState("A1");
  const [seatNo,    setSeatNo]    = useState("Row 3, Col 4");
  const [vegOnly,   setVegOnly]   = useState(false);
  const [foodOrdered,setFoodOrd] = useState(false);
  const [showCart,  setShowCart] = useState(false);

  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const addToCart = (item:{id:string;name:string;price:number},outlet:string) => {
    setCart(prev=>{
      const ex = prev.find(i=>i.id===item.id);
      if(ex) return prev.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i);
      return [...prev,{...item,qty:1,outlet}];
    });
  };
  const removeFromCart = (id:string) =>
    setCart(prev=>prev.map(i=>i.id===id?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0));

  const pickFlight = (f:typeof AVAILABLE_FLIGHTS[0]) => {
    setSelFlight(f);
    setSeatMap(generateSeats(cls));
    setSelSeat(null);
    setBookStep("seats");
  };

  const pay = async () => {
    setBookLoad(true);
    await new Promise(r=>setTimeout(r,1500));
    setBookLoad(false);
    setBookStep("done");
  };

  const placeOrder = async () => {
    setFoodOrd(true);
  };

  const filteredFlights = AVAILABLE_FLIGHTS.filter(f=>
    !searchTo || f.to.toUpperCase().includes(searchTo.toUpperCase()) ||
    f.airline.toLowerCase().includes(searchTo.toLowerCase()) ||
    f.flight.toLowerCase().includes(searchTo.toLowerCase())
  ).filter(f=>(f.prices as any)[cls]>0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.name?.split(" ")[0]||"Passenger"} ✈
          </h1>
          <p className="text-slate-400 text-sm">{user?.airportName} · Your travel companion</p>
        </div>
        {myFlight.status==="Boarding" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{background:"rgba(45,212,191,0.12)",border:"1px solid rgba(45,212,191,0.3)",color:"#2dd4bf"}}>
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
            AI-101 Boarding Now!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {([
          {k:"mytrip",  l:"🎫 My Trip",       d:"Status & boarding pass"},
          {k:"book",    l:"✈ Book Flight",    d:"Search & book tickets"},
          {k:"food",    l:"🍔 Food & Drinks",  d:"Delivered to your gate"},
          {k:"services",l:"🛎 Services",       d:"Lounge, taxi, help"},
        ] as const).map(({k,l,d})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.01]"
            style={activeTab===k
              ?{background:"linear-gradient(135deg,rgba(14,165,233,0.2),rgba(20,184,166,0.1))",borderColor:"rgba(56,189,248,0.4)"}
              :{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
            <div className="font-bold text-white text-sm">{l}</div>
            <div className="text-xs text-slate-500 mt-0.5">{d}</div>
          </button>
        ))}
      </div>

      {/* ────────── MY TRIP ────────── */}
      {activeTab==="mytrip" && (
        <div className="space-y-5">
          {/* Delay alert */}
          {DEMO_FLIGHTS.some(f=>f.status==="Delayed") && (
            <div className="p-4 rounded-2xl border flex items-center gap-3"
              style={{background:"rgba(245,158,11,0.08)",borderColor:"rgba(245,158,11,0.25)"}}>
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
              <div>
                <div className="font-semibold text-yellow-300 text-sm">Flight Delay Alert</div>
                <div className="text-xs text-yellow-400/70">
                  {DEMO_FLIGHTS.filter(f=>f.status==="Delayed").map(f=>f.flight_number).join(", ")} — delayed. Check updated info.
                </div>
              </div>
            </div>
          )}

          {/* Boarding pass */}
          <div className="rounded-3xl overflow-hidden border"
            style={{background:"linear-gradient(135deg,#0f1629,#0a0e1a)",borderColor:"rgba(56,189,248,0.35)",boxShadow:"0 0 40px rgba(56,189,248,0.12)"}}>
            <div className="p-6" style={{background:"linear-gradient(135deg,rgba(14,165,233,0.22),rgba(20,184,166,0.1))"}}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-sky-400"/>
                  <span className="font-bold text-white text-xl">{myFlight.flight_number}</span>
                  <span className="text-xs text-slate-400">{myFlight.airline}</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${STATUS_STYLE[myFlight.status]||STATUS_STYLE["Scheduled"]}`}>
                  {myFlight.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black text-white">{myFlight.origin}</div>
                  <div className="text-sm text-slate-400 mt-1">{myFlight.dep} departure</div>
                  <div className="text-xs text-slate-500">Delhi IGI</div>
                </div>
                <div className="flex flex-col items-center">
                  <Plane className="w-6 h-6 text-sky-400"/>
                  <div className="text-xs text-slate-500 mt-1">Boeing 787</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{myFlight.destination}</div>
                  <div className="text-sm text-slate-400 mt-1">{myFlight.arr||"12:40"}</div>
                  <div className="text-xs text-slate-500">Mumbai CSI</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 border-t" style={{borderColor:"rgba(56,189,248,0.12)"}}>
              {[{l:"GATE",v:myFlight.gate},{l:"TERMINAL",v:myFlight.terminal||"T3"},{l:"SEAT",v:"14A"},{l:"CLASS",v:"Economy"}].map(({l,v})=>(
                <div key={l} className="p-4 text-center border-r last:border-0" style={{borderColor:"rgba(56,189,248,0.08)"}}>
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className="font-black font-mono text-white text-lg">{v}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t text-center" style={{borderColor:"rgba(56,189,248,0.08)"}}>
              <div className="text-xs text-slate-500 mb-2">PNR: PAX9X4Y</div>
              <div className="flex justify-center gap-px">
                {Array.from({length:42},(_,i)=>(
                  <div key={i} className="bg-white/75" style={{width:"2px",height:`${12+Math.sin(i*2.8)*10}px`}}/>
                ))}
              </div>
            </div>
          </div>

          {/* Journey timeline */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4">Your Journey Progress</h2>
            <div className="flex items-center">
              {["Check-in","Security","Boarding","Departed","Arrived"].map((step,i)=>{
                const idx = {Scheduled:1,Boarding:2,Departed:3,Landed:4,Cancelled:0}[myFlight.status]??1;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i<idx?"bg-green-500 text-white":i===idx?"bg-sky-500 text-white animate-pulse":"bg-navy-700 text-slate-600"}`}>
                        {i<idx?<CheckCircle className="w-4 h-4"/>:i+1}
                      </div>
                      <div className={`text-xs mt-1.5 text-center max-w-16 leading-tight ${
                        i===idx?"text-sky-300 font-semibold":i<idx?"text-green-400":"text-slate-600"}`}>
                        {step}
                      </div>
                    </div>
                    {i<4 && <div className={`flex-1 h-0.5 mx-1 mb-5 ${i<idx?"bg-green-500":i===idx?"bg-sky-500/40":"bg-navy-700"}`}/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live updates */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-4 border-b border-navy-600 flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400"/>
              <h2 className="font-semibold text-white text-sm">Live Flight Updates</h2>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1"/>
            </div>
            <div className="divide-y divide-navy-700">
              {LIVE_UPDATES.map((u,i)=>(
                <div key={i} className={`flex items-start gap-3 p-4 ${u.urgent?"bg-teal-500/5":""}`}>
                  <span className="text-xl flex-shrink-0">{u.icon}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${u.urgent?"text-teal-300":"text-white"}`}>{u.msg}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{u.time}</div>
                  </div>
                  {u.urgent && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{background:"rgba(45,212,191,0.15)",color:"#2dd4bf"}}>Action</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              {l:"Track Baggage",  icon:"🧳",  action:()=>setActivePage("baggage")},
              {l:"Airport Map",    icon:"🗺",   action:()=>setActivePage("map")},
              {l:"Check-in Online",icon:"🎫",  action:()=>setActivePage("checkin")},
              {l:"Order Food",     icon:"🍔",  action:()=>setTab("food")},
            ].map(({l,icon,action})=>(
              <button key={l} onClick={action}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-[1.03]"
                style={{background:"rgba(14,165,233,0.06)",borderColor:"rgba(56,189,248,0.2)"}}>
                <span className="text-3xl">{icon}</span>
                <span className="text-xs font-semibold text-white">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ────────── BOOK FLIGHT ────────── */}
      {activeTab==="book" && (
        <div className="space-y-5">
          {bookStep==="search" && (
            <>
              {/* Search panel */}
              <div className="p-5 rounded-2xl border"
                style={{background:"rgba(14,165,233,0.06)",borderColor:"rgba(56,189,248,0.2)"}}>
                <h2 className="font-bold text-white mb-4">Search Available Flights</h2>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Destination / Airline / Flight</label>
                    <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 border"
                      style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}>
                      <Search className="w-4 h-4 text-slate-500"/>
                      <input value={searchTo} onChange={e=>setSearchTo(e.target.value)}
                        placeholder="BOM, LHR, Emirates..."
                        className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Travel Class</label>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl"
                      style={{background:"rgba(0,0,0,0.3)"}}>
                      {(["economy","business","first"] as const).map(c=>(
                        <button key={c} onClick={()=>setCls(c)}
                          className="py-2 rounded-lg text-xs font-bold capitalize transition-all"
                          style={cls===c
                            ?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}
                            :{color:"#64748b"}}>
                          {c==="first"?"First":c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Date</label>
                    <input type="date" defaultValue="2024-04-28"
                      className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none border"
                      style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)",colorScheme:"dark"}}/>
                  </div>
                </div>
              </div>

              {/* Class info */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {c:"economy", label:"Economy",  desc:"Standard seat · 23kg baggage · Meals on purchase",icon:"💺",color:"#0ea5e9"},
                  {c:"business",label:"Business", desc:"Lie-flat seat · 32kg baggage · Full meals",        icon:"🛋",color:"#8b5cf6"},
                  {c:"first",   label:"First",    desc:"Suite · 40kg · Gourmet dining · Lounge access",    icon:"👑",color:"#f59e0b"},
                ].map(({c,label,desc,icon,color})=>(
                  <div key={c} className="p-4 rounded-2xl border text-center cursor-pointer transition-all"
                    style={{
                      background:cls===c?`${color}12`:"rgba(255,255,255,0.02)",
                      borderColor:cls===c?`${color}40`:"rgba(255,255,255,0.06)"
                    }}
                    onClick={()=>setCls(c as any)}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-bold text-white text-sm">{label}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>

              {/* Flight results */}
              <div>
                <div className="text-xs text-slate-500 mb-3">
                  {filteredFlights.length} flight{filteredFlights.length!==1?"s":""} available in {cls} class
                </div>
                <div className="space-y-3">
                  {filteredFlights.map(f=>{
                    const price = (f.prices as any)[cls] as number;
                    return (
                      <div key={f.id} className="rounded-2xl border p-5 transition-all hover:border-sky-500/30 hover:scale-[1.005]"
                        style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-black font-mono text-sky-300 text-xl">{f.flight}</span>
                              <span className="text-sm text-slate-400">{f.airline}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                                style={{background:"rgba(255,255,255,0.06)"}}>{f.stops}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="text-center">
                                <div className="text-xl font-black text-white">{f.from}</div>
                                <div className="text-xs text-slate-400">{f.dep}</div>
                              </div>
                              <div className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-slate-600">{f.duration}</div>
                                <div className="flex items-center w-full">
                                  <div className="h-px flex-1 bg-slate-700"/>
                                  <Plane className="w-3.5 h-3.5 text-sky-400 mx-2"/>
                                  <div className="h-px flex-1 bg-slate-700"/>
                                </div>
                                <div className="text-xs text-slate-600">{f.aircraft}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-black text-white">{f.to}</div>
                                <div className="text-xs text-slate-400">{f.arr}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-6 flex-shrink-0">
                            <div className="text-2xl font-black text-white">₹{price.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">{cls} · per person</div>
                            <button onClick={()=>pickFlight(f)}
                              className="mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                              Select <ArrowRight className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── SEAT SELECTION ── */}
          {bookStep==="seats" && selFlight && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={()=>setBookStep("search")} className="text-sky-400 text-sm hover:text-sky-300">← Back</button>
                <div className="font-bold text-white">{selFlight.flight} — {selFlight.airline}</div>
                <span className="text-sm text-slate-400">{selFlight.from} → {selFlight.to} · {cls}</span>
              </div>

              {/* Seat type filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Seat preference:</span>
                {([
                  {k:"all",        l:"All Seats"},
                  {k:"window",     l:"🪟 Window"},
                  {k:"middle",     l:"🪑 Middle"},
                  {k:"aisle_seat", l:"🚶 Aisle"},
                ] as const).map(({k,l})=>(
                  <button key={k} onClick={()=>setSeatFilter(k)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={seatFilter===k
                      ?{background:"#0ea5e9",borderColor:"#0ea5e9",color:"white"}
                      :{background:"transparent",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-xs flex-wrap">
                {[
                  {l:"Available", c:"#0ea5e9"},
                  {l:"Taken",     c:"#ef4444"},
                  {l:"Selected",  c:"#22c55e"},
                  {l:"Window",    border:"#8b5cf6"},
                ].map(({l,c,border})=>(
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md border" style={{background:c?`${c}25`:"transparent",borderColor:border||c}}/>
                    <span className="text-slate-400">{l}</span>
                  </div>
                ))}
              </div>

              {/* Seat map */}
              <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5 overflow-x-auto">
                <div className="text-center mb-4">
                  <div className="inline-block px-8 py-2 rounded-t-3xl text-xs font-bold text-slate-400"
                    style={{background:"rgba(255,255,255,0.05)"}}>
                    ✈ FRONT OF AIRCRAFT
                  </div>
                </div>
                <div className="space-y-1.5 min-w-max mx-auto" style={{width:"fit-content"}}>
                  {seatMap.map(row=>(
                    <div key={row.row} className="flex items-center gap-1">
                      <div className="w-6 text-xs text-slate-600 text-right flex-shrink-0">{row.row}</div>
                      <div className="flex gap-1">
                        {row.seats.map((seat,si)=>{
                          if(seat.type==="aisle") return <div key={si} className="w-5"/>;
                          const s = seat as {col:string;type:string;taken:boolean;id:string};
                          const isSelected = selSeat===s.id;
                          const filtered   = seatFilter!=="all" && s.type!==seatFilter;
                          return (
                            <button key={si}
                              disabled={s.taken}
                              onClick={()=>setSelSeat(isSelected?null:s.id)}
                              className="w-8 h-8 rounded-md text-xs font-bold transition-all border disabled:cursor-not-allowed"
                              style={{
                                background: s.taken?"rgba(239,68,68,0.15)":
                                            isSelected?"#22c55e":
                                            s.type==="window"?"rgba(139,92,246,0.15)":"rgba(14,165,233,0.1)",
                                borderColor: s.taken?"rgba(239,68,68,0.3)":
                                             isSelected?"#22c55e":
                                             s.type==="window"?"rgba(139,92,246,0.4)":"rgba(14,165,233,0.3)",
                                color:  s.taken?"#ef4444":isSelected?"white":"#e2e8f0",
                                opacity:filtered?0.25:1,
                                transform:isSelected?"scale(1.15)":"scale(1)",
                              }}>
                              {s.col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <div className="inline-block px-8 py-2 rounded-b-3xl text-xs font-bold text-slate-400"
                    style={{background:"rgba(255,255,255,0.05)"}}>
                    REAR OF AIRCRAFT
                  </div>
                </div>
              </div>

              {selSeat && (
                <div className="p-4 rounded-2xl border"
                  style={{background:"rgba(34,197,94,0.08)",borderColor:"rgba(34,197,94,0.25)"}}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-green-300">✓ Seat {selSeat} selected</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {seatMap.flatMap(r=>r.seats).find((s:any)=>s.id===selSeat) &&
                          `${(seatMap.flatMap(r=>r.seats).find((s:any)=>s.id===selSeat) as any)?.type?.replace("_"," ")} seat · ${selFlight.aircraft}`}
                      </div>
                    </div>
                    <button onClick={()=>setBookStep("pay")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                      style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                      Continue to Payment <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT ── */}
          {bookStep==="pay" && selFlight && (
            <div className="space-y-4">
              <button onClick={()=>setBookStep("seats")} className="text-sky-400 text-sm hover:text-sky-300">← Back to seats</button>

              <div className="p-4 rounded-2xl border" style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.25)"}}>
                <div className="font-bold text-white text-lg">{selFlight.flight} · {selFlight.airline}</div>
                <div className="text-sm text-slate-400">{selFlight.from} → {selFlight.to} · Seat {selSeat} · {cls}</div>
              </div>

              <div className="rounded-2xl border p-5 space-y-3" style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                <h3 className="font-semibold text-white">Passenger Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:"Full Name",ph:"As on ID/Passport"},{l:"Email",ph:"your@email.com"},{l:"Phone",ph:"+91 xxxxx xxxxx"},{l:"Aadhaar / Passport",ph:"ID Number"}].map(({l,ph})=>(
                    <div key={l}>
                      <label className="text-xs text-slate-400 mb-1 block">{l}</label>
                      <input placeholder={ph}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                        style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                <h3 className="font-semibold text-white mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-slate-400">Base fare ({cls})</span><span className="text-white">₹{Math.round((selFlight.prices as any)[cls]*0.85).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Seat {selSeat}</span><span className="text-white">₹{cls==="economy"?0:cls==="business"?1500:3000}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Taxes & fees</span><span className="text-white">₹{Math.round((selFlight.prices as any)[cls]*0.15).toLocaleString()}</span></div>
                  <div className="border-t pt-2 mt-2" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                    <div className="flex justify-between font-black text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-sky-300">₹{((selFlight.prices as any)[cls]).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <label className="text-xs text-slate-400 font-semibold block">Payment Method</label>
                  {["UPI / PhonePe / GPay","Credit / Debit Card","Net Banking","Wallet (Paytm/Mobikwik)"].map(m=>(
                    <label key={m} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{background:payMethod===m?"rgba(14,165,233,0.08)":"rgba(255,255,255,0.02)"}}>
                      <input type="radio" name="pmethod" checked={payMethod===m} onChange={()=>setPayMethod(m)}
                        className="accent-sky-500"/>
                      <span className="text-sm text-slate-200">{m}</span>
                    </label>
                  ))}
                </div>
                <button onClick={pay} disabled={bookLoading}
                  className="w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2"
                  style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                  {bookLoading
                    ?<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing...</>
                    :`💳 Pay ₹${(selFlight.prices as any)[cls].toLocaleString()} & Confirm`}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {bookStep==="done" && selFlight && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400"/>
              </div>
              <h2 className="text-2xl font-bold text-white">Booking Confirmed! 🎉</h2>
              <p className="text-slate-400">{selFlight.flight} · {selFlight.from} → {selFlight.to} · Seat {selSeat}</p>
              <div className="p-4 rounded-2xl border text-center"
                style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.25)"}}>
                <div className="text-xs text-slate-400 mb-1">Booking Reference</div>
                <div className="font-mono font-black text-2xl text-sky-300">
                  {Math.random().toString(36).slice(2,9).toUpperCase()}
                </div>
                <div className="text-xs text-slate-500 mt-1">Check your email for e-ticket</div>
              </div>
              <div className="p-5 rounded-2xl border text-left space-y-2" style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                <div className="font-semibold text-white mb-3">What to do at airport</div>
                {["🧳 Drop checked bags at Baggage Drop counter","🔒 Proceed to Security with valid photo ID","🚪 Go to your gate 45 min before departure","✈ Board when your seat row is called"].map((t,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:"rgba(255,255,255,0.02)"}}>
                    <span className="text-base">{t.split(" ")[0]}</span>
                    <span className="text-sm text-slate-200">{t.slice(2)}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>{setBookStep("search");setSelFlight(null);setSelSeat(null);}}
                className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm">
                Book Another Flight
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────── FOOD & DRINKS ────────── */}
      {activeTab==="food" && (
        <div className="space-y-5">
          {/* Location & options */}
          {!foodOrdered && (
            <>
              <div className="p-4 rounded-2xl border"
                style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <div className="font-bold text-white">Delivered to Your Gate / Seat</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      No need to leave! Order now and staff will bring it to you in 10-25 min.
                      Perfect for elderly passengers, families with kids, or anyone who wants to relax.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400 font-medium">Gate:</label>
                  <input value={gateNo} onChange={e=>setGateNo(e.target.value)}
                    className="w-20 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none border text-center"
                    style={{background:"rgba(255,255,255,0.06)",borderColor:"rgba(56,189,248,0.3)"}}/>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400 font-medium">Seat/Row:</label>
                  <input value={seatNo} onChange={e=>setSeatNo(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.06)",borderColor:"rgba(255,255,255,0.1)"}}
                    placeholder="Row 3, Seat 4"/>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={vegOnly} onChange={e=>setVegOnly(e.target.checked)}
                    className="w-4 h-4 rounded accent-green-500"/>
                  <span className="text-sm text-slate-300">🌿 Veg only</span>
                </label>
              </div>

              {!selResto ? (
                // Restaurant list
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-white">{RESTAURANTS.length} restaurants available · All delivering to Gate {gateNo}</div>
                  <div className="grid xl:grid-cols-2 gap-3">
                    {RESTAURANTS.map(r=>(
                      <div key={r.id} onClick={()=>setSelResto(r)}
                        className="flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                        style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                        <div className="text-4xl flex-shrink-0">{r.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">{r.name}</span>
                            <div className="flex items-center gap-1 text-yellow-400 text-xs">
                              <Star className="w-3 h-3 fill-yellow-400"/>{r.rating}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mb-1">{r.category} · {r.location}</div>
                          <div className="flex gap-3 text-xs text-slate-500">
                            <span>🕐 {r.deliveryTime}</span>
                            <span>Min ₹{r.minOrder}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 self-center"/>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Restaurant menu
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>setSelResto(null)} className="text-sky-400 text-sm hover:text-sky-300">← All Restaurants</button>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selResto.icon}</span>
                      <span className="font-bold text-white">{selResto.name}</span>
                      <span className="text-xs text-slate-400">{selResto.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selResto.menu.filter(item=>!vegOnly||item.veg).map(item=>(
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border"
                        style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                        <div className="text-4xl flex-shrink-0">{item.img}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-white">{item.name}</span>
                            {item.popular && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{background:"rgba(251,146,60,0.2)",color:"#fb923c"}}>Popular</span>}
                            <span className={`text-xs ${item.veg?"text-green-400":"text-red-400"}`}>{item.veg?"🟢":"🔴"}</span>
                          </div>
                          <div className="text-xs text-slate-500">{item.cal}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-black text-white">₹{item.price}</span>
                          {cart.find(c=>c.id===item.id) ? (
                            <div className="flex items-center gap-2 rounded-xl border px-2 py-1"
                              style={{background:"rgba(14,165,233,0.1)",borderColor:"rgba(56,189,248,0.3)"}}>
                              <button onClick={()=>removeFromCart(item.id)} className="text-sky-400 hover:text-white">
                                <Minus className="w-3.5 h-3.5"/>
                              </button>
                              <span className="font-bold text-white text-sm w-4 text-center">
                                {cart.find(c=>c.id===item.id)?.qty}
                              </span>
                              <button onClick={()=>addToCart(item,selResto.name)} className="text-sky-400 hover:text-white">
                                <Plus className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          ) : (
                            <button onClick={()=>addToCart(item,selResto.name)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-white"
                              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                              <Plus className="w-3.5 h-3.5"/>Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticky cart */}
              {cartCount>0 && (
                <div className="sticky bottom-0 rounded-2xl border p-5"
                  style={{background:"linear-gradient(135deg,#0f1629,#0a0e1a)",borderColor:"rgba(56,189,248,0.35)"}}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-sky-400"/>
                      {cartCount} item{cartCount!==1?"s":""} · ₹{cartTotal}
                    </div>
                    <button onClick={()=>setShowCart(!showCart)}
                      className="text-xs text-sky-400 hover:text-sky-300">
                      {showCart?"Hide":"View"} cart
                    </button>
                  </div>

                  {showCart && (
                    <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
                      {cart.map(i=>(
                        <div key={i.id} className="flex justify-between text-sm">
                          <span className="text-slate-300">{i.name} × {i.qty} <span className="text-slate-600">({i.outlet})</span></span>
                          <span className="font-bold text-white">₹{i.price*i.qty}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1.5 mt-1.5" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                        <div className="flex justify-between font-black text-white">
                          <span>Total</span><span className="text-sky-300">₹{cartTotal}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mb-3">
                    📍 Delivering to: Gate <span className="text-white font-bold">{gateNo}</span> · {seatNo}
                  </div>

                  <button onClick={placeOrder}
                    className="w-full py-3.5 rounded-xl font-black text-white text-base"
                    style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                    💳 Pay ₹{cartTotal} & Place Order → Gate {gateNo}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Order confirmed */}
          {foodOrdered && (
            <div className="text-center space-y-5 py-8">
              <div className="text-6xl">🍔</div>
              <h2 className="text-2xl font-bold text-white">Order Placed! 🎉</h2>
              <p className="text-slate-400">Your food is being prepared and will be delivered to</p>
              <div className="p-4 rounded-2xl border text-center"
                style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.25)"}}>
                <div className="font-black text-sky-300 text-xl">Gate {gateNo}</div>
                <div className="text-slate-400 text-sm">{seatNo}</div>
              </div>
              <div className="flex justify-center gap-4 text-sm text-slate-400">
                <span>⏱ Est. delivery: 15-20 min</span>
              </div>
              <div className="space-y-2 max-w-xs mx-auto">
                {cart.map(i=>(
                  <div key={i.id} className="flex justify-between p-2 rounded-lg text-sm"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <span className="text-slate-300">{i.name} × {i.qty}</span>
                    <span className="text-white">₹{i.price*i.qty}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>{setFoodOrd(false);setCart([]);setSelResto(null);}}
                className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm">
                Order More Food
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────── SERVICES ────────── */}
      {activeTab==="services" && (
        <div className="space-y-4">
          <div className="grid xl:grid-cols-2 gap-4">
            {[
              {title:"Airport Lounge",      price:"₹1,500",desc:"GVK Lounge T3 · Meals, WiFi, shower · 6hr",    icon:"🛋",color:"#8b5cf6"},
              {title:"Fast Track Security", price:"₹500",  desc:"Skip queue · Priority lane · ~3 min",          icon:"⚡",color:"#f59e0b"},
              {title:"Porter / Baggage",   price:"₹200",  desc:"Staff carries your bags T1↔T3",                icon:"🧳",color:"#0ea5e9"},
              {title:"Airport Taxi",       price:"₹650+", desc:"Pre-paid cab · City center 30-60 min",          icon:"🚖",color:"#22c55e"},
              {title:"Wheelchair Assist",  price:"Free",  desc:"Mobility assistance · All terminals",           icon:"♿",color:"#14b8a6"},
              {title:"Currency Exchange",  price:"0% fee",desc:"Competitive rates · T3 Arrivals & Dep",         icon:"💱",color:"#f97316"},
              {title:"Medical / Doctor",   price:"Free",  desc:"24hr doctor on call · Terminal Medical Bay",    icon:"🏥",color:"#ef4444"},
              {title:"Kids Play Area",     price:"Free",  desc:"T3 Level 4 · Supervised play zone",             icon:"🎠",color:"#ec4899"},
            ].map(({title,price,desc,icon,color})=>(
              <div key={title}
                className="flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                style={{background:`${color}06`,borderColor:`${color}18`}}>
                <span className="text-3xl flex-shrink-0">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-bold text-white">{title}</div>
                    <div className="font-black ml-3 flex-shrink-0 text-sm" style={{color}}>{price}</div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{desc}</div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-bold"
                    style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency contacts */}
          <div className="p-5 rounded-2xl border" style={{background:"rgba(239,68,68,0.05)",borderColor:"rgba(239,68,68,0.2)"}}>
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-400"/>Emergency & Help
            </h2>
            <div className="grid xl:grid-cols-2 gap-2">
              {[
                {l:"Airport Help Desk","n":"1800-180-1407"},
                {l:"Medical Emergency","n":"+91-11-2567-0001"},
                {l:"Lost & Found",     "n":"+91-11-2567-0010"},
                {l:"Police / CISF",    "n":"+91-11-2567-0003"},
              ].map(({l,n})=>(
                <a key={l} href={`tel:${n.replace(/[^+\d]/g,"")}`}
                  className="flex justify-between p-3 rounded-xl text-sm transition-all hover:bg-white/5"
                  style={{background:"rgba(255,255,255,0.02)"}}>
                  <span className="text-slate-300">{l}</span>
                  <span className="font-mono text-sky-300">{n}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
