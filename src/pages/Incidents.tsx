import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

const sevClass = (s: string) => {
  switch (s) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

// Add strict status typing
const STATUS_VALUES = ["open", "in_progress", "resolved"] as const;
type IncidentStatus = typeof STATUS_VALUES[number];

export default function Incidents() {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | undefined>(undefined);
  const incidents = useQuery(api.incidents.list, { status: statusFilter });
  const updateStatus = useMutation(api.incidents.updateStatus);

  const [open, setOpen] = useState(false);
  const createIncident = useMutation(api.incidents.create);

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });

  const onCreate = async () => {
    try {
      if (!form.title.trim()) return toast.error("Title required");
      await createIncident({
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        tags: [],
      });
      toast.success("Incident created");
      setOpen(false);
      setForm({ title: "", description: "", severity: "medium" });
    } catch (e) {
      toast.error("Failed to create incident");
      console.error(e);
    }
  };

  // Strongly type status change handler
  const onStatusChange = async (id: Id<"incidents">, status: IncidentStatus) => {
    try {
      await updateStatus({ id, status });
      toast.success("Status updated");
    } catch (e) {
      toast.error("Failed to update status");
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-neon-pink" />
          <h1 className="text-2xl font-bold text-neon-green">Incidents</h1>
        </div>

        <div className="flex items-center gap-3">
          <Select onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as IncidentStatus))} defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="glow-pink">
                <Plus className="mr-2 h-4 w-4" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Create Incident</h3>
                <div className="space-y-2">
                  <label className="text-sm">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short incident title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Severity</label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">low</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="high">high</SelectItem>
                      <SelectItem value="critical">critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Description</label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="What happened?" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={onCreate}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents?.map((i) => (
              <div key={i._id} className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-start justify-between">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{i.title}</div>
                    <Badge className={sevClass(i.severity)}>{i.severity}</Badge>
                  </div>
                  {i.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.description}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    Status: <span className="capitalize">{i.status.replace("_", " ")}</span> • Created {new Date(i._creationTime).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue={i.status} onValueChange={(v) => onStatusChange(i._id, v as IncidentStatus)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {(!incidents || incidents.length === 0) && (
              <p className="text-sm text-muted-foreground">No incidents yet. Create one to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}