import { useState } from "react";
import { Bell, Search, Menu, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { API_ENABLED } from "../../config";
import { ProfileModal } from "../ui/ProfileModal";

const ROLE_COLOR: Record<string,string> = {
  superadmin:"orange", airport_admin:"sky", staff:"teal", passenger:"purple",
};

export function TopBar() {
  const { sidebarOpen, setSidebar, setActivePage, health } = useAppStore();
  const { user } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const ok = (health as any)?.status === "healthy";
  const color = ROLE_COLOR[user?.role||"airport_admin"]||"sky";

  return (
    <>
      <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4
        bg-navy-800/95 backdrop-blur border-b border-navy-600/60 w-full">

        <div className="flex items-center gap-3">
          <button onClick={()=>setSidebar(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-navy-700 text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5"/>
          </button>
          <div className="hidden sm:flex items-center gap-2.5 bg-navy-700/80 border border-navy-600/40 rounded-xl px-3.5 py-2 w-64">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0"/>
            <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
              placeholder="Search flights, gates..."/>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs">
            {!API_ENABLED ? <Wifi className="w-3.5 h-3.5 text-amber-400"/>
              : ok ? <Wifi className="w-3.5 h-3.5 text-green-400"/> : <WifiOff className="w-3.5 h-3.5 text-red-400"/>}
            <span className={`hidden sm:block ${!API_ENABLED?"text-amber-400":ok?"text-green-400":"text-red-400"}`}>
              {!API_ENABLED?"Demo":ok?"Live":"Offline"}
            </span>
          </div>

          <div className="w-px h-5 bg-navy-600 hidden sm:block"/>

          {/* Notifications */}
          <button onClick={()=>setActivePage("notifications")}
            className="relative p-2 rounded-xl hover:bg-navy-700 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4"/>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"/>
          </button>

          <div className="w-px h-5 bg-navy-600 hidden sm:block"/>

          {/* Profile button */}
          <button onClick={()=>setShowProfile(true)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-navy-600 hover:bg-navy-700/50 rounded-xl px-2 py-1.5 transition-colors group">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl bg-${color}-500/25 border border-${color}-500/40 flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xs font-bold text-${color}-400`}>
                {user?.name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"?"}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight group-hover:text-sky-300 transition-colors">
                {user?.name?.split(" ")[0]||"Guest"}
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                {user?.airport||"—"} • {user?.role==="airport_admin"?"Admin":user?.role==="staff"?"Staff":user?.role==="superadmin"?"SuperAdmin":"Passenger"}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden md:block"/>
          </button>
        </div>
      </header>

      {showProfile && <ProfileModal onClose={()=>setShowProfile(false)}/>}
    </>
  );
}
