import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getImportHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("importHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 20);
    
    return history;
  },
});

export const bulkCreateIOCs = mutation({
  args: {
    iocs: v.array(v.object({
      type: v.string(),
      value: v.string(),
      severity: v.string(),
      description: v.optional(v.string()),
      source: v.string(),
      tags: v.array(v.string()),
      confidence: v.number(),
    })),
    fileType: v.union(v.literal("csv"), v.literal("json")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");
    
    const batchId = `import_${Date.now()}_${user._id}`;
    const now = Date.now();
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ row: number; error: string }> = [];
    
    for (let i = 0; i < args.iocs.length; i++) {
      try {
        const ioc = args.iocs[i];
        
        // Validation
        if (!ioc.value || !ioc.type || !ioc.severity) {
          throw new Error("Missing required fields: type, value, or severity");
        }
        
        await ctx.db.insert("iocs", {
          type: ioc.type as any,
          value: ioc.value,
          severity: ioc.severity as any,
          description: ioc.description,
          source: ioc.source || "bulk_import",
          tags: [...ioc.tags, "bulk_import", batchId],
          isActive: true,
          firstSeen: now,
          lastSeen: now,
          confidence: ioc.confidence || 75,
          createdBy: user._id,
          importBatch: batchId,
        });
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push({
          row: i + 1,
          error: error.message || "Unknown error",
        });
      }
    }
    
    // Record import history
    await ctx.db.insert("importHistory", {
      batchId,
      importedBy: user._id,
      timestamp: now,
      totalRecords: args.iocs.length,
      successCount,
      failureCount,
      fileType: args.fileType,
      errors: errors.length > 0 ? errors : undefined,
    });
    
    return {
      batchId,
      successCount,
      failureCount,
      errors,
    };
  },
});
