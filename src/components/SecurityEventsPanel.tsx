import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SecurityEventsPanelProps {
  limit?: number;
}

interface SecurityEventForm {
  type: "motion_detected" | "intrusion_alert" | "face_recognized" | "patrol_completed" | "emergency" | "system_alert";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  sourceId: string;
  sourceType: "camera" | "dog" | "guard" | "system";
  metadata?: {
    imageUrl?: string;
    confidence?: number;
    additionalInfo?: string;
  };
}

export function SecurityEventsPanel({ limit }: SecurityEventsPanelProps) {
  const events = useQuery(api.security.getSecurityEvents, { limit });
  const resolveEvent = useMutation(api.security.resolveSecurityEvent);
  const logEvent = useMutation(api.security.logSecurityEvent);
  const updateEvent = useMutation(api.security.updateSecurityEvent);
  const deleteEvent = useMutation(api.security.deleteSecurityEvent);
  
  const [sortBy, setSortBy] = useState<"timestamp" | "severity" | "type" | "zone">("timestamp");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterResolved, setFilterResolved] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  
  const [formData, setFormData] = useState<SecurityEventForm>({
    type: "motion_detected",
    severity: "low",
    description: "",
    location: { lat: 40.7128, lng: -74.0060, zone: "" },
    sourceId: "",
    sourceType: "camera",
    metadata: { imageUrl: "", confidence: 0, additionalInfo: "" }
  });

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🚨",
      critical: "🔥",
    };
    return icons[severity as keyof typeof icons] || "ℹ️";
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      motion_detected: "👁️",
      intrusion_alert: "🚨",
      face_recognized: "👤",
      patrol_completed: "✅",
      emergency: "🆘",
      system_alert: "⚙️",
    };
    return icons[type as keyof typeof icons] || "📋";
  };

  const getResponseTime = (creationTime: number, resolvedAt?: number) => {
    if (!resolvedAt) return "Pending";
    const responseTime = resolvedAt - creationTime;
    const minutes = Math.floor(responseTime / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent({ eventId: editingEvent._id, ...formData });
        setEditingEvent(null);
      } else {
        await logEvent(formData);
      }
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "motion_detected",
      severity: "low",
      description: "",
      location: { lat: 40.7128, lng: -74.0060, zone: "" },
      sourceId: "",
      sourceType: "camera",
      metadata: { imageUrl: "", confidence: 0, additionalInfo: "" }
    });
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      type: event.type,
      severity: event.severity,
      description: event.description,
      location: event.location,
      sourceId: event.sourceId,
      sourceType: event.sourceType,
      metadata: event.metadata || { imageUrl: "", confidence: 0, additionalInfo: "" }
    });
    setShowAddForm(true);
  };

  const handleDelete = async (eventId: any) => {
    if (confirm("Are you sure you want to delete this security event?")) {
      try {
        await deleteEvent({ eventId });
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  if (!events) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 sm:h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.sourceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === "all" || event.severity === filterSeverity;
      const matchesResolved = filterResolved === "all" || 
                             (filterResolved === "resolved" && event.isResolved) ||
                             (filterResolved === "unresolved" && !event.isResolved);
      return matchesSearch && matchesSeverity && matchesResolved;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "timestamp":
          return b._creationTime - a._creationTime;
        case "severity":
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                 (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        case "type":
          return a.type.localeCompare(b.type);
        case "zone":
          return a.location.zone.localeCompare(b.location.zone);
        default:
          return 0;
      }
    });

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Security Events</h2>
          
          {!limit && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingEvent(null);
                resetForm();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              + Add Event
            </button>
          )}
        </div>
        
        {!limit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Events</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:col-span-2 lg:col-span-1"
            >
              <option value="timestamp">Sort by Time</option>
              <option value="severity">Sort by Severity</option>
              <option value="type">Sort by Type</option>
              <option value="zone">Sort by Zone</option>
            </select>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingEvent ? "Edit Security Event" : "Add New Security Event"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="motion_detected">Motion Detected</option>
                      <option value="intrusion_alert">Intrusion Alert</option>
                      <option value="face_recognized">Face Recognized</option>
                      <option value="patrol_completed">Patrol Completed</option>
                      <option value="emergency">Emergency</option>
                      <option value="system_alert">System Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <input
                      type="text"
                      required
                      value={formData.location.zone}
                      onChange={(e) => setFormData({...formData, location: {...formData.location, zone: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source ID</label>
                    <input
                      type="text"
                      required
                      value={formData.sourceId}
                      onChange={(e) => setFormData({...formData, sourceId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) => setFormData({...formData, sourceType: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="camera">Camera</option>
                      <option value="dog">Guard Dog</option>
                      <option value="guard">Bodyguard</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confidence (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.metadata?.confidence || 0}
                      onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, confidence: parseInt(e.target.value)}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Info</label>
                    <textarea
                      value={formData.metadata?.additionalInfo || ""}
                      onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, additionalInfo: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingEvent(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm touch-manipulation"
                  >
                    {editingEvent ? "Update" : "Add"} Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl touch-manipulation"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event Type</label>
                    <p className="text-gray-900">{getTypeIcon(showDetails.type)} {showDetails.type.replace("_", " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severity</label>
                    <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(showDetails.severity)}`}>
                      {getSeverityIcon(showDetails.severity)} {showDetails.severity.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Source</label>
                    <p className="text-gray-900">{showDetails.sourceType}: {showDetails.sourceId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{showDetails.location.zone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-gray-900 text-sm">{new Date(showDetails._creationTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={`text-sm font-medium ${showDetails.isResolved ? 'text-green-600' : 'text-red-600'}`}>
                      {showDetails.isResolved ? '✅ Resolved' : '🔴 Pending'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{showDetails.description}</p>
                </div>
                {showDetails.metadata?.additionalInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Information</label>
                    <p className="text-gray-900 mt-1">{showDetails.metadata.additionalInfo}</p>
                  </div>
                )}
                {showDetails.metadata?.confidence && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Confidence</label>
                    <p className="text-gray-900 mt-1">{showDetails.metadata.confidence}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Event List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredEvents.map((event) => (
          <div key={event._id} className={`border rounded-lg p-3 sm:p-4 ${event.isResolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'} hover:shadow-md transition-shadow`}>
            <div className="flex items-start space-x-3">
              <div className="text-xl sm:text-2xl flex-shrink-0">{getTypeIcon(event.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{event.description}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">{event.type.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {getSeverityIcon(event.severity)} {event.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Zone:</span> {event.location.zone}
                  </div>
                  <div>
                    <span className="font-medium">Source:</span> {event.sourceId}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {new Date(event._creationTime).toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-1 ${event.isResolved ? 'text-green-600' : 'text-red-600'}`}>
                      {event.isResolved ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowDetails(event)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors touch-manipulation"
                  >
                    Details
                  </button>
                  {!event.isResolved && (
                    <button
                      onClick={() => resolveEvent({ eventId: event._id, resolvedBy: "Current User" })}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors touch-manipulation"
                    >
                      Resolve
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors touch-manipulation"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-4">🛡️</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {events.length === 0 ? "No Security Events" : "No events match your filters"}
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            {events.length === 0 ? "All systems are secure. Load demo data to see sample events." : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}

      {limit && filteredEvents.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium touch-manipulation">
            View All Events →
          </button>
        </div>
      )}
    </div>
  );
}
