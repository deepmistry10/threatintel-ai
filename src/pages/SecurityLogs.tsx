import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityLogs() {
  const logs = useQuery(api.logs.getLogs, {});

  const levelToSev = (lvl: string) =>
    lvl === "critical" ? "critical" : lvl === "error" ? "high" : lvl === "warn" ? "medium" : "low";

  const sevClass = (s: string) => {
    switch (s) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-neon-blue" />
        <h1 className="text-2xl font-bold text-neon-green">Security Logs</h1>
      </div>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs?.map((log) => (
              <div key={log._id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{log.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {log.source} • {new Date(log.timestamp).toLocaleString()} • IP: {log.sourceIp || "N/A"}
                  </div>
                  {(log.metadata) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.metadata.endpoint ? `Endpoint: ${log.metadata.endpoint}` : ""} {log.metadata.statusCode ? `• Status: ${log.metadata.statusCode}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 ml-3 flex flex-col items-end">
                  <Badge className={sevClass(levelToSev(log.level))}>{log.level}</Badge>
                  <span className="text-xs text-muted-foreground mt-1">Anomaly: {log.anomalyScore}</span>
                </div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <p className="text-sm text-muted-foreground">No logs found. Load sample data from the landing page.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
