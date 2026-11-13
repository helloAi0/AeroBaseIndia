import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { Palette, Upload, Eye, Save,
         CheckCircle, Globe, Smartphone } from "lucide-react";

const PRESETS = [
  {name:"AeroBase Default", primary:"#0ea5e9", secondary:"#14b8a6", bg:"#0a0e1a", accent:"#8b5cf6"},
  {name:"Sunrise Gold",     primary:"#f59e0b", secondary:"#ef4444", bg:"#1a0a0a", accent:"#f97316"},
  {name:"Forest Green",     primary:"#22c55e", secondary:"#14b8a6", bg:"#0a1a0a", accent:"#84cc16"},
  {name:"Royal Purple",     primary:"#8b5cf6", secondary:"#ec4899", bg:"#0f0a1a", accent:"#a78bfa"},
  {name:"Ocean Blue",       primary:"#3b82f6", secondary:"#0ea5e9", bg:"#0a0f1a", accent:"#6366f1"},
  {name:"Crimson Red",      primary:"#ef4444", secondary:"#f97316", bg:"#1a0a0a", accent:"#dc2626"},
];

export function BrandingPage() {
  const [preview,   setPreview] = useState<"desktop"|"mobile">("desktop");
  const [activePreset, setPreset] = useState(PRESETS[0]);
  const { values: custom, setValues: setCustom, save: saveRemote, saved } = useSettings("branding", {
    airportName: "Delhi International Airport",
    tagline:     "Gateway to India",
    logoText:    "DEL",
    primaryColor:  "#0ea5e9",
    secondaryColor:"#14b8a6",
    bgColor:       "#0a0e1a",
    accentColor:   "#8b5cf6",
    fontFamily:    "Inter",
    borderRadius:  "16",
  });

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPreset(p);
    setCustom((prev: any)=>({...prev, primaryColor:p.primary, secondaryColor:p.secondary,
                               bgColor:p.bg, accentColor:p.accent}));
  };

  const save = () => { void saveRemote(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">White-label Branding</h1>
          <p className="text-slate-400 text-sm mt-0.5">Customize your airport portal appearance</p>
        </div>
        <button onClick={save}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {saved?<CheckCircle className="w-4 h-4"/>:<Save className="w-4 h-4"/>}
          {saved?"Saved!":"Save Branding"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="xl:col-span-1 space-y-5">
          {/* Presets */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-sky-400"/>Color Presets
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p=>(
                <button key={p.name} onClick={()=>applyPreset(p)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    activePreset.name===p.name
                      ?"border-sky-500/50 bg-sky-500/10"
                      :"border-navy-600 hover:border-navy-500"}`}>
                  <div className="flex gap-1.5 mb-2">
                    {[p.primary,p.secondary,p.accent].map((c,i)=>(
                      <div key={i} className="w-4 h-4 rounded-full" style={{background:c}}/>
                    ))}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Brand identity */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4">Brand Identity</h2>
            <div className="space-y-3">
              {[
                {label:"Airport Name",  key:"airportName",   placeholder:"Delhi International..."},
                {label:"Tagline",       key:"tagline",       placeholder:"Gateway to India"},
                {label:"Logo Text",     key:"logoText",       placeholder:"DEL"},
                {label:"Font Family",   key:"fontFamily",     placeholder:"Inter"},
                {label:"Border Radius", key:"borderRadius",   placeholder:"16"},
              ].map(({label,key,placeholder})=>(
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                  <input value={(custom as any)[key]} placeholder={placeholder}
                    onChange={e=>setCustom({...custom,[key]:e.target.value})}
                    className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4">Custom Colors</h2>
            <div className="space-y-3">
              {[
                {label:"Primary",   key:"primaryColor"},
                {label:"Secondary", key:"secondaryColor"},
                {label:"Background",key:"bgColor"},
                {label:"Accent",    key:"accentColor"},
              ].map(({label,key})=>(
                <div key={key} className="flex items-center justify-between p-3 bg-navy-700/50 rounded-xl">
                  <label className="text-sm text-slate-300">{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{(custom as any)[key]}</span>
                    <input type="color" value={(custom as any)[key]}
                      onChange={e=>setCustom({...custom,[key]:e.target.value})}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logo upload */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-400"/>Logo Upload
            </h2>
            <div className="border-2 border-dashed border-navy-600 rounded-xl p-6 text-center hover:border-sky-500/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500"/>
              <div className="text-sm text-slate-400">Drop logo here or click to upload</div>
              <div className="text-xs text-slate-500 mt-1">SVG, PNG, JPG — max 2MB</div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-400"/>Live Preview
            </h2>
            <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600">
              <button onClick={()=>setPreview("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preview==="desktop"?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
                <Globe className="w-3.5 h-3.5"/>Desktop
              </button>
              <button onClick={()=>setPreview("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  preview==="mobile"?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
                <Smartphone className="w-3.5 h-3.5"/>Mobile
              </button>
            </div>
          </div>

          {/* Browser frame */}
          <div className="bg-navy-700 rounded-2xl overflow-hidden border border-navy-600">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-navy-800 border-b border-navy-600">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
                <div className="w-3 h-3 rounded-full bg-green-500/60"/>
              </div>
              <div className="flex-1 bg-navy-700 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono mx-4">
                https://{custom.airportName.split(" ")[0].toLowerCase()}.aerobase.in
              </div>
            </div>

            {/* Simulated app */}
            <div className={`mx-auto transition-all ${preview==="mobile"?"max-w-xs":""}`}
              style={{background:custom.bgColor, minHeight:"480px"}}>
              {/* Navbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b"
                style={{borderColor:custom.primaryColor+"30", background:custom.bgColor}}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{background:`linear-gradient(135deg, ${custom.primaryColor}, ${custom.secondaryColor})`}}>
                    {custom.logoText}
                  </div>
                  {preview==="desktop" && (
                    <div>
                      <div className="text-sm font-bold text-white">{custom.airportName.split(" ").slice(0,2).join(" ")}</div>
                      <div className="text-xs" style={{color:custom.primaryColor}}>{custom.tagline}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {preview==="desktop" && ["Dashboard","Flights","Gates","Analytics"].map(item=>(
                    <div key={item} className="text-xs px-3 py-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:"Total Flights",value:"1,240",icon:"✈"},
                    {label:"Active Now",   value:"48",   icon:"⚡"},
                    {label:"Revenue",      value:"₹2.4Cr",icon:"₹"},
                    {label:"On Time %",    value:"91%",  icon:"✓"},
                  ].map(({label,value,icon})=>(
                    <div key={label} className="p-4 rounded-xl border"
                      style={{background:custom.primaryColor+"10",borderColor:custom.primaryColor+"30",
                              borderRadius:custom.borderRadius+"px"}}>
                      <div className="text-lg mb-1" style={{color:custom.primaryColor}}>{icon}</div>
                      <div className="text-lg font-bold text-white font-mono">{value}</div>
                      <div className="text-xs text-white/50">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border"
                  style={{background:custom.secondaryColor+"08",borderColor:custom.secondaryColor+"20",
                          borderRadius:custom.borderRadius+"px"}}>
                  <div className="text-xs text-white/50 mb-2">Revenue Trend</div>
                  <div className="flex items-end gap-1 h-16">
                    {[40,60,45,80,65,90,75,95,85,100,88,110].map((h,i)=>(
                      <div key={i} className="flex-1 rounded-t transition-all"
                        style={{height:`${h}%`,background:`linear-gradient(to top, ${custom.primaryColor}, ${custom.secondaryColor})`}}/>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border"
                  style={{background:custom.accentColor+"08",borderColor:custom.accentColor+"20",
                          borderRadius:custom.borderRadius+"px"}}>
                  <div className="text-xs text-white/50 mb-3">Live Flights</div>
                  {["AI-101 DEL→BOM Boarding","6E-202 DEL→BLR Scheduled","UK-303 BOM→DEL Delayed"].map(f=>(
                    <div key={f} className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{borderColor:"rgba(255,255,255,0.05)"}}>
                      <span className="text-xs text-white/80 font-mono">{f.split(" ")[0]}</span>
                      <span className="text-xs text-white/50">{f.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color palette display */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h3 className="text-sm font-semibold text-white mb-3">Active Palette — {activePreset.name}</h3>
            <div className="flex gap-3">
              {[
                {label:"Primary",   color:custom.primaryColor},
                {label:"Secondary", color:custom.secondaryColor},
                {label:"Background",color:custom.bgColor},
                {label:"Accent",    color:custom.accentColor},
              ].map(({label,color})=>(
                <div key={label} className="flex-1 text-center">
                  <div className="w-full h-10 rounded-xl mb-2 border border-white/10" style={{background:color}}/>
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="text-xs font-mono text-slate-300">{color}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
