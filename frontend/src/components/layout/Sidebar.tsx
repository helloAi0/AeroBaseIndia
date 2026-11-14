import { roleLabel } from "../../lib/roleLabel";
import { KeyRound, ShoppingBag,
  LayoutDashboard, Plane, DoorOpen, Briefcase,
  BarChart3, CreditCard, Bell, FileText, Activity,
  GitBranch, Code2, ChevronLeft, ChevronRight,
  Users, Cpu, Map, UserCheck, TrendingUp, AlertOctagon,
  FileDown, Package, CalendarDays, ClipboardCheck,
  Gauge, Wrench, CloudSun, ParkingSquare, Store,
  MessageSquare, TestTube, Radio, Building2, Palette,
  Shield, Settings, Flame, Target, Volume2, Link,
  Globe, Crown, Leaf, ScanFace, Plug, MessageCircle, Timer, Siren, FlaskConical, Bot, Flame as FlameIcon, Route, LayoutGrid, CloudLightning, PlaneTakeoff, Accessibility as AccIcon, SearchCheck, Handshake, ShieldAlert
} from "lucide-react";
import { Icon3D } from "../ui/Icon3D";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";

const ALL_NAV = [
  { group:"Operations", roles:["superadmin","airport_admin","staff"], items:[
    {id:"dashboard",   label:"Dashboard",      icon:LayoutDashboard},
    {id:"flights",     label:"Flights",        icon:Plane},
    {id:"gates",       label:"Gates",          icon:DoorOpen},
    {id:"baggage",     label:"Baggage",        icon:Briefcase},
    {id:"scheduler",   label:"Scheduler",      icon:CalendarDays},
    {id:"checkin",     label:"Check-in",       icon:ClipboardCheck},
    {id:"biometric",   label:"Biometric Check-in",icon:ScanFace},
    {id:"baggage_predict",label:"Bag Claim ETA", icon:Timer},
    {id:"autopilot",   label:"Disruption Autopilot",icon:Siren},
    {id:"whatif",      label:"What-if Simulator",icon:FlaskConical},
    {id:"copilot",     label:"Ops Copilot",    icon:Bot},
    {id:"heatmap",     label:"Crowd & Queues",  icon:FlameIcon},
    {id:"gateopt",     label:"Smart Gates",    icon:LayoutGrid},
    {id:"carbonops",   label:"Carbon Ops",     icon:Leaf},
    {id:"playbooks",   label:"Weather Playbooks",icon:CloudLightning},
    {id:"turnaround",  label:"Turnaround Timer",icon:PlaneTakeoff},
    {id:"accessibility",label:"Accessibility",  icon:AccIcon},
    {id:"emergency",   label:"Emergency Center",icon:ShieldAlert},
  ]},
  { group:"Business", roles:["superadmin","airport_admin"], items:[
    {id:"analytics",     label:"Analytics",    icon:BarChart3},
    {id:"revenue",       label:"Revenue",      icon:TrendingUp},
    {id:"bids",          label:"Offer Marketplace",icon:Handshake},
    {id:"payments",      label:"Payments",     icon:CreditCard},
    {id:"billing",       label:"Billing",      icon:FileText},
    {id:"retail",        label:"Retail",       icon:Store},
    {id:"feedback",      label:"Feedback",     icon:MessageSquare},
  ]},
  { group:"Operations Ext", roles:["superadmin","airport_admin","staff"], items:[
    {id:"desk",          label:"Passenger Desk", icon:Users},
    {id:"shoporders",    label:"Shop Orders",  icon:ShoppingBag},
    {id:"cargo",         label:"Cargo",        icon:Package},
    {id:"fuel",          label:"Fuel",         icon:Gauge},
    {id:"maintenance",   label:"Maintenance",  icon:Wrench},
    {id:"weather",       label:"Weather",      icon:CloudSun},
    {id:"parking",       label:"Parking",      icon:ParkingSquare},
    {id:"carbon",        label:"Carbon",       icon:Leaf},
    {id:"map",           label:"Airport Map",  icon:Map},
  ]},
  { group:"Passenger", roles:["superadmin","airport_admin","staff","passenger"], items:[
    {id:"passenger",     label:"Passengers",   icon:Users},
    {id:"journey",       label:"My Journey",   icon:Route},
    {id:"biometric",     label:"Biometric Check-in",icon:ScanFace},
    {id:"lostfound",     label:"Lost & Found", icon:SearchCheck},
    {id:"map",           label:"Airport Map",  icon:Map},
  ]},
  { group:"My Shop", roles:["retailer"], items:[
      {id:"retailer",     label:"My Shop Dashboard",icon:Store},
      {id:"bids",         label:"Offer Marketplace",icon:Handshake},
      {id:"map",          label:"Airport Map",       icon:Map},
      {id:"flights",      label:"Flight Info",       icon:Plane},
  ]},
  { group:"Security", roles:["security_head","security"], items:[
      {id:"command",      label:"Security Command",  icon:Shield},
      {id:"security",     label:"Security Events",   icon:Shield},
      {id:"incidents",    label:"Incidents",         icon:AlertOctagon},
      {id:"emergency",    label:"Emergency Center",  icon:Siren},
      {id:"heatmap",      label:"Crowd & Queues",    icon:Users},
      {id:"flights",      label:"Flight Info",       icon:Plane},
      {id:"map",          label:"Airport Map",       icon:Map},
  ]},
  { group:"Crew", roles:["pilot"], items:[
      {id:"pilot",        label:"Crew Briefing",    icon:Plane},
      {id:"flights",      label:"Flight Info",      icon:Plane},
      {id:"weather",      label:"Weather",          icon:CloudSun},
      {id:"map",          label:"Airport Map",      icon:Map},
  ]},
  { group:"Airline", roles:["airline"], items:[
      {id:"airline",      label:"Airline Operations",icon:Plane},
      {id:"crew",         label:"Crew & IDs",        icon:KeyRound},
      {id:"desk",         label:"Bookings",          icon:Users},
      {id:"flights",      label:"Flight Info",       icon:Plane},
      {id:"baggage",      label:"Baggage",           icon:Briefcase},
      {id:"weather",      label:"Weather",           icon:CloudSun},
      {id:"map",          label:"Airport Map",       icon:Map},
  ]},
  { group:"My Account", roles:["passenger"], items:[
      {id:"trips",         label:"My Trips",        icon:Plane},
      {id:"shops",         label:"Shops & Food",    icon:ShoppingBag},
      {id:"baggage",       label:"My Bags",         icon:Briefcase},
      {id:"accessibility", label:"Assistance",      icon:AccIcon},
      {id:"subscription",  label:"My Subscription", icon:Crown},
  ]},
  { group:"People", roles:["superadmin","airport_admin"], items:[
    {id:"staff",         label:"Staff",        icon:UserCheck},
    {id:"team",          label:"Team Access",  icon:KeyRound},
    {id:"partner",       label:"Partner Hub",  icon:Building2},
  ]},
  { group:"Management", roles:["superadmin","airport_admin"], items:[
    {id:"incidents",     label:"Incidents",    icon:AlertOctagon},
    {id:"reports",       label:"Reports",      icon:FileDown},
    {id:"contracts",     label:"Contracts",    icon:FileText},
    {id:"kpi",           label:"KPIs",         icon:Target},
    {id:"security",      label:"Security",     icon:Shield},
    {id:"notifications", label:"Alerts",       icon:Bell},
    {id:"announcements", label:"Announcements",icon:Volume2},
  ]},
  { group:"System", roles:["superadmin","airport_admin"], items:[
    {id:"twin",          label:"Digital Twin", icon:Cpu},
    {id:"ai",            label:"AI Predictions",icon:Flame},
    {id:"integrations",  label:"Integrations", icon:Link},
    {id:"marketplace",   label:"API Marketplace",icon:Plug},
    {id:"whatsapp",      label:"WhatsApp Bot", icon:MessageCircle},
    {id:"metrics",       label:"Metrics",      icon:Activity},
    {id:"traces",        label:"Traces",       icon:GitBranch},
    {id:"graphql",       label:"GraphQL",      icon:Code2},
    {id:"api_test",      label:"API Tester",   icon:TestTube},
    {id:"websocket",     label:"Live Feed",    icon:Radio},
    {id:"settings",      label:"Settings",     icon:Settings},
  ]},
  { group:"Super Admin", roles:["superadmin"], items:[
    {id:"tenants",       label:"Tenants",      icon:Building2},
    {id:"branding",      label:"Branding",     icon:Palette},
    {id:"deployment",    label:"Deploy",       icon:Globe},
  ]},
];

