import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
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

  // Fetch AI analyses to show recommendations
  const aiAnalyses = useQuery(api.aiAnalysis.getAnalysis, { limit: 100 });

  // Create a map of AI recommendations by keyword matching
  const getRecommendationsForResult = (result: any) => {
    if (result.type === "analysis") {
      // If it's already an analysis, fetch full details
      const fullAnalysis = aiAnalyses?.find(a => a._id === result.id);
      return fullAnalysis?.recommendations || [];
    }
    
    // For IOCs and logs, try to find related AI analyses
    const relatedAnalyses = aiAnalyses?.filter(analysis => {
      const searchText = `${analysis.summary} ${analysis.details}`.toLowerCase();
      const resultText = `${result.title} ${result.description}`.toLowerCase();
      
      // Check if they share keywords
      const resultWords = resultText.split(/\s+/).filter(w => w.length > 3);
      return resultWords.some(word => searchText.includes(word));
    }) || [];

    // Return recommendations from the most confident analysis
    if (relatedAnalyses.length > 0) {
      const bestMatch = relatedAnalyses.sort((a, b) => b.confidence - a.confidence)[0];
      return bestMatch.recommendations;
    }

    return [];
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
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-neon-pink" />
            Results with AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results?.map((r) => {
              const recommendations = getRecommendationsForResult(r);
              
              return (
                <div key={`${r.type}-${r.id}`} className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3">
                  {/* Main Result Info */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold">{r.title}</div>
                        <Badge className={sevClass(r.severity)}>{r.severity}</Badge>
                        {r.type === "analysis" && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            AI Analysis
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.source ? `Source: ${r.source} • ` : ""}{new Date(r.timestamp).toLocaleString()}
                        {r.anomalyScore !== null ? ` • Anomaly: ${r.anomalyScore}` : ""}
                        {r.confidence !== null ? ` • Confidence: ${r.confidence}%` : ""}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations Section */}
                  {recommendations.length > 0 && (
                    <div className="mt-3 p-3 rounded-md bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-neon-green">AI Recommendations</span>
                      </div>
                      <div className="space-y-2">
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(!results || results.length === 0) && (
              <p className="text-sm text-muted-foreground">No results. Try a different keyword or load sample data.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}