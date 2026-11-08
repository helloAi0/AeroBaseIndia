import React, { useState } from "react";
// FIXED: Re-added missing icon tokens to match potential menu configurations
import { Bell, Database, Palette, Globe, Save, CheckCircle } from "lucide-react";

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    airportName:"Delhi International Airport",
    airportCode:"DEL",
    timezone:"Asia/Kolkata",
    currency:"INR",
    emailAlerts:true,
    delayAlerts:true,
    securityAlerts:true,
    billingAlerts:false,
    theme:"dark",
    language:"en",
    refreshInterval:"10",
  });

  const save = () => {
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  const Section = ({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}) => (
    <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-navy-600">
        <div className="text-sky-400">{icon}</div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Field = ({label,children}:{label:string;children:React.ReactNode}) => (
    <div className="flex items-center justify-between py-3 border-b border-navy-700/50 last:border-0">
      <label className="text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );

  const Toggle = ({val,onChange}:{val:boolean;onChange:()=>void}) => (
    <button onClick={onChange}
      className={`w-11 h-6 rounded-full transition-all relative ${val?"bg-sky-500":"bg-navy-600"}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${val?"left-6":"left-1"}`}/>
    </button>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Airport configuration & preferences</p>
        </div>
        <button onClick={save}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {saved ? <CheckCircle className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <Section title="Airport Profile" icon={<Globe className="w-5 h-5"/>}>
        {[
          {label:"Airport Name", key:"airportName", type:"text"},
          {label:"IATA Code",    key:"airportCode", type:"text"},
          {label:"Timezone",     key:"timezone",    type:"text"},
          {label:"Currency",     key:"currency",    type:"text"},
        ].map(({label,key,type})=>(
          <Field key={key} label={label}>
            <input type={type} value={(form as any)[key]}
              onChange={e=>setForm({...form,[key]:e.target.value})}
              className="bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2 text-sm text-white outline-none w-64"/>
          </Field>
        ))}
      </Section>

      <Section title="Notifications" icon={<Bell className="w-5 h-5"/>}>
        {[
          {label:"Email alerts",          key:"emailAlerts"},
          {label:"Flight delay alerts",   key:"delayAlerts"},
          {label:"Security alerts",       key:"securityAlerts"},
          {label:"Billing notifications", key:"billingAlerts"},
        ].map(({label,key})=>(
          <Field key={key} label={label}>
            <Toggle val={(form as any)[key]} onChange={()=>setForm({...form,[key]:!(form as any)[key]})}/>
          </Field>
        ))}
      </Section>

      <Section title="Display" icon={<Palette className="w-5 h-5"/>}>
        <Field label="Theme">
          <select value={form.theme} onChange={e=>setForm({...form,theme:e.target.value})}
            className="bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white outline-none">
            <option value="dark">Dark (Default)</option>
            <option value="light">Light</option>
          </select>
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}
            className="bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white outline-none">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </Field>
        <Field label="Data refresh interval (seconds)">
          <select value={form.refreshInterval} onChange={e=>setForm({...form,refreshInterval:e.target.value})}
            className="bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-white outline-none">
            {["5","10","30","60"].map(v=><option key={v} value={v}>{v}s</option>)}
          </select>
        </Field>
      </Section>

      <Section title="System Info" icon={<Database className="w-5 h-5"/>}>
        {[
          {label:"Backend",    value:"C++20 + Drogon"},
          {label:"Database",   value:"PostgreSQL 15"},
          {label:"Cache",      value:"Redis 7"},
          {label:"ML Service", value:"Python Flask"},
          {label:"Version",    value:"AeroBase India v1.0"},
          {label:"Phases",     value:"49 / 50 complete"},
        ].map(({label,value})=>(
          <Field key={label} label={label}>
            <span className="text-sm text-slate-400 font-mono">{value}</span>
          </Field>
        ))}
      </Section>
    </div>
  );
}