import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Guard Dogs Functions
export const getGuardDogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guardDogs").collect();
  },
});

export const getActiveGuardDogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("guardDogs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const addGuardDog = mutation({
  args: {
    name: v.string(),
    breed: v.string(),
    age: v.number(),
    status: v.union(v.literal("active"), v.literal("resting"), v.literal("offline"), v.literal("medical")),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
    }),
    handler: v.object({
      name: v.string(),
      contact: v.string(),
    }),
    healthMetrics: v.object({
      heartRate: v.number(),
      temperature: v.number(),
      lastCheckup: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("guardDogs", {
      ...args,
      lastPatrol: Date.now(),
      isOnDuty: args.status === "active",
    });
  },
});

export const updateGuardDog = mutation({
  args: {
    dogId: v.id("guardDogs"),
    name: v.optional(v.string()),
    breed: v.optional(v.string()),
    age: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("resting"), v.literal("offline"), v.literal("medical"))),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
    })),
    handler: v.optional(v.object({
      name: v.string(),
      contact: v.string(),
    })),
    healthMetrics: v.optional(v.object({
      heartRate: v.number(),
      temperature: v.number(),
      lastCheckup: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { dogId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (filteredUpdates.status) {
      filteredUpdates.isOnDuty = filteredUpdates.status === "active";
    }
    
    return await ctx.db.patch(dogId, filteredUpdates);
  },
});

export const updateDogStatus = mutation({
  args: {
    dogId: v.id("guardDogs"),
    status: v.union(v.literal("active"), v.literal("resting"), v.literal("offline"), v.literal("medical")),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const updates: any = { 
      status: args.status,
      isOnDuty: args.status === "active"
    };
    if (args.location) {
      updates.location = args.location;
    }
    return await ctx.db.patch(args.dogId, updates);
  },
});

export const deleteGuardDog = mutation({
  args: {
    dogId: v.id("guardDogs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.dogId);
  },
});

// Bodyguards Functions
export const getBodyguards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bodyguards").collect();
  },
});

export const getActiveBodyguards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bodyguards")
      .withIndex("by_status", (q) => q.eq("status", "on_duty"))
      .collect();
  },
});

export const addBodyguard = mutation({
  args: {
    name: v.string(),
    employeeId: v.string(),
    assignedZone: v.string(),
    status: v.union(v.literal("on_duty"), v.literal("off_duty"), v.literal("break"), v.literal("emergency")),
    currentActivity: v.string(),
    shiftStart: v.number(),
    shiftEnd: v.number(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    contact: v.string(),
    certifications: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bodyguards", args);
  },
});

export const updateBodyguard = mutation({
  args: {
    guardId: v.id("bodyguards"),
    name: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    assignedZone: v.optional(v.string()),
    status: v.optional(v.union(v.literal("on_duty"), v.literal("off_duty"), v.literal("break"), v.literal("emergency"))),
    currentActivity: v.optional(v.string()),
    shiftStart: v.optional(v.number()),
    shiftEnd: v.optional(v.number()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    contact: v.optional(v.string()),
    certifications: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { guardId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    return await ctx.db.patch(guardId, filteredUpdates);
  },
});

export const updateGuardStatus = mutation({
  args: {
    guardId: v.id("bodyguards"),
    status: v.union(v.literal("on_duty"), v.literal("off_duty"), v.literal("break"), v.literal("emergency")),
    currentActivity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };
    if (args.currentActivity) {
      updates.currentActivity = args.currentActivity;
    }
    return await ctx.db.patch(args.guardId, updates);
  },
});

export const deleteBodyguard = mutation({
  args: {
    guardId: v.id("bodyguards"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.guardId);
  },
});

// CCTV Cameras Functions
export const getCCTVCameras = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cctvCameras").collect();
  },
});

export const getOnlineCameras = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cctvCameras")
      .withIndex("by_status", (q) => q.eq("status", "online"))
      .collect();
  },
});

export const addCCTVCamera = mutation({
  args: {
    cameraId: v.string(),
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
      description: v.string(),
    }),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("maintenance"), v.literal("error")),
    isRecording: v.boolean(),
    aiFeatures: v.object({
      motionDetection: v.boolean(),
      faceRecognition: v.boolean(),
      intrusionDetection: v.boolean(),
    }),
    resolution: v.string(),
    nightVision: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cctvCameras", {
      ...args,
      lastPing: Date.now(),
    });
  },
});

export const updateCCTVCamera = mutation({
  args: {
    cameraId: v.id("cctvCameras"),
    name: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
      description: v.string(),
    })),
    status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("maintenance"), v.literal("error"))),
    isRecording: v.optional(v.boolean()),
    aiFeatures: v.optional(v.object({
      motionDetection: v.boolean(),
      faceRecognition: v.boolean(),
      intrusionDetection: v.boolean(),
    })),
    resolution: v.optional(v.string()),
    nightVision: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { cameraId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    filteredUpdates.lastPing = Date.now();
    return await ctx.db.patch(cameraId, filteredUpdates);
  },
});

export const updateCameraStatus = mutation({
  args: {
    cameraId: v.id("cctvCameras"),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("maintenance"), v.literal("error")),
    isRecording: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = { 
      status: args.status,
      lastPing: Date.now(),
    };
    if (args.isRecording !== undefined) {
      updates.isRecording = args.isRecording;
    }
    return await ctx.db.patch(args.cameraId, updates);
  },
});

export const deleteCCTVCamera = mutation({
  args: {
    cameraId: v.id("cctvCameras"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.cameraId);
  },
});

// Security Events Functions
export const getSecurityEvents = query({
  args: {
    limit: v.optional(v.number()),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.resolved !== undefined) {
      return await ctx.db
        .query("securityEvents")
        .withIndex("by_resolved", (q) => q.eq("isResolved", args.resolved as boolean))
        .order("desc")
        .take(args.limit || 50);
    }
    
    return await ctx.db
      .query("securityEvents")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getEventsByZone = query({
  args: {
    zone: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("securityEvents")
      .withIndex("by_zone", (q) => q.eq("location.zone", args.zone))
      .order("desc")
      .take(args.limit || 20);
  },
});

export const logSecurityEvent = mutation({
  args: {
    type: v.union(
      v.literal("motion_detected"),
      v.literal("intrusion_alert"),
      v.literal("face_recognized"),
      v.literal("patrol_completed"),
      v.literal("emergency"),
      v.literal("system_alert")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
    }),
    sourceId: v.string(),
    sourceType: v.union(v.literal("camera"), v.literal("dog"), v.literal("guard"), v.literal("system")),
    metadata: v.optional(v.object({
      imageUrl: v.optional(v.string()),
      confidence: v.optional(v.number()),
      additionalInfo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("securityEvents", {
      ...args,
      isResolved: false,
    });
  },
});

export const updateSecurityEvent = mutation({
  args: {
    eventId: v.id("securityEvents"),
    type: v.optional(v.union(
      v.literal("motion_detected"),
      v.literal("intrusion_alert"),
      v.literal("face_recognized"),
      v.literal("patrol_completed"),
      v.literal("emergency"),
      v.literal("system_alert")
    )),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    description: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      zone: v.string(),
    })),
    sourceId: v.optional(v.string()),
    sourceType: v.optional(v.union(v.literal("camera"), v.literal("dog"), v.literal("guard"), v.literal("system"))),
    metadata: v.optional(v.object({
      imageUrl: v.optional(v.string()),
      confidence: v.optional(v.number()),
      additionalInfo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    return await ctx.db.patch(eventId, filteredUpdates);
  },
});

export const resolveSecurityEvent = mutation({
  args: {
    eventId: v.id("securityEvents"),
    resolvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.eventId, {
      isResolved: true,
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
    });
  },
});

export const deleteSecurityEvent = mutation({
  args: {
    eventId: v.id("securityEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.eventId);
  },
});

// Dashboard Statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [dogs, guards, cameras, events] = await Promise.all([
      ctx.db.query("guardDogs").collect(),
      ctx.db.query("bodyguards").collect(),
      ctx.db.query("cctvCameras").collect(),
      ctx.db.query("securityEvents")
        .withIndex("by_resolved", (q) => q.eq("isResolved", false))
        .collect(),
    ]);

    const activeDogs = dogs.filter(dog => dog.status === "active").length;
    const activeGuards = guards.filter(guard => guard.status === "on_duty").length;
    const onlineCameras = cameras.filter(camera => camera.status === "online").length;
    const criticalEvents = events.filter(event => event.severity === "critical").length;

    return {
      dogs: {
        total: dogs.length,
        active: activeDogs,
        offline: dogs.length - activeDogs,
      },
      guards: {
        total: guards.length,
        onDuty: activeGuards,
        offDuty: guards.length - activeGuards,
      },
      cameras: {
        total: cameras.length,
        online: onlineCameras,
        offline: cameras.length - onlineCameras,
      },
      events: {
        total: events.length,
        critical: criticalEvents,
        pending: events.length,
      },
    };
  },
});
