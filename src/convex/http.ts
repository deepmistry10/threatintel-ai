import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/analyze",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Check API key
    const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.ANALYSIS_API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      // Get latest threat log
      const latestLog = await ctx.runQuery(api.threatLogs.getLatestThreatLog);
      if (!latestLog) {
        return new Response("No threat logs found", { status: 404 });
      }

      // Generate AI analysis (no DB write)
      const analysis = await ctx.runAction(api.ai.generateAndSaveAnalysis, {
        content: latestLog.rawData,
        targetType: "threat_log",
      });

      // Save analysis to DB
      const analysisId = await ctx.runMutation(internal.aiInternal.saveAnalysis, {
        targetType: "threat_log",
        analysisType: "ai_threat_analysis",
        summary: analysis.summary,
        details: analysis.details,
        recommendations: analysis.recommendations,
        severity: analysis.severity,
        confidence: analysis.confidence,
      });

      // Update threat log with analysis id
      await ctx.runMutation(api.threatLogs.updateThreatLogAnalysis, {
        threatLogId: latestLog._id,
        aiAnalysisId: analysisId,
        severity: analysis.severity,
      });

      return new Response(JSON.stringify({ id: analysisId, ...analysis }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Analysis endpoint error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

export default http;