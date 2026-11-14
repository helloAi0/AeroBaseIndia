import { useCollection } from "../../hooks/useCollection";
import { OrdersQueue } from "./OrdersQueue";
import { shopStats, type Order } from "../../lib/shopStats";
import { PageHead, Stat } from "../../components/ui/PageHead";

/** Airport staff view: every order across the airport's shops, to follow up or deliver. */
export function ShopOrders() {
  const orders = useCollection<Order>("orders", []); const list = orders.items as (Order & { id: string })[]; const s = shopStats(list, []);
  return (<div className="space-y-6"><PageHead title="Shop & Food Orders" sub="Every passenger order across the airport's shops. Move an order forward or deliver it to the gate." />
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Waiting" value={s.pending} tone={s.pending ? "text-yellow-400" : "text-white"} /><Stat label="In progress" value={s.active - s.pending} /><Stat label="Orders today" value={s.todayOrders} /><Stat label="Delivered value" value={"₹" + s.revenue.toLocaleString("en-IN")} tone="text-green-400" /></div>
    {orders.error && <div className="text-xs text-red-400">{orders.error}</div>}<OrdersQueue orders={list} update={orders.update} showShop /></div>);
}
