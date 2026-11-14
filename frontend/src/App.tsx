import { API_ENABLED } from "./config";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar }            from "./components/layout/Sidebar";
import { TopBar }             from "./components/layout/TopBar";
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.Dashboard })));
const PaymentsPage = lazy(() => import("./pages/admin/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const MetricsPage = lazy(() => import("./pages/admin/MetricsPage").then(m => ({ default: m.MetricsPage })));
const PartnerKeys = lazy(() => import("./pages/marketplace/PartnerKeys").then(m => ({ default: m.PartnerKeys })));
const FlightsPage = lazy(() => import("./pages/admin/FlightsPage").then(m => ({ default: m.FlightsPage })));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage").then(m => ({ default: m.SettingsPage })));
const GraphQLExplorer = lazy(() => import("./pages/graphql/GraphQLExplorer").then(m => ({ default: m.GraphQLExplorer })));
const DigitalTwin = lazy(() => import("./pages/twin/DigitalTwin").then(m => ({ default: m.DigitalTwin })));
const AIPredictions = lazy(() => import("./pages/ai/AIPredictions").then(m => ({ default: m.AIPredictions })));
const NotificationCenter = lazy(() => import("./pages/notifications/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage").then(m => ({ default: m.ReportsPage })));
const AirportMapPage = lazy(() => import("./pages/wayfinding/AirportMapPage").then(m => ({ default: m.AirportMapPage })));
const AnnouncementsPage = lazy(() => import("./pages/announcements/AnnouncementsPage").then(m => ({ default: m.AnnouncementsPage })));
const IntegrationsHub = lazy(() => import("./pages/integrations/IntegrationsHub").then(m => ({ default: m.IntegrationsHub })));
const BaggageClaimPredictor = lazy(() => import("./pages/baggage_predict/BaggageClaimPredictor").then(m => ({ default: m.BaggageClaimPredictor })));
const BiometricCheckIn = lazy(() => import("./pages/biometric/BiometricCheckIn").then(m => ({ default: m.BiometricCheckIn })));
const ApiMarketplace = lazy(() => import("./pages/marketplace/ApiMarketplace").then(m => ({ default: m.ApiMarketplace })));
const WhatsAppBot = lazy(() => import("./pages/whatsapp/WhatsAppBot").then(m => ({ default: m.WhatsAppBot })));
const Autopilot = lazy(() => import("./pages/ops/Autopilot").then(m => ({ default: m.Autopilot })));
const WhatIf = lazy(() => import("./pages/ops/WhatIf").then(m => ({ default: m.WhatIf })));
const Copilot = lazy(() => import("./pages/ops/Copilot").then(m => ({ default: m.Copilot })));
const CrowdHeatmap = lazy(() => import("./pages/ops2/CrowdHeatmap").then(m => ({ default: m.CrowdHeatmap })));
const GateOptimizer = lazy(() => import("./pages/ops2/GateOptimizer").then(m => ({ default: m.GateOptimizer })));
const CarbonOps = lazy(() => import("./pages/ops2/CarbonOps").then(m => ({ default: m.CarbonOps })));
const Playbooks = lazy(() => import("./pages/ops2/Playbooks").then(m => ({ default: m.Playbooks })));
const Turnaround = lazy(() => import("./pages/ops2/Turnaround").then(m => ({ default: m.Turnaround })));
const AccessibilityConcierge = lazy(() => import("./pages/ops2/Accessibility").then(m => ({ default: m.AccessibilityConcierge })));
const LostFound = lazy(() => import("./pages/ops2/LostFound").then(m => ({ default: m.LostFound })));
const MyJourney = lazy(() => import("./pages/ops2/MyJourney").then(m => ({ default: m.MyJourney })));
const RetailBids = lazy(() => import("./pages/ops2/RetailBids").then(m => ({ default: m.RetailBids })));
const lv = (file: string, k: string) => lazy(() => import(`./pages/live/${file}.tsx`).then(m => ({ default: (m as any)[k] })));
const rec = (k: string) => lazy(() => import("./pages/records/configs").then(m => ({ default: (m as any)[k] })));
const IncidentsPage = rec("IncidentsPage"), FuelManagement = rec("FuelPage"), MaintenancePage = rec("MaintenancePage"), ContractsPage = rec("ContractsPage"), ParkingPage = rec("ParkingPage"),
  BillingPortal = lv("Billing", "BillingPortal"), AnalyticsDashboard = lv("Analytics", "AnalyticsDashboard"), KPIDashboard = lv("Analytics", "KPIDashboard"),
  PassengerPortal = lv("Portals", "PassengerPortal"), AirlinePortal = lv("Portals", "AirlinePortal"), PilotDashboard = lv("Portals", "PilotDashboard"), RetailerDashboard = lv("Portals", "RetailerDashboard"),
  GatesPage = lv("Gates", "GatesPage"), RevenueDashboard = lv("Revenue", "RevenueDashboard"), CarbonDashboard = lv("Carbon", "CarbonDashboard"), FlightScheduler = lv("Scheduler", "FlightScheduler"),
  TenantManager = lazy(() => import("./pages/tenants/TenantManager").then(m => ({ default: m.TenantManager }))),
  RetailPage = rec("RetailPage"), SubscriptionPage = rec("SubscriptionPage"),
  BaggagePage = lazy(() => import("./pages/baggage/BaggagePage").then(m => ({ default: m.BaggagePage }))), SecurityPage = rec("SecurityPage"), SecurityOpsPage = rec("SecurityPage"), StaffManagement = rec("StaffPage"), CargoPage = rec("CargoPage"), CheckInSystem = rec("CheckInPage"), FeedbackPage = rec("FeedbackPage"), EmergencyCenter = rec("EmergencyPage");
/** Pages whose numbers come from the server when signed in to the live backend. Everything else shows built-in sample data. */
const LIVE_PAGES = new Set(["dashboard", "flights", "autopilot", "whatif", "copilot", "heatmap", "gateopt", "carbonops", "playbooks", "turnaround", "accessibility",
  "lostfound", "journey", "bids", "announcements", "incidents", "maintenance", "contracts", "parking", "fuel", "weather", "ai", "marketplace",
  "analytics", "kpi", "revenue", "gates", "carbon", "airline", "pilot", "retailer", "passenger", "tenants", "baggage", "security", "security_ops", "cargo", "checkin", "staff", "feedback", "emergency", "billing", "scheduler", "biometric", "retail", "subscription", "partner", "twin", "map", "settings", "branding", "integrations", "payments", "whatsapp", "reports", "notifications", "websocket"]);
const LandingPage = lazy(() => import("./pages/landing/LandingPage").then(m => ({ default: m.LandingPage })));
const WeatherMonitor = lazy(() => import("./pages/weather/WeatherMonitor").then(m => ({ default: m.WeatherMonitor })));
const APITester = lazy(() => import("./pages/api_tester/APITester").then(m => ({ default: m.APITester })));
const WebSocketFeed = lazy(() => import("./pages/websocket/WebSocketFeed").then(m => ({ default: m.WebSocketFeed })));
const BrandingPage = lazy(() => import("./pages/branding/BrandingPage").then(m => ({ default: m.BrandingPage })));
const DeploymentPage = lazy(() => import("./pages/deployment/DeploymentPage").then(m => ({ default: m.DeploymentPage })));
import { ErrorBoundary }    from "./components/ui/ErrorBoundary";
import { PageSkeleton }     from "./components/ui/Skeleton";
import { useAppStore }        from "./store/appStore";
import { useAuthStore }        from "./store/authStore";
import { LoginPage } from "./pages/auth/LoginPage";
import { allowedPagesFor } from "./components/layout/Sidebar";
import { OfflineBanner } from "./components/ui/OfflineBanner";
import { useRealtime }        from "./hooks/useRealtime";
import { useFlightAlerts }    from "./hooks/useFlightAlerts";

const qc = new QueryClient({ defaultOptions:{ queries:{ retry:1, staleTime:5000 } } });

const PAGES: Record<string, React.ReactNode> = {
  dashboard:     <Dashboard />,
  flights:       <FlightsPage />,
  gates:         <GatesPage />,
  baggage:       <BaggagePage />,
  analytics:     <AnalyticsDashboard />,
  payments:      <PaymentsPage />,
  billing:       <BillingPortal />,
  notifications: <NotificationCenter />,
  passenger:     <PassengerPortal />,
  partner:       <PartnerKeys />,
  staff:         <StaffManagement />,
  revenue:       <RevenueDashboard />,
  incidents:     <IncidentsPage />,
  emergency:     <EmergencyCenter />,
  reports:       <ReportsPage />,
  cargo:         <CargoPage />,
  map:           <AirportMapPage />,
  scheduler:     <FlightScheduler />,
  checkin:       <CheckInSystem />,
  fuel:          <FuelManagement />,
  maintenance:   <MaintenancePage />,
  weather:       <WeatherMonitor />,
  announcements: <AnnouncementsPage />,
  contracts:     <ContractsPage />,
  carbon:        <CarbonDashboard />,
  autopilot:     <Autopilot />,
  whatif:        <WhatIf />,
  copilot:       <Copilot />,
  heatmap: <CrowdHeatmap />,
  gateopt: <GateOptimizer />,
  carbonops: <CarbonOps />,
  playbooks: <Playbooks />,
  turnaround: <Turnaround />,
  accessibility: <AccessibilityConcierge />,
  lostfound: <LostFound />,
  journey: <MyJourney />,
  bids: <RetailBids />,

  baggage_predict: <BaggageClaimPredictor />,
  biometric:     <BiometricCheckIn />,
  marketplace:   <ApiMarketplace />,
  whatsapp:      <WhatsAppBot />,
  kpi:           <KPIDashboard />,
  integrations:  <IntegrationsHub />,
  parking:       <ParkingPage />,
  retail:        <RetailPage />,
  feedback:      <FeedbackPage />,
  metrics:       <MetricsPage />,
  traces:        <MetricsPage />,
  graphql:       <GraphQLExplorer />,
  twin:          <DigitalTwin />,
  ai:            <AIPredictions />,
  security:      <SecurityPage />,
  security_ops:  <SecurityOpsPage />,
  retailer:      <RetailerDashboard />,
  airline:       <AirlinePortal />,
  pilot:         <PilotDashboard />,
  subscription:  <SubscriptionPage />,
  settings:      <SettingsPage />,
  tenants:       <TenantManager />,
  branding:      <BrandingPage />,
  api_test:      <APITester />,
  websocket:     <WebSocketFeed />,
  deployment:    <DeploymentPage />,
};

function AppContent() {
  useRealtime(10000);
  useFlightAlerts();
  const { activePage, sidebarOpen, setSidebar, setActivePage } = useAppStore();
  const { isLoggedIn, user } = useAuthStore();
  const [showLogin, setShowLogin] = useState(() => { try { return sessionStorage.getItem("aerobase.login") === "1" || location.hash === "#login" || location.hash.startsWith("#/reset"); } catch { return false; } });

  // Sign out when a server-issued JWT expires (checked on load and every 30s).
  useEffect(() => {
    const check = () => {
      const { source, expiresAt, logout } = useAuthStore.getState();
      if (source === "backend" && expiresAt && Date.now() >= expiresAt) logout();
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  // Keep the URL hash in sync with the page so Back/Forward and refresh work (no router in this app).
  const role = user?.role;
  const pendingHash = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoggedIn || !role) return;
    const allowed = allowedPagesFor(role);
    const fromHash = () => { const p = location.hash.replace(/^#\/?/, ""); return p && allowed.has(p) ? p : null; };
    const initial = fromHash();
    if (initial && initial !== useAppStore.getState().activePage) { pendingHash.current = initial; setActivePage(initial); }
    const onPop = () => setActivePage(fromHash() ?? "dashboard");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isLoggedIn, role, setActivePage]);
  useEffect(() => {
    if (!isLoggedIn) return;
    if (pendingHash.current && pendingHash.current !== activePage) return;   // wait until the hash page has been applied
    pendingHash.current = null;
    const want = "#/" + activePage;
    if (location.hash !== want) history.pushState(null, "", want);
  }, [isLoggedIn, activePage]);

  if (!isLoggedIn) return showLogin ? <LoginPage /> : (
    <Suspense fallback={<PageSkeleton />}><LandingPage onEnter={() => { setShowLogin(true); try { sessionStorage.setItem("aerobase.login", "1"); } catch { /* ignore */ } }} /></Suspense>
  );


  // Auto-route by role
  const sl = user?.staffLevel||"";
  const liveMode = API_ENABLED && useAuthStore.getState().source === "backend";
  const effectivePage =
    user?.role==="retailer" && !["retailer","map","flights","payments","passenger","checkin","bids"].includes(activePage)
      ? "retailer"
    : sl.startsWith("pilot_") && activePage==="dashboard"
      ? "pilot"
    : sl.startsWith("airline_") && activePage==="dashboard"
      ? "airline"
    : sl==="staff_security" && activePage==="dashboard"
      ? "security_ops"
    : activePage;

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <Sidebar />

      {/* Main content wrapper — offset by sidebar width */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-56" : "lg:ml-14"}`}
      >
        <TopBar />
        <OfflineBanner />

        {/* Page content — below topbar */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <ErrorBoundary resetKey={effectivePage}>
          <Suspense fallback={<PageSkeleton />}>
          {liveMode && PAGES[effectivePage] && !LIVE_PAGES.has(effectivePage) && (
            <div role="note" className="mb-4 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
              Sample data: this view is not yet connected to your airport&apos;s live data.
            </div>
          )}
          {PAGES[effectivePage] ?? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <div className="text-5xl mb-4">✈</div>
                <p className="text-xl font-semibold text-white mb-1">Page not available</p>
                <p className="text-sm text-slate-400 mb-4">“{activePage}” isn’t available for your account.</p>
                <button onClick={() => setActivePage("dashboard")} className="px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 text-sm">Back to dashboard</button>
              </div>
            </div>
          )}
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AppContent />
    </QueryClientProvider>
  );
}
