import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar }            from "./components/layout/Sidebar";
import { TopBar }             from "./components/layout/TopBar";
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.Dashboard })));
const PaymentsPage = lazy(() => import("./pages/admin/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const MetricsPage = lazy(() => import("./pages/admin/MetricsPage").then(m => ({ default: m.MetricsPage })));
const PartnerPortal = lazy(() => import("./pages/partner/PartnerPortal").then(m => ({ default: m.PartnerPortal })));
const BillingPortal = lazy(() => import("./pages/billing/BillingPortal").then(m => ({ default: m.BillingPortal })));
const AnalyticsDashboard = lazy(() => import("./pages/analytics/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const PassengerPortal = lazy(() => import("./pages/passenger/PassengerPortal").then(m => ({ default: m.PassengerPortal })));
const FlightsPage = lazy(() => import("./pages/admin/FlightsPage").then(m => ({ default: m.FlightsPage })));
const GatesPage = lazy(() => import("./pages/admin/GatesPage").then(m => ({ default: m.GatesPage })));
const BaggagePage = lazy(() => import("./pages/admin/BaggagePage").then(m => ({ default: m.BaggagePage })));
const SecurityPage = lazy(() => import("./pages/admin/SecurityPage").then(m => ({ default: m.SecurityPage })));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage").then(m => ({ default: m.SettingsPage })));
const GraphQLExplorer = lazy(() => import("./pages/graphql/GraphQLExplorer").then(m => ({ default: m.GraphQLExplorer })));
const DigitalTwin = lazy(() => import("./pages/twin/DigitalTwin").then(m => ({ default: m.DigitalTwin })));
const AIPredictions = lazy(() => import("./pages/ai/AIPredictions").then(m => ({ default: m.AIPredictions })));
const NotificationCenter = lazy(() => import("./pages/notifications/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const StaffManagement = lazy(() => import("./pages/staff/StaffManagement").then(m => ({ default: m.StaffManagement })));
const RevenueDashboard = lazy(() => import("./pages/revenue/RevenueDashboard").then(m => ({ default: m.RevenueDashboard })));
const IncidentsPage = lazy(() => import("./pages/incidents/IncidentsPage").then(m => ({ default: m.IncidentsPage })));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage").then(m => ({ default: m.ReportsPage })));
const CargoPage = lazy(() => import("./pages/cargo/CargoPage").then(m => ({ default: m.CargoPage })));
const AirportMap = lazy(() => import("./pages/wayfinding/AirportMap").then(m => ({ default: m.AirportMap })));
const FlightScheduler = lazy(() => import("./pages/scheduler/FlightScheduler").then(m => ({ default: m.FlightScheduler })));
const CheckInSystem = lazy(() => import("./pages/checkin/CheckInSystem").then(m => ({ default: m.CheckInSystem })));
const FuelManagement = lazy(() => import("./pages/fuel/FuelManagement").then(m => ({ default: m.FuelManagement })));
const MaintenancePage = lazy(() => import("./pages/maintenance/MaintenancePage").then(m => ({ default: m.MaintenancePage })));
const AnnouncementsPage = lazy(() => import("./pages/announcements/AnnouncementsPage").then(m => ({ default: m.AnnouncementsPage })));
const ContractsPage = lazy(() => import("./pages/contracts/ContractsPage").then(m => ({ default: m.ContractsPage })));
const KPIDashboard = lazy(() => import("./pages/kpi/KPIDashboard").then(m => ({ default: m.KPIDashboard })));
const IntegrationsHub = lazy(() => import("./pages/integrations/IntegrationsHub").then(m => ({ default: m.IntegrationsHub })));
const CarbonDashboard = lazy(() => import("./pages/carbon/CarbonDashboard").then(m => ({ default: m.CarbonDashboard })));
const BaggageClaimPredictor = lazy(() => import("./pages/baggage_predict/BaggageClaimPredictor").then(m => ({ default: m.BaggageClaimPredictor })));
const BiometricCheckIn = lazy(() => import("./pages/biometric/BiometricCheckIn").then(m => ({ default: m.BiometricCheckIn })));
const ApiMarketplace = lazy(() => import("./pages/marketplace/ApiMarketplace").then(m => ({ default: m.ApiMarketplace })));
const WhatsAppBot = lazy(() => import("./pages/whatsapp/WhatsAppBot").then(m => ({ default: m.WhatsAppBot })));
const Autopilot = lazy(() => import("./pages/ops/Autopilot").then(m => ({ default: m.Autopilot })));
const WhatIf = lazy(() => import("./pages/ops/WhatIf").then(m => ({ default: m.WhatIf })));
const Copilot = lazy(() => import("./pages/ops/Copilot").then(m => ({ default: m.Copilot })));
const LandingPage = lazy(() => import("./pages/landing/LandingPage").then(m => ({ default: m.LandingPage })));
const WeatherMonitor = lazy(() => import("./pages/weather/WeatherMonitor").then(m => ({ default: m.WeatherMonitor })));
const ParkingPage = lazy(() => import("./pages/parking/ParkingPage").then(m => ({ default: m.ParkingPage })));
const RetailPage = lazy(() => import("./pages/retail/RetailPage").then(m => ({ default: m.RetailPage })));
const FeedbackPage = lazy(() => import("./pages/feedback/FeedbackPage").then(m => ({ default: m.FeedbackPage })));
const APITester = lazy(() => import("./pages/api_tester/APITester").then(m => ({ default: m.APITester })));
const WebSocketFeed = lazy(() => import("./pages/websocket/WebSocketFeed").then(m => ({ default: m.WebSocketFeed })));
const TenantManager = lazy(() => import("./pages/tenants/TenantManager").then(m => ({ default: m.TenantManager })));
const BrandingPage = lazy(() => import("./pages/branding/BrandingPage").then(m => ({ default: m.BrandingPage })));
const DeploymentPage = lazy(() => import("./pages/deployment/DeploymentPage").then(m => ({ default: m.DeploymentPage })));
import { ErrorBoundary }    from "./components/ui/ErrorBoundary";
import { PageSkeleton }     from "./components/ui/Skeleton";
const SubscriptionPage = lazy(() => import("./pages/passenger/SubscriptionPage").then(m => ({ default: m.SubscriptionPage })));
const AirlinePortal = lazy(() => import("./pages/airline/AirlinePortal").then(m => ({ default: m.AirlinePortal })));
const PilotDashboard = lazy(() => import("./pages/airline/PilotDashboard").then(m => ({ default: m.PilotDashboard })));
const RetailerDashboard = lazy(() => import("./pages/retailer/RetailerDashboard").then(m => ({ default: m.RetailerDashboard })));
const SecurityOpsPage = lazy(() => import("./pages/security_ops/SecurityOpsPage").then(m => ({ default: m.SecurityOpsPage })));
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
  partner:       <PartnerPortal />,
  staff:         <StaffManagement />,
  revenue:       <RevenueDashboard />,
  incidents:     <IncidentsPage />,
  reports:       <ReportsPage />,
  cargo:         <CargoPage />,
  map:           <AirportMap />,
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
  const [showLogin, setShowLogin] = useState(() => { try { return sessionStorage.getItem("aerobase.login") === "1" || location.hash === "#login"; } catch { return false; } });

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
  const effectivePage =
    user?.role==="retailer" && !["retailer","map","flights","payments","passenger","checkin"].includes(activePage)
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
