import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLogs = query({
  args: {
    source: v.optional(v.string()),
    level: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    minAnomalyScore: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("securityLogs");

    if (args.source && args.source !== "all") {
      q = q.filter((q) => q.eq(q.field("source"), args.source));
    }

    if (args.level && args.level !== "all") {
      q = q.filter((q) => q.eq(q.field("level"), args.level));
    }

    if (args.startTime || args.endTime) {
      q = q.filter((q) => {
        let condition = q.gte(q.field("timestamp"), args.startTime || 0);
        if (args.endTime) {
          condition = q.and(condition, q.lte(q.field("timestamp"), args.endTime));
        }
        return condition;
      });
    }

    if (args.minAnomalyScore !== undefined) {
      q = q.filter((q) => q.gte(q.field("anomalyScore"), args.minAnomalyScore!));
    }

    const logs = await q.order("desc").take(args.limit || 100);
    return logs;
  },
});

export const getLogStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("securityLogs").collect();
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    
    const stats = {
      total: allLogs.length,
      last24h: allLogs.filter(log => log.timestamp > last24h).length,
      anomalies: allLogs.filter(log => log.anomalyScore > 70).length,
      byLevel: {
        info: allLogs.filter(log => log.level === "info").length,
        warn: allLogs.filter(log => log.level === "warn").length,
        error: allLogs.filter(log => log.level === "error").length,
        critical: allLogs.filter(log => log.level === "critical").length,
      },
      bySource: allLogs.reduce((acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  },
});

export const createSampleLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleLogs = [
      {
        source: "firewall",
        level: "warn" as const,
        message: "Suspicious connection attempt from 192.168.1.100",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "192.168.1.100",
        anomalyScore: 75,
        isDemo: true,
      },
      {
        source: "web_server",
        level: "error" as const,
        message: "SQL injection attempt detected in login form",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "203.0.113.45",
        anomalyScore: 95,
        isDemo: true,
      },
      {
        source: "ids",
        level: "critical" as const,
        message: "Malware signature detected in network traffic",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "198.51.100.23",
        anomalyScore: 98,
        isDemo: true,
      },
      {
        source: "auth_system",
        level: "info" as const,
        message: "User login successful",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "10.0.0.15",
        anomalyScore: 10,
        isDemo: true,
      },
    ];

    for (const log of sampleLogs) {
      await ctx.db.insert("securityLogs", log);
    }

    return { created: sampleLogs.length };
  },
});
