import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar }            from "./components/layout/Sidebar";
import { TopBar }             from "./components/layout/TopBar";
import { Dashboard }          from "./pages/admin/Dashboard";
import { PaymentsPage }       from "./pages/admin/PaymentsPage";
import { MetricsPage }        from "./pages/admin/MetricsPage";
import { PartnerPortal }      from "./pages/partner/PartnerPortal";
import { BillingPortal }      from "./pages/billing/BillingPortal";
import { AnalyticsDashboard } from "./pages/analytics/AnalyticsDashboard";
import { PassengerPortal }    from "./pages/passenger/PassengerPortal";
import { FlightsPage }        from "./pages/admin/FlightsPage";
import { GatesPage }          from "./pages/admin/GatesPage";
import { BaggagePage }        from "./pages/admin/BaggagePage";
import { SecurityPage }       from "./pages/admin/SecurityPage";
import { SettingsPage }       from "./pages/admin/SettingsPage";
import { GraphQLExplorer }    from "./pages/graphql/GraphQLExplorer";
import { DigitalTwin }        from "./pages/twin/DigitalTwin";
import { AIPredictions }      from "./pages/ai/AIPredictions";
import { NotificationCenter } from "./pages/notifications/NotificationCenter";
import { StaffManagement }    from "./pages/staff/StaffManagement";
import { RevenueDashboard }   from "./pages/revenue/RevenueDashboard";
import { IncidentsPage }      from "./pages/incidents/IncidentsPage";
import { ReportsPage }        from "./pages/reports/ReportsPage";
import { CargoPage }          from "./pages/cargo/CargoPage";
import { AirportMap }         from "./pages/wayfinding/AirportMap";
import { FlightScheduler }    from "./pages/scheduler/FlightScheduler";
import { CheckInSystem }      from "./pages/checkin/CheckInSystem";
import { FuelManagement }     from "./pages/fuel/FuelManagement";
import { MaintenancePage }    from "./pages/maintenance/MaintenancePage";
import { WeatherMonitor }     from "./pages/weather/WeatherMonitor";
import { ParkingPage }        from "./pages/parking/ParkingPage";
import { RetailPage }         from "./pages/retail/RetailPage";
import { FeedbackPage }       from "./pages/feedback/FeedbackPage";
import { APITester }          from "./pages/api_tester/APITester";
import { WebSocketFeed }      from "./pages/websocket/WebSocketFeed";
import { TenantManager }      from "./pages/tenants/TenantManager";
import { BrandingPage }       from "./pages/branding/BrandingPage";
import { DeploymentPage }   from "./pages/deployment/DeploymentPage";
import { ErrorBoundary }    from "./components/ui/ErrorBoundary";
import { SubscriptionPage }   from "./pages/passenger/SubscriptionPage";
import { AirlinePortal }   from "./pages/airline/AirlinePortal";
import { PilotDashboard }  from "./pages/airline/PilotDashboard";
import { RetailerDashboard } from "./pages/retailer/RetailerDashboard";
import { SecurityOpsPage } from "./pages/security_ops/SecurityOpsPage";
import { useAppStore }        from "./store/appStore";
import { useAuthStore }        from "./store/authStore";
import { LoginPage }           from "./pages/auth/LoginPage";
import { useRealtime }        from "./hooks/useRealtime";

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
  const { activePage, sidebarOpen, setSidebar } = useAppStore();
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <LoginPage />;


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
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "224px" : "56px" }}
      >
        <TopBar />

        {/* Page content — below topbar */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 mt-16">
          <ErrorBoundary>
          {PAGES[effectivePage] ?? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <div className="text-5xl mb-4">✈</div>
                <p className="text-xl font-semibold text-white capitalize mb-1">{activePage}</p>
                <p className="text-sm text-slate-400">Module coming soon</p>
              </div>
            </div>
          )}
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
