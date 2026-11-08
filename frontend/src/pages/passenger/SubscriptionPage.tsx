import { useState } from "react";
import { CheckCircle, ArrowRight, X } from "lucide-react";

const TIERS = [
  {
    id:"classic",
    name:"Classic",
    tagline:"The Solo Frequent Flyer",
    icon:"⭐",
    color:"#0ea5e9",
    monthly:999,
    annual:9990,
    badge:null,
    perks:[
      {icon:"🍔",title:"Gate Food Delivery",          desc:"Free food delivery to any gate/seat — no queue"},
      {icon:"🔒",title:"2× Fast-Track Security",      desc:"2 priority security passes per month"},
      {icon:"🛋",title:"1× Lounge Pass",              desc:"1 complimentary lounge visit per month"},
      {icon:"🛍",title:"10% Duty-Free Discount",      desc:"At all airport retail & dining outlets"},
      {icon:"📍",title:"Real-time Gate Alerts",       desc:"Instant push notifications for gate changes"},
      {icon:"🗺",title:"Crowd-Free Navigation",       desc:"Real-time crowd maps + step-by-step directions"},
      {icon:"🧳",title:"Priority Baggage Tracking",   desc:"Live bag tracking with ETA updates"},
    ],
    highlight:"Perfect for monthly travelers wanting convenience"
  },
  {
    id:"group",
    name:"Friends & Group",
    tagline:"Digital Nomads & Travel Buddies",
    icon:"👥",
    color:"#14b8a6",
    monthly:2499,
    annual:24990,
    badge:"BEST VALUE",
    perks:[
      {icon:"🍔",title:"Group Food Ordering",         desc:"One-tap order for up to 4 people at the gate"},
      {icon:"🔒",title:"4× Fast-Track Passes",        desc:"Shared pool of 4 security fast-track passes/month"},
      {icon:"🛋",title:"Discounted Group Lounge",     desc:"20% off lounge entry for the whole group"},
      {icon:"🛍",title:"15% Group Discount",          desc:"Shared discount on all airport retail & F&B"},
      {icon:"🅿",title:"Adjacent Parking Spots",      desc:"Guaranteed adjacent spots at discounted group rate"},
      {icon:"📍",title:"Group Flight Tracking",       desc:"Track all group members' flights from one screen"},
      {icon:"🎁",title:"Birthday Month Upgrade",      desc:"Free lounge access for group on member's birthday"},
    ],
    highlight:"Ideal for 2-4 friends traveling together regularly"
  },
  {
    id:"family",
    name:"Family",
    tagline:"Stress-Free Vacationers",
    icon:"👪",
    color:"#22c55e",
    monthly:3999,
    annual:39990,
    badge:"POPULAR",
    perks:[
      {icon:"🍔",title:"Priority Family Food Delivery",desc:"Complimentary kids' meals + stroller-side delivery"},
      {icon:"🔒",title:"Unlimited Family Fast-Track",  desc:"Unlimited priority security for 2 adults + 3 kids"},
      {icon:"🛋",title:"Family Lounge Access",         desc:"Dedicated family lounge with kids' play area"},
      {icon:"🧳",title:"Free Home Pickup",             desc:"Luggage collected from home, checked at airport"},
      {icon:"👶",title:"Stroller & Wheelchair Help",  desc:"Dedicated staff assistance through the terminal"},
      {icon:"🎠",title:"Kids Entertainment Pass",     desc:"Free access to Kids Play Zone T3"},
      {icon:"🏥",title:"Family Medical Concierge",    desc:"Priority medical assistance for children"},
    ],
    highlight:"For families with children — maximum comfort & safety"
  },
  {
    id:"elite",
    name:"Elite Executive",
    tagline:"The Luxury Commuter",
    icon:"👑",
    color:"#f59e0b",
    monthly:9999,
    annual:99990,
    badge:"PREMIUM",
    perks:[
      {icon:"🚗",title:"Tarmac VIP Transfer",         desc:"BMW/Mercedes picks you up at lounge & drives to plane stairs"},
      {icon:"🔒",title:"Biometric Zero-Wait Security",desc:"Dedicated biometric lane — 0 wait, exclusive to Elite"},
      {icon:"✈",title:"Business Class Upgrade Lottery",desc:"1 guaranteed Business class upgrade per quarter via airline partners"},
      {icon:"🛋",title:"Unlimited Global Lounge",     desc:"Unlimited VIP lounge access globally + arrival lounges"},
      {icon:"🤵",title:"Dedicated 24/7 Concierge",   desc:"Personal assistant for rebooking, delays, reservations"},
      {icon:"🍽",title:"Fine Dining at Gate",         desc:"White-glove catering delivered to gate/lounge, free up to ₹5000/mo"},
      {icon:"🧳",title:"Full Concierge Baggage",      desc:"Handled from curb to aircraft — you carry nothing"},
      {icon:"🎫",title:"Priority Rebooking",          desc:"Instant rebooking during delays — no hold time"},
    ],
    highlight:"The ultimate luxury travel experience"
  },
];

