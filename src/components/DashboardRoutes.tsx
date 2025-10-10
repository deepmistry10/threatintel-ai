import { Routes, Route } from "react-router";
import AppLayout from "./AppLayout";
import Dashboard from "@/pages/Dashboard";
import IOCManager from "@/pages/IOCManager";
import SecurityLogs from "@/pages/SecurityLogs";
import AIAnalysisView from "@/pages/AIAnalysisView";
import ThreatHunt from "@/pages/ThreatHunt";
import Incidents from "@/pages/Incidents";
import ThreatFeeds from "@/pages/ThreatFeeds";
import MITRECoverage from "@/pages/MITRECoverage";

export default function DashboardRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/iocs" element={<IOCManager />} />
        <Route path="/logs" element={<SecurityLogs />} />
        <Route path="/analysis" element={<AIAnalysisView />} />
        <Route path="/hunt" element={<ThreatHunt />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/feeds" element={<ThreatFeeds />} />
        <Route path="/mitre" element={<MITRECoverage />} />
      </Routes>
    </AppLayout>
  );
}