import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getNetworkEvents = query({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(v.string()),
    eventType: v.optional(v.string()),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.permissions.includes("view_siem")) {
      return [];
    }

    let events;

    // Apply filters
    if (args.severity) {
      events = await ctx.db
        .query("networkEvents")
        .withIndex("by_severity", (q) => q.eq("severity", args.severity as any))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.eventType) {
      events = await ctx.db
        .query("networkEvents")
        .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType as any))
        .order("desc")
        .take(args.limit || 50);
    } else {
      events = await ctx.db
        .query("networkEvents")
        .withIndex("by_timestamp")
        .order("desc")
        .take(args.limit || 50);
    }

    // Apply time range filter if specified
    if (args.timeRange) {
      const cutoffTime = Date.now() - args.timeRange;
      events = events.filter(event => event.timestamp >= cutoffTime);
    }

    return events;
  },
});

export const getSiemStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.permissions.includes("view_siem")) {
      return null;
    }

    const allEvents = await ctx.db.query("networkEvents").collect();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentEvents = allEvents.filter(event => event.timestamp >= last24Hours);

    const stats = {
      totalEvents: allEvents.length,
      recentEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === "critical").length,
      highEvents: recentEvents.filter(e => e.severity === "high").length,
      mediumEvents: recentEvents.filter(e => e.severity === "medium").length,
      lowEvents: recentEvents.filter(e => e.severity === "low").length,
      blockedEvents: recentEvents.filter(e => e.status === "blocked").length,
      detectedEvents: recentEvents.filter(e => e.status === "detected").length,
      eventsByType: {
        login_attempt: recentEvents.filter(e => e.eventType === "login_attempt").length,
        network_scan: recentEvents.filter(e => e.eventType === "network_scan").length,
        malware_detected: recentEvents.filter(e => e.eventType === "malware_detected").length,
        data_exfiltration: recentEvents.filter(e => e.eventType === "data_exfiltration").length,
        privilege_escalation: recentEvents.filter(e => e.eventType === "privilege_escalation").length,
      },
      topSourceIps: getTopSourceIps(recentEvents),
      threatTrends: getThreatTrends(allEvents),
    };

    return stats;
  },
});

function getTopSourceIps(events: any[]) {
  const ipCounts: Record<string, number> = {};
  events.forEach(event => {
    ipCounts[event.sourceIp] = (ipCounts[event.sourceIp] || 0) + 1;
  });
  
  return Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
}

function getThreatTrends(events: any[]) {
  const now = Date.now();
  const trends = [];
  
  for (let i = 0; i < 24; i++) {
    const hourStart = now - (i + 1) * 60 * 60 * 1000;
    const hourEnd = now - i * 60 * 60 * 1000;
    const hourEvents = events.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd);
    
    trends.unshift({
      hour: new Date(hourStart).getHours(),
      count: hourEvents.length,
      critical: hourEvents.filter(e => e.severity === "critical").length,
      high: hourEvents.filter(e => e.severity === "high").length,
    });
  }
  
  return trends;
}

export const createNetworkEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("login_attempt"),
      v.literal("network_scan"),
      v.literal("malware_detected"),
      v.literal("data_exfiltration"),
      v.literal("privilege_escalation"),
      v.literal("firewall_block"),
      v.literal("intrusion_detection"),
      v.literal("ddos_attack"),
      v.literal("suspicious_traffic")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    sourceIp: v.string(),
    destinationIp: v.optional(v.string()),
    port: v.optional(v.number()),
    protocol: v.optional(v.string()),
    status: v.union(v.literal("allowed"), v.literal("blocked"), v.literal("failed"), v.literal("detected"), v.literal("quarantined")),
    description: v.string(),
    userId: v.optional(v.string()),
    location: v.optional(v.string()),
    metadata: v.optional(v.object({
      attempts: v.optional(v.number()),
      userAgent: v.optional(v.string()),
      geoLocation: v.optional(v.string()),
      portsScanned: v.optional(v.number()),
      duration: v.optional(v.number()),
      malwareType: v.optional(v.string()),
      fileName: v.optional(v.string()),
      hash: v.optional(v.string()),
      dataSize: v.optional(v.string()),
      transferDuration: v.optional(v.number()),
      fileTypes: v.optional(v.array(v.string())),
      targetAccount: v.optional(v.string()),
      method: v.optional(v.string()),
      processName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.permissions.includes("manage_siem")) {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.insert("networkEvents", {
      timestamp: Date.now(),
      ...args,
    });
  },
});

export const getSiemRules = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.permissions.includes("view_siem")) {
      return [];
    }

    return await ctx.db.query("siemRules").collect();
  },
});

export const createSiemRule = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    eventType: v.string(),
    conditions: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.string(),
    })),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    actions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.permissions.includes("manage_siem")) {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.insert("siemRules", {
      ...args,
      isActive: true,
      createdBy: userId,
    });
  },
});
