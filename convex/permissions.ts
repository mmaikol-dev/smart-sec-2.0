import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Define all available permissions
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  SYSTEM_SETTINGS: "system_settings",
  
  // Security management
  MANAGE_SECURITY_EVENTS: "manage_security_events",
  VIEW_ALL_EVENTS: "view_all_events",
  RESOLVE_EVENTS: "resolve_events",
  CREATE_EVENTS: "create_events",
  
  // Guard dogs
  MANAGE_GUARD_DOGS: "manage_guard_dogs",
  VIEW_GUARD_DOGS: "view_guard_dogs",
  UPDATE_DOG_STATUS: "update_dog_status",
  
  // Bodyguards
  MANAGE_BODYGUARDS: "manage_bodyguards",
  VIEW_BODYGUARDS: "view_bodyguards",
  UPDATE_GUARD_STATUS: "update_guard_status",
  
  // CCTV
  MANAGE_CAMERAS: "manage_cameras",
  VIEW_CAMERAS: "view_cameras",
  CONTROL_CAMERAS: "control_cameras",
  
  // Dashboard and reports
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_REPORTS: "view_reports",
  GENERATE_REPORTS: "generate_reports",
  
  // AI features
  USE_AI_CHAT: "use_ai_chat",
  
  // Zone access
  ACCESS_ALL_ZONES: "access_all_zones",

  // SIEM permissions
  VIEW_SIEM: "view_siem",
  MANAGE_SIEM: "manage_siem",
  VIEW_NETWORK_LOGS: "view_network_logs",
  MANAGE_NETWORK_SECURITY: "manage_network_security",
} as const;

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_SECURITY_EVENTS,
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.RESOLVE_EVENTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.MANAGE_GUARD_DOGS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.UPDATE_DOG_STATUS,
    PERMISSIONS.MANAGE_BODYGUARDS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.UPDATE_GUARD_STATUS,
    PERMISSIONS.MANAGE_CAMERAS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.CONTROL_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.USE_AI_CHAT,
    PERMISSIONS.ACCESS_ALL_ZONES,
    PERMISSIONS.VIEW_SIEM,
    PERMISSIONS.MANAGE_SIEM,
    PERMISSIONS.VIEW_NETWORK_LOGS,
    PERMISSIONS.MANAGE_NETWORK_SECURITY,
  ],
  security_manager: [
    PERMISSIONS.MANAGE_SECURITY_EVENTS,
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.RESOLVE_EVENTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.UPDATE_DOG_STATUS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.UPDATE_GUARD_STATUS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.CONTROL_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.USE_AI_CHAT,
    PERMISSIONS.ACCESS_ALL_ZONES,
    PERMISSIONS.VIEW_SIEM,
    PERMISSIONS.VIEW_NETWORK_LOGS,
  ],
  bodyguard: [
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.RESOLVE_EVENTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.UPDATE_GUARD_STATUS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_AI_CHAT,
  ],
  dog_handler: [
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.MANAGE_GUARD_DOGS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.UPDATE_DOG_STATUS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_AI_CHAT,
  ],
  cctv_operator: [
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.RESOLVE_EVENTS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.MANAGE_CAMERAS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.CONTROL_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.USE_AI_CHAT,
    PERMISSIONS.VIEW_SIEM,
    PERMISSIONS.VIEW_NETWORK_LOGS,
  ],
  viewer: [
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.VIEW_GUARD_DOGS,
    PERMISSIONS.VIEW_BODYGUARDS,
    PERMISSIONS.VIEW_CAMERAS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

export const initializeRolePermissions = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing role permissions
    const existing = await ctx.db.query("rolePermissions").collect();
    for (const role of existing) {
      await ctx.db.delete(role._id);
    }

    // Insert role permissions
    const roleDescriptions = {
      admin: "Full system access with all administrative privileges",
      security_manager: "Manages security operations and personnel",
      bodyguard: "Field security personnel with operational access",
      dog_handler: "Specialized in guard dog management and operations",
      cctv_operator: "Monitors and controls surveillance systems",
      viewer: "Read-only access to security information",
    };

    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      await ctx.db.insert("rolePermissions", {
        role,
        permissions,
        description: roleDescriptions[role as keyof typeof roleDescriptions],
      });
    }

    return { success: true, message: "Role permissions initialized" };
  },
});

export const checkPermission = query({
  args: {
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || !profile.isActive) {
      return false;
    }

    return profile.permissions.includes(args.permission);
  },
});

export const getUserPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return profile?.permissions || [];
  },
});

export const getRolePermissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rolePermissions").collect();
  },
});

export const logAuditEvent = mutation({
  args: {
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.insert("auditLogs", {
      userId,
      action: args.action,
      resource: args.resource,
      resourceId: args.resourceId,
      details: args.details,
    });
  },
});
