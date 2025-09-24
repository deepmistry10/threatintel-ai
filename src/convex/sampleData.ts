import { mutation } from "./_generated/server";

export const loadSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample IOCs
    const sampleIOCs = [
      {
        type: "ip" as const,
        value: "192.168.1.100",
        severity: "high" as const,
        description: "Known malicious IP from botnet C&C",
        source: "threat_intel_feed",
        tags: ["botnet", "c2", "malware"],
        isActive: true,
        firstSeen: Date.now() - 86400000,
        lastSeen: Date.now() - 3600000,
        confidence: 95,
        createdBy: "system" as any,
      },
      {
        type: "domain" as const,
        value: "malicious-site.com",
        severity: "critical" as const,
        description: "Phishing domain targeting financial institutions",
        source: "phishing_tracker",
        tags: ["phishing", "financial", "credential_theft"],
        isActive: true,
        firstSeen: Date.now() - 172800000,
        lastSeen: Date.now() - 1800000,
        confidence: 98,
        createdBy: "system" as any,
      },
      {
        type: "hash" as const,
        value: "d41d8cd98f00b204e9800998ecf8427e",
        severity: "medium" as const,
        description: "Suspicious file hash detected in email attachment",
        source: "email_security",
        tags: ["malware", "email", "attachment"],
        isActive: true,
        firstSeen: Date.now() - 259200000,
        lastSeen: Date.now() - 7200000,
        confidence: 87,
        createdBy: "system" as any,
      },
    ];

    // Sample Security Logs
    const sampleLogs = [
      {
        source: "firewall",
        level: "warn" as const,
        message: "Multiple connection attempts from suspicious IP",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "203.0.113.45",
        anomalyScore: 78,
        metadata: {
          endpoint: "/api/login",
          method: "POST",
          statusCode: 401,
        },
      },
      {
        source: "web_server",
        level: "error" as const,
        message: "SQL injection attempt detected",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "198.51.100.23",
        anomalyScore: 95,
        metadata: {
          endpoint: "/search",
          method: "GET",
          statusCode: 400,
        },
      },
      {
        source: "ids",
        level: "critical" as const,
        message: "Malware signature match in network traffic",
        timestamp: Date.now() - Math.random() * 86400000,
        sourceIp: "192.0.2.15",
        anomalyScore: 99,
      },
    ];

    // Sample AI Analyses
    const sampleAnalyses = [
      {
        targetType: "network_traffic",
        analysisType: "anomaly_detection",
        summary: "Unusual outbound data transfer detected",
        details: "Analysis shows 500% increase in outbound traffic during off-hours, indicating potential data exfiltration.",
        recommendations: [
          "Investigate source of data transfer",
          "Review user access logs",
          "Implement DLP controls"
        ],
        severity: "high" as const,
        confidence: 89,
        metadata: {
          model: "threat_detection_v2",
          processingTime: 1250,
          dataPoints: 15000,
        },
      },
      {
        targetType: "user_behavior",
        analysisType: "behavioral_analysis",
        summary: "Anomalous user login pattern identified",
        details: "User account shows login attempts from multiple geographic locations within impossible timeframe.",
        recommendations: [
          "Force password reset",
          "Enable MFA",
          "Review account permissions"
        ],
        severity: "critical" as const,
        confidence: 96,
        metadata: {
          model: "user_behavior_v1",
          processingTime: 890,
          dataPoints: 2500,
        },
      },
    ];

    // Sample Threat Logs
    const sampleThreatLogs = [
      {
        rawData: JSON.stringify({
          event: "login_attempt",
          user: "admin",
          ip: "192.168.1.100",
          timestamp: Date.now(),
          success: false,
          attempts: 15,
        }),
        source: "auth_system",
        eventType: "authentication",
        timestamp: Date.now() - 3600000,
        analyzed: false,
        metadata: {
          sourceIp: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    ];

    // Insert sample data
    const results = {
      iocs: 0,
      logs: 0,
      analyses: 0,
      threatLogs: 0,
    };

    for (const ioc of sampleIOCs) {
      await ctx.db.insert("iocs", ioc);
      results.iocs++;
    }

    for (const log of sampleLogs) {
      await ctx.db.insert("securityLogs", log);
      results.logs++;
    }

    for (const analysis of sampleAnalyses) {
      await ctx.db.insert("aiAnalysis", analysis);
      results.analyses++;
    }

    for (const threatLog of sampleThreatLogs) {
      await ctx.db.insert("threatLogs", threatLog);
      results.threatLogs++;
    }

    return results;
  },
});
