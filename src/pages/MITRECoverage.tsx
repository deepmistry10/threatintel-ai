import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Shield, Target, TrendingUp, Database } from "lucide-react";
import { useState } from "react";

export default function MITRECoverage() {
  const [tacticFilter, setTacticFilter] = useState<string>("all");
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  
  const techniques = useQuery(api.mitre.getTechniques, { tactic: tacticFilter });
  const tactics = useQuery(api.mitre.getTactics, {});
  const stats = useQuery(api.mitre.getCoverageStats, {});
  const seedTechniques = useMutation(api.mitre.seedMitreTechniques);
  
  // Fetch all IOCs and analyses to show which ones map to techniques
  const allIOCs = useQuery(api.iocs.getIOCs, { limit: 1000 });
  const allAnalyses = useQuery(api.aiAnalysis.getAnalysis, { limit: 1000 });

  const onSeedData = async () => {
    try {
      const result = await seedTechniques({});
      toast.success(`Seeded ${result.created || 0} MITRE techniques`);
    } catch (e: any) {
      if (e.message?.includes("already seeded")) {
        toast.info("MITRE techniques already loaded");
      } else {
        toast.error("Failed to seed MITRE data");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-neon-pink" />
          <h1 className="text-2xl font-bold text-neon-green">MITRE ATT&CK Coverage</h1>
        </div>
        <Button onClick={onSeedData} variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Load Sample Techniques
        </Button>
      </div>

      {/* Coverage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-glow bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-neon-blue" />
              Total Techniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neon-blue">{stats?.totalTechniques ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In framework</p>
          </CardContent>
        </Card>

        <Card className="border-glow bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-neon-green" />
              Detected Techniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neon-green">{stats?.detectedTechniques ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Found in your data</p>
          </CardContent>
        </Card>

        <Card className="border-glow bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-neon-pink" />
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neon-pink">{stats?.coveragePercent ?? 0}%</div>
            <Progress value={stats?.coveragePercent ?? 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tactic Coverage Breakdown */}
      {stats?.byTactic && Object.keys(stats.byTactic).length > 0 && (
        <Card className="border-glow bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Coverage by Tactic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byTactic).map(([tactic, data]) => {
                const percent = data.total > 0 ? Math.round((data.detected / data.total) * 100) : 0;
                return (
                  <div key={tactic} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{tactic}</span>
                      <span className="text-muted-foreground">
                        {data.detected} / {data.total} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Filter by Tactic</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={tacticFilter} onValueChange={setTacticFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tactics</SelectItem>
              {tactics?.map((tactic) => (
                <SelectItem key={tactic} value={tactic}>
                  {tactic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Techniques List */}
      <Card className="border-glow bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>MITRE ATT&CK Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {techniques?.map((tech) => {
              // Find IOCs and analyses that map to this technique
              const relatedIOCs = allIOCs?.filter(ioc => 
                ioc.mitreTechniques?.includes(tech.techniqueId)
              ) || [];
              const relatedAnalyses = allAnalyses?.filter(analysis => 
                analysis.mitreTechniques?.includes(tech.techniqueId)
              ) || [];
              const isDetected = relatedIOCs.length > 0 || relatedAnalyses.length > 0;
              const isExpanded = expandedTechnique === tech.techniqueId;
              
              return (
                <div
                  key={tech._id}
                  className={`p-3 rounded-lg border transition-all ${
                    isDetected 
                      ? 'bg-green-500/10 border-green-500/50 hover:border-green-500/70' 
                      : 'bg-muted/50 border-border/50 hover:border-neon-blue/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          {tech.techniqueId}
                        </Badge>
                        <span className="text-sm font-semibold">{tech.name}</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {tech.tactic}
                        </Badge>
                        {isDetected && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            ✓ Detected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tech.description}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tech.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary" className="text-[10px]">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Show detection details */}
                      {isDetected && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedTechnique(isExpanded ? null : tech.techniqueId)}
                            className="text-xs h-6 px-2"
                          >
                            {isExpanded ? '▼' : '▶'} {relatedIOCs.length} IOCs, {relatedAnalyses.length} Analyses
                          </Button>
                          
                          {isExpanded && (
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-green-500/30">
                              {relatedIOCs.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-green-400 mb-1">Related IOCs:</p>
                                  {relatedIOCs.map(ioc => (
                                    <div key={ioc._id} className="text-xs text-muted-foreground">
                                      • {ioc.type}: {ioc.value} ({ioc.severity})
                                    </div>
                                  ))}
                                </div>
                              )}
                              {relatedAnalyses.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-blue-400 mb-1">Related Analyses:</p>
                                  {relatedAnalyses.map(analysis => (
                                    <div key={analysis._id} className="text-xs text-muted-foreground">
                                      • {analysis.summary.substring(0, 60)}...
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={tech.url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!techniques || techniques.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No techniques found. Click "Load Sample Techniques" to populate the database.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
