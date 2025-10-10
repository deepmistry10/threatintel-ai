import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, Shield, Activity, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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

  const sevColor = (s: string) => {
    switch (s) {
      case "critical": return "rgb(239 68 68)";
      case "high": return "rgb(249 115 22)";
      case "medium": return "rgb(234 179 8)";
      case "low": return "rgb(34 197 94)";
      default: return "rgb(156 163 175)";
    }
  };

  // Fetch AI analyses to show recommendations
  const aiAnalyses = useQuery(api.aiAnalysis.getAnalysis, { limit: 100 });

  // Create a map of AI recommendations by keyword matching
  const getRecommendationsForResult = (result: any) => {
    if (result.type === "analysis") {
      const fullAnalysis = aiAnalyses?.find(a => a._id === result.id);
      return fullAnalysis?.recommendations || [];
    }
    
    const relatedAnalyses = aiAnalyses?.filter(analysis => {
      const searchText = `${analysis.summary} ${analysis.details}`.toLowerCase();
      const resultText = `${result.title} ${result.description}`.toLowerCase();
      
      const resultWords = resultText.split(/\s+/).filter(w => w.length > 3);
      return resultWords.some(word => searchText.includes(word));
    }) || [];

    if (relatedAnalyses.length > 0) {
      const bestMatch = relatedAnalyses.sort((a, b) => b.confidence - a.confidence)[0];
      return bestMatch.recommendations;
    }

    return [];
  };

  // Calculate statistics for visual representation
  // Export to CSV function
  const exportToCSV = () => {
    if (!results || results.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvRows = [];
    // Header
    csvRows.push([
      "Type",
      "Title",
      "Description",
      "Severity",
      "Confidence",
      "Source",
      "Timestamp",
      "Anomaly Score",
      "AI Recommendations Count",
      "AI Recommendations"
    ].join(","));

    // Data rows
    results.forEach(r => {
      const recommendations = getRecommendationsForResult(r);
      const recsText = recommendations.map(rec => rec.replace(/,/g, ";")).join(" | ");
      
      csvRows.push([
        r.type,
        `"${(r.title || "").replace(/"/g, '""')}"`,
        `"${(r.description || "").replace(/"/g, '""')}"`,
        r.severity,
        r.confidence || "",
        r.source || "",
        new Date(r.timestamp).toISOString(),
        r.anomalyScore !== null ? r.anomalyScore : "",
        recommendations.length,
        `"${recsText.replace(/"/g, '""')}"`
      ].join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `threat_hunt_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported successfully");
  };

  const stats = useMemo(() => {
    if (!results) return null;
    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    let withRecommendations = 0;
    
    results.forEach(r => {
      if (r.severity in severityCounts) {
        severityCounts[r.severity as keyof typeof severityCounts]++;
      }
      if (r.confidence !== null && r.confidence !== undefined) {
        totalConfidence += r.confidence;
        confidenceCount++;
      }
      const recs = getRecommendationsForResult(r);
      if (recs.length > 0) withRecommendations++;
    });
    
    return {
      total: results.length,
      severityCounts,
      avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
      withRecommendations,
    };
  }, [results, aiAnalyses]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-neon-blue" />
          <h1 className="text-2xl font-bold text-neon-green">Threat Hunt</h1>
        </div>
        <Button 
          className="glow-green" 
          onClick={exportToCSV}
          disabled={!results || results.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
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

      {/* Visual Statistics Dashboard */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-glow bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-neon-blue" />
                Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neon-blue">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-glow bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neon-green" />
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neon-green">{stats.avgConfidence}%</div>
              <Progress value={stats.avgConfidence} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-glow bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.withRecommendations}</div>
              <p className="text-xs text-muted-foreground mt-1">of {stats.total} results</p>
            </CardContent>
          </Card>

          <Card className="border-glow bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                Severity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400">Critical</span>
                <span className="font-bold">{stats.severityCounts.critical}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-400">High</span>
                <span className="font-bold">{stats.severityCounts.high}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-400">Medium</span>
                <span className="font-bold">{stats.severityCounts.medium}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-400">Low</span>
                <span className="font-bold">{stats.severityCounts.low}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              const confidencePercent = r.confidence || 0;
              
              return (
                <div 
                  key={`${r.type}-${r.id}`} 
                  className="p-4 rounded-lg bg-muted/50 border-2 border-border/50 space-y-3 hover:border-neon-blue/50 transition-all duration-300"
                  style={{
                    boxShadow: `0 0 20px ${sevColor(r.severity)}20`,
                  }}
                >
                  {/* Main Result Info */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="text-sm font-semibold truncate">{r.title}</div>
                        <Badge className={sevClass(r.severity)}>{r.severity}</Badge>
                        {r.type === "analysis" && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            AI Analysis
                          </Badge>
                        )}
                        {recommendations.length > 0 && (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            {recommendations.length} Recommendations
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.source ? `Source: ${r.source} • ` : ""}{new Date(r.timestamp).toLocaleString()}
                        {r.anomalyScore !== null ? ` • Anomaly: ${r.anomalyScore}` : ""}
                      </div>
                      
                      {/* Confidence Bar */}
                      {r.confidence !== null && r.confidence !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-bold text-neon-green">{confidencePercent}%</span>
                          </div>
                          <Progress 
                            value={confidencePercent} 
                            className="h-2"
                            style={{
                              background: `linear-gradient(to right, ${sevColor(r.severity)}40 0%, ${sevColor(r.severity)}10 100%)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendations Section with Enhanced Visuals */}
                  {recommendations.length > 0 && (
                    <div className="mt-3 p-4 rounded-md bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border-2 border-purple-500/40 shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-full bg-yellow-400/20 border border-yellow-400/30">
                          <Lightbulb className="h-4 w-4 text-yellow-400" />
                        </div>
                        <span className="text-sm font-bold text-neon-green">AI-Generated Recommendations</span>
                        <Badge variant="outline" className="ml-auto bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {recommendations.length} Actions
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {recommendations.map((rec, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-start gap-3 p-2 rounded bg-background/50 border border-border/30 hover:border-neon-green/50 transition-all duration-200"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="p-1 rounded-full bg-green-400/20 border border-green-400/30">
                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                              </div>
                            </div>
                            <span className="text-xs text-foreground flex-1">{rec}</span>
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                              #{idx + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(!results || results.length === 0) && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No results. Try a different keyword or load sample data.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}