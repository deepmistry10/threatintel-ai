import { query } from "./_generated/server";

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const [iocs, logs, analyses, threatLogs] = await Promise.all([
      ctx.db.query("iocs").collect(),
      ctx.db.query("securityLogs").collect(),
      ctx.db.query("aiAnalysis").collect(),
      ctx.db.query("threatLogs").collect(),
    ]);

    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const last7d = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
      activeThreats: iocs.filter(ioc => ioc.isActive && ioc.severity === "critical").length,
      logEvents: logs.filter(log => log.timestamp > last24h).length,
      aiAnalyses: analyses.length,
      recentThreats: threatLogs.filter(log => log.timestamp > last24h).length,
      trends: {
        threats: iocs.filter(ioc => ioc.firstSeen > last7d).length,
        logs: logs.filter(log => log.timestamp > last7d).length,
        analyses: analyses.filter(analysis => analysis._creationTime > last7d).length,
      },
    };
  },
});

export const getThreatFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const [recentIOCs, recentAnalyses, recentLogs] = await Promise.all([
      ctx.db.query("iocs").order("desc").take(10),
      ctx.db.query("aiAnalysis").order("desc").take(10),
      ctx.db.query("securityLogs").withIndex("by_timestamp").order("desc").take(10),
    ]);

    const feed = [
      ...recentIOCs.map(ioc => ({
        id: ioc._id,
        type: "ioc" as const,
        title: `${ioc.type.toUpperCase()}: ${ioc.value}`,
        severity: ioc.severity,
        timestamp: ioc.lastSeen,
        description: ioc.description || `${ioc.type} indicator detected`,
      })),
      ...recentAnalyses.map(analysis => ({
        id: analysis._id,
        type: "analysis" as const,
        title: analysis.summary,
        severity: analysis.severity,
        timestamp: analysis._creationTime,
        description: `AI Analysis: ${analysis.analysisType}`,
      })),
      ...recentLogs.map(log => ({
        id: log._id,
        type: "log" as const,
        title: log.message,
        severity: log.level === "critical" ? "critical" : log.level === "error" ? "high" : "medium",
        timestamp: log.timestamp,
        description: `${log.source}: ${log.level}`,
      })),
    ];

    return feed
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit || 20);
  },
});

import { v } from "convex/values";
