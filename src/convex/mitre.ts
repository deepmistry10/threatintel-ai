import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTechniques = query({
  args: {
    tactic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.tactic && args.tactic !== "all") {
      const tacticValue = args.tactic; // Type narrowing
      return await ctx.db
        .query("mitreTechniques")
        .withIndex("by_tactic", (q) => q.eq("tactic", tacticValue))
        .collect();
    }
    
    return await ctx.db.query("mitreTechniques").collect();
  },
});

export const getTactics = query({
  args: {},
  handler: async (ctx) => {
    const techniques = await ctx.db.query("mitreTechniques").collect();
    const tactics = [...new Set(techniques.map(t => t.tactic))];
    return tactics.sort();
  },
});

export const getCoverageStats = query({
  args: {},
  handler: async (ctx) => {
    const [techniques, iocs, analyses, incidents] = await Promise.all([
      ctx.db.query("mitreTechniques").collect(),
      ctx.db.query("iocs").collect(),
      ctx.db.query("aiAnalysis").collect(),
      ctx.db.query("incidents").collect(),
    ]);
    
    const detectedTechniques = new Set<string>();
    
    iocs.forEach(ioc => {
      ioc.mitreTechniques?.forEach(t => detectedTechniques.add(t));
    });
    analyses.forEach(analysis => {
      analysis.mitreTechniques?.forEach(t => detectedTechniques.add(t));
    });
    incidents.forEach(incident => {
      incident.mitreTechniques?.forEach(t => detectedTechniques.add(t));
    });
    
    const byTactic = techniques.reduce((acc, tech) => {
      if (!acc[tech.tactic]) {
        acc[tech.tactic] = { total: 0, detected: 0 };
      }
      acc[tech.tactic].total++;
      if (detectedTechniques.has(tech.techniqueId)) {
        acc[tech.tactic].detected++;
      }
      return acc;
    }, {} as Record<string, { total: number; detected: number }>);
    
    return {
      totalTechniques: techniques.length,
      detectedTechniques: detectedTechniques.size,
      coveragePercent: Math.round((detectedTechniques.size / techniques.length) * 100),
      byTactic,
    };
  },
});

export const seedMitreTechniques = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample MITRE ATT&CK techniques for demonstration
    const sampleTechniques = [
      {
        techniqueId: "T1566",
        name: "Phishing",
        tactic: "Initial Access",
        description: "Adversaries may send phishing messages to gain access to victim systems.",
        platforms: ["Linux", "macOS", "Windows"],
        url: "https://attack.mitre.org/techniques/T1566/",
      },
      {
        techniqueId: "T1190",
        name: "Exploit Public-Facing Application",
        tactic: "Initial Access",
        description: "Adversaries may attempt to exploit a weakness in an Internet-facing host or system.",
        platforms: ["Linux", "Windows", "macOS", "Network"],
        url: "https://attack.mitre.org/techniques/T1190/",
      },
      {
        techniqueId: "T1059",
        name: "Command and Scripting Interpreter",
        tactic: "Execution",
        description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.",
        platforms: ["Linux", "macOS", "Windows"],
        url: "https://attack.mitre.org/techniques/T1059/",
      },
      {
        techniqueId: "T1110",
        name: "Brute Force",
        tactic: "Credential Access",
        description: "Adversaries may use brute force techniques to gain access to accounts.",
        platforms: ["Linux", "macOS", "Windows", "Office 365", "Azure AD"],
        url: "https://attack.mitre.org/techniques/T1110/",
      },
      {
        techniqueId: "T1071",
        name: "Application Layer Protocol",
        tactic: "Command and Control",
        description: "Adversaries may communicate using application layer protocols to avoid detection.",
        platforms: ["Linux", "macOS", "Windows"],
        url: "https://attack.mitre.org/techniques/T1071/",
      },
      {
        techniqueId: "T1048",
        name: "Exfiltration Over Alternative Protocol",
        tactic: "Exfiltration",
        description: "Adversaries may steal data by exfiltrating it over a different protocol than the existing command and control channel.",
        platforms: ["Linux", "macOS", "Windows"],
        url: "https://attack.mitre.org/techniques/T1048/",
      },
    ];
    
    const existing = await ctx.db.query("mitreTechniques").first();
    if (existing) {
      return { message: "MITRE techniques already seeded" };
    }
    
    for (const tech of sampleTechniques) {
      await ctx.db.insert("mitreTechniques", tech);
    }
    
    return { created: sampleTechniques.length };
  },
});
