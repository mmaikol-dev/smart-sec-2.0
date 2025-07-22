import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with roles and permissions
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("security_manager"),
      v.literal("bodyguard"),
      v.literal("dog_handler"),
      v.literal("cctv_operator"),
      v.literal("viewer")
    ),
    permissions: v.array(v.string()),
    department: v.string(),
    employeeId: v.optional(v.string()),
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    assignedZones: v.array(v.string()),
  }).index("by_user_id", ["userId"])
    .index("by_role", ["role"])
    .index("by_employee_id", ["employeeId"]),

  // Guard Dogs
  guardDogs: defineTable({
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
    lastPatrol: v.number(),
    isOnDuty: v.boolean(),
  }).index("by_status", ["status"])
    .index("by_zone", ["location.zone"]),

  // Bodyguards
  bodyguards: defineTable({
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
  }).index("by_status", ["status"])
    .index("by_employee_id", ["employeeId"])
    .index("by_zone", ["assignedZone"]),

  // CCTV Cameras
  cctvCameras: defineTable({
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
    lastPing: v.number(),
    aiFeatures: v.object({
      motionDetection: v.boolean(),
      faceRecognition: v.boolean(),
      intrusionDetection: v.boolean(),
    }),
    resolution: v.string(),
    nightVision: v.boolean(),
  }).index("by_status", ["status"])
    .index("by_camera_id", ["cameraId"])
    .index("by_zone", ["location.zone"]),

  // Security Events
  securityEvents: defineTable({
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
    isResolved: v.boolean(),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      imageUrl: v.optional(v.string()),
      confidence: v.optional(v.number()),
      additionalInfo: v.optional(v.string()),
    })),
  }).index("by_resolved", ["isResolved"])
    .index("by_severity", ["severity"])
    .index("by_zone", ["location.zone"])
    .index("by_type", ["type"]),

  // Network Events for SIEM
  networkEvents: defineTable({
    timestamp: v.number(),
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
  }).index("by_timestamp", ["timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_source_ip", ["sourceIp"])
    .index("by_status", ["status"]),

  // SIEM Rules
  siemRules: defineTable({
    name: v.string(),
    description: v.string(),
    eventType: v.string(),
    conditions: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.string(),
    })),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    isActive: v.boolean(),
    actions: v.array(v.string()),
    createdBy: v.id("users"),
  }).index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_active", ["isActive"]),

  // Role permissions mapping
  rolePermissions: defineTable({
    role: v.string(),
    permissions: v.array(v.string()),
    description: v.string(),
  }).index("by_role", ["role"]),

  // Audit logs for security actions
  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
