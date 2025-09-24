import { motion } from "framer-motion";
import { Shield, Activity, Brain, AlertTriangle, TrendingUp, Eye, Search, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const metrics = useQuery(api.dashboard.getDashboardMetrics);
  const threatFeed = useQuery(api.dashboard.getThreatFeed, { limit: 10 });
  const latestAnalysis = useQuery(api.threatLogs.getLatestThreatAnalysis);

  // Check for CONVEX_URL configuration
  useEffect(() => {
    if (!import.meta.env.VITE_CONVEX_URL) {
      console.error("VITE_CONVEX_URL not configured");
    }
  }, []);

  if (!import.meta.env.VITE_CONVEX_URL) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>VITE_CONVEX_URL environment variable is not set. Please configure it in your environment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-400";
      case "high": return "text-orange-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-6 space-y-6 flex-shrink-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-neon-green mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time threat intelligence and security monitoring</p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-glow bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-neon-pink glow-pink" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-pink glow-pink">
                  {metrics?.activeThreats ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Critical severity IOCs
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-glow bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Log Events (24h)</CardTitle>
                <Activity className="h-4 w-4 text-neon-blue glow-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-blue glow-blue">
                  {metrics?.logEvents ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Security events logged
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-glow bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                <Brain className="h-4 w-4 text-neon-green glow-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-green glow-green">
                  {metrics?.aiAnalyses ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestAnalysis ? `Latest: ${latestAnalysis.summary.slice(0, 30)}...` : "Total analyses completed"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-glow bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Threats</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {metrics?.recentThreats ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Threats in last 24h
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex-shrink-0"
        >
          <h2 className="text-xl font-semibold mb-4 text-neon-green">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate("/dashboard/iocs")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 glow-green"
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Manage IOCs</span>
            </Button>
            
            <Button
              onClick={() => navigate("/dashboard/logs")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-accent/20 hover:bg-accent/30 border border-accent/30 glow-pink"
            >
              <Activity className="h-6 w-6" />
              <span className="text-sm">View Logs</span>
            </Button>
            
            <Button
              onClick={() => navigate("/dashboard/analysis")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 glow-blue"
            >
              <Brain className="h-6 w-6" />
              <span className="text-sm">AI Analysis</span>
            </Button>
            
            <Button
              onClick={() => navigate("/dashboard/hunt")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30"
            >
              <Search className="h-6 w-6" />
              <span className="text-sm">Threat Hunt</span>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Threat Feed */}
      <div className="flex-grow min-h-0 p-6 pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="h-full"
        >
          <Card className="border-glow bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-neon-green" />
                <span>Live Threat Feed</span>
              </CardTitle>
              <CardDescription>
                Real-time security events and threat intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="space-y-3">
                {threatFeed?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {item.type === "ioc" && <Shield className="h-4 w-4 text-neon-green" />}
                      {item.type === "analysis" && <Brain className="h-4 w-4 text-neon-pink" />}
                      {item.type === "log" && <Activity className="h-4 w-4 text-neon-blue" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{item.title}</h4>
                        <Badge className={getSeverityBadge(item.severity)}>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {(!threatFeed || threatFeed.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No threat data available</p>
                    <p className="text-sm">Load sample data from the landing page to see live feeds</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Decorative bottom panel */}
      <div className="flex-shrink-0 h-16 bg-gradient-to-r from-primary/10 via-accent/10 to-blue-500/10 border-t border-glow" />
    </div>
  );
}
