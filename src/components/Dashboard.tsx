import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { StatsCards } from "./StatsCards";
import { GuardDogsPanel } from "./GuardDogsPanel";
import { BodyguardsPanel } from "./BodyguardsPanel";
import { SiemDashboard } from "./SiemDashboard";
import { CCTVPanel } from "./CCTVPanel";
import { SecurityEventsPanel } from "./SecurityEventsPanel";
import { AIChat } from "./AIChat";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const stats = useQuery(api.security.getDashboardStats);
  const seedData = useMutation(api.seedData.seedSecurityData);
  const logEvent = useMutation(api.security.logSecurityEvent);

  const handleSeedData = async () => {
    try {
      await seedData();
    } catch (error) {
      console.error("Failed to seed data:", error);
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

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "dogs", label: "Dogs", icon: "🐕" },
    { id: "guards", label: "Guards", icon: "👮" },
    { id: "siem", label: "SIEM", icon: "🛡️" },
    { id: "cameras", label: "CCTV", icon: "📹" },
    { id: "events", label: "Events", icon: "🚨" },
    { id: "ai", label: "AI", icon: "🤖" },
  ];

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
              <button
                onClick={handleSeedData}
                className="px-2 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors whitespace-nowrap"
              >
                Demo Data
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
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

      {/* Mobile-Optimized Main Content */}
      <main className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">
            <StatsCards stats={stats} />
            
            {/* Mobile-Optimized Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Recent Events - Full width on mobile */}
              <div className="lg:col-span-2">
                <SecurityEventsPanel limit={5} />
              </div>
              
              {/* Quick Actions & System Status - Stacked on mobile */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
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
                    <button className="p-3 sm:p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left touch-manipulation">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl sm:text-2xl">📊</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base">Generate Report</div>
                          <div className="text-xs sm:text-sm opacity-75 truncate">Export security data</div>
                        </div>
                      </div>
                    </button>
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
                    <button className="p-3 sm:p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-left touch-manipulation">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl sm:text-2xl">⚙️</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base">Settings</div>
                          <div className="text-xs sm:text-sm opacity-75 truncate">Configure system</div>
                        </div>
                      </div>
                    </button>
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
                        <span className="text-sm text-gray-600">Monitoring</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Running</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Backup</span>
                      </div>
                      <span className="text-sm font-medium text-yellow-600">Scheduled</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900">System started</div>
                        <div className="text-xs text-gray-500">2 minutes ago</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900">All cameras online</div>
                        <div className="text-xs text-gray-500">5 minutes ago</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-900">Guard shift change</div>
                        <div className="text-xs text-gray-500">1 hour ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "dogs" && <GuardDogsPanel />}
        {activeTab === "guards" && <BodyguardsPanel />}
        {activeTab === "siem" && <SiemDashboard />}
        {activeTab === "cameras" && <CCTVPanel />}
        {activeTab === "events" && <SecurityEventsPanel />}
        {activeTab === "ai" && <AIChat />}
      </main>
    </div>
  );
}
