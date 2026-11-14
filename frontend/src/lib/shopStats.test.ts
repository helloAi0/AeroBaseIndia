import { describe, it, expect } from "vitest";
import { shopStats, nextStatus, type Order, type Product } from "./shopStats";
const o = (p: Partial<Order>): Order => ({ id: "1", ref: "ORD-1", shopName: "S", items: [{ id: "p1", name: "Chai", price: 40, qty: 2 }], total: 80, status: "Delivered", deliver: "Gate", created_at: new Date().toISOString(), passenger: "Asha", ...p });
describe("shopStats", () => {
  it("counts revenue only from delivered orders and ignores cancelled", () => {
    const s = shopStats([o({}), o({ id: "2", status: "Cancelled" }), o({ id: "3", status: "New" })], []);
    expect(s.revenue).toBe(80); expect(s.pending).toBe(1); expect(s.active).toBe(1); expect(s.todayOrders).toBe(2);
  });
  it("ranks products and flags low stock", () => {
    const products: Product[] = [{ id: "p1", name: "Chai", price: 40, stock: 3 }, { id: "p2", name: "Tea", price: 30, stock: "" }, { id: "p3", name: "Cake", price: 90, stock: 20 }];
    const s = shopStats([o({})], products);
    expect(s.top[0]).toMatchObject({ name: "Chai", qty: 2, revenue: 80 }); expect(s.lowStock.map(p => p.id)).toEqual(["p1"]);
  });
  it("walks the right status flow for gate delivery vs pickup", () => {
    expect(nextStatus({ deliver: "Gate", status: "Ready" })).toBe("Out for delivery");
    expect(nextStatus({ deliver: "Pickup", status: "Ready" })).toBe("Delivered");
    expect(nextStatus({ deliver: "Pickup", status: "Delivered" })).toBeNull();
  });
});
