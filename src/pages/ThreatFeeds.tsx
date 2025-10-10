import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Rss, Plus, Trash2, RefreshCw, TrendingUp } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function ThreatFeeds() {
  const feeds = useQuery(api.threatFeeds.listFeeds, {});
  const stats = useQuery(api.threatFeeds.getFeedStats, {});
  const createFeed = useMutation(api.threatFeeds.createFeed);
  const toggleFeed = useMutation(api.threatFeeds.toggleFeed);
  const deleteFeed = useMutation(api.threatFeeds.deleteFeed);

  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    url: "",
    feedType: "json" as "json" | "csv" | "stix",
    syncInterval: 60,
    reputation: 75,
    description: "",
    provider: "",
  });

  const onCreate = async () => {
    try {
      if (!createForm.name.trim() || !createForm.url.trim()) {
        return toast.error("Name and URL are required");
      }
      await createFeed(createForm);
      toast.success("Threat feed created");
      setOpenCreate(false);
      setCreateForm({
        name: "",
        url: "",
        feedType: "json",
        syncInterval: 60,
        reputation: 75,
        description: "",
        provider: "",
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to create feed");
    }
  };

  const onToggle = async (feedId: Id<"threatFeeds">, enabled: boolean) => {
    try {
      await toggleFeed({ feedId, enabled: !enabled });
      toast.success(`Feed ${!enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle feed");
    }
  };

  const onDelete = async (feedId: Id<"threatFeeds">) => {
    try {
      await deleteFeed({ feedId });
      toast.success("Feed deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete feed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Rss className="h-6 w-6 text-neon-blue" />
          <h1 className="text-2xl font-bold text-neon-green">Threat Intelligence Feeds</h1>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="glow-green">
              <Plus className="mr-2 h-4 w-4" />
              Add Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Threat Feed</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs">Feed Name</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., AlienVault OTX"
                />
              </div>
              <div>
                <label className="text-xs">Feed URL</label>
                <Input
                  value={createForm.url}
                  onChange={(e) => setCreateForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Feed Type</label>
                  <Select
                    value={createForm.feedType}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, feedType: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="stix">STIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs">Sync Interval (minutes)</label>
                  <Input
                    type="number"
                    value={createForm.syncInterval}
                    onChange={(e) => setCreateForm((f) => ({ ...f, syncInterval: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs">Reputation Score (0-100)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={createForm.reputation}
                  onChange={(e) => setCreateForm((f) => ({ ...f, reputation: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs">Provider</label>
                <Input
                  value={createForm.provider}
                  onChange={(e) => setCreateForm((f) => ({ ...f, provider: e.target.value }))}
                  placeholder="e.g., AlienVault"
                />
              </div>
              <div>
                <label className="text-xs">Description</label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onCreate}>Create Feed</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Total Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFeeds ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.enabledFeeds ?? 0} enabled</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Feed IOCs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-blue">{stats?.totalFeedIOCs ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total imported</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Today's Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-green">{stats?.todayFeedIOCs ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats?.lastSync ? new Date(stats.lastSync).toLocaleString() : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Feed List */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Configured Feeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feeds?.map((feed) => (
              <div
                key={feed._id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-semibold">{feed.name}</div>
                    <Badge variant={feed.enabled ? "default" : "secondary"}>
                      {feed.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Badge variant="outline">{feed.feedType.toUpperCase()}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{feed.url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Sync: Every {feed.syncInterval} min • Reputation: {feed.reputation}%
                    {feed.lastSync && ` • Last: ${new Date(feed.lastSync).toLocaleString()}`}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                  <Switch checked={feed.enabled} onCheckedChange={() => onToggle(feed._id, feed.enabled)} />
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => onDelete(feed._id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {(!feeds || feeds.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No threat feeds configured. Add your first feed to start importing IOCs automatically.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
