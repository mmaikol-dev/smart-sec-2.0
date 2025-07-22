import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ROLE_PERMISSIONS } from "./permissions";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      profile,
    };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to manage users
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile?.permissions.includes("manage_users")) {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .unique();
        return {
          ...user,
          profile,
        };
      })
    );

    return usersWithProfiles;
  },
});

export const getUsersWithoutProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile?.permissions.includes("manage_users")) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();
    const allProfiles = await ctx.db.query("userProfiles").collect();
    const userIdsWithProfiles = new Set(allProfiles.map((p) => p.userId));

    const usersWithoutProfile = allUsers.filter(
      (u) => !userIdsWithProfiles.has(u._id)
    );

    return usersWithoutProfile;
  },
});

export const createUserProfile = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("security_manager"),
      v.literal("bodyguard"),
      v.literal("dog_handler"),
      v.literal("cctv_operator"),
      v.literal("viewer")
    ),
    department: v.string(),
    employeeId: v.optional(v.string()),
    assignedZones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if current user has permission to manage users
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", currentUserId))
      .unique();

    if (!currentProfile?.permissions.includes("manage_users")) {
      throw new Error("Insufficient permissions");
    }

    const targetUserId = args.userId;
    const permissions = ROLE_PERMISSIONS[args.role] || [];

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", targetUserId))
      .unique();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    return await ctx.db.insert("userProfiles", {
      userId: targetUserId,
      role: args.role,
      permissions,
      department: args.department,
      employeeId: args.employeeId,
      isActive: true,
      assignedZones: args.assignedZones,
    });
  },
});

export const updateUserProfile = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("security_manager"),
        v.literal("bodyguard"),
        v.literal("dog_handler"),
        v.literal("cctv_operator"),
        v.literal("viewer")
      )
    ),
    department: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    assignedZones: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to manage users
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile?.permissions.includes("manage_users")) {
      throw new Error("Insufficient permissions");
    }

    const { profileId, ...updates } = args;
    const filteredUpdates: any = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Update permissions if role is changed
    if (filteredUpdates.role) {
      filteredUpdates.permissions =
        ROLE_PERMISSIONS[filteredUpdates.role as keyof typeof ROLE_PERMISSIONS] ||
        [];
    }

    return await ctx.db.patch(profileId, filteredUpdates);
  },
});

export const updateLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastLogin: Date.now(),
      });
    }

    return profile;
  },
});

export const createInitialAdminProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if this user already has a profile
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      return existingProfile;
    }

    // Check if there are any admin profiles
    const adminProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    // If no admin exists, make this user an admin
    const role = adminProfiles.length === 0 ? "admin" : "viewer";
    const permissions = ROLE_PERMISSIONS[role] || [];

    return await ctx.db.insert("userProfiles", {
      userId,
      role,
      permissions,
      department: "Administration",
      isActive: true,
      assignedZones: ["Main Building"],
    });
  },
});
