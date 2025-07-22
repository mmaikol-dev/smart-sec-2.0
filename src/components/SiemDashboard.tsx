import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PermissionGate } from "./PermissionGate";

export function SiemDashboard() {
  const [timeRange, setTimeRange] = useState(24 * 60 * 60 * 1000); // 24 hours
  const [severityFilter, setSeverityFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const siemStats = useQuery(api.siem.getSiemStats);
  const networkEvents = useQuery(api.siem.getNetworkEvents, {
    limit: 100,
    severity: severityFilter || undefined,
    eventType: eventTypeFilter || undefined,
    timeRange,
  });
  const createNetworkEvent = useMutation(api.siem.createNetworkEvent);

  const [newEventForm, setNewEventForm] = useState({
    eventType: "login_attempt" as const,
    severity: "medium" as const,
    sourceIp: "",
    destinationIp: "",
    port: 80,
    protocol: "TCP",
    status: "detected" as const,
    description: "",
    location: "",
  });

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      allowed: "bg-green-100 text-green-800",
      blocked: "bg-red-100 text-red-800",
      failed: "bg-orange-100 text-orange-800",
      detected: "bg-yellow-100 text-yellow-800",
      quarantined: "bg-purple-100 text-purple-800",
    };
    return colors[status as keyof typeof colors] || colors.detected;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNetworkEvent(newEventForm);
      setShowCreateEvent(false);
      setNewEventForm({
        eventType: "login_attempt",
        severity: "medium",
        sourceIp: "",
        destinationIp: "",
        port: 80,
        protocol: "TCP",
        status: "detected",
        description: "",
        location: "",
      });
    } catch (error) {
      console.error("Error creating network event:", error);
    }
  };

  if (!siemStats || !networkEvents) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SIEM Dashboard</h2>
          <p className="text-gray-600">Security Information and Event Management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <PermissionGate permission="manage_siem">
            <button
              onClick={() => setShowCreateEvent(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              + Create Event
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">{siemStats.recentEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <span className="text-red-600 text-lg">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Events</p>
              <p className="text-2xl font-semibold text-gray-900">{siemStats.criticalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <span className="text-orange-600 text-lg">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">{siemStats.highEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 text-lg">🛡️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Blocked Threats</p>
              <p className="text-2xl font-semibold text-gray-900">{siemStats.blockedEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Trends (24 Hours)</h3>
        <div className="h-64 flex items-end space-x-2">
          {siemStats.threatTrends.map((trend, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                {trend.count > 0 && (
                  <>
                    <div
                      className="bg-blue-500 rounded-t absolute bottom-0 w-full"
                      style={{ height: `${(trend.count / Math.max(...siemStats.threatTrends.map(t => t.count))) * 200}px` }}
                    ></div>
                    {trend.critical > 0 && (
                      <div
                        className="bg-red-500 rounded-t absolute bottom-0 w-full"
                        style={{ height: `${(trend.critical / Math.max(...siemStats.threatTrends.map(t => t.count))) * 200}px` }}
                      ></div>
                    )}
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1">{trend.hour}:00</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types (24h)</h3>
          <div className="space-y-3">
            {Object.entries(siemStats.eventsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(siemStats.eventsByType))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Source IPs</h3>
          <div className="space-y-3">
            {siemStats.topSourceIps.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-mono">{item.ip}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${(item.count / siemStats.topSourceIps[0]?.count || 1) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Event Types</option>
            <option value="login_attempt">Login Attempt</option>
            <option value="network_scan">Network Scan</option>
            <option value="malware_detected">Malware Detected</option>
            <option value="data_exfiltration">Data Exfiltration</option>
            <option value="privilege_escalation">Privilege Escalation</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value={60 * 60 * 1000}>Last Hour</option>
            <option value={6 * 60 * 60 * 1000}>Last 6 Hours</option>
            <option value={24 * 60 * 60 * 1000}>Last 24 Hours</option>
            <option value={7 * 24 * 60 * 60 * 1000}>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Network Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Network Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source IP
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {networkEvents.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {event.eventType.replace('_', ' ')}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {event.sourceIp}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                    {event.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create Network Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={newEventForm.eventType}
                      onChange={(e) => setNewEventForm({...newEventForm, eventType: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="login_attempt">Login Attempt</option>
                      <option value="network_scan">Network Scan</option>
                      <option value="malware_detected">Malware Detected</option>
                      <option value="data_exfiltration">Data Exfiltration</option>
                      <option value="privilege_escalation">Privilege Escalation</option>
                      <option value="firewall_block">Firewall Block</option>
                      <option value="intrusion_detection">Intrusion Detection</option>
                      <option value="ddos_attack">DDoS Attack</option>
                      <option value="suspicious_traffic">Suspicious Traffic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <select
                      value={newEventForm.severity}
                      onChange={(e) => setNewEventForm({...newEventForm, severity: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source IP</label>
                    <input
                      type="text"
                      required
                      value={newEventForm.sourceIp}
                      onChange={(e) => setNewEventForm({...newEventForm, sourceIp: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination IP</label>
                    <input
                      type="text"
                      value={newEventForm.destinationIp}
                      onChange={(e) => setNewEventForm({...newEventForm, destinationIp: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="10.0.0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="number"
                      value={newEventForm.port}
                      onChange={(e) => setNewEventForm({...newEventForm, port: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
                    <input
                      type="text"
                      value={newEventForm.protocol}
                      onChange={(e) => setNewEventForm({...newEventForm, protocol: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="TCP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newEventForm.status}
                      onChange={(e) => setNewEventForm({...newEventForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="allowed">Allowed</option>
                      <option value="blocked">Blocked</option>
                      <option value="failed">Failed</option>
                      <option value="detected">Detected</option>
                      <option value="quarantined">Quarantined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={newEventForm.location}
                      onChange={(e) => setNewEventForm({...newEventForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Main Building"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={newEventForm.description}
                    onChange={(e) => setNewEventForm({...newEventForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={3}
                    placeholder="Describe the security event..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
