import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getIOCs = query({
  args: {
    type: v.optional(v.string()),
    severity: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("iocs");

    if (args.type && args.type !== "all") {
      q = q.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.severity && args.severity !== "all") {
      q = q.filter((q) => q.eq(q.field("severity"), args.severity));
    }

    if (args.isActive !== undefined) {
      q = q.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    if (args.search) {
      q = q.filter((q) => 
        q.or(
          q.eq(q.field("value"), args.search),
          q.eq(q.field("description"), args.search)
        )
      );
    }

    const iocs = await q.order("desc").take(args.limit || 50);
    return iocs;
  },
});

export const getIOCStats = query({
  args: {},
  handler: async (ctx) => {
    const allIOCs = await ctx.db.query("iocs").collect();
    
    const stats = {
      total: allIOCs.length,
      active: allIOCs.filter(ioc => ioc.isActive).length,
      bySeverity: {
        critical: allIOCs.filter(ioc => ioc.severity === "critical").length,
        high: allIOCs.filter(ioc => ioc.severity === "high").length,
        medium: allIOCs.filter(ioc => ioc.severity === "medium").length,
        low: allIOCs.filter(ioc => ioc.severity === "low").length,
      },
      byType: {
        ip: allIOCs.filter(ioc => ioc.type === "ip").length,
        domain: allIOCs.filter(ioc => ioc.type === "domain").length,
        url: allIOCs.filter(ioc => ioc.type === "url").length,
        hash: allIOCs.filter(ioc => ioc.type === "hash").length,
        email: allIOCs.filter(ioc => ioc.type === "email").length,
        file: allIOCs.filter(ioc => ioc.type === "file").length,
      },
    };

    return stats;
  },
});

export const createIOC = mutation({
  args: {
    type: v.string(),
    value: v.string(),
    severity: v.string(),
    description: v.optional(v.string()),
    source: v.string(),
    tags: v.array(v.string()),
    confidence: v.number(),
    mitreTechniques: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const now = Date.now();
    
    return await ctx.db.insert("iocs", {
      type: args.type as any,
      value: args.value,
      severity: args.severity as any,
      description: args.description,
      source: args.source,
      tags: args.tags,
      isActive: true,
      firstSeen: now,
      lastSeen: now,
      confidence: args.confidence,
      createdBy: user._id,
      mitreTechniques: args.mitreTechniques,
    });
  },
});

export const updateIOC = mutation({
  args: {
    id: v.id("iocs"),
    updates: v.object({
      severity: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      isActive: v.optional(v.boolean()),
      confidence: v.optional(v.number()),
      mitreTechniques: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    let user = await getCurrentUser(ctx);
    
    // If no authenticated user, use or create system user for status updates
    if (!user) {
      const systemUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), "system@threatintel.ai"))
        .first();
      
      if (systemUser) {
        user = systemUser;
      } else {
        const userId = await ctx.db.insert("users", {
          email: "system@threatintel.ai",
          name: "System",
          isAnonymous: true,
        });
        user = await ctx.db.get(userId);
        if (!user) throw new Error("Failed to create system user");
      }
    }

    const ioc = await ctx.db.get(args.id);
    if (!ioc) {
      throw new Error("IOC not found");
    }

    const updates: any = {};
    if (args.updates.severity) updates.severity = args.updates.severity;
    if (args.updates.description !== undefined) updates.description = args.updates.description;
    if (args.updates.tags) updates.tags = args.updates.tags;
    if (args.updates.isActive !== undefined) updates.isActive = args.updates.isActive;
    if (args.updates.confidence !== undefined) updates.confidence = args.updates.confidence;
    if (args.updates.mitreTechniques !== undefined) updates.mitreTechniques = args.updates.mitreTechniques;

    if (args.updates.isActive !== undefined) {
      updates.lastSeen = Date.now();
    }

    return await ctx.db.patch(args.id, updates);
  },
});

export const deleteIOC = mutation({
  args: {
    id: v.id("iocs"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const ioc = await ctx.db.get(args.id);
    if (!ioc) {
      throw new Error("IOC not found");
    }

    // Only allow deletion by creator or admin
    if (ioc.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.delete(args.id);
  },
});