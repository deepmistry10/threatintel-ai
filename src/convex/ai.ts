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
      const models: Array<string> = [
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3-haiku",
        "mistralai/mixtral-8x7b-instruct",
      ];

      const baseHeaders = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://threatintel.app",
        "X-Title": "ThreatIntel AI Analysis",
      } as const;

      const messages = [
        {
          role: "system",
          content:
            "You are a senior cybersecurity threat analyst. Analyze the provided security data and return a STRICT JSON object with these fields ONLY: summary (1–2 sentence concise threat description), details (start with a short 'Cause:' paragraph explaining likely root cause, followed by deeper technical analysis), recommendations (an array of actionable remediation steps ordered by priority), severity (one of: low, medium, high, critical), confidence (number 0-100). Keep responses precise and practical for a SOC. No extra keys, no prose outside JSON.",
        },
        {
          role: "user",
          content: `Analyze this security data: ${args.content}`,
        },
      ];

      let lastError: Error | null = null;

      for (const model of models) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              model,
              messages,
              response_format: { type: "json_object" },
            }),
          });

          if (!response.ok) {
            // Auth/credit/access issues -> try next model
            if (response.status === 401 || response.status === 402 || response.status === 403) {
              lastError = new Error(`OpenRouter auth/credit error ${response.status} for model ${model}`);
              continue;
            }
            // Other errors -> try next but preserve reason
            lastError = new Error(`OpenRouter API error: ${response.status} for model ${model}`);
            continue;
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content ?? "{}";

          let analysis: any;
          try {
            analysis = JSON.parse(content);
          } catch {
            // Defensive: non-JSON from model, synthesize minimal structure
            analysis = {
              summary: "AI returned non-JSON content",
              details: `Cause: Model ${model} did not follow JSON response format. Raw: ${String(content).slice(0, 500)}`,
              recommendations: ["Retry with a different model", "Verify API key/credits", "Reduce prompt size if very large"],
              severity: "low",
              confidence: 0,
            };
          }

          // Successful parse/response -> return immediately
          return {
            targetType: args.targetType || "custom_analysis",
            analysisType: "ai_threat_analysis",
            summary: analysis.summary,
            details: analysis.details,
            recommendations: analysis.recommendations,
            severity: analysis.severity,
            confidence: analysis.confidence,
          };
        } catch (innerErr: any) {
          // Network/parse error on this model; try the next
          lastError = new Error(
            `Model ${model} failed: ${innerErr?.message || String(innerErr)}`
          );
          continue;
        }
      }

      // If we got here, all models failed
      throw lastError ?? new Error("All OpenRouter models failed");
    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error(
        `Failed to generate AI analysis: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});