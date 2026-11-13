import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const add = vi.fn(async () => true), update = vi.fn(async () => true);
let items: any[] = [];
vi.mock("../../hooks/useCollection", () => ({ useCollection: () => ({ items, live: true, loading: false, error: "", add, update, remove: vi.fn(async () => true) }) }));
import { RecordsPage, type RecordsConfig } from "./RecordsPage";

const cfg: RecordsConfig = {
  collection: "things", title: "Things", subtitle: "sub", noun: "thing", prefix: "THG", titleKey: "name", statusKey: "status",
  fields: [{ key: "name", label: "Name", required: true }, { key: "qty", label: "Qty", type: "number", min: 1, max: 9 }, { key: "status", label: "Status", type: "select", options: ["Open", "Done"], table: true }],
  kpis: [{ label: "Total", value: r => r.length }, { label: "Done", value: r => r.filter(x => x.status === "Done").length }],
};

describe("RecordsPage", () => {
  beforeEach(() => { add.mockClear(); update.mockClear(); items = [{ id: "1", ref: "THG-1", name: "Alpha", qty: 2, status: "Open" }, { id: "2", ref: "THG-2", name: "Beta", qty: 3, status: "Done" }]; });

  it("shows rows and KPIs computed from them, and filters by search", () => {
    render(<RecordsPage cfg={cfg} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument(); expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Total").previousElementSibling?.textContent).toBe("2");
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alp" } });
    expect(screen.queryByText("Beta")).toBeNull(); expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("validates required and numeric range before calling the server, then submits a valid record", async () => {
    render(<RecordsPage cfg={cfg} />);
    fireEvent.click(screen.getByRole("button", { name: /^New thing$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(await screen.findByText(/Name is required/)).toBeInTheDocument(); expect(add).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Gamma" } });
    fireEvent.change(screen.getByLabelText(/^Qty/), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(await screen.findByText(/Qty must be/)).toBeInTheDocument(); expect(add).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Qty/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
    expect((add.mock.calls[0] as any[])[0]).toMatchObject({ name: "Gamma", qty: 5, status: "Open" });
  });
});
