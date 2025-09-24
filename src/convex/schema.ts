import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles for the threat intelligence platform
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  ANALYST: "analyst",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.ANALYST),
);
export type Role = Infer<typeof roleValidator>;

// IOC (Indicators of Compromise) types
export const IOC_TYPES = {
  IP: "ip",
  DOMAIN: "domain", 
  URL: "url",
  HASH: "hash",
  EMAIL: "email",
  FILE: "file",
} as const;

export const iocTypeValidator = v.union(
  v.literal(IOC_TYPES.IP),
  v.literal(IOC_TYPES.DOMAIN),
  v.literal(IOC_TYPES.URL),
  v.literal(IOC_TYPES.HASH),
  v.literal(IOC_TYPES.EMAIL),
  v.literal(IOC_TYPES.FILE),
);

// Severity levels
export const SEVERITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const severityValidator = v.union(
  v.literal(SEVERITY_LEVELS.LOW),
  v.literal(SEVERITY_LEVELS.MEDIUM),
  v.literal(SEVERITY_LEVELS.HIGH),
  v.literal(SEVERITY_LEVELS.CRITICAL),
);

// Log levels
export const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export const logLevelValidator = v.union(
  v.literal(LOG_LEVELS.INFO),
  v.literal(LOG_LEVELS.WARN),
  v.literal(LOG_LEVELS.ERROR),
  v.literal(LOG_LEVELS.CRITICAL),
);

// Add incident status constants and validator
export const INCIDENT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
} as const;

export const incidentStatusValidator = v.union(
  v.literal(INCIDENT_STATUS.OPEN),
  v.literal(INCIDENT_STATUS.IN_PROGRESS),
  v.literal(INCIDENT_STATUS.RESOLVED),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Indicators of Compromise
    iocs: defineTable({
      type: iocTypeValidator,
      value: v.string(),
      severity: severityValidator,
      description: v.optional(v.string()),
      source: v.string(),
      tags: v.array(v.string()),
      isActive: v.boolean(),
      firstSeen: v.number(),
      lastSeen: v.number(),
      confidence: v.number(), // 0-100
      createdBy: v.id("users"),
    })
      .index("by_type", ["type"])
      .index("by_severity", ["severity"])
      .index("by_active", ["isActive"])
      .index("by_created_by", ["createdBy"]),

    // CVE (Common Vulnerabilities and Exposures)
    cves: defineTable({
      cveId: v.string(),
      description: v.string(),
      severity: severityValidator,
      cvssScore: v.number(),
      publishedDate: v.number(),
      lastModified: v.number(),
      affectedProducts: v.array(v.string()),
      references: v.array(v.string()),
      isPatched: v.boolean(),
    }).index("by_cve_id", ["cveId"]),

    // Security Logs
    securityLogs: defineTable({
      source: v.string(),
      level: logLevelValidator,
      message: v.string(),
      timestamp: v.number(),
      sourceIp: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      metadata: v.optional(v.object({
        userAgent: v.optional(v.string()),
        endpoint: v.optional(v.string()),
        method: v.optional(v.string()),
        statusCode: v.optional(v.number()),
      })),
      anomalyScore: v.number(), // 0-100
      isDemo: v.optional(v.boolean()),
    })
      .index("by_source", ["source"])
      .index("by_level", ["level"])
      .index("by_timestamp", ["timestamp"])
      .index("by_anomaly_score", ["anomalyScore"]),

    // AI Analysis Results
    aiAnalysis: defineTable({
      targetType: v.string(), // "log", "ioc", "network_traffic", etc.
      targetId: v.optional(v.string()),
      analysisType: v.string(), // "anomaly_detection", "threat_classification", etc.
      summary: v.string(),
      details: v.string(),
      recommendations: v.array(v.string()),
      severity: severityValidator,
      confidence: v.number(), // 0-100
      metadata: v.optional(v.object({
        model: v.optional(v.string()),
        processingTime: v.optional(v.number()),
        dataPoints: v.optional(v.number()),
      })),
      isDemo: v.optional(v.boolean()),
    })
      .index("by_target_type", ["targetType"])
      .index("by_analysis_type", ["analysisType"])
      .index("by_confidence", ["confidence"])
      .index("by_severity", ["severity"]),

    // Threat Logs - Raw security events for AI analysis
    threatLogs: defineTable({
      rawData: v.string(),
      source: v.string(),
      eventType: v.string(),
      timestamp: v.number(),
      analyzed: v.boolean(),
      aiAnalysisId: v.optional(v.id("aiAnalysis")),
      severity: v.optional(severityValidator),
      metadata: v.optional(v.object({
        sourceIp: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        endpoint: v.optional(v.string()),
      })),
    })
      .index("by_analyzed", ["analyzed"])
      .index("by_source", ["source"])
      .index("by_timestamp", ["timestamp"]),

    // Incidents (MVP)
    incidents: defineTable({
      title: v.string(),
      description: v.optional(v.string()),
      severity: severityValidator,
      status: incidentStatusValidator,
      assignee: v.optional(v.id("users")),
      tags: v.array(v.string()),
      evidence: v.array(
        v.object({
          kind: v.union(v.literal("ioc"), v.literal("log"), v.literal("analysis")),
          refId: v.string(),
        }),
      ),
      createdBy: v.id("users"),
    })
      .index("by_status", ["status"])
      .index("by_assignee", ["assignee"])
      .index("by_severity", ["severity"]),

    // Audit Logs
    auditLogs: defineTable({
      userId: v.id("users"),
      action: v.string(),
      resource: v.string(),
      resourceId: v.optional(v.string()),
      timestamp: v.number(),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      success: v.boolean(),
      details: v.optional(v.string()),
    })
      .index("by_user_id", ["userId"])
      .index("by_action", ["action"])
      .index("by_timestamp", ["timestamp"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;