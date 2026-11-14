import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, KeyRound } from "lucide-react";
import { listTeam, addTeamMember, removeTeamMember, type TeamMember } from "../../api/account";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

const ROLES: { v: string; label: string; hint: string }[] = [
  { v: "GROUND_STAFF", label: "Ground staff", hint: "Operations pages, baggage, accessibility" },
  { v: "SECURITY_OFFICER", label: "Security officer", hint: "Security events and incidents" },
  { v: "AIRLINE_OPS", label: "Airline operations", hint: "Sees only that airline's flights" },
  { v: "PILOT", label: "Pilot / crew", hint: "Crew briefing for that airline" },
  { v: "RETAILER", label: "Retailer", hint: "Shop dashboard and offer marketplace" },
];
const label = (r: string) => ROLES.find(x => x.v === r)?.label ?? r.replace("_", " ").toLowerCase().replace(/^./, c => c.toUpperCase());
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500";
const genPw = () => { const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const a = new Uint32Array(12); crypto.getRandomValues(a); return Array.from(a, n => c[n % c.length]).join("") + "7"; };

export function TeamAccess() {
  const [team, setTeam] = useState<TeamMember[]>([]); const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "GROUND_STAFF", org: "", password: genPw() });
  const load = useCallback(() => listTeam().then(setTeam).catch(() => setErr("Could not load the team.")), []);
  useEffect(() => { void load(); }, [load]);
  const needsOrg = f.role === "AIRLINE_OPS" || f.role === "PILOT";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    try { await addTeamMember({ ...f, org: needsOrg ? f.org.trim().toUpperCase() : undefined }); setOk(`${f.name} can now sign in with ${f.email} and the password below. Share it securely; they can change it with “Forgot password”.`); await load(); setF({ ...f, name: "", email: "", org: "" }); }
    catch (x) { setErr(x instanceof Error ? x.message : "Could not add"); } finally { setBusy(false); }
  };
  const remove = async (m: TeamMember) => { if (!confirm(`Remove ${m.name}? They will no longer be able to sign in.`)) return; try { await removeTeamMember(m.id); await load(); } catch (x) { setErr(x instanceof Error ? x.message : "Could not remove"); } };
  const count = (r: string) => team.filter(t => t.role === r).length;
  return (
    <div className="space-y-6">
      <PageHead title="Team Access" sub="Give staff, security, airline teams, pilots and retailers their own sign-in for this airport." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat label="Total accounts" value={team.length} /><Stat label="Staff & security" value={count("GROUND_STAFF") + count("SECURITY_OFFICER")} /><Stat label="Airline & crew" value={count("AIRLINE_OPS") + count("PILOT")} /><Stat label="Retailers" value={count("RETAILER")} /></div>
      <Card>
        <div className="text-white font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" />Add a team member</div>
        <form onSubmit={submit} className="grid md:grid-cols-6 gap-3">
          <input className={inp + " md:col-span-2"} placeholder="Full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required aria-label="Full name" />
          <input className={inp + " md:col-span-2"} type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required aria-label="Email" />
          <select className={inp + " md:col-span-2"} value={f.role} onChange={e => setF({ ...f, role: e.target.value })} aria-label="Role">{ROLES.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}</select>
          {needsOrg && <input className={inp + " md:col-span-2"} placeholder="Airline code e.g. AI, 6E" value={f.org} onChange={e => setF({ ...f, org: e.target.value })} maxLength={3} required aria-label="Airline code" />}
          <div className="md:col-span-3 flex gap-2"><input className={inp + " flex-1 font-mono"} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} aria-label="Temporary password" />
            <button type="button" onClick={() => setF({ ...f, password: genPw() })} className="px-3 rounded-lg bg-navy-700 border border-navy-600 text-slate-300" title="Generate" aria-label="Generate password"><KeyRound className="w-4 h-4" /></button></div>
          <button disabled={busy} className="md:col-span-1 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:opacity-50">{busy ? "Adding…" : "Add"}</button>
        </form>
        <div className="text-xs text-slate-500 mt-2">{ROLES.find(r => r.v === f.role)?.hint}. Password needs 10+ characters with a letter and a number.</div>
        {ok && <div className="text-sm text-green-300 mt-3">{ok}</div>}{err && <div className="text-sm text-red-400 mt-3">{err}</div>}
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Airline</th><th className="p-2" /></tr></thead>
          <tbody>{team.map(m => <tr key={m.id} className="border-b border-navy-700 text-slate-200"><td className="p-2">{m.name}</td><td className="p-2 text-slate-400">{m.email}</td><td className="p-2">{label(m.role)}</td><td className="p-2">{m.org || "—"}</td>
            <td className="p-2 text-right">{m.role !== "AIRPORT_ADMIN" && m.role !== "SUPER_ADMIN" && <button onClick={() => void remove(m)} aria-label={`Remove ${m.name}`} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}</td></tr>)}</tbody></table>
        {team.length === 0 && <div className="text-sm text-slate-400 text-center py-6">No accounts yet.</div>}
      </Card>
    </div>
  );
}
