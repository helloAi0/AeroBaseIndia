export interface OrderItem { id: string; name: string; price: number; qty: number }
export interface Order { id: string; ref: string; shopName: string; items: OrderItem[]; total: number; status: string; deliver: "Gate" | "Pickup"; terminal?: string; gate?: string; flight?: string; note?: string; passenger?: string; payment?: string; created_at?: string }
export interface Product { id: string; name: string; category?: string; price: number | string; stock?: number | string; available?: string }

export const FLOW_GATE = ["New", "Accepted", "Preparing", "Ready", "Out for delivery", "Delivered"];
export const FLOW_PICKUP = ["New", "Accepted", "Preparing", "Ready", "Delivered"];
export const flowFor = (o: Pick<Order, "deliver">) => (o.deliver === "Gate" ? FLOW_GATE : FLOW_PICKUP);
export const nextStatus = (o: Pick<Order, "deliver" | "status">): string | null => { const f = flowFor(o), i = f.indexOf(o.status); return i >= 0 && i < f.length - 1 ? f[i + 1] : null; };

const sameDay = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
export function shopStats(orders: Order[], products: Product[]) {
  const live = orders.filter(o => o.status !== "Cancelled");
  const today = live.filter(o => sameDay(o.created_at));
  const delivered = orders.filter(o => o.status === "Delivered");
  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  delivered.forEach(o => o.items.forEach(i => { const c = sold.get(i.id) ?? { name: i.name, qty: 0, revenue: 0 }; c.qty += i.qty; c.revenue += i.qty * i.price; sold.set(i.id, c); }));
  const customers = new Set(live.map(o => o.passenger).filter(Boolean));
  return {
    todayOrders: today.length,
    pending: orders.filter(o => o.status === "New").length,
    active: orders.filter(o => !["Delivered", "Cancelled"].includes(o.status)).length,
    revenue: delivered.reduce((s, o) => s + o.total, 0),
    todayRevenue: delivered.filter(o => sameDay(o.created_at)).reduce((s, o) => s + o.total, 0),
    avgOrder: delivered.length ? Math.round(delivered.reduce((s, o) => s + o.total, 0) / delivered.length) : 0,
    lowStock: products.filter(p => p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 5),
    top: [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    customers: customers.size,
  };
}
