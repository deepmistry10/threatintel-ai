"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateAndSaveAnalysis = action({
  args: {
    content: v.string(),
    targetType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://threatintel.app",
          "X-Title": "ThreatIntel AI Analysis",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "system",
              content: "You are a senior cybersecurity threat analyst. Analyze the provided security data and return a STRICT JSON object with these fields ONLY: summary (1–2 sentence concise threat description), details (start with a short 'Cause:' paragraph explaining likely root cause, followed by deeper technical analysis), recommendations (an array of actionable remediation steps ordered by priority), severity (one of: low, medium, high, critical), confidence (number 0-100). Keep responses precise and practical for a SOC. No extra keys, no prose outside JSON."
            },
            {
              role: "user",
              content: `Analyze this security data: ${args.content}`
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      // Return analysis data only (no DB writes here to avoid circular refs)
      return {
        targetType: args.targetType || "custom_analysis",
        analysisType: "ai_threat_analysis",
        summary: analysis.summary,
        details: analysis.details,
        recommendations: analysis.recommendations,
        severity: analysis.severity,
        confidence: analysis.confidence,
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error(`Failed to generate AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});