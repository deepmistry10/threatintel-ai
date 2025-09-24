import { Routes, Route } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import IOCManager from "@/pages/IOCManager";
import SecurityLogs from "@/pages/SecurityLogs";
import AIAnalysisView from "@/pages/AIAnalysisView";
import ThreatHunt from "@/pages/ThreatHunt";
import Incidents from "@/pages/Incidents";

export default function DashboardRoutes() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-cyber dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/iocs" element={<IOCManager />} />
        <Route path="/logs" element={<SecurityLogs />} />
        <Route path="/analysis" element={<AIAnalysisView />} />
        <Route path="/hunt" element={<ThreatHunt />} />
        <Route path="/incidents" element={<Incidents />} />
      </Routes>
    </AppLayout>
  );
}