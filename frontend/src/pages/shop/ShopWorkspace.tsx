import { useState } from "react";
import { Store, Package, ClipboardList, Settings, LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useBoard } from "../../hooks/useBoard";
import { shopStats, type Order, type Product } from "../../lib/shopStats";
import { OrdersQueue } from "./OrdersQueue";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Shop { name: string; category: string; terminal: string; location?: string; hours?: string; contact?: string; status: string; deliver?: string; ownerId?: string }
const CATS = ["F&B", "Retail", "Duty Free", "Beauty", "Books/News", "Services"];
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";
const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function ShopWorkspace() {
  const me = useAuthStore(s => s.user); const go = useAppStore(s => s.setActivePage); const { flights } = useBoard();
  const stores = useCollection<Shop>("stores", []); const products = useCollection<Product>("products", []); const orders = useCollection<Order>("orders", []);
  const shop = stores.items.find(s => s.ownerId === me?.id) as (Shop & { id: string }) | undefined;
  const [tab, setTab] = useState<"overview" | "orders" | "products" | "shop">("overview"); const [msg, setMsg] = useState("");
  const terminals = Array.from(new Set(flights.map(f => f.terminal).filter(t => t && t !== "—"))).sort(); if (!terminals.length) terminals.push("T1");
  const [f, setF] = useState({ name: me?.name ?? "", category: "F&B", terminal: terminals[0], location: "", hours: "05:00 – 23:00", contact: "", deliver: "Yes" });
  const [np, setNp] = useState({ name: "", category: "", price: "", stock: "" });

  if (stores.loading) return <div className="text-sm text-slate-400">Loading…</div>;

  /* ───── First sign-in: create the shop ───── */
  if (!shop) return (
    <div className="space-y-6 max-w-2xl">
      <PageHead title="Set up your shop" sub={`Welcome${me ? ", " + me.name : ""}. Tell passengers who you are and where to find you — you can change all of this later.`} />
      <Card><form className="grid sm:grid-cols-2 gap-3" onSubmit={async e => { e.preventDefault(); const ok = await stores.add({ ...f, status: "Open" } as never); if (ok) setMsg("Your shop is live."); }}>
        <label className="sm:col-span-2 text-xs text-slate-400">Shop name<input className={inp + " mt-1"} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required maxLength={60} /></label>
        <label className="text-xs text-slate-400">Category<select className={inp + " mt-1"} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs text-slate-400">Terminal<select className={inp + " mt-1"} value={f.terminal} onChange={e => setF({ ...f, terminal: e.target.value })}>{terminals.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="sm:col-span-2 text-xs text-slate-400">Where in the terminal<input className={inp + " mt-1"} placeholder="Near gate 12, level 2, post-security" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} maxLength={80} /></label>
        <label className="text-xs text-slate-400">Opening hours<input className={inp + " mt-1"} value={f.hours} onChange={e => setF({ ...f, hours: e.target.value })} maxLength={30} /></label>
        <label className="text-xs text-slate-400">Contact number<input className={inp + " mt-1"} value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} maxLength={20} inputMode="tel" /></label>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={f.deliver === "Yes"} onChange={e => setF({ ...f, deliver: e.target.checked ? "Yes" : "No" })} />Deliver orders to passengers at their gate</label>
        <button className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold">Create my shop</button>
        {stores.error && <div className="sm:col-span-2 text-xs text-red-400">{stores.error}</div>}</form></Card>
    </div>);

  const myOrders = orders.items as (Order & { id: string })[];   // the server only returns this shop's orders
  const prods = products.items.filter(p => (p as Product & { ownerId?: string }).ownerId === me?.id) as (Product & { id: string })[];
  const st = shopStats(myOrders, prods);
  const addProduct = async (e: React.FormEvent) => { e.preventDefault(); const price = Number(np.price); if (!np.name.trim() || !(price >= 0)) return;
    const ok = await products.add({ name: np.name.trim(), category: np.category || undefined, price, stock: np.stock === "" ? undefined : Math.max(0, Math.floor(Number(np.stock))), available: "Yes" } as never); if (ok) setNp({ name: "", category: np.category, price: "", stock: "" }); };
  const tabs = [["overview", "Overview", LayoutDashboard], ["orders", `Orders${st.active ? ` (${st.active})` : ""}`, ClipboardList], ["products", "Products", Package], ["shop", "Shop settings", Settings]] as const;

  return (
    <div className="space-y-6">
      <PageHead title={shop.name} sub={`${shop.category} · ${shop.terminal}${shop.location ? " · " + shop.location : ""} · ${shop.status}`} />
      <div className="flex flex-wrap gap-2">{tabs.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={`px-3.5 py-2 rounded-xl text-sm flex items-center gap-2 ${tab === k ? "bg-sky-500 text-white" : "bg-navy-800 border border-navy-600 text-slate-300"}`}><I className="w-4 h-4" />{l}</button>)}
        <button onClick={() => go("bids")} className="px-3.5 py-2 rounded-xl text-sm bg-navy-800 border border-navy-600 text-slate-300">Offer marketplace</button></div>
      {msg && <div className="text-sm text-green-300">{msg}</div>}{(orders.error || products.error) && <div className="text-xs text-red-400">{orders.error || products.error}</div>}

      {tab === "overview" && <>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Orders today" value={st.todayOrders} sub={`${st.pending} waiting for you`} tone={st.pending ? "text-yellow-400" : "text-white"} /><Stat label="Revenue (delivered)" value={rupee(st.revenue)} sub={`${rupee(st.todayRevenue)} today`} tone="text-green-400" />
          <Stat label="Average order" value={st.avgOrder ? rupee(st.avgOrder) : "—"} /><Stat label="Customers" value={st.customers} sub="passengers served" /></div>
        <div className="grid xl:grid-cols-2 gap-5">
          <Card><div className="text-white font-semibold mb-3">Best sellers</div>{st.top.length === 0 ? <div className="text-sm text-slate-400">Sales appear here once your first order is delivered.</div> : st.top.map(t => <div key={t.name} className="flex justify-between text-sm py-1.5 border-b border-navy-700 last:border-0"><span className="text-slate-200">{t.name}</span><span className="text-slate-400">{t.qty} sold · {rupee(t.revenue)}</span></div>)}</Card>
          <Card><div className="text-white font-semibold mb-3">Needs attention</div>
            {st.pending > 0 && <button onClick={() => setTab("orders")} className="block w-full text-left text-sm text-yellow-300 py-1.5">{st.pending} new order{st.pending > 1 ? "s" : ""} waiting →</button>}
            {st.lowStock.map(p => <div key={p.id} className="text-sm text-red-300 py-1.5">Low stock: {p.name} ({String(p.stock)} left)</div>)}
            {prods.length === 0 && <button onClick={() => setTab("products")} className="block text-sm text-sky-300 py-1.5">Add your first product so passengers can order →</button>}
            {st.pending === 0 && st.lowStock.length === 0 && prods.length > 0 && <div className="text-sm text-green-400">Nothing needs attention.</div>}</Card></div></>}

      {tab === "orders" && <OrdersQueue orders={myOrders} update={orders.update} />}

      {tab === "products" && <>
        <Card><form onSubmit={addProduct} className="grid sm:grid-cols-5 gap-3"><input className={inp + " sm:col-span-2"} placeholder="Product name" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} required aria-label="Product name" />
          <input className={inp} placeholder="Category (optional)" value={np.category} onChange={e => setNp({ ...np, category: e.target.value })} aria-label="Category" />
          <input className={inp} type="number" min={0} step="0.5" placeholder="Price ₹" value={np.price} onChange={e => setNp({ ...np, price: e.target.value })} required aria-label="Price" />
          <input className={inp} type="number" min={0} placeholder="Stock (blank = unlimited)" value={np.stock} onChange={e => setNp({ ...np, stock: e.target.value })} aria-label="Stock" />
          <button className="sm:col-span-5 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add product</button></form></Card>
        <Card className="overflow-x-auto">{prods.length === 0 ? <div className="text-sm text-slate-400 text-center py-6">No products yet.</div> :
          <table className="w-full text-sm min-w-[560px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Available</th><th className="p-2" /></tr></thead><tbody>
            {prods.map(p => <tr key={p.id} className="border-b border-navy-700 text-slate-200"><td className="p-2">{p.name}<div className="text-[11px] text-slate-500">{p.category}</div></td><td className="p-2">{rupee(Number(p.price))}</td>
              <td className="p-2">{p.stock === undefined || p.stock === "" ? "∞" : <span className="inline-flex items-center gap-1"><button aria-label="Less stock" onClick={() => void products.update(p.id, { stock: Math.max(0, Number(p.stock) - 1) })} className="w-6 h-6 rounded bg-navy-700">−</button><span className={Number(p.stock) <= 5 ? "text-red-300" : ""}>{String(p.stock)}</span><button aria-label="More stock" onClick={() => void products.update(p.id, { stock: Number(p.stock) + 1 })} className="w-6 h-6 rounded bg-navy-700">+</button></span>}</td>
              <td className="p-2"><button onClick={() => void products.update(p.id, { available: p.available === "No" ? "Yes" : "No" })} className={`text-xs px-2 py-0.5 rounded-full border ${p.available === "No" ? "text-slate-400 border-navy-600" : "text-green-300 border-green-500/30"}`}>{p.available === "No" ? "Hidden" : "Selling"}</button></td>
              <td className="p-2 text-right"><button aria-label={`Delete ${p.name}`} onClick={() => confirm(`Delete ${p.name}?`) && void products.remove(p.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table>}</Card></>}

      {tab === "shop" && <Card><div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        {(["name", "location", "hours", "contact"] as const).map(k => <label key={k} className="text-xs text-slate-400 capitalize">{k}<input className={inp + " mt-1"} defaultValue={shop[k] ?? ""} onBlur={e => e.target.value !== (shop[k] ?? "") && void stores.update(shop.id, { [k]: e.target.value })} maxLength={80} /></label>)}
        <label className="text-xs text-slate-400">Terminal<select className={inp + " mt-1"} value={shop.terminal} onChange={e => void stores.update(shop.id, { terminal: e.target.value })}>{terminals.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="text-xs text-slate-400">Status<select className={inp + " mt-1"} value={shop.status} onChange={e => void stores.update(shop.id, { status: e.target.value })}>{["Open", "Closed"].map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="sm:col-span-2 text-xs text-slate-500"><Store className="inline w-3 h-3 mr-1" />While the shop is Closed, passengers cannot place new orders.</div></div></Card>}
    </div>
  );
}
