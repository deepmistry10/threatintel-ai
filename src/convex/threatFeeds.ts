import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const listFeeds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("threatFeeds").collect();
  },
});

export const getFeedStats = query({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db.query("threatFeeds").collect();
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    
    const iocs = await ctx.db.query("iocs").collect();
    const feedIOCs = iocs.filter(ioc => ioc.feedSource !== undefined);
    const recentFeedIOCs = feedIOCs.filter(ioc => ioc.firstSeen > last24h);
    
    return {
      totalFeeds: feeds.length,
      enabledFeeds: feeds.filter(f => f.enabled).length,
      totalFeedIOCs: feedIOCs.length,
      todayFeedIOCs: recentFeedIOCs.length,
      lastSync: feeds.reduce((max, f) => Math.max(max, f.lastSync || 0), 0),
    };
  },
});

export const createFeed = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    feedType: v.union(v.literal("json"), v.literal("csv"), v.literal("stix")),
    syncInterval: v.number(),
    reputation: v.optional(v.number()),
    description: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await getCurrentUser(ctx);
    
    // If no authenticated user, use or create system user
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

    return await ctx.db.insert("threatFeeds", {
      name: args.name,
      url: args.url,
      feedType: args.feedType,
      enabled: true,
      syncInterval: args.syncInterval,
      reputation: args.reputation || 75,
      metadata: {
        description: args.description,
        provider: args.provider,
      },
    });
  },
});

export const toggleFeed = mutation({
  args: {
    feedId: v.id("threatFeeds"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    let user = await getCurrentUser(ctx);
    
    // If no authenticated user, use or create system user
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

    await ctx.db.patch(args.feedId, { enabled: args.enabled });
  },
});

export const deleteFeed = mutation({
  args: {
    feedId: v.id("threatFeeds"),
  },
  handler: async (ctx, args) => {
    let user = await getCurrentUser(ctx);
    
    // If no authenticated user, use or create system user
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

    await ctx.db.delete(args.feedId);
  },
});
