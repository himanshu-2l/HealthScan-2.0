import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { EHRProvider } from "./contexts/EHRContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ComingSoon from "./components/ComingSoon";
import { MobileAppView } from "./pages/MobileAppView";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages and heavy lab modules for fast PWA initial paint
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LabsPage = lazy(() => import("./pages/Labs"));
const MotorLab = lazy(() => import("./components/labs/MotorLab"));
const VoiceLab = lazy(() => import("./components/labs/VoiceLab").then(m => ({ default: m.VoiceLab })));
const EyeLab = lazy(() => import("./components/labs/EyeLab").then(m => ({ default: m.EyeLab })));
const CardiovascularLab = lazy(() => import("./components/labs/CardiovascularLab"));
const MentalHealthLab = lazy(() => import("./components/labs/MentalHealthLab"));
const VisionHearingLab = lazy(() => import("./components/labs/VisionHearingLab"));
const GaitLab = lazy(() => import("./components/labs/GaitLab"));
const MedicineLensLab = lazy(() => import("./components/labs/MedicineLensLab"));
const BPTrackerPage = lazy(() => import("./pages/BPTrackerPage"));
const DiabetesManagementPage = lazy(() => import("./pages/DiabetesManagementPage"));
const PatientProfilePage = lazy(() => import("./pages/PatientProfilePage"));
const EHRPage = lazy(() => import("./pages/EHRPage").then(m => ({ default: m.EHRPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const Purpose = lazy(() => import("./pages/Purpose"));
const About = lazy(() => import("./pages/About"));
const HardwareIntegration = lazy(() => import("./pages/HardwareIntegration"));
const DeviceModel = lazy(() => import("./pages/DeviceModel"));

// New feature pages (lazy loaded)
const SymptomCheckerPage = lazy(() => import("./pages/SymptomCheckerPage"));
const PeriodTrackerPage = lazy(() => import("./pages/PeriodTrackerPage"));
const VaccinationPage = lazy(() => import("./pages/VaccinationPage"));
const EmergencyContactsPage = lazy(() => import("./pages/EmergencyContactsPage"));
const HealthPredictionsPage = lazy(() => import("./pages/HealthPredictionsPage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage"));
const VoiceEntryPage = lazy(() => import("./pages/VoiceEntryPage"));
const DoctorReportPage = lazy(() => import("./pages/DoctorReportPage"));
const SmartwatchPage = lazy(() => import("./pages/SmartwatchPage"));
const CaregiverDashboard = lazy(() => import("./pages/CaregiverDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 60000,
    },
  },
});

const PageLoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#070A11] flex items-center justify-center transition-colors duration-200">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs animate-pulse">
        HS
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Loading module...</span>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/" element={<MobileAppView />} />
        <Route path="/app" element={<MobileAppView />} />
        <Route path="/dashboard" element={<MobileAppView />} />
        <Route path="/web-overview" element={<Index />} />
        <Route path="/legacy-dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/bp-tracker" element={
          <ProtectedRoute>
            <BPTrackerPage />
          </ProtectedRoute>
        } />
        <Route path="/diabetes" element={
          <ProtectedRoute>
            <DiabetesManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PatientProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/labs" element={
          <ProtectedRoute>
            <LabsPage />
          </ProtectedRoute>
        }>
          <Route path="motor" element={<MotorLab />} />
          <Route path="voice" element={<VoiceLab />} />
          <Route path="eye" element={<EyeLab />} />
          <Route path="cardiovascular" element={<CardiovascularLab />} />
          <Route path="mental-health" element={<MentalHealthLab />} />
          <Route path="vision-hearing" element={<VisionHearingLab />} />
          <Route path="gait" element={<GaitLab />} />
          <Route path="medicine-lens" element={<MedicineLensLab />} />
        </Route>
        <Route path="/ehr" element={
          <ProtectedRoute>
            <EHRPage />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/symptom-checker" element={
          <ProtectedRoute>
            <SymptomCheckerPage />
          </ProtectedRoute>
        } />
        <Route path="/period-tracker" element={
          <ProtectedRoute>
            <PeriodTrackerPage />
          </ProtectedRoute>
        } />
        <Route path="/vaccinations" element={
          <ProtectedRoute>
            <VaccinationPage />
          </ProtectedRoute>
        } />
        <Route path="/emergency-contacts" element={
          <ProtectedRoute>
            <EmergencyContactsPage />
          </ProtectedRoute>
        } />
        <Route path="/health-predictions" element={
          <ProtectedRoute>
            <HealthPredictionsPage />
          </ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <RecommendationsPage />
          </ProtectedRoute>
        } />
        <Route path="/voice-entry" element={
          <ProtectedRoute>
            <VoiceEntryPage />
          </ProtectedRoute>
        } />
        <Route path="/doctor-report" element={
          <ProtectedRoute>
            <DoctorReportPage />
          </ProtectedRoute>
        } />
        <Route path="/smartwatch" element={
          <ProtectedRoute>
            <SmartwatchPage />
          </ProtectedRoute>
        } />
        <Route path="/medicine-lens" element={
          <ProtectedRoute>
            <MedicineLensLab />
          </ProtectedRoute>
        } />

        {/* Public Routes */}
        <Route path="/purpose" element={<Purpose />} />
        <Route path="/about" element={<About />} />
        <Route path="/hardware-integration" element={<HardwareIntegration />} />
        <Route path="/device-model" element={<DeviceModel />} />
        
        {/* Caregiver Route - Protected to prevent unauthorized access */}
        <Route path="/caregiver/:patientId" element={
          <ProtectedRoute>
            <CaregiverDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};


const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <EHRProvider>
              <ThemeProvider>
                <AuthProvider>
                  <TooltipProvider>
                    <Toaster />
                    <AppContent />
                  </TooltipProvider>
                </AuthProvider>
              </ThemeProvider>
            </EHRProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
