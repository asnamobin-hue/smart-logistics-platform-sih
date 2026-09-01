import { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import EmergencyMode from "./pages/EmergencyMode.jsx"
import BottomNav from "./components/BottomNav.jsx"
import GlobalSearch from "./components/GlobalSearch.jsx"
import AICopilot from "./components/AICopilot.jsx"
import PageTransition from "./components/PageTransition.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import { EmergencyModeProvider } from "./context/EmergencyModeContext.jsx"
import Home from "./pages/Home.jsx"
import Emergency from "./pages/Emergency.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Accessibility from "./pages/Accessibility.jsx"
import FieldReport from "./pages/FieldReport.jsx"
import RoutePlanning from "./pages/RoutePlanning.jsx"
import Alerts from "./pages/Alerts.jsx"
import Analytics from "./pages/Analytics.jsx"
import DistrictMonitoring from "./pages/DistrictMonitoring.jsx"
import NotFound from "./pages/NotFound.jsx"

export default function App() {
  const location = useLocation()
  // Clicking the navbar's "Emergency" button opens this full-screen overlay
  // directly (matches the original Emergency Mode UI) instead of navigating
  // to a separate page.
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  return (
    <EmergencyModeProvider>
      <div>
        <Navbar emergencyOpen={emergencyOpen} onToggleEmergency={() => setEmergencyOpen((v) => !v)} />
        <GlobalSearch />
        <div className="app-layout">
          <main className="main-content">
            <ErrorBoundary>
              <PageTransition key={location.pathname}>
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/emergency" element={<Emergency />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/field-report" element={<FieldReport />} />
                  <Route path="/routes" element={<RoutePlanning />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/districts" element={<DistrictMonitoring />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </ErrorBoundary>
          </main>
        </div>
        <BottomNav />
        <AICopilot />
      </div>
      {emergencyOpen && <EmergencyMode onClose={() => setEmergencyOpen(false)} />}
    </EmergencyModeProvider>
  )
}