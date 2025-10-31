import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { incidentStatusValidator } from "./schema";

export const list = query({
  args: {
    status: v.optional(incidentStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Build query: apply index BEFORE ordering
    const baseQuery = args.status
      ? ctx.db
          .query("incidents")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("incidents");

    const ordered = baseQuery.order("desc");
    const items = await (args.limit ? ordered.take(args.limit) : ordered.collect());
    return items;
  },
});

export const get = query({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    tags: v.optional(v.array(v.string())),
    evidence: v.optional(
      v.array(
        v.object({
          kind: v.union(v.literal("ioc"), v.literal("log"), v.literal("analysis")),
          refId: v.string(),
        }),
      ),
    ),
    assignee: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = await getAuthUserId(ctx);
    
    // If no authenticated user, create a system user or use a placeholder
    if (!userId) {
      // Try to find or create a system user
      const systemUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), "system@threatintel.ai"))
        .first();
      
      if (systemUser) {
        userId = systemUser._id;
      } else {
        // Create a system user for unauthenticated operations
        userId = await ctx.db.insert("users", {
          email: "system@threatintel.ai",
          name: "System",
          isAnonymous: true,
        });
      }
    }
    
    const doc = {
      title: args.title,
      description: args.description ?? "",
      severity: args.severity as any,
      status: "open" as const,
      assignee: args.assignee,
      tags: args.tags ?? [],
      evidence: args.evidence ?? [],
      createdBy: userId,
    };
    const id = await ctx.db.insert("incidents", doc);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("incidents"),
    status: incidentStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status as any });
  },
});

export const addEvidence = mutation({
  args: {
    id: v.id("incidents"),
    evidence: v.object({
      kind: v.union(v.literal("ioc"), v.literal("log"), v.literal("analysis")),
      refId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const inc = await ctx.db.get(args.id);
    if (!inc) throw new Error("Incident not found");
    const next = [...(inc.evidence || []), args.evidence];
    await ctx.db.patch(args.id, { evidence: next });
  },
});