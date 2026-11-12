import { RecordsPage, type RecordsConfig } from "../../components/ui/RecordsPage";

const n = (rows: any[], f: (r: any) => boolean) => rows.filter(f).length;
const SEV = ["LOW", "MED", "HIGH", "CRIT"];

const INCIDENTS: RecordsConfig = {
  collection: "incidents", title: "Incidents & Emergency", subtitle: "Report, track and close airport incidents", noun: "incident", prefix: "INC", titleKey: "title", statusKey: "status", canDelete: false,
  fields: [
    { key: "title", label: "What happened", required: true, placeholder: "e.g. Unattended baggage at T3" },
    { key: "type", label: "Type", type: "select", options: ["Security", "Safety", "Medical", "Fire Safety", "IT", "Operations", "Other"], table: true },
    { key: "severity", label: "Severity", type: "select", options: SEV, table: true },
    { key: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Resolved"], table: true },
    { key: "location", label: "Location", placeholder: "Terminal / gate / runway" },
    { key: "officer", label: "Reporting officer", table: false },
    { key: "action", label: "Action taken", type: "textarea", table: false },
  ],
  kpis: [{ label: "Total", value: r => r.length }, { label: "Critical", value: r => n(r, x => x.severity === "CRIT"), tone: "red" },
         { label: "Open / in progress", value: r => n(r, x => x.status !== "Resolved"), tone: "yellow" }, { label: "Resolved", value: r => n(r, x => x.status === "Resolved"), tone: "green" }],
  seed: [{ id: "s1", ref: "INC-S01", title: "Baggage conveyor malfunction", type: "Safety", severity: "MED", status: "In Progress", location: "T2 belt 4", officer: "V. Nair", action: "Maintenance dispatched" }],
};
const MAINTENANCE: RecordsConfig = {
  collection: "maintenance", title: "Maintenance (MRO)", subtitle: "Aircraft and ground-equipment work orders", noun: "work order", prefix: "MRO", titleKey: "desc", statusKey: "status",
  fields: [
    { key: "aircraft", label: "Aircraft / equipment", required: true, placeholder: "VT-AIL or Belt 4" },
    { key: "desc", label: "Work description", required: true, type: "textarea" },
    { key: "type", label: "Type", type: "select", options: ["A-Check", "C-Check", "Component", "AOG", "Ground equipment"] },
    { key: "priority", label: "Priority", type: "select", options: ["Normal", "High", "Critical"] },
    { key: "status", label: "Status", type: "select", options: ["Scheduled", "In Progress", "Completed", "Critical"] },
    { key: "due", label: "Due date", type: "date" }, { key: "tech", label: "Technician / team", table: false },
  ],
  kpis: [{ label: "Work orders", value: r => r.length }, { label: "In progress", value: r => n(r, x => x.status === "In Progress"), tone: "yellow" },
         { label: "Critical / AOG", value: r => n(r, x => x.status === "Critical" || x.priority === "Critical"), tone: "red" }, { label: "Completed", value: r => n(r, x => x.status === "Completed"), tone: "green" }],
  seed: [{ id: "s1", ref: "MRO-S01", aircraft: "VT-6EA", desc: "Left engine fan blade replacement", type: "Component", priority: "High", status: "In Progress", due: "", tech: "Amit S" }],
};
const CONTRACTS: RecordsConfig = {
  collection: "contracts", title: "Contracts & SLAs", subtitle: "Airline, concession and service agreements", noun: "contract", prefix: "CTR", titleKey: "party", statusKey: "status", validate: d => d.start && d.end && d.end < d.start ? "End date must be after the start date" : null,
  fields: [
    { key: "party", label: "Counterparty", required: true, placeholder: "Air India" },
    { key: "type", label: "Type", type: "select", options: ["Airline Agreement", "Ground Handling", "Concession", "Service", "Other"] },
    { key: "value_inr", label: "Annual value (₹)", type: "number", min: 0, max: 100000000000 },
    { key: "status", label: "Status", type: "select", options: ["Draft", "Active", "Expiring", "Expired"] },
    { key: "start", label: "Start date", type: "date", table: false }, { key: "end", label: "End date", type: "date" },
    { key: "sla", label: "SLA terms", table: false, placeholder: "98% uptime" },
  ],
  kpis: [{ label: "Contracts", value: r => r.length }, { label: "Active", value: r => n(r, x => x.status === "Active"), tone: "green" },
         { label: "Expiring", value: r => n(r, x => x.status === "Expiring"), tone: "yellow" },
         { label: "Annual value", value: r => "₹" + r.filter(x => x.status === "Active").reduce((s, x) => s + (Number(x.value_inr) || 0), 0).toLocaleString("en-IN") }],
  seed: [{ id: "s1", ref: "CTR-S01", party: "Celebi Ground", type: "Ground Handling", value_inr: 8000000, status: "Active", start: "", end: "", sla: "99% on-time" }],
};
const PARKING: RecordsConfig = {
  collection: "parking", title: "Parking Management", subtitle: "Zones, capacity and live occupancy", noun: "zone", prefix: "PRK", titleKey: "name", canDelete: true, validate: d => Number(d.occupied) > Number(d.total) ? "Occupied bays cannot exceed total bays" : null,
  fields: [
    { key: "name", label: "Zone name", required: true, placeholder: "Short Stay P1" },
    { key: "total", label: "Total bays", type: "number", required: true, min: 1, max: 100000 },
    { key: "occupied", label: "Occupied bays", type: "number", required: true, min: 0, max: 100000 },
    { key: "rate", label: "Rate", placeholder: "₹80/hr" },
    { key: "terminal", label: "Serves terminal", table: false },
  ],
  kpis: [{ label: "Zones", value: r => r.length }, { label: "Total bays", value: r => r.reduce((s, x) => s + (Number(x.total) || 0), 0).toLocaleString("en-IN") },
         { label: "Occupied", value: r => r.reduce((s, x) => s + (Number(x.occupied) || 0), 0).toLocaleString("en-IN"), tone: "yellow" },
         { label: "Utilisation", value: r => { const t = r.reduce((s, x) => s + (Number(x.total) || 0), 0); return t ? Math.round(100 * r.reduce((s, x) => s + (Number(x.occupied) || 0), 0) / t) + "%" : "—"; }, tone: "green" }],
  seed: [{ id: "s1", ref: "PRK-S01", name: "Short Stay P1", total: 800, occupied: 612, rate: "₹80/hr", terminal: "T1 & T2" }],
};
const FUEL: RecordsConfig = {
  collection: "fuel", title: "Fuel Management", subtitle: "Aircraft fuelling orders and progress", noun: "fuel order", prefix: "FUL", titleKey: "flight", statusKey: "status",
  fields: [
    { key: "flight", label: "Flight", required: true, placeholder: "AI-101" },
    { key: "type", label: "Fuel", type: "select", options: ["ATF", "AVGAS"] },
    { key: "required", label: "Required (litres)", type: "number", required: true, min: 1, max: 400000 },
    { key: "loaded", label: "Loaded (litres)", type: "number", min: 0, max: 400000 },
    { key: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Fuelled"] },
    { key: "bay", label: "Bay", table: false }, { key: "truck", label: "Truck", table: false },
  ],
  kpis: [{ label: "Orders", value: r => r.length }, { label: "Pending", value: r => n(r, x => x.status === "Pending"), tone: "yellow" },
         { label: "In progress", value: r => n(r, x => x.status === "In Progress") }, { label: "Litres loaded", value: r => r.reduce((s, x) => s + (Number(x.loaded) || 0), 0).toLocaleString("en-IN"), tone: "green" }],
  seed: [{ id: "s1", ref: "FUL-S01", flight: "AI-101", type: "ATF", required: 18500, loaded: 18700, status: "Fuelled", bay: "Bay 3", truck: "T-01" }],
};
export const IncidentsPage = () => <RecordsPage cfg={INCIDENTS} />;
export const MaintenancePage = () => <RecordsPage cfg={MAINTENANCE} />;
export const ContractsPage = () => <RecordsPage cfg={CONTRACTS} />;
export const ParkingPage = () => <RecordsPage cfg={PARKING} />;
export const FuelPage = () => <RecordsPage cfg={FUEL} />;
