import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIAnalysisView() {
  const analyses = useQuery(api.aiAnalysis.getAnalysis, {});

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
        <Brain className="h-6 w-6 text-neon-pink" />
        <h1 className="text-2xl font-bold text-neon-green">AI Analysis</h1>
      </div>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyses?.map((a) => (
              <div key={a._id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-semibold">{a.summary}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.details}</div>
                    <div className="text-xs text-muted-foreground mt-1">Type: {a.analysisType} • Target: {a.targetType}</div>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {a.recommendations.map((r, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground">{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end">
                    <Badge className={sevClass(a.severity)}>{a.severity}</Badge>
                    <span className="text-xs text-muted-foreground mt-1">Confidence: {a.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
            {(!analyses || analyses.length === 0) && (
              <p className="text-sm text-muted-foreground">No analyses found. Load sample data or trigger the /analyze endpoint.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
