import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ThreatHunt() {
  const [keyword, setKeyword] = useState("");
  const results = useQuery(api.hunt.getHuntResults, { keyword: keyword || undefined, limit: 50 });

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
        <Search className="h-6 w-6 text-neon-blue" />
        <h1 className="text-2xl font-bold text-neon-green">Threat Hunt</h1>
      </div>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Keyword (e.g., IP, domain, summary)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="max-w-md"
            />
            <Button className="glow-blue" onClick={() => setKeyword(keyword.trim())}>
              <Search className="mr-2 h-4 w-4" />
              Run
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results?.map((r) => (
              <div key={`${r.type}-${r.id}`} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.source ? `Source: ${r.source} • ` : ""}{new Date(r.timestamp).toLocaleString()}
                    {r.anomalyScore !== null ? ` • Anomaly: ${r.anomalyScore}` : ""}
                    {r.confidence !== null ? ` • Confidence: ${r.confidence}%` : ""}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <Badge className={sevClass(r.severity)}>{r.severity}</Badge>
                </div>
              </div>
            ))}
            {(!results || results.length === 0) && (
              <p className="text-sm text-muted-foreground">No results. Try a different keyword or load sample data.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