const COMPARISONS = [
  {feature:"Food delivery to gate",     classic:true,  group:true,  family:true,  elite:true},
  {feature:"Security fast-track passes",classic:"2×",  group:"4×",  family:"∞",   elite:"∞ Biometric"},
  {feature:"Lounge access",            classic:"1×/mo",group:"Disc",family:"Family",elite:"∞ Global"},
  {feature:"Duty-free discount",       classic:"10%",  group:"15%", family:"15%", elite:"20%"},
  {feature:"Baggage concierge",        classic:false,  group:false, family:"Home pickup",elite:"Full service"},
  {feature:"VIP tarmac transfer",      classic:false,  group:false, family:false, elite:true},
  {feature:"Dedicated concierge",      classic:false,  group:false, family:false, elite:"24/7"},
  {feature:"Business class upgrade",   classic:false,  group:false, family:false, elite:"1× /qtr"},
  {feature:"Fine dining at gate",      classic:false,  group:false, family:false, elite:"₹5000/mo"},
  {feature:"Group ordering",           classic:false,  group:true,  family:true,  elite:true},
  {feature:"Kids' play area",          classic:false,  group:false, family:true,  elite:true},
];

export function SubscriptionPage() {
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly");
  const [selected,setSelected]= useState<string|null>(null);
  const [showCmp, setShowCmp] = useState(false);
  const [buying,  setBuying]  = useState<typeof TIERS[0]|null>(null);
  const [payDone, setPayDone] = useState(false);

  const getPrice = (t:typeof TIERS[0]) =>
    billing==="annual" ? t.annual : t.monthly;

  const discount = Math.round((1 - TIERS[0].annual/(TIERS[0].monthly*12))*100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white mb-2">AeroBase Passenger Subscriptions</h1>
        <p className="text-slate-400">Travel in comfort, skip the queues, and enjoy luxury perks at every airport</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-semibold ${billing==="monthly"?"text-white":"text-slate-500"}`}>Monthly</span>
        <button onClick={()=>setBilling(b=>b==="monthly"?"annual":"monthly")}
          className="w-14 h-7 rounded-full relative transition-all"
          style={{background:billing==="annual"?"#0ea5e9":"#334155"}}>
          <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
            style={{left:billing==="annual"?"calc(100% - 24px)":"4px"}}/>
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${billing==="annual"?"text-white":"text-slate-500"}`}>Annual</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{background:"rgba(34,197,94,0.2)",color:"#4ade80"}}>
            Save {discount}%
          </span>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid xl:grid-cols-4 gap-4">
        {TIERS.map(tier=>{
          const price = getPrice(tier);
          const isSelected = selected===tier.id;
          return (
            <div key={tier.id}
              className="rounded-3xl border overflow-hidden transition-all duration-200"
              style={{
                borderColor:isSelected?tier.color:`${tier.color}25`,
                boxShadow:isSelected?`0 0 30px ${tier.color}30`:"none",
                transform:isSelected?"scale(1.02)":"scale(1)",
                background:"#080d18"
              }}>
              {tier.badge && (
                <div className="py-2 text-center text-xs font-black text-white"
                  style={{background:tier.color}}>
                  {tier.badge}
                </div>
              )}
              <div className="p-5">
                <div className="text-3xl mb-2">{tier.icon}</div>
                <div className="font-black text-white text-xl mb-0.5">{tier.name}</div>
                <div className="text-xs text-slate-400 mb-4 italic">"{tier.tagline}"</div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black" style={{color:tier.color}}>
                    ₹{price.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-xs">/{billing==="annual"?"year":"month"}</span>
                </div>
                {billing==="annual" && (
                  <div className="text-xs text-green-400 mb-3">
                    = ₹{Math.round(tier.annual/12).toLocaleString()}/month
                  </div>
                )}

                <div className="space-y-2 mb-5 min-h-48">
                  {tier.perks.slice(0,5).map((p,i)=>(
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex-shrink-0">{p.icon}</span>
                      <div>
                        <span className="text-white font-semibold">{p.title}</span>
                        <span className="text-slate-500"> — {p.desc.split(" ").slice(0,6).join(" ")}...</span>
                      </div>
                    </div>
                  ))}
                  {tier.perks.length>5 && (
                    <div className="text-xs text-slate-500">+{tier.perks.length-5} more perks</div>
                  )}
                </div>

                <div className="text-xs text-slate-500 italic mb-4 leading-relaxed">{tier.highlight}</div>

                <button
                  onClick={()=>{setSelected(tier.id);setBuying(tier);}}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{
                    background:isSelected?tier.color:`linear-gradient(135deg,${tier.color}40,${tier.color}20)`,
                    border:`1px solid ${tier.color}${isSelected?"":"40"}`,
                    color:isSelected?"white":tier.color
                  }}>
                  {isSelected?"✓ Selected":"Subscribe Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare plans toggle */}
      <div className="text-center">
        <button onClick={()=>setShowCmp(!showCmp)}
          className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-2 mx-auto">
          {showCmp?"Hide":"Show"} full comparison table
          <ArrowRight className={`w-4 h-4 transition-transform ${showCmp?"rotate-90":""}`}/>
        </button>
      </div>

      {/* Comparison table */}
      {showCmp && (
        <div className="rounded-2xl border overflow-hidden" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                <th className="px-5 py-4 text-left text-xs uppercase" style={{color:"#475569"}}>Feature</th>
                {TIERS.map(t=>(
                  <th key={t.id} className="px-4 py-4 text-center">
                    <div className="text-lg">{t.icon}</div>
                    <div className="font-bold text-xs mt-0.5" style={{color:t.color}}>{t.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISONS.map(row=>(
                <tr key={row.feature} style={{borderBottom:"1px solid rgba(30,45,77,0.4)"}}>
                  <td className="px-5 py-3 text-xs text-slate-300">{row.feature}</td>
                  {(["classic","group","family","elite"] as const).map(k=>{
                    const val = row[k];
                    const tier = TIERS.find(t=>t.id===k)!;
                    return (
                      <td key={k} className="px-4 py-3 text-center">
                        {val===true && <CheckCircle className="w-4 h-4 mx-auto" style={{color:tier.color}}/>}
                        {val===false && <X className="w-4 h-4 mx-auto text-slate-700"/>}
                        {typeof val==="string" && (
                          <span className="text-xs font-bold" style={{color:tier.color}}>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected tier detail / checkout */}
      {buying && !payDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)"}}>
          <div className="w-full max-w-2xl rounded-3xl border overflow-hidden"
            style={{background:"#0a0e1a",borderColor:`${buying.color}40`}}>
            {/* Header */}
            <div className="p-6 border-b"
              style={{background:`${buying.color}10`,borderColor:`${buying.color}20`}}>
              <div className="flex justify-between">
                <div>
                  <div className="text-4xl mb-2">{buying.icon}</div>
                  <div className="text-2xl font-black text-white">{buying.name}</div>
                  <div className="text-sm text-slate-400 italic">{buying.tagline}</div>
                </div>
                <button onClick={()=>setBuying(null)} className="self-start">
                  <X className="w-5 h-5 text-slate-500 hover:text-white"/>
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-black" style={{color:buying.color}}>
                  ₹{getPrice(buying).toLocaleString()}
                </span>
                <span className="text-slate-400">/{billing==="annual"?"year":"month"}</span>
                {billing==="annual" && (
                  <span className="text-green-400 text-sm font-bold">
                    · Save ₹{(buying.monthly*12-buying.annual).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* All perks */}
            <div className="p-6">
              <h3 className="font-bold text-white mb-4">Everything included in {buying.name}:</h3>
              <div className="grid xl:grid-cols-2 gap-3 mb-6">
                {buying.perks.map((p,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <span className="text-2xl flex-shrink-0">{p.icon}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{p.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment */}
              <div className="space-y-3">
                <label className="text-xs text-slate-400 font-semibold block">Payment Method</label>
                {["UPI / PhonePe / GPay","Credit / Debit Card","Net Banking"].map(m=>(
                  <label key={m} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <input type="radio" name="subpay" className="accent-sky-500"/>
                    <span className="text-sm text-slate-200">{m}</span>
                  </label>
                ))}
              </div>

              <button onClick={()=>{setPayDone(true);}}
                className="w-full py-4 rounded-xl font-black text-white text-lg mt-5"
                style={{background:`linear-gradient(135deg,${buying.color},${buying.color}bb)`}}>
                {buying.icon} Subscribe for ₹{getPrice(buying).toLocaleString()}/{billing==="annual"?"year":"month"}
              </button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Cancel anytime · 7-day money-back guarantee · Auto-renews {billing}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {payDone && buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:"rgba(0,0,0,0.9)",backdropFilter:"blur(10px)"}}>
          <div className="w-full max-w-md rounded-3xl p-8 border text-center"
            style={{background:"#0a0e1a",borderColor:`${buying.color}40`}}>
            <div className="text-6xl mb-4">{buying.icon}</div>
            <h2 className="text-2xl font-black text-white mb-2">Welcome to {buying.name}! 🎉</h2>
            <p className="text-slate-400 mb-6">Your subscription is now active. Enjoy your perks!</p>
            <div className="p-4 rounded-2xl border mb-6"
              style={{background:`${buying.color}08`,borderColor:`${buying.color}25`}}>
              <div className="font-bold text-white">{buying.perks[0].icon} First perk unlocked!</div>
              <div className="text-sm text-slate-400 mt-1">{buying.perks[0].title} — {buying.perks[0].desc}</div>
            </div>
            <button onClick={()=>{setPayDone(false);setBuying(null);setSelected(null);}}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{background:buying.color}}>
              Start Using Perks →
            </button>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="font-bold text-white text-lg">Frequently Asked Questions</h2>
        {[
          {q:"Which airports support these perks?",          a:"All AeroBase partner airports in India — DEL, BOM, BLR, HYD, CCU, MAA and growing."},
          {q:"Can I upgrade or downgrade my plan?",          a:"Yes, anytime. Upgrade takes effect immediately; downgrade at next billing cycle."},
          {q:"Is the tarmac VIP transfer available at all airports?",a:"Currently at DEL (T3), BOM, and BLR. Expanding to HYD and CCU by Q3 2024."},
          {q:"How does the Business Class upgrade lottery work?",a:"We partner with airlines to offer last-minute upgrade opportunities. You're entered automatically each quarter as an Elite subscriber."},
          {q:"Can family members use my subscription?",      a:"Classic is for one person. Group is for up to 4. Family covers 2 adults + 3 children. Elite allows 1 companion."},
        ].map(({q,a})=>(
          <div key={q} className="p-4 rounded-2xl border" style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
            <div className="font-semibold text-white text-sm mb-1">{q}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
