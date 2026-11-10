import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, Activity, XCircle } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const incidents = [
  {id:"INC-001",type:"Unauthorized Access",severity:"HIGH",  time:"10:24 AM",status:"Resolved", ip:"192.168.1.45"},
  {id:"INC-002",type:"Rate Limit Exceeded", severity:"LOW",  time:"09:15 AM",status:"Active",   ip:"10.0.0.23"},
  {id:"INC-003",type:"Invalid JWT Token",   severity:"MED",  time:"08:50 AM",status:"Resolved", ip:"172.16.0.8"},
  {id:"INC-004",type:"SQL Injection Attempt",severity:"HIGH",time:"08:12 AM",status:"Blocked",  ip:"45.33.32.156"},
  {id:"INC-005",type:"CORS Violation",      severity:"LOW",  time:"07:45 AM",status:"Resolved", ip:"192.168.2.10"},
];

const auditLog = [
  {action:"CREATE_FLIGHT",user:"admin@del.com",  time:"10:30 AM",entity:"AI-101",status:"success"},
  {action:"UPDATE_GATE",  user:"ops@del.com",    time:"10:15 AM",entity:"Gate A1",status:"success"},
  {action:"DELETE_USER",  user:"admin@del.com",  time:"09:45 AM",entity:"user_123",status:"warning"},
  {action:"ROLE_CHANGE",  user:"admin@del.com",  time:"09:30 AM",entity:"staff_45",status:"warning"},
  {action:"LOGIN",        user:"partner@ai.com", time:"09:10 AM",entity:"Session",status:"success"},
  {action:"API_ABUSE",    user:"unknown",         time:"08:55 AM",entity:"IP Block",status:"error"},
];

const threatData = [
  {h:"00",threats:1},{h:"02",threats:0},{h:"04",threats:2},
  {h:"06",threats:5},{h:"08",threats:12},{h:"10",threats:8},
  {h:"12",threats:3},{h:"14",threats:7},{h:"16",threats:15},
  {h:"18",threats:9},{h:"20",threats:4},{h:"22",threats:2},
];

const SEV_COLOR: Record<string,string> = {
  HIGH:"bg-red-500/15 text-red-400 border-red-500/20",
  MED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  LOW: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const STATUS_COLOR: Record<string,string> = {
  Resolved:"text-green-400", Active:"text-red-400 animate-pulse",
  Blocked:"text-orange-400", success:"text-green-400",
  warning:"text-yellow-400", error:"text-red-400",
};

const KPI_TEXT_COLORS: Record<string, string> = {
  red: "text-red-400",
  orange: "text-orange-400",
  sky: "text-sky-400",
  green: "text-green-400",
};

const COMPLIANCE_BG_COLORS: Record<string, string> = {
  green: "bg-green-500/15",
  yellow: "bg-yellow-500/15",
};

const COMPLIANCE_TEXT_COLORS: Record<string, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
};

const COMPLIANCE_BORDER_COLORS: Record<string, string> = {
  green: "border-green-500/20",
  yellow: "border-yellow-500/20",
};

const COMPLIANCE_BAR_COLORS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};

export function SecurityPage() {
  const [tab, setTab] = useState<"overview"|"incidents"|"audit"|"compliance">("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Center</h1>
          <p className="text-slate-400 text-sm mt-0.5">Threat detection & compliance monitoring</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
          <Shield className="w-4 h-4 text-green-400"/>
          <span className="text-sm text-green-400 font-medium">Secure</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Threats Today",   value:5,      icon:<AlertTriangle className="w-5 h-5"/>, color:"red"},
          {label:"Blocked IPs",     value:12,     icon:<Lock className="w-5 h-5"/>,          color:"orange"},
          {label:"Auth Attempts",   value:1247,   icon:<Eye className="w-5 h-5"/>,           color:"sky"},
          {label:"Compliance Score",value:"94%",  icon:<CheckCircle className="w-5 h-5"/>,   color:"green"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`${KPI_TEXT_COLORS[color] || "text-slate-400"} mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600 w-fit">
        {(["overview","incidents","audit","compliance"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab===t?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4">Threat Timeline</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={threatData} margin={{left:-20}}>
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12}}/>
                <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="url(#tg)" strokeWidth={2} name="Threats"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4">Security Checklist</h2>
            <div className="space-y-3">
              {[
                {item:"JWT tokens rotated",        ok:true},
                {item:"HTTPS enabled (port 8443)", ok:true},
                {item:"Rate limiting active",      ok:true},
                {item:"SQL injection protection",  ok:true},
                {item:"CORS configured",           ok:true},
                {item:"Audit logging enabled",     ok:true},
                {item:"2FA enforcement",           ok:false},
                {item:"IP allowlisting",           ok:false},
              ].map(({item,ok})=>(
                <div key={item} className="flex items-center justify-between p-2.5 bg-navy-700/50 rounded-xl">
                  <span className="text-sm text-slate-300">{item}</span>
                  {ok
                    ? <CheckCircle className="w-4 h-4 text-green-400"/>
                    : <XCircle className="w-4 h-4 text-red-400"/>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="incidents" && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400"/>
            <h2 className="font-semibold text-white">Security Incidents</h2>
          </div>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["ID","Type","Severity","Time","IP","Status"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc=>(
                <tr key={inc.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3 font-mono text-xs text-sky-300">{inc.id}</td>
                  <td className="px-5 py-3 text-slate-200">{inc.type}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${SEV_COLOR[inc.severity]}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{inc.time}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{inc.ip}</td>
                  <td className={`px-5 py-3 text-sm font-medium ${STATUS_COLOR[inc.status]}`}>{inc.status}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {tab==="audit" && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400"/>
            <h2 className="font-semibold text-white">Audit Trail</h2>
            <span className="text-xs text-slate-500 ml-auto">Tamper-proof • SHA-256 chained</span>
          </div>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Action","User","Time","Entity","Status"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.map((log,i)=>(
                <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3 font-mono text-xs text-sky-300">{log.action}</td>
                  <td className="px-5 py-3 text-slate-300">{log.user}</td>
                  <td className="px-5 py-3 text-slate-400">{log.time}</td>
                  <td className="px-5 py-3 text-slate-300">{log.entity}</td>
                  <td className={`px-5 py-3 text-xs font-medium ${STATUS_COLOR[log.status]}`}>
                    ● {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {tab==="compliance" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[
            {name:"DGCA Compliance",     score:96, status:"Compliant",    color:"green"},
            {name:"GDPR Data Privacy",   score:88, status:"Minor Issues", color:"yellow"},
            {name:"ISO 27001 Security",  score:91, status:"Compliant",    color:"green"},
            {name:"PCI DSS Payments",    score:94, status:"Compliant",    color:"green"},
          ].map(({name,score,status,color})=>(
            <div key={name} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{name}</h3>
                <span className={`text-xs px-3 py-1 rounded-full border ${COMPLIANCE_BG_COLORS[color]} ${COMPLIANCE_TEXT_COLORS[color]} ${COMPLIANCE_BORDER_COLORS[color]}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl font-bold font-mono text-white">{score}%</div>
              </div>
              <div className="h-2 bg-navy-700 rounded-full">
                <div className={`h-full rounded-full ${COMPLIANCE_BAR_COLORS[color]}`} style={{width:`${score}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}