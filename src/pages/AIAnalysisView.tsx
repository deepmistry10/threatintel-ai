import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAction, useMutation } from "convex/react";
import { toast } from "sonner";
import { RefreshCw, Sparkles, Filter, Play } from "lucide-react";
import { useMemo, useState } from "react";

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

  const [analysisType, setAnalysisType] = useState<string>("all");
  const [targetType, setTargetType] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);
  const [liveOnly, setLiveOnly] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [manualTitle, setManualTitle] = useState<string>("manual_input");
  const [manualContent, setManualContent] = useState<string>("");

  const runAI = useAction(api.ai.generateAndSaveAnalysis);
  const createSamples = useMutation(api.aiAnalysis.createSampleAnalyses);
  const saveAnalysis = useMutation(api.aiAnalysis.saveAnalysisPublic);

  const analysesQuery = useQuery(api.aiAnalysis.getAnalysis, {
    analysisType,
    targetType,
    minConfidence: minConfidence || undefined,
    limit,
    liveOnly,
    // @ts-ignore force refetch
    _k: refreshKey,
  } as any);

  const stats = useQuery(api.aiAnalysis.getAnalysisStats, { liveOnly });

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleGenerateDemo = async () => {
    try {
      const res = await createSamples({});
      toast.success(`Generated ${res.created} demo analyses`);
      handleRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate demo analyses");
    }
  };

  const handleRunAI = async () => {
    if (!manualContent.trim()) {
      toast.error("Enter some content to analyze");
      return;
    }
    try {
      const a = await runAI({ content: manualContent, targetType: "manual_input" });
      await saveAnalysis({
        targetType: "manual_input",
        analysisType: "ai_threat_analysis",
        summary: a.summary,
        details: a.details,
        recommendations: a.recommendations,
        severity: a.severity,
        confidence: a.confidence,
        metadata: { model: "anthropic/claude-3.5-sonnet" },
      });
      toast.success("AI analysis saved");
      setManualContent("");
      handleRefresh();
    } catch (e) {
      console.error(e);
      toast.error("AI analysis failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-neon-pink" />
          <h1 className="text-2xl font-bold text-neon-green">AI Analysis</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="glow-green" onClick={handleGenerateDemo}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Demo Analysis
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Total</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? analysesQuery?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Avg Confidence</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${Math.round((analysesQuery?.reduce((s, a) => s + a.confidence, 0) || 0) / (analysesQuery?.length || 1))}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Across current results</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>By Type</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {stats && Object.entries(stats.byType).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="truncate">{k}</span><span>{v}</span></div>
            ))}
            {!stats && <div>-</div>}
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>By Severity</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <div>critical: {stats?.bySeverity.critical ?? 0}</div>
            <div>high: {stats?.bySeverity.high ?? 0}</div>
            <div>medium: {stats?.bySeverity.medium ?? 0}</div>
            <div>low: {stats?.bySeverity.low ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Manual Run */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neon-pink" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs">Analysis Type</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="anomaly_detection">anomaly_detection</SelectItem>
                  <SelectItem value="threat_classification">threat_classification</SelectItem>
                  <SelectItem value="behavioral_analysis">behavioral_analysis</SelectItem>
                  <SelectItem value="ai_threat_analysis">ai_threat_analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs">Target Type</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="log">log</SelectItem>
                  <SelectItem value="threat_log">threat_log</SelectItem>
                  <SelectItem value="network_traffic">network_traffic</SelectItem>
                  <SelectItem value="user_behavior">user_behavior</SelectItem>
                  <SelectItem value="manual_input">manual_input</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs">Min Confidence ≥</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs">Limit</label>
              <Input
                type="number"
                min={10}
                max={200}
                value={limit}
                onChange={(e) => setLimit(Math.max(10, Math.min(200, Number(e.target.value) || 50)))} />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                checked={liveOnly}
                onChange={(e) => setLiveOnly(e.target.checked)}
              />
              <span className="text-sm">Live data only</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs">Quick AI Run (uses OpenRouter):</label>
            <Input
              placeholder="manual_input"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="hidden" // keep title simple/hidden for now
            />
            <Textarea
              rows={4}
              placeholder="Paste a log line, IOC context, or text to analyze..."
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button className="glow-green" onClick={handleRunAI}>
                <Play className="mr-2 h-4 w-4" />
                Run AI Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysesQuery?.map((a) => (
              <div key={a._id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-semibold">{a.summary}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.details}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Type: {a.analysisType} • Target: {a.targetType}
                    </div>
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
            {(!analysesQuery || analysesQuery.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No analyses found. Generate demo data or run an AI analysis above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}