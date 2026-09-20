import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { EHRProvider } from "./contexts/EHRContext";
import Index from "./pages/Index";
import LabsPage from "./pages/Labs";
import MotorLab from "./components/labs/MotorLab";
import { VoiceLab } from "./components/labs/VoiceLab";
import { EyeLab } from "./components/labs/EyeLab";
import CardiovascularLab from "./components/labs/CardiovascularLab";
import MentalHealthLab from "./components/labs/MentalHealthLab";
import VisionHearingLab from "./components/labs/VisionHearingLab";
import GaitLab from "./components/labs/GaitLab";
import Purpose from "./pages/Purpose";
import About from "./pages/About";
import HardwareIntegration from "./pages/HardwareIntegration";
import DeviceModel from "./pages/DeviceModel";
import { EHRPage } from "./pages/EHRPage";
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/ReportsPage";
import BPTrackerPage from "./pages/BPTrackerPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import DiabetesManagementPage from "./pages/DiabetesManagementPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ComingSoon from "./components/ComingSoon";

// New feature pages
import SymptomCheckerPage from "./pages/SymptomCheckerPage";
import PeriodTrackerPage from "./pages/PeriodTrackerPage";
import VaccinationPage from "./pages/VaccinationPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import HealthPredictionsPage from "./pages/HealthPredictionsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import VoiceEntryPage from "./pages/VoiceEntryPage";
import DoctorReportPage from "./pages/DoctorReportPage";
import SmartwatchPage from "./pages/SmartwatchPage";
import CaregiverDashboard from "./pages/CaregiverDashboard";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
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
          <Route path="respiratory" element={<ComingSoon title="Respiratory Lab" description="Advanced respiratory analysis and breathing pattern assessment coming soon." />} />
          <Route path="skin-dermal" element={<ComingSoon title="Skin & Dermal Lab" description="Skin health analysis and dermal condition assessment coming soon." />} />
          <Route path="nutritional" element={<ComingSoon title="Nutritional Lab" description="Comprehensive nutritional analysis and dietary assessment coming soon." />} />
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

        {/* Public Routes */}
        <Route path="/purpose" element={<Purpose />} />
        <Route path="/about" element={<About />} />
        <Route path="/hardware-integration" element={<HardwareIntegration />} />
        <Route path="/device-model" element={<DeviceModel />} />
        
        {/* Caregiver Route - Not protected, accessible without login */}
        <Route path="/caregiver/:patientId" element={<CaregiverDashboard />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};


const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <EHRProvider>
            <ThemeProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router>
                    <AppContent />
                  </Router>
                </TooltipProvider>
              </AuthProvider>
            </ThemeProvider>
          </EHRProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
