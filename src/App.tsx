import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Book = lazy(() => import("./pages/Book"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const DoctorManagement = lazy(() => import("./pages/admin/DoctorManagement"));
const PatientManagement = lazy(() => import("./pages/admin/PatientManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  const location = useLocation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                <Route path="/book" element={<PageTransition><Book /></PageTransition>} />
                <Route path="/doctors" element={<PageTransition><Doctors /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                <Route 
                  path="/dashboard" 
                  element={
                    <PageTransition>
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    </PageTransition>
                  } 
                />
                <Route 
                  path="/admin/*" 
                  element={
                    <PageTransition>
                      <ProtectedRoute requiredRole="patient">
                        <Routes>
                          <Route index element={<AdminDashboard />} />
                          <Route path="doctors" element={<DoctorManagement />} />
                          <Route path="patients" element={<PatientManagement />} />
                          <Route path="schedules" element={<div>Schedule Management - Coming Soon</div>} />
                          <Route path="settings" element={<div>Settings - Coming Soon</div>} />
                        </Routes>
                      </ProtectedRoute>
                    </PageTransition>
                  } 
                />
                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
