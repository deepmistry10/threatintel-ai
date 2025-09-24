import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const insertThreatLog = mutation({
  args: {
    rawData: v.string(),
    source: v.string(),
    eventType: v.string(),
    metadata: v.optional(v.object({
      sourceIp: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      endpoint: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("threatLogs", {
      rawData: args.rawData,
      source: args.source,
      eventType: args.eventType,
      timestamp: Date.now(),
      analyzed: false,
      metadata: args.metadata,
    });
  },
});

export const updateThreatLogAnalysis = mutation({
  args: {
    threatLogId: v.id("threatLogs"),
    aiAnalysisId: v.id("aiAnalysis"),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.threatLogId, {
      analyzed: true,
      aiAnalysisId: args.aiAnalysisId,
      severity: args.severity as any,
    });
  },
});

export const getThreatLogs = query({
  args: {
    limit: v.optional(v.number()),
    analyzed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("threatLogs");

    if (args.analyzed !== undefined) {
      q = q.filter((q) => q.eq(q.field("analyzed"), args.analyzed));
    }

    return await q.order("desc").take(args.limit || 50);
  },
});

export const getLatestThreatLog = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("threatLogs").order("desc").take(1);
    return logs[0] || null;
  },
});

export const getLatestThreatAnalysis = query({
  args: {},
  handler: async (ctx) => {
    const latestLog = await ctx.db.query("threatLogs").order("desc").take(1);
    if (!latestLog[0] || !latestLog[0].aiAnalysisId) {
      return null;
    }

    return await ctx.db.get(latestLog[0].aiAnalysisId);
  },
});
