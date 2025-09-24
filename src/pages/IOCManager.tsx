import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default function IOCManager() {
  const iocs = useQuery(api.iocs.getIOCs, {});

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
        <Shield className="h-6 w-6 text-neon-green" />
        <h1 className="text-2xl font-bold text-neon-green">IOC Management</h1>
      </div>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Indicators of Compromise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {iocs?.map((ioc) => (
              <div key={ioc._id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{ioc.type.toUpperCase()}: {ioc.value}</div>
                  <div className="text-xs text-muted-foreground truncate">{ioc.description || "No description"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Source: {ioc.source} • Confidence: {ioc.confidence}% • Active: {ioc.isActive ? "Yes" : "No"}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <Badge className={sevClass(ioc.severity)}>{ioc.severity}</Badge>
                </div>
              </div>
            ))}
            {(!iocs || iocs.length === 0) && (
              <p className="text-sm text-muted-foreground">No IOCs found. Load sample data from the landing page.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
