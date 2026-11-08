import { useAuthStore } from "../../store/authStore";
import { useAppStore }  from "../../store/appStore";
import { LogOut, User, Settings, ChevronRight, Shield, Star } from "lucide-react";

interface Props { onClose: ()=>void; }

const ROLE_LABELS: Record<string,string> = {
  airport_admin:"Airport Director / Admin",
  staff:        "Airport Staff",
  passenger:    "Passenger",
  retailer:     "Shop Owner / Retailer",
  superadmin:   "Super Administrator",
};

const ROLE_COLOR: Record<string,string> = {
  airport_admin:"sky", staff:"teal", passenger:"purple",
  retailer:"orange", superadmin:"yellow",
};


export function ProfileModal({ onClose }: Props) {
  const { user, logout }  = useAuthStore();
  const { setActivePage, setSidebar } = useAppStore();

  // Clear the session in the stores: App re-renders to <LoginPage/> with no page reload.
  const doLogout = () => {
    onClose();
    setActivePage("dashboard");
    setSidebar(typeof window === "undefined" || window.innerWidth >= 1024);
    logout();
  };

  if (!user) return null;

  const color    = ROLE_COLOR[user.role] || "sky";
  const initials = (user.name || "?")
    .split(" ").map((n:string)=>n[0]||"").join("").toUpperCase().slice(0,2) || "?";
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const go = (page:string) => { setActivePage(page); onClose(); };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-[4.5rem] right-4 z-50 w-72 rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          background:"linear-gradient(135deg,#0f1629,#0a0e1a)",
          borderColor:"rgba(56,189,248,0.2)",
          boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
        }}>

        {/* User header */}
        <div className="p-5 border-b" style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.12)"}}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center flex-shrink-0`}>
              <span className={`text-lg font-black text-${color}-400`}>{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{user.name || "User"}</div>
              <div className="text-xs text-slate-400 truncate">{user.email || ""}</div>
              <div className={`text-xs font-semibold mt-0.5 text-${color}-400`}>{roleLabel}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 p-2 rounded-xl text-center" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="text-xs text-slate-500">Airport</div>
              <div className="text-sm font-bold text-white">{user.airport || "—"}</div>
            </div>
            <div className="flex-1 p-2 rounded-xl text-center" style={{background:"rgba(255,255,255,0.04)"}}>
              <div className="text-xs text-slate-500">Role</div>
              <div className={`text-sm font-bold text-${color}-400 capitalize`}>
                {user.role === "airport_admin" ? "Admin" : user.role || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-2">
          {user.role === "retailer" ? (
            <>
              <MenuItem icon={<User className="w-4 h-4"/>}    label="My Shop Dashboard" onClick={()=>go("retailer")}/>
              <MenuItem icon={<Star className="w-4 h-4"/>}    label="My Perks"          onClick={()=>go("retailer")}/>
              <MenuItem icon={<Settings className="w-4 h-4"/>}label="Settings"          onClick={()=>go("settings")}/>
            </>
          ) : user.role === "passenger" ? (
            <>
              <MenuItem icon={<User className="w-4 h-4"/>}    label="My Trip"          onClick={()=>go("passenger")}/>
              <MenuItem icon={<Star className="w-4 h-4"/>}    label="My Subscription"  onClick={()=>go("subscription")}/>
              <MenuItem icon={<Settings className="w-4 h-4"/>}label="Settings"         onClick={()=>go("settings")}/>
            </>
          ) : (
            <>
              <MenuItem icon={<User className="w-4 h-4"/>}    label="Dashboard"        onClick={()=>go("dashboard")}/>
              <MenuItem icon={<Shield className="w-4 h-4"/>}  label="Security"         onClick={()=>go("security")}/>
              <MenuItem icon={<Settings className="w-4 h-4"/>}label="Settings"         onClick={()=>go("settings")}/>
            </>
          )}
        </div>

        {/* Logout */}
        <div className="p-2 border-t" style={{borderColor:"rgba(255,255,255,0.06)"}}>
          <button
            onClick={doLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300">
            <LogOut className="w-4 h-4"/>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon:React.ReactNode; label:string; onClick:()=>void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left">
      <span className="text-slate-500">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-600"/>
    </button>
  );
}
