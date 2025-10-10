import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCorrelations = query({
  args: {
    entityType: v.union(v.literal("ioc"), v.literal("log"), v.literal("incident"), v.literal("analysis")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const asSource = await ctx.db
      .query("correlations")
      .withIndex("by_source", (q) => q.eq("sourceType", args.entityType).eq("sourceId", args.entityId))
      .collect();
    
    const asTarget = await ctx.db
      .query("correlations")
      .withIndex("by_target", (q) => q.eq("targetType", args.entityType).eq("targetId", args.entityId))
      .collect();
    
    return [...asSource, ...asTarget];
  },
});

export const getCorrelationStats = query({
  args: {},
  handler: async (ctx) => {
    const correlations = await ctx.db.query("correlations").collect();
    
    const byType = correlations.reduce((acc, corr) => {
      acc[corr.correlationType] = (acc[corr.correlationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: correlations.length,
      byType,
      highConfidence: correlations.filter(c => c.confidence > 80).length,
    };
  },
});

export const createCorrelation = mutation({
  args: {
    sourceType: v.union(v.literal("ioc"), v.literal("log"), v.literal("incident"), v.literal("analysis")),
    sourceId: v.string(),
    targetType: v.union(v.literal("ioc"), v.literal("log"), v.literal("incident"), v.literal("analysis")),
    targetId: v.string(),
    correlationType: v.string(),
    confidence: v.number(),
    matchedValue: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if correlation already exists
    const existing = await ctx.db
      .query("correlations")
      .withIndex("by_source", (q) => q.eq("sourceType", args.sourceType).eq("sourceId", args.sourceId))
      .filter((q) => q.and(
        q.eq(q.field("targetType"), args.targetType),
        q.eq(q.field("targetId"), args.targetId)
      ))
      .first();
    
    if (existing) return existing._id;
    
    return await ctx.db.insert("correlations", {
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      targetType: args.targetType,
      targetId: args.targetId,
      correlationType: args.correlationType,
      confidence: args.confidence,
      detectedAt: Date.now(),
      metadata: {
        matchedValue: args.matchedValue,
        reason: args.reason,
      },
    });
  },
});