/** Page ids this role may open (used to validate URL hashes / back-forward navigation). */
/** Pilots and airline staff arrive as role "staff" with a staffLevel; give them their own navigation. */
export function navRole(role: string, staffLevel?: string): string {
  if (role === "staff" && staffLevel?.startsWith("pilot_")) return "pilot";
  if (role === "staff" && staffLevel?.startsWith("airline_")) return "airline";
  if (role === "staff" && staffLevel === "staff_security_head") return "security_head";
  if (role === "staff" && staffLevel === "staff_security") return "security";
  return role;
}
export function allowedPagesFor(role: string): Set<string> {
  const ids = new Set<string>(["dashboard"]);
  ALL_NAV.filter(g => g.roles.includes(role)).forEach(g => g.items.forEach(i => ids.add(i.id)));
  return ids;
}

export function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebar, tenant } = useAppStore();
  const { user } = useAuthStore();
  const role = navRole(user?.role || "passenger", user?.staffLevel);

  // Filter nav by role, deduplicate by group+id
  const seenIds = new Set<string>();
  const visibleNav = ALL_NAV
    .filter(g => g.roles.includes(role))
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
    }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col bg-navy-800 border-r border-navy-600/60 transition-all duration-300 overflow-hidden
        ${sidebarOpen ? "" : "max-lg:-translate-x-full"}`}
      style={{ width: sidebarOpen ? "224px" : "56px" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-3 border-b border-navy-600/60 h-16 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <Plane className="w-4 h-4 text-white"/>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">AeroBase</div>
              <div className="text-xs text-sky-400 font-medium truncate">
                {user?.airport||tenant.code}
              </div>
            </div>
          )}
        </div>
        <button onClick={()=>setSidebar(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors flex-shrink-0">
          {sidebarOpen
            ? <ChevronLeft className="w-4 h-4"/>
            : <ChevronRight className="w-4 h-4"/>
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-3">
        {visibleNav.map(({ group, items }) => (
          <div key={group}>
            {sidebarOpen && (
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1 pt-1">
                {group}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => { setActivePage(id); if (window.innerWidth < 1024) setSidebar(false); }}
                  title={!sidebarOpen ? label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-sm
                    ${activePage === id
                      ? "bg-sky-500/15 text-sky-300 font-medium border border-sky-500/20"
                      : "text-slate-500 hover:bg-navy-700/80 hover:text-slate-200"
                    }
                    ${!sidebarOpen ? "justify-center" : ""}`}>
                  <Icon3D size={24} color={activePage === id ? "#0ea5e9" : "#475569"}><Icon className="w-3.5 h-3.5"/></Icon3D>
                  {sidebarOpen && <span className="truncate text-left">{label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="p-3 border-t border-navy-600/60 flex-shrink-0">
          <div className="text-xs text-slate-600">
            {roleLabel(user)} — {user?.airport}
          </div>
        </div>
      )}
    </aside>
  );
}
