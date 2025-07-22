import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { StatsCards } from "./StatsCards";
import { GuardDogsPanel } from "./GuardDogsPanel";
import { BodyguardsPanel } from "./BodyguardsPanel";
import { CCTVPanel } from "./CCTVPanel";
import { SecurityEventsPanel } from "./SecurityEventsPanel";
import { AIChat } from "./AIChat";
import { UserManagementPanel } from "./UserManagementPanel";
import { SiemDashboard } from "./SiemDashboard";
import { PermissionGate } from "./PermissionGate";
import { usePermissions } from "../hooks/usePermissions";

export function RoleBasedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const stats = useQuery(api.security.getDashboardStats);
  const seedData = useMutation(api.seedData.seedSecurityData);
  const createSuperAdmin = useMutation(api.seedData.createSuperAdmin);
  const logEvent = useMutation(api.security.logSecurityEvent);
  const updateLastLogin = useMutation(api.userProfiles.updateLastLogin);
  const createInitialProfile = useMutation(api.userProfiles.createInitialAdminProfile);
  const currentUser = useQuery(api.userProfiles.getCurrentUserProfile);
  
  const {
    hasPermission,
    userRole,
    isAdmin,
    isSecurityManager,
    isBodyguard,
    isDogHandler,
    isCCTVOperator,
    isViewer,
  } = usePermissions();

  // Create initial profile if none exists
  useState(() => {
    if (currentUser && !currentUser.profile) {
      createInitialProfile();
    } else if (currentUser?.profile) {
      updateLastLogin();
    }
  });

  const handleSeedData = async () => {
    try {
      await seedData();
    } catch (error) {
      console.error("Failed to seed data:", error);
    }
  };

  const handleCreateSuperAdmin = async () => {
    try {
      const result = await createSuperAdmin();
      alert(result.message);
    } catch (error) {
      console.error("Failed to create super admin:", error);
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      await logEvent({
        type: "emergency",
        severity: "critical",
        description: "Emergency alert triggered from dashboard",
        location: { lat: 40.7128, lng: -74.0060, zone: "Control Room" },
        sourceId: "DASHBOARD",
        sourceType: "system",
        metadata: { additionalInfo: "Manual emergency alert activation" }
      });
      alert("Emergency alert has been logged!");
    } catch (error) {
      console.error("Failed to log emergency alert:", error);
    }
  };

  const handleSystemCheck = async () => {
    try {
      await logEvent({
        type: "system_alert",
        severity: "low",
        description: "System health check initiated",
        location: { lat: 40.7128, lng: -74.0060, zone: "System" },
        sourceId: "HEALTH_CHECK",
        sourceType: "system",
        metadata: { additionalInfo: "Automated system health verification" }
      });
      alert("System check has been initiated!");
    } catch (error) {
      console.error("Failed to initiate system check:", error);
    }
  };

  // Define tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs = [];

    if (hasPermission("view_dashboard")) {
      tabs.push({ id: "overview", label: "Overview", icon: "📊" });
    }

    if (hasPermission("view_guard_dogs")) {
      tabs.push({ id: "dogs", label: "Dogs", icon: "🐕" });
    }

    if (hasPermission("view_bodyguards")) {
      tabs.push({ id: "guards", label: "Guards", icon: "👮" });
    }

    if (hasPermission("view_cameras")) {
      tabs.push({ id: "cameras", label: "CCTV", icon: "📹" });
    }

    if (hasPermission("view_all_events")) {
      tabs.push({ id: "events", label: "Events", icon: "🚨" });
    }

    if (hasPermission("view_siem")) {
      tabs.push({ id: "siem", label: "SIEM", icon: "🛡️" });
    }

    if (hasPermission("use_ai_chat")) {
      tabs.push({ id: "ai", label: "AI", icon: "🤖" });
    }

    if (hasPermission("manage_users")) {
      tabs.push({ id: "users", label: "Users", icon: "👥" });
    }

    return tabs;
  };

  const tabs = getAvailableTabs();

  // Get role-specific welcome message
  const getRoleWelcomeMessage = () => {
    const roleMessages = {
      admin: "System Administrator",
      security_manager: "Security Manager",
      bodyguard: "Security Officer",
      dog_handler: "K9 Handler",
      cctv_operator: "CCTV Operator",
      viewer: "Security Viewer",
    };
    return roleMessages[userRole as keyof typeof roleMessages] || "Security Personnel";
  };

  // Get role-specific color scheme
  const getRoleColorScheme = () => {
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      security_manager: "bg-blue-100 text-blue-800",
      bodyguard: "bg-green-100 text-green-800",
      dog_handler: "bg-yellow-100 text-yellow-800",
      cctv_operator: "bg-purple-100 text-purple-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return roleColors[userRole as keyof typeof roleColors] || "bg-gray-100 text-gray-800";
  };

  // Show loading state while profile is being created
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Setting Up Your Profile</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we configure your account permissions...
          </p>
          <div className="space-y-3">
            <button
              onClick={() => createInitialProfile()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Profile
            </button>
            <button
              onClick={handleCreateSuperAdmin}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Create Super Admin (admin@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.profile.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Account Inactive</h2>
          <p className="text-gray-600 mb-4">
            Your account has been deactivated. Please contact your administrator for assistance.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                🛡️ <span className="hidden xs:inline">Smart Security</span>
              </h1>
              <PermissionGate permission="system_settings">
                <div className="flex space-x-2">
                  <button
                    onClick={handleSeedData}
                    className="px-2 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors whitespace-nowrap"
                  >
                    Demo Data
                  </button>
                  <button
                    onClick={handleCreateSuperAdmin}
                    className="px-2 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors whitespace-nowrap"
                  >
                    Super Admin
                  </button>
                </div>
              </PermissionGate>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColorScheme()}`}>
                  {getRoleWelcomeMessage()}
                </span>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600">Online</span>
              </div>
              <div className="hidden md:block text-xs sm:text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-Optimized Navigation Tabs */}
      <nav className="bg-white border-b sticky top-14 sm:top-16 z-30">
        <div className="px-2 sm:px-4 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === "overview" && (
          <PermissionGate permission="view_dashboard" fallback={<UnauthorizedAccess />}>
            <div className="space-y-6 sm:space-y-8">
              <StatsCards stats={stats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2">
                  <SecurityEventsPanel limit={5} />
                </div>
                
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                      <PermissionGate permission="create_events">
                        <button 
                          onClick={handleEmergencyAlert}
                          className="p-3 sm:p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-left touch-manipulation"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl sm:text-2xl">🚨</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base">Emergency Alert</div>
                              <div className="text-xs sm:text-sm opacity-75 truncate">Trigger immediate response</div>
                            </div>
                          </div>
                        </button>
                      </PermissionGate>
                      
                      <PermissionGate permission="generate_reports">
                        <button className="p-3 sm:p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left touch-manipulation">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl sm:text-2xl">📊</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base">Generate Report</div>
                              <div className="text-xs sm:text-sm opacity-75 truncate">Export security data</div>
                            </div>
                          </div>
                        </button>
                      </PermissionGate>
                      
                      <PermissionGate permission="system_settings">
                        <button 
                          onClick={handleSystemCheck}
                          className="p-3 sm:p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left touch-manipulation"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl sm:text-2xl">🔄</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base">System Check</div>
                              <div className="text-xs sm:text-sm opacity-75 truncate">Verify all systems</div>
                            </div>
                          </div>
                        </button>
                      </PermissionGate>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Database</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">AI Assistant</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Your Access</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">{getRoleWelcomeMessage()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PermissionGate>
        )}
        
        {activeTab === "dogs" && (
          <PermissionGate permission="view_guard_dogs" fallback={<UnauthorizedAccess />}>
            <GuardDogsPanel />
          </PermissionGate>
        )}
        
        {activeTab === "guards" && (
          <PermissionGate permission="view_bodyguards" fallback={<UnauthorizedAccess />}>
            <BodyguardsPanel />
          </PermissionGate>
        )}
        
        {activeTab === "cameras" && (
          <PermissionGate permission="view_cameras" fallback={<UnauthorizedAccess />}>
            <CCTVPanel />
          </PermissionGate>
        )}
        
        {activeTab === "events" && (
          <PermissionGate permission="view_all_events" fallback={<UnauthorizedAccess />}>
            <SecurityEventsPanel />
          </PermissionGate>
        )}

        {activeTab === "siem" && (
          <PermissionGate permission="view_siem" fallback={<UnauthorizedAccess />}>
            <SiemDashboard />
          </PermissionGate>
        )}
        
        {activeTab === "ai" && (
          <PermissionGate permission="use_ai_chat" fallback={<UnauthorizedAccess />}>
            <AIChat />
          </PermissionGate>
        )}
        
        {activeTab === "users" && (
          <PermissionGate permission="manage_users" fallback={<UnauthorizedAccess />}>
            <UserManagementPanel />
          </PermissionGate>
        )}
      </main>
    </div>
  );
}

function UnauthorizedAccess() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🚫</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600">
        You don't have permission to access this section. Contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}
