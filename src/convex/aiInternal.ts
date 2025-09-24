import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const saveAnalysis = internalMutation({
  args: {
    targetType: v.string(),
    analysisType: v.string(),
    summary: v.string(),
    details: v.string(),
    recommendations: v.array(v.string()),
    severity: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiAnalysis", {
      targetType: args.targetType,
      analysisType: args.analysisType,
      summary: args.summary,
      details: args.details,
      recommendations: args.recommendations,
      severity: args.severity as any,
      confidence: args.confidence,
    });
  },
});
