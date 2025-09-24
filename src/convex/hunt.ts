import { v } from "convex/values";
import { query } from "./_generated/server";

export const getHuntResults = query({
  args: {
    keyword: v.optional(v.string()),
    source: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    minSeverity: v.optional(v.string()),
    minAnomaly: v.optional(v.number()),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const [iocs, logs, analyses] = await Promise.all([
      ctx.db.query("iocs").collect(),
      ctx.db.query("securityLogs").collect(),
      ctx.db.query("aiAnalysis").collect(),
    ]);

    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const minSevLevel = args.minSeverity ? severityOrder[args.minSeverity as keyof typeof severityOrder] : 0;

    let results: any[] = [];

    // Filter IOCs
    const filteredIOCs = iocs.filter(ioc => {
      if (args.keyword && !ioc.value.includes(args.keyword) && !ioc.description?.includes(args.keyword)) return false;
      if (args.source && ioc.source !== args.source) return false;
      if (args.startTime && ioc.firstSeen < args.startTime) return false;
      if (args.endTime && ioc.lastSeen > args.endTime) return false;
      if (minSevLevel && severityOrder[ioc.severity] < minSevLevel) return false;
      if (args.minConfidence && ioc.confidence < args.minConfidence) return false;
      return true;
    });

    results.push(...filteredIOCs.map(ioc => ({
      id: ioc._id,
      type: "ioc",
      title: `${ioc.type.toUpperCase()}: ${ioc.value}`,
      description: ioc.description || "",
      severity: ioc.severity,
      timestamp: ioc.lastSeen,
      source: ioc.source,
      confidence: ioc.confidence,
      anomalyScore: null,
    })));

    // Filter Security Logs
    const filteredLogs = logs.filter(log => {
      if (args.keyword && !log.message.includes(args.keyword)) return false;
      if (args.source && log.source !== args.source) return false;
      if (args.startTime && log.timestamp < args.startTime) return false;
      if (args.endTime && log.timestamp > args.endTime) return false;
      if (args.minAnomaly && log.anomalyScore < args.minAnomaly) return false;
      return true;
    });

    results.push(...filteredLogs.map(log => ({
      id: log._id,
      type: "log",
      title: log.message,
      description: `${log.source} - ${log.level}`,
      severity: log.level === "critical" ? "critical" : log.level === "error" ? "high" : "medium",
      timestamp: log.timestamp,
      source: log.source,
      confidence: null,
      anomalyScore: log.anomalyScore,
    })));

    // Filter AI Analyses
    const filteredAnalyses = analyses.filter(analysis => {
      if (args.keyword && !analysis.summary.includes(args.keyword) && !analysis.details.includes(args.keyword)) return false;
      if (minSevLevel && severityOrder[analysis.severity] < minSevLevel) return false;
      if (args.minConfidence && analysis.confidence < args.minConfidence) return false;
      return true;
    });

    results.push(...filteredAnalyses.map(analysis => ({
      id: analysis._id,
      type: "analysis",
      title: analysis.summary,
      description: analysis.details,
      severity: analysis.severity,
      timestamp: analysis._creationTime,
      source: analysis.targetType,
      confidence: analysis.confidence,
      anomalyScore: null,
    })));

    // Sort by timestamp and limit
    results.sort((a, b) => b.timestamp - a.timestamp);
    return results.slice(0, args.limit || 100);
  },
});

export const getHuntStats = query({
  args: {},
  handler: async (ctx) => {
    const [iocs, logs, analyses] = await Promise.all([
      ctx.db.query("iocs").collect(),
      ctx.db.query("securityLogs").collect(),
      ctx.db.query("aiAnalysis").collect(),
    ]);

    return {
      totalIOCs: iocs.length,
      totalLogs: logs.length,
      totalAnalyses: analyses.length,
      highSeverityIOCs: iocs.filter(ioc => ioc.severity === "high" || ioc.severity === "critical").length,
      anomalousLogs: logs.filter(log => log.anomalyScore > 70).length,
      highConfidenceAnalyses: analyses.filter(analysis => analysis.confidence > 80).length,
    };
  },
});
