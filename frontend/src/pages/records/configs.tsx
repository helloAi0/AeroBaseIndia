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

const BAGGAGE: RecordsConfig = {
  collection: "baggage", title: "Baggage Handling", subtitle: "Track every bag from check-in to the belt", noun: "bag", prefix: "BAG", titleKey: "tag", statusKey: "status",
  fields: [
    { key: "tag", label: "Bag tag", required: true, placeholder: "10-digit tag" }, { key: "flight", label: "Flight", required: true, placeholder: "AI-101" },
    { key: "passenger", label: "Passenger", required: true },
    { key: "status", label: "Status", type: "select", options: ["Checked in", "Screened", "Loaded", "In transit", "At belt", "Delivered", "Delayed", "Lost"] },
    { key: "belt", label: "Belt / location", table: false }, { key: "weight_kg", label: "Weight (kg)", type: "number", min: 0, max: 100, table: false },
  ],
  kpis: [{ label: "Bags tracked", value: r => r.length }, { label: "Delivered", value: r => n(r, x => x.status === "Delivered"), tone: "green" },
         { label: "Delayed", value: r => n(r, x => x.status === "Delayed"), tone: "yellow" }, { label: "Lost", value: r => n(r, x => x.status === "Lost"), tone: "red" }],
  seed: [{ id: "s1", ref: "BAG-S01", tag: "0098123456", flight: "AI-101", passenger: "R. Sharma", status: "At belt", belt: "Belt 3", weight_kg: 19 }],
};
const SECURITY: RecordsConfig = {
  collection: "security_events", title: "Security Operations", subtitle: "Screening events, alerts and patrol log", noun: "event", prefix: "SEC", titleKey: "title", statusKey: "status", canDelete: false,
  fields: [
    { key: "title", label: "Event", required: true, placeholder: "Unattended bag, T3 gate 12" },
    { key: "type", label: "Type", type: "select", options: ["Screening alert", "Unattended item", "Access violation", "Patrol", "Drill", "Other"] },
    { key: "severity", label: "Severity", type: "select", options: SEV }, { key: "status", label: "Status", type: "select", options: ["Open", "Investigating", "Cleared", "Escalated"] },
    { key: "location", label: "Location" }, { key: "officer", label: "Officer", table: false }, { key: "notes", label: "Notes", type: "textarea", table: false },
  ],
  kpis: [{ label: "Events", value: r => r.length }, { label: "Open", value: r => n(r, x => x.status === "Open" || x.status === "Investigating"), tone: "yellow" },
         { label: "Escalated", value: r => n(r, x => x.status === "Escalated"), tone: "red" }, { label: "Cleared", value: r => n(r, x => x.status === "Cleared"), tone: "green" }],
  seed: [{ id: "s1", ref: "SEC-S01", title: "Unattended bag at T3", type: "Unattended item", severity: "MED", status: "Investigating", location: "T3 gate 12", officer: "A. Singh", notes: "" }],
};
const CARGO: RecordsConfig = {
  collection: "cargo", title: "Cargo Operations", subtitle: "Air waybills from booking to delivery", noun: "shipment", prefix: "AWB", titleKey: "awb", statusKey: "status",
  fields: [
    { key: "awb", label: "Air waybill no.", required: true, placeholder: "098-12345678" }, { key: "flight", label: "Flight", required: true },
    { key: "commodity", label: "Commodity", required: true }, { key: "weight_kg", label: "Weight (kg)", type: "number", required: true, min: 0.1, max: 200000 },
    { key: "status", label: "Status", type: "select", options: ["Booked", "Accepted", "Loaded", "In transit", "Delivered", "Held"] },
    { key: "dangerous", label: "Dangerous goods", type: "select", options: ["No", "Yes"], table: false }, { key: "consignee", label: "Consignee", table: false },
  ],
  kpis: [{ label: "Shipments", value: r => r.length }, { label: "Total weight (kg)", value: r => r.reduce((s, x) => s + (Number(x.weight_kg) || 0), 0).toLocaleString("en-IN") },
         { label: "Held", value: r => n(r, x => x.status === "Held"), tone: "red" }, { label: "Dangerous goods", value: r => n(r, x => x.dangerous === "Yes"), tone: "yellow" }],
  seed: [{ id: "s1", ref: "AWB-S01", awb: "098-12345678", flight: "AI-819", commodity: "Pharmaceuticals", weight_kg: 420, status: "Loaded", dangerous: "No", consignee: "" }],
};
const CHECKIN: RecordsConfig = {
  collection: "checkins", title: "Check-in", subtitle: "Passenger check-in and boarding status", noun: "passenger", prefix: "PNR", titleKey: "passenger", statusKey: "status",
  fields: [
    { key: "passenger", label: "Passenger name", required: true }, { key: "flight", label: "Flight", required: true, placeholder: "AI-101" },
    { key: "seat", label: "Seat", placeholder: "14C" }, { key: "bags", label: "Bags", type: "number", min: 0, max: 10 },
    { key: "status", label: "Status", type: "select", options: ["Booked", "Checked in", "Boarded", "No-show"] },
  ],
  kpis: [{ label: "Passengers", value: r => r.length }, { label: "Checked in", value: r => n(r, x => x.status === "Checked in"), tone: "sky" },
         { label: "Boarded", value: r => n(r, x => x.status === "Boarded"), tone: "green" }, { label: "No-show", value: r => n(r, x => x.status === "No-show"), tone: "red" }],
  seed: [{ id: "s1", ref: "PNR-S01", passenger: "R. Sharma", flight: "AI-101", seat: "14C", bags: 1, status: "Checked in" }],
};
const STAFF: RecordsConfig = {
  collection: "staff", title: "Staff Management", subtitle: "Roster, shifts and duty status", noun: "staff member", prefix: "STF", titleKey: "name", statusKey: "status",
  fields: [
    { key: "name", label: "Name", required: true }, { key: "role", label: "Role", required: true, placeholder: "Ramp agent" },
    { key: "shift", label: "Shift", type: "select", options: ["Morning", "Afternoon", "Night"] }, { key: "terminal", label: "Terminal", type: "select", options: ["T1", "T2", "T3"] },
    { key: "status", label: "Status", type: "select", options: ["On duty", "Off duty", "Leave"] }, { key: "phone", label: "Phone", table: false },
  ],
  kpis: [{ label: "Staff", value: r => r.length }, { label: "On duty", value: r => n(r, x => x.status === "On duty"), tone: "green" },
         { label: "On leave", value: r => n(r, x => x.status === "Leave"), tone: "yellow" }, { label: "Night shift", value: r => n(r, x => x.shift === "Night") }],
  seed: [{ id: "s1", ref: "STF-S01", name: "Ravi Kumar", role: "Ramp agent", shift: "Morning", terminal: "T3", status: "On duty", phone: "" }],
};
const FEEDBACK: RecordsConfig = {
  collection: "feedback", title: "Passenger Feedback", subtitle: "Ratings and comments from passengers and staff", noun: "feedback", prefix: "FB", titleKey: "comment", statusKey: "status",
  fields: [
    { key: "name", label: "Name", placeholder: "Optional" }, { key: "category", label: "Category", type: "select", options: ["Check-in", "Security", "Dining", "Cleanliness", "Wayfinding", "Staff", "Other"] },
    { key: "rating", label: "Rating (1-5)", type: "number", required: true, min: 1, max: 5 }, { key: "comment", label: "Comment", type: "textarea", required: true },
    { key: "status", label: "Status", type: "select", options: ["New", "Reviewed", "Actioned"] },
  ],
  kpis: [{ label: "Responses", value: r => r.length }, { label: "Average rating", value: r => r.length ? (r.reduce((s, x) => s + (Number(x.rating) || 0), 0) / r.length).toFixed(1) : "—", tone: "green" },
         { label: "Low (1-2)", value: r => n(r, x => Number(x.rating) <= 2), tone: "red" }, { label: "New", value: r => n(r, x => x.status === "New"), tone: "yellow" }],
  seed: [{ id: "s1", ref: "FB-S01", name: "Rahul S.", category: "Check-in", rating: 5, comment: "Very smooth check-in.", status: "New" }],
};
const EMERGENCY: RecordsConfig = {
  collection: "emergency", title: "Emergency Center", subtitle: "Activations, response status and after-action notes. Airport emergency line: follow your site's published numbers.", noun: "activation", prefix: "EMG", titleKey: "type", statusKey: "status", canDelete: false,
  fields: [
    { key: "type", label: "Emergency type", type: "select", options: ["Aircraft incident (ARFF)", "Medical", "Security threat", "Fire (terminal)", "Weather", "Power / IT failure", "Evacuation drill"] },
    { key: "location", label: "Location", required: true }, { key: "severity", label: "Severity", type: "select", options: SEV },
    { key: "status", label: "Status", type: "select", options: ["Active", "Contained", "Closed"] }, { key: "commander", label: "Incident commander" }, { key: "notes", label: "Notes", type: "textarea", table: false },
  ],
  kpis: [{ label: "Activations", value: r => r.length }, { label: "Active now", value: r => n(r, x => x.status === "Active"), tone: "red" },
         { label: "Contained", value: r => n(r, x => x.status === "Contained"), tone: "yellow" }, { label: "Closed", value: r => n(r, x => x.status === "Closed"), tone: "green" }],
  seed: [],
};
export const BaggagePage = () => <RecordsPage cfg={BAGGAGE} />;
export const SecurityPage = () => <RecordsPage cfg={SECURITY} />;
export const CargoPage = () => <RecordsPage cfg={CARGO} />;
export const CheckInPage = () => <RecordsPage cfg={CHECKIN} />;
export const StaffPage = () => <RecordsPage cfg={STAFF} />;
export const FeedbackPage = () => <RecordsPage cfg={FEEDBACK} />;
export const EmergencyPage = () => <RecordsPage cfg={EMERGENCY} />;
