import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAnalysis = query({
  args: {
    analysisType: v.optional(v.string()),
    targetType: v.optional(v.string()),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number()),
    liveOnly: v.optional(v.boolean()),
    // Accept a dummy key to force refetches from the client
    _k: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("aiAnalysis");

    if (args.liveOnly) {
      q = q.filter((q) => q.neq(q.field("isDemo"), true));
    }

    if (args.analysisType && args.analysisType !== "all") {
      q = q.filter((q) => q.eq(q.field("analysisType"), args.analysisType));
    }

    if (args.targetType && args.targetType !== "all") {
      q = q.filter((q) => q.eq(q.field("targetType"), args.targetType));
    }

    if (args.minConfidence !== undefined) {
      q = q.filter((q) => q.gte(q.field("confidence"), args.minConfidence!));
    }

    const analyses = await q.order("desc").take(args.limit || 50);
    return analyses;
  },
});

export const getAnalysisStats = query({
  args: {
    liveOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let allAnalyses = await ctx.db.query("aiAnalysis").collect();
    
    if (args.liveOnly) {
      allAnalyses = allAnalyses.filter(analysis => !analysis.isDemo);
    }
    
    const stats = {
      total: allAnalyses.length,
      highConfidence: allAnalyses.filter(a => a.confidence > 80).length,
      bySeverity: {
        critical: allAnalyses.filter(a => a.severity === "critical").length,
        high: allAnalyses.filter(a => a.severity === "high").length,
        medium: allAnalyses.filter(a => a.severity === "medium").length,
        low: allAnalyses.filter(a => a.severity === "low").length,
      },
      byType: allAnalyses.reduce((acc, analysis) => {
        acc[analysis.analysisType] = (acc[analysis.analysisType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  },
});

export const createSampleAnalyses = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleAnalyses = [
      {
        targetType: "network_traffic",
        analysisType: "anomaly_detection",
        summary: "Unusual data exfiltration pattern detected",
        details: "Analysis of network traffic patterns shows abnormal data transfer volumes during off-hours, suggesting potential data exfiltration attempt.",
        recommendations: [
          "Block suspicious IP addresses",
          "Implement DLP policies",
          "Monitor user activity during off-hours"
        ],
        severity: "high" as const,
        confidence: 87,
        isDemo: true,
      },
      {
        targetType: "log_analysis",
        analysisType: "threat_classification",
        summary: "Potential brute force attack identified",
        details: "Multiple failed login attempts from single IP address within short time window indicates brute force attack pattern.",
        recommendations: [
          "Implement account lockout policies",
          "Enable multi-factor authentication",
          "Block attacking IP address"
        ],
        severity: "medium" as const,
        confidence: 92,
        isDemo: true,
      },
      {
        targetType: "malware_analysis",
        analysisType: "behavioral_analysis",
        summary: "Advanced persistent threat (APT) indicators found",
        details: "Behavioral analysis reveals sophisticated malware with persistence mechanisms and command & control communication patterns.",
        recommendations: [
          "Isolate affected systems",
          "Update antivirus signatures",
          "Conduct forensic analysis",
          "Review network segmentation"
        ],
        severity: "critical" as const,
        confidence: 95,
        isDemo: true,
      },
    ];

    for (const analysis of sampleAnalyses) {
      await ctx.db.insert("aiAnalysis", analysis);
    }

    return { created: sampleAnalyses.length };
  },
});

export const saveAnalysisPublic = mutation({
  args: {
    targetType: v.string(),
    analysisType: v.string(),
    summary: v.string(),
    details: v.string(),
    recommendations: v.array(v.string()),
    severity: v.string(),
    confidence: v.number(),
    isDemo: v.optional(v.boolean()),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      processingTime: v.optional(v.number()),
      dataPoints: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("aiAnalysis", {
      targetType: args.targetType,
      analysisType: args.analysisType,
      summary: args.summary,
      details: args.details,
      recommendations: args.recommendations,
      severity: args.severity as any,
      confidence: args.confidence,
      metadata: args.metadata,
      isDemo: args.isDemo,
    });
    return id;
  },
});