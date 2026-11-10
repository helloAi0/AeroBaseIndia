import { useState } from "react";
import { Car, Bus, Truck, CheckCircle, AlertTriangle } from "lucide-react";

const ZONES = [
  {id:"P1",name:"Short Stay P1",  type:"Car",    total:800, occupied:612, rate:"₹80/hr",   terminal:"T1 & T2", level:"Ground"},
  {id:"P2",name:"Short Stay P2",  type:"Car",    total:600, occupied:480, rate:"₹80/hr",   terminal:"T3",      level:"Ground"},
  {id:"P3",name:"Long Stay P3",   type:"Car",    total:1200,occupied:890, rate:"₹40/hr",   terminal:"All",     level:"Multi-story"},
  {id:"P4",name:"Economy P4",     type:"Car",    total:2000,occupied:1240,rate:"₹25/hr",   terminal:"All",     level:"Open"},
  {id:"PV",name:"VIP Parking",    type:"Car",    total:100, occupied:45,  rate:"₹200/hr",  terminal:"T3",      level:"Covered"},
  {id:"CB",name:"Coach Bay",      type:"Bus",    total:50,  occupied:32,  rate:"₹500/day", terminal:"All",     level:"Ground"},
  {id:"TP",name:"Taxi Pre-paid",  type:"Taxi",   total:200, occupied:168, rate:"Metered",  terminal:"T1-T3",   level:"Ground"},
  {id:"CG",name:"Cargo Trucks",   type:"Truck",  total:80,  occupied:58,  rate:"₹300/day", terminal:"Cargo",   level:"Ground"},
];

const GROUND_TRANSPORT = [
  {service:"Airport Metro",       status:"Running",   freq:"Every 10 min", dest:"New Delhi Station", fare:"₹60"},
  {service:"Pre-paid Taxi (AC)",  status:"Available", freq:"On demand",    dest:"All Delhi NCR",     fare:"₹450+"},
  {service:"Airport Bus",         status:"Running",   freq:"Every 30 min", dest:"Kashmere Gate ISBT",fare:"₹75"},
  {service:"Inter-terminal Bus",  status:"Running",   freq:"Every 5 min",  dest:"T1 ↔ T2 ↔ T3",     fare:"Free"},
  {service:"Car Rental",          status:"Available", freq:"Counter open", dest:"City & outstation",  fare:"₹1200/day"},
  {service:"OLA/Uber Zone",       status:"Active",    freq:"On demand",    dest:"All NCR",            fare:"App price"},
  {service:"Hotel Shuttle",       status:"Scheduled", freq:"Every 60 min", dest:"Partner hotels",     fare:"Varies"},
];

const TYPE_ICON: Record<string,React.ReactNode> = {
  Car:   <Car className="w-5 h-5"/>,
  Bus:   <Bus className="w-5 h-5"/>,
  Taxi:  <Car className="w-5 h-5"/>,
  Truck: <Truck className="w-5 h-5"/>,
};

const TYPE_COLOR: Record<string,string> = {
  Car:"sky", Bus:"teal", Taxi:"yellow", Truck:"orange",
};

export function ParkingPage() {
  const [filter, setFilter] = useState("All");
  const types = ["All","Car","Bus","Taxi","Truck"];

  const filtered = ZONES.filter(z=>filter==="All"||z.type===filter);
  const totalSpaces = ZONES.filter(z=>z.type==="Car").reduce((s,z)=>s+z.total,0);
  const totalOccupied = ZONES.filter(z=>z.type==="Car").reduce((s,z)=>s+z.occupied,0);
  const availableCar = totalSpaces - totalOccupied;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Parking & Ground Transport</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time parking availability & transport services</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Car Spaces", value:totalSpaces.toLocaleString(),  icon:<Car className="w-5 h-5"/>,           color:"sky"},
          {label:"Available Now",    value:availableCar.toLocaleString(), icon:<CheckCircle className="w-5 h-5"/>,   color:"green"},
          {label:"Occupancy Rate",   value:`${Math.round(totalOccupied/totalSpaces*100)}%`,
                                                                           icon:<AlertTriangle className="w-5 h-5"/>,color:totalOccupied/totalSpaces>0.85?"red":"yellow"},
          {label:"Transport Services",value:GROUND_TRANSPORT.length,      icon:<Bus className="w-5 h-5"/>,           color:"teal"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Visual occupancy */}
      <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
        <h2 className="font-semibold text-white mb-4">Parking Occupancy Overview</h2>
        <div className="space-y-3">
          {ZONES.filter(z=>z.type==="Car").map(z=>{
            const pct = Math.round(z.occupied/z.total*100);
            return (
              <div key={z.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white w-6">{z.id}</span>
                    <span className="text-slate-300">{z.name}</span>
                    <span className="text-xs text-slate-500">{z.terminal}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{z.rate}</span>
                    <span className={`font-bold ${pct>90?"text-red-400":pct>75?"text-yellow-400":"text-green-400"}`}>
                      {pct}%
                    </span>
                    <span className="text-xs text-slate-500 w-20 text-right">
                      {(z.total-z.occupied)} free
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    pct>90?"bg-red-500":pct>75?"bg-yellow-500":"bg-green-500"}`}
                    style={{width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + zones table */}
      <div>
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {types.map(t=>(
            <button key={t} onClick={()=>setFilter(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter===t?"bg-sky-500 text-white border-sky-500":
                "bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(z=>{
            const pct = Math.round(z.occupied/z.total*100);
            const avail = z.total - z.occupied;
            const color = TYPE_COLOR[z.type]||"sky";
            return (
              <div key={z.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600 hover:border-navy-500 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-${color}-500/15 text-${color}-400`}>
                      {TYPE_ICON[z.type]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{z.name}</h3>
                      <div className="text-xs text-slate-400">{z.terminal} • {z.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold font-mono ${
                      pct>90?"text-red-400":pct>75?"text-yellow-400":"text-green-400"}`}>
                      {pct}%
                    </div>
                    <div className="text-xs text-slate-400">occupied</div>
                  </div>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${
                    pct>90?"bg-red-500":pct>75?"bg-yellow-500":"bg-green-500"}`}
                    style={{width:`${pct}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{avail} available / {z.total} total</span>
                  <span className="font-medium text-white">{z.rate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ground transport */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <Bus className="w-5 h-5 text-teal-400"/>
          <h2 className="font-semibold text-white">Ground Transport Services</h2>
        </div>
        <div className="table-scroll"><table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase">
              {["Service","Frequency","Destination","Fare","Status"].map(h=>(
                <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUND_TRANSPORT.map((t,i)=>(
              <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                <td className="px-5 py-3.5 font-medium text-white">{t.service}</td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{t.freq}</td>
                <td className="px-5 py-3.5 text-slate-300">{t.dest}</td>
                <td className="px-5 py-3.5 font-mono text-sky-300 text-xs">{t.fare}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    t.status==="Running"||t.status==="Available"||t.status==="Active"
                      ?"bg-green-500/15 text-green-400 border-green-500/20"
                      :"bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
