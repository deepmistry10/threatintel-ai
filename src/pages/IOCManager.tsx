import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Plus, Pencil, Trash2, Eye, Filter, CheckCircle2, XCircle, Tag } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

// Helpers
const sevClass = (s: string) => {
  switch (s) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const types = ["ip", "domain", "url", "hash", "email", "file"] as const;
const severities = ["low", "medium", "high", "critical"] as const;

type IocType = typeof types[number];
type Severity = typeof severities[number];

export default function IOCManager() {
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined);

  // Data
  const stats = useQuery(api.iocs.getIOCStats, {});
  const iocs = useQuery(api.iocs.getIOCs, {
    type: typeFilter,
    severity: severityFilter,
    isActive: activeOnly,
    search: search.trim() || undefined,
    limit: 100,
  });

  // Mutations
  const createIOC = useMutation(api.iocs.createIOC);
  const updateIOC = useMutation(api.iocs.updateIOC);
  const deleteIOC = useMutation(api.iocs.deleteIOC);

  // Create dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{
    type: IocType; value: string; severity: Severity; description: string;
    source: string; tags: string; confidence: number;
  }>({
    type: "ip",
    value: "",
    severity: "medium",
    description: "",
    source: "manual",
    tags: "",
    confidence: 80,
  });

  // Edit dialog state
  const [editing, setEditing] = useState<null | {
    id: Id<"iocs">;
    value: string;
    severity: Severity;
    description?: string;
    tags: string[];
    isActive: boolean;
    confidence: number;
  }>(null);

  const totalCritical = useMemo(() => stats?.bySeverity.critical ?? 0, [stats]);

  const onCreate = async () => {
    try {
      if (!createForm.value.trim()) return toast.error("IOC value is required");
      const tags = createForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      await createIOC({
        type: createForm.type,
        value: createForm.value.trim(),
        severity: createForm.severity,
        description: createForm.description.trim() || undefined,
        source: createForm.source.trim() || "manual",
        tags,
        confidence: Number(createForm.confidence) || 0,
      });
      toast.success("IOC created");
      setOpenCreate(false);
      setCreateForm({ type: "ip", value: "", severity: "medium", description: "", source: "manual", tags: "", confidence: 80 });
    } catch (e) {
      console.error(e);
      toast.error("Failed to create IOC");
    }
  };

  const onToggleActive = async (id: Id<"iocs">, current: boolean) => {
    try {
      await updateIOC({ id, updates: { isActive: !current } });
      toast.success(`Marked as ${!current ? "active" : "inactive"}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update IOC");
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateIOC({
        id: editing.id,
        updates: {
          severity: editing.severity,
          description: editing.description ?? "",
          tags: editing.tags,
          isActive: editing.isActive,
          confidence: editing.confidence,
        },
      });
      toast.success("IOC updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update IOC");
    }
  };

  const onDelete = async (id: Id<"iocs">) => {
    try {
      await deleteIOC({ id });
      toast.success("IOC deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete IOC");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-neon-green" />
          <h1 className="text-2xl font-bold text-neon-green">IOC Management</h1>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="glow-green">
              <Plus className="mr-2 h-4 w-4" />
              Add IOC
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create IOC</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Type</label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm(f => ({ ...f, type: v as IocType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Severity</label>
                <Select value={createForm.severity} onValueChange={(v) => setCreateForm(f => ({ ...f, severity: v as Severity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Value</label>
                <Input value={createForm.value} onChange={(e) => setCreateForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g., 192.168.1.100 or malicious.com" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Description</label>
                <Textarea rows={3} value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Short context" />
              </div>
              <div>
                <label className="text-xs">Source</label>
                <Input value={createForm.source} onChange={(e) => setCreateForm(f => ({ ...f, source: e.target.value }))} placeholder="manual, feed name..." />
              </div>
              <div>
                <label className="text-xs">Confidence (%)</label>
                <Input type="number" min={0} max={100} value={createForm.confidence} onChange={(e) => setCreateForm(f => ({ ...f, confidence: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Tags (comma separated)</label>
                <Input value={createForm.tags} onChange={(e) => setCreateForm(f => ({ ...f, tags: e.target.value }))} placeholder="phishing, c2, malware" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Total IOCs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats ? `${stats.active} active` : "-"}</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Critical Threats</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{totalCritical}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>IP Addresses</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byType.ip ?? 0}</div>
            <p className="text-xs text-muted-foreground">Malicious IPs tracked</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle>Recent Additions</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(iocs?.length ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Showing latest</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neon-green" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Input placeholder="Search value or description" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={activeOnly === true} onCheckedChange={(v) => setActiveOnly(v ? true : undefined)} />
              <span className="text-sm">Active only</span>
              {activeOnly !== undefined && (
                <Button size="sm" variant="ghost" onClick={() => setActiveOnly(undefined)}>Clear</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Indicators of Compromise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {iocs?.map((ioc) => (
              <div key={ioc._id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">
                      {ioc.type.toUpperCase()}: {ioc.value}
                    </div>
                    <Badge className={sevClass(ioc.severity)}>{ioc.severity}</Badge>
                    <Badge variant="outline">{ioc.type}</Badge>
                    {ioc.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{ioc.description || "No description"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Source: {ioc.source} • Confidence: {ioc.confidence}% • Last seen: {new Date(ioc.lastSeen).toLocaleString()}
                  </div>
                  {ioc.tags?.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {ioc.tags.map((t: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={ioc.isActive ? "Mark inactive" : "Mark active"}
                    onClick={() => onToggleActive(ioc._id, ioc.isActive)}
                  >
                    {ioc.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="View"
                    onClick={() => toast.info("Detail view coming soon")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edit"
                    onClick={() =>
                      setEditing({
                        id: ioc._id,
                        value: ioc.value,
                        severity: ioc.severity as Severity,
                        description: ioc.description,
                        tags: ioc.tags || [],
                        isActive: ioc.isActive,
                        confidence: ioc.confidence,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete"
                    onClick={() => onDelete(ioc._id)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!iocs || iocs.length === 0) && (
              <p className="text-sm text-muted-foreground">No IOCs found. Load sample data from the landing page or add a new IOC.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit IOC</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Severity</label>
                <Select value={editing.severity} onValueChange={(v) => setEditing(e => e ? { ...e, severity: v as Severity } : e)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Confidence (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editing.confidence}
                  onChange={(e) => setEditing(e0 => e0 ? { ...e0, confidence: Number(e.target.value) } : e0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Description</label>
                <Textarea
                  rows={3}
                  value={editing.description || ""}
                  onChange={(e) => setEditing(e0 => e0 ? { ...e0, description: e.target.value } : e0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Tags (comma separated)</label>
                <Input
                  value={(editing.tags || []).join(", ")}
                  onChange={(e) => setEditing(e0 => e0 ? { ...e0, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } : e0)}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch checked={editing.isActive} onCheckedChange={(v) => setEditing(e0 => e0 ? { ...e0, isActive: v } : e0)} />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={onSaveEdit}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}