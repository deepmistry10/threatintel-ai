import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, RefreshCw, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

const levelOptions = ["all", "info", "warn", "error", "critical"] as const;
type LevelOpt = typeof levelOptions[number];

const sevClass = (s: string) => {
  switch (s) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const levelToSev = (lvl: string) =>
  lvl === "critical" ? "critical" : lvl === "error" ? "high" : lvl === "warn" ? "medium" : "low";

export default function SecurityLogs() {
  // Filters
  const [source, setSource] = useState<string>("");
  const [level, setLevel] = useState<LevelOpt>("all");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [minAnomaly, setMinAnomaly] = useState<number>(0);
  const [limit, setLimit] = useState<number>(100);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const startTime = useMemo(() => (start ? new Date(start).getTime() : undefined), [start]);
  const endTime = useMemo(() => (end ? new Date(end).getTime() : undefined), [end]);

  // Queries
  const stats = useQuery(api.logs.getLogStats, {});
  const logs = useQuery(api.logs.getLogs, {
    source: source.trim() || undefined,
    level: level === "all" ? undefined : level,
    startTime,
    endTime,
    minAnomalyScore: minAnomaly || undefined,
    limit,
    // force refetch when pressing Refresh
    // Convex re-runs on arg change
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    _k: refreshKey,
  });

  const generateDemo = useMutation(api.logs.createSampleLogs);

  const handleGenerate = async () => {
    try {
      const res = await generateDemo({});
      toast.success(`Generated ${res.created} demo logs`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate demo logs");
    }
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-neon-blue" />
          <h1 className="text-2xl font-bold text-neon-green">Security Logs</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="glow-green" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Demo Logs
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/dashboard/iocs">IOC Manager</Link></Button>
        <Button variant="outline" asChild><Link to="/dashboard/analysis">AI Analysis</Link></Button>
        <Button variant="outline" asChild><Link to="/dashboard/hunt">Threat Hunt</Link></Button>
        <Button variant="outline" asChild><Link to="/dashboard/incidents">Incidents</Link></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Total Logs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.last24h} in last 24h` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Anomalies</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats?.anomalies ?? 0}</div>
            <p className="text-xs text-muted-foreground">Score ≥ 70</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>By Level</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <div>INFO: {stats?.byLevel.info ?? 0}</div>
            <div>WARN: {stats?.byLevel.warn ?? 0}</div>
            <div>ERROR: {stats?.byLevel.error ?? 0}</div>
            <div>CRITICAL: {stats?.byLevel.critical ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Top Sources</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {stats && Object.entries(stats.bySource)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([s, c]) => (
                <div key={s} className="flex justify-between">
                  <span className="truncate">{s}</span>
                  <span className="ml-2">{c}</span>
                </div>
              ))}
            {!stats && <div>-</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neon-pink" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs">Source</label>
              <Input placeholder="firewall, siem, proxy..." value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Level</label>
              <Select value={level} onValueChange={(v) => setLevel(v as LevelOpt)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levelOptions.map((l) => (
                    <SelectItem key={l} value={l}>{l === "all" ? "All" : l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs">Start</label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">End</label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Anomaly ≥</label>
              <Input type="number" min={0} max={100} value={minAnomaly} onChange={(e) => setMinAnomaly(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs">Limit</label>
              <Input type="number" min={10} max={500} value={limit} onChange={(e) => setLimit(Math.max(10, Math.min(500, Number(e.target.value) || 100)))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-12 text-xs text-muted-foreground pb-2 border-b border-border/50">
                <div className="col-span-3">Time</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-2">Source</div>
                <div className="col-span-4">Message</div>
                <div className="col-span-2 text-right">Anom.</div>
              </div>
              <div className="divide-y divide-border/40">
                {logs?.map((log) => (
                  <div key={log._id} className="grid grid-cols-12 py-2 items-center">
                    <div className="col-span-3 text-sm">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="col-span-1">
                      <Badge className={sevClass(levelToSev(log.level))}>{log.level.toUpperCase()}</Badge>
                    </div>
                    <div className="col-span-2 text-sm truncate">{log.source}</div>
                    <div className="col-span-4">
                      <div className="text-sm truncate">{log.message}</div>
                      {log.metadata && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {log.metadata.endpoint ? `Endpoint: ${log.metadata.endpoint}` : ""}{log.metadata.method ? ` • ${log.metadata.method}` : ""}{log.metadata.statusCode ? ` • ${log.metadata.statusCode}` : ""}
                          {log.sourceIp ? ` • IP: ${log.sourceIp}` : ""}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-sm">
                      {log.anomalyScore}
                    </div>
                  </div>
                ))}
              </div>
              {(!logs || logs.length === 0) && (
                <p className="text-sm text-muted-foreground mt-3">No logs found. Generate demo logs or adjust filters.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}