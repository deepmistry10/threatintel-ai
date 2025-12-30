import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Search, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SecurityLogs() {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Manual Log Entry State
  const [newLog, setNewLog] = useState({
    source: "manual",
    level: "info",
    message: "",
    sourceIp: "",
    additionalDetails: "",
  });

  const logs = useQuery(api.logs.getLogs, {
    source: sourceFilter === "all" ? undefined : sourceFilter,
    level: levelFilter === "all" ? undefined : levelFilter,
    limit: 100,
    _k: refreshKey,
  });

  const stats = useQuery(api.logs.getLogStats);
  const createSampleLogs = useMutation(api.logs.createSampleLogs);
  const addLog = useMutation(api.logs.addLog);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateSamples = async () => {
    try {
      await createSampleLogs();
      toast.success("Sample logs created");
      handleRefresh();
    } catch (error) {
      toast.error("Failed to create sample logs");
    }
  };

  const handleAddLog = async () => {
    if (!newLog.message) {
      toast.error("Message is required");
      return;
    }
    try {
      await addLog(newLog);
      toast.success("Log entry added");
      setIsAddOpen(false);
      setNewLog({
        source: "manual",
        level: "info",
        message: "",
        sourceIp: "",
        additionalDetails: "",
      });
      handleRefresh();
    } catch (error) {
      toast.error("Failed to add log entry");
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "error": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "warn": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-neon-blue" />
          <h1 className="text-2xl font-bold text-neon-blue">Security Logs</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleCreateSamples}>
            Generate Samples
          </Button>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="glow-blue">
                <Plus className="mr-2 h-4 w-4" />
                Add Log Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Log Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input 
                      value={newLog.source} 
                      onChange={(e) => setNewLog({...newLog, source: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select 
                      value={newLog.level} 
                      onValueChange={(v) => setNewLog({...newLog, level: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warn</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Input 
                    value={newLog.message} 
                    onChange={(e) => setNewLog({...newLog, message: e.target.value})} 
                    placeholder="Log message..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source IP (Optional)</Label>
                  <Input 
                    value={newLog.sourceIp} 
                    onChange={(e) => setNewLog({...newLog, sourceIp: e.target.value})} 
                    placeholder="192.168.1.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Details</Label>
                  <Textarea 
                    value={newLog.additionalDetails} 
                    onChange={(e) => setNewLog({...newLog, additionalDetails: e.target.value})} 
                    placeholder="JSON or text details..."
                  />
                </div>
                <Button className="w-full glow-blue" onClick={handleAddLog}>
                  Submit Log
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-glow bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-glow bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last24h}</div>
            </CardContent>
          </Card>
          <Card className="border-glow bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.byLevel.critical}</div>
            </CardContent>
          </Card>
          <Card className="border-glow bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.anomalies}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Log Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="w-48">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="firewall">Firewall</SelectItem>
                  <SelectItem value="ids">IDS</SelectItem>
                  <SelectItem value="web_server">Web Server</SelectItem>
                  <SelectItem value="auth_system">Auth System</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Anomaly Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getLevelBadge(log.level)}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.source}</TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={log.message}>
                        {log.message}
                      </div>
                      {log.metadata?.details && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {log.metadata.details}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.anomalyScore > 0 && (
                        <Badge variant="outline" className={
                          log.anomalyScore > 80 ? "text-red-400 border-red-500/30" : 
                          log.anomalyScore > 50 ? "text-orange-400 border-orange-500/30" : 
                          "text-blue-400 border-blue-500/30"
                        }>
                          {log.anomalyScore}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found matching criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}