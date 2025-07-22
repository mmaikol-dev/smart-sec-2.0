import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSecurityData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingDogs = await ctx.db.query("guardDogs").collect();
    const existingGuards = await ctx.db.query("bodyguards").collect();
    const existingCameras = await ctx.db.query("cctvCameras").collect();
    const existingEvents = await ctx.db.query("securityEvents").collect();
    const existingNetworkEvents = await ctx.db.query("networkEvents").collect();

    for (const dog of existingDogs) {
      await ctx.db.delete(dog._id);
    }
    for (const guard of existingGuards) {
      await ctx.db.delete(guard._id);
    }
    for (const camera of existingCameras) {
      await ctx.db.delete(camera._id);
    }
    for (const event of existingEvents) {
      await ctx.db.delete(event._id);
    }
    for (const networkEvent of existingNetworkEvents) {
      await ctx.db.delete(networkEvent._id);
    }

    // Seed Guard Dogs
    const dogs = [
      {
        name: "Rex",
        breed: "German Shepherd",
        age: 4,
        status: "active" as const,
        location: { lat: 40.7128, lng: -74.0060, zone: "Main Building" },
        handler: { name: "John Smith", contact: "+1-555-0101" },
        healthMetrics: { heartRate: 85, temperature: 101.5, lastCheckup: Date.now() - 86400000 },
        lastPatrol: Date.now() - 3600000,
        isOnDuty: true,
      },
      {
        name: "Luna",
        breed: "Belgian Malinois",
        age: 3,
        status: "active" as const,
        location: { lat: 40.7130, lng: -74.0058, zone: "North Gate" },
        handler: { name: "Sarah Johnson", contact: "+1-555-0102" },
        healthMetrics: { heartRate: 90, temperature: 101.8, lastCheckup: Date.now() - 172800000 },
        lastPatrol: Date.now() - 1800000,
        isOnDuty: true,
      },
      {
        name: "Max",
        breed: "Rottweiler",
        age: 5,
        status: "resting" as const,
        location: { lat: 40.7125, lng: -74.0065, zone: "South Entrance" },
        handler: { name: "Mike Wilson", contact: "+1-555-0103" },
        healthMetrics: { heartRate: 75, temperature: 101.2, lastCheckup: Date.now() - 259200000 },
        lastPatrol: Date.now() - 7200000,
        isOnDuty: false,
      },
    ];

    for (const dog of dogs) {
      await ctx.db.insert("guardDogs", dog);
    }

    // Seed Bodyguards
    const guards = [
      {
        name: "Alex Rodriguez",
        employeeId: "BG001",
        assignedZone: "Main Building",
        status: "on_duty" as const,
        currentActivity: "Perimeter patrol",
        shiftStart: Date.now() - 14400000,
        shiftEnd: Date.now() + 14400000,
        location: { lat: 40.7128, lng: -74.0060 },
        contact: "+1-555-0201",
        certifications: ["Armed Security", "First Aid", "CPR"],
      },
      {
        name: "Maria Garcia",
        employeeId: "BG002",
        assignedZone: "North Gate",
        status: "on_duty" as const,
        currentActivity: "Access control",
        shiftStart: Date.now() - 10800000,
        shiftEnd: Date.now() + 17400000,
        location: { lat: 40.7130, lng: -74.0058 },
        contact: "+1-555-0202",
        certifications: ["Security Guard License", "Crowd Control"],
      },
      {
        name: "David Chen",
        employeeId: "BG003",
        assignedZone: "Control Room",
        status: "break" as const,
        currentActivity: "Break time",
        shiftStart: Date.now() - 7200000,
        shiftEnd: Date.now() + 21600000,
        location: { lat: 40.7126, lng: -74.0062 },
        contact: "+1-555-0203",
        certifications: ["CCTV Operations", "Emergency Response"],
      },
    ];

    for (const guard of guards) {
      await ctx.db.insert("bodyguards", guard);
    }

    // Seed CCTV Cameras
    const cameras = [
      {
        cameraId: "CAM001",
        name: "Main Entrance Camera",
        location: {
          lat: 40.7128,
          lng: -74.0060,
          zone: "Main Building",
          description: "Primary entrance monitoring",
        },
        status: "online" as const,
        isRecording: true,
        lastPing: Date.now() - 30000,
        aiFeatures: {
          motionDetection: true,
          faceRecognition: true,
          intrusionDetection: true,
        },
        resolution: "4K",
        nightVision: true,
      },
      {
        cameraId: "CAM002",
        name: "North Gate Camera",
        location: {
          lat: 40.7130,
          lng: -74.0058,
          zone: "North Gate",
          description: "North entrance security",
        },
        status: "online" as const,
        isRecording: true,
        lastPing: Date.now() - 45000,
        aiFeatures: {
          motionDetection: true,
          faceRecognition: false,
          intrusionDetection: true,
        },
        resolution: "1080p",
        nightVision: true,
      },
      {
        cameraId: "CAM003",
        name: "Parking Lot Camera",
        location: {
          lat: 40.7125,
          lng: -74.0065,
          zone: "Parking Lot",
          description: "Vehicle monitoring",
        },
        status: "maintenance" as const,
        isRecording: false,
        lastPing: Date.now() - 300000,
        aiFeatures: {
          motionDetection: true,
          faceRecognition: false,
          intrusionDetection: false,
        },
        resolution: "1080p",
        nightVision: false,
      },
    ];

    for (const camera of cameras) {
      await ctx.db.insert("cctvCameras", camera);
    }

    // Seed Security Events
    const events = [
      {
        type: "motion_detected" as const,
        severity: "low" as const,
        description: "Motion detected in parking lot",
        location: { lat: 40.7125, lng: -74.0065, zone: "Parking Lot" },
        sourceId: "CAM003",
        sourceType: "camera" as const,
        isResolved: true,
        resolvedBy: "David Chen",
        resolvedAt: Date.now() - 1800000,
        metadata: { confidence: 0.85, additionalInfo: "Vehicle movement detected" },
      },
      {
        type: "intrusion_alert" as const,
        severity: "high" as const,
        description: "Unauthorized access attempt at north gate",
        location: { lat: 40.7130, lng: -74.0058, zone: "North Gate" },
        sourceId: "CAM002",
        sourceType: "camera" as const,
        isResolved: false,
        metadata: { confidence: 0.92, additionalInfo: "Person without valid credentials" },
      },
      {
        type: "patrol_completed" as const,
        severity: "low" as const,
        description: "K9 patrol completed successfully",
        location: { lat: 40.7128, lng: -74.0060, zone: "Main Building" },
        sourceId: "Rex",
        sourceType: "dog" as const,
        isResolved: true,
        resolvedBy: "John Smith",
        resolvedAt: Date.now() - 3600000,
        metadata: { additionalInfo: "All areas clear" },
      },
    ];

    for (const event of events) {
      await ctx.db.insert("securityEvents", event);
    }

    // Seed Network Events for SIEM
    const networkEvents = [
      {
        timestamp: Date.now() - 300000,
        eventType: "login_attempt" as const,
        severity: "medium" as const,
        sourceIp: "192.168.1.100",
        destinationIp: "10.0.0.1",
        port: 22,
        protocol: "SSH",
        status: "failed" as const,
        description: "Failed SSH login attempt",
        userId: "admin",
        location: "Main Building",
        metadata: {
          attempts: 3,
          userAgent: "OpenSSH_8.0",
          geoLocation: "New York, US"
        }
      },
      {
        timestamp: Date.now() - 600000,
        eventType: "network_scan" as const,
        severity: "high" as const,
        sourceIp: "203.0.113.45",
        destinationIp: "10.0.0.0/24",
        port: 80,
        protocol: "TCP",
        status: "blocked" as const,
        description: "Port scan detected from external IP",
        location: "Network Perimeter",
        metadata: {
          portsScanned: 1024,
          duration: 120,
          geoLocation: "Unknown"
        }
      },
      {
        timestamp: Date.now() - 900000,
        eventType: "malware_detected" as const,
        severity: "critical" as const,
        sourceIp: "192.168.1.150",
        destinationIp: "185.220.101.42",
        port: 443,
        protocol: "HTTPS",
        status: "quarantined" as const,
        description: "Malware communication blocked",
        location: "Workstation-15",
        metadata: {
          malwareType: "Trojan.Generic",
          fileName: "suspicious.exe",
          hash: "a1b2c3d4e5f6"
        }
      },
      {
        timestamp: Date.now() - 1200000,
        eventType: "data_exfiltration" as const,
        severity: "critical" as const,
        sourceIp: "192.168.1.200",
        destinationIp: "198.51.100.10",
        port: 443,
        protocol: "HTTPS",
        status: "blocked" as const,
        description: "Suspicious large data transfer blocked",
        userId: "user123",
        location: "Finance Department",
        metadata: {
          dataSize: "500MB",
          transferDuration: 300,
          fileTypes: ["xlsx", "pdf", "docx"]
        }
      },
      {
        timestamp: Date.now() - 1800000,
        eventType: "privilege_escalation" as const,
        severity: "high" as const,
        sourceIp: "192.168.1.75",
        port: 3389,
        protocol: "RDP",
        status: "detected" as const,
        description: "Privilege escalation attempt detected",
        userId: "temp_user",
        location: "IT Department",
        metadata: {
          targetAccount: "administrator",
          method: "Token Manipulation",
          processName: "powershell.exe"
        }
      }
    ];

    for (const networkEvent of networkEvents) {
      await ctx.db.insert("networkEvents", networkEvent);
    }

    return { success: true, message: "Security data seeded successfully" };
  },
});

export const createSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if super admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "admin@gmail.com"))
      .unique();

    if (existingAdmin) {
      return { success: false, message: "Super admin already exists" };
    }

    // Create super admin user
    const adminId = await ctx.db.insert("users", {
      name: "Super Administrator",
      email: "admin@gmail.com",
      emailVerificationTime: Date.now(),
      isAnonymous: false,
    });

    // Create super admin profile
    await ctx.db.insert("userProfiles", {
      userId: adminId,
      role: "admin",
      permissions: [
        "manage_users",
        "manage_roles",
        "view_audit_logs",
        "system_settings",
        "manage_security_events",
        "view_all_events",
        "resolve_events",
        "create_events",
        "manage_guard_dogs",
        "view_guard_dogs",
        "update_dog_status",
        "manage_bodyguards",
        "view_bodyguards",
        "update_guard_status",
        "manage_cameras",
        "view_cameras",
        "control_cameras",
        "view_dashboard",
        "view_reports",
        "generate_reports",
        "use_ai_chat",
        "access_all_zones",
        "view_siem",
        "manage_siem",
        "view_network_logs",
        "manage_network_security"
      ],
      department: "Administration",
      employeeId: "ADMIN001",
      isActive: true,
      assignedZones: ["All Zones"],
    });

    return { success: true, message: "Super admin created successfully" };
  },
});
