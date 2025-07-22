import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CCTVCameraForm {
  cameraId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    zone: string;
    description: string;
  };
  status: "online" | "offline" | "maintenance" | "error";
  isRecording: boolean;
  aiFeatures: {
    motionDetection: boolean;
    faceRecognition: boolean;
    intrusionDetection: boolean;
  };
  resolution: string;
  nightVision: boolean;
}

export function CCTVPanel() {
  const cameras = useQuery(api.security.getCCTVCameras);
  const addCCTVCamera = useMutation(api.security.addCCTVCamera);
  const updateCCTVCamera = useMutation(api.security.updateCCTVCamera);
  const updateCameraStatus = useMutation(api.security.updateCameraStatus);
  const deleteCCTVCamera = useMutation(api.security.deleteCCTVCamera);
  
  const [sortBy, setSortBy] = useState<"name" | "status" | "zone" | "lastPing">("name");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [formData, setFormData] = useState<CCTVCameraForm>({
    cameraId: "",
    name: "",
    location: { lat: 40.7128, lng: -74.0060, zone: "", description: "" },
    status: "offline",
    isRecording: false,
    aiFeatures: { motionDetection: false, faceRecognition: false, intrusionDetection: false },
    resolution: "1080p",
    nightVision: false
  });

  const getStatusColor = (status: string) => {
    const colors = {
      online: "bg-green-100 text-green-800",
      offline: "bg-red-100 text-red-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      online: "🟢",
      offline: "🔴",
      maintenance: "🟡",
      error: "❌",
    };
    return icons[status as keyof typeof icons] || "🔴";
  };

  const getConnectionStatus = (lastPing: number) => {
    const timeSinceLastPing = Date.now() - lastPing;
    const minutes = Math.floor(timeSinceLastPing / (1000 * 60));
    
    if (minutes < 1) return { status: "excellent", color: "text-green-600", text: "Just now" };
    if (minutes < 5) return { status: "good", color: "text-green-600", text: `${minutes}m ago` };
    if (minutes < 15) return { status: "fair", color: "text-yellow-600", text: `${minutes}m ago` };
    return { status: "poor", color: "text-red-600", text: `${minutes}m ago` };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCamera) {
        const { cameraId, ...updateData } = formData;
        await updateCCTVCamera({ cameraId: editingCamera._id, ...updateData });
        setEditingCamera(null);
      } else {
        await addCCTVCamera(formData);
      }
      setShowAddForm(false);
      setFormData({
        cameraId: "",
        name: "",
        location: { lat: 40.7128, lng: -74.0060, zone: "", description: "" },
        status: "offline",
        isRecording: false,
        aiFeatures: { motionDetection: false, faceRecognition: false, intrusionDetection: false },
        resolution: "1080p",
        nightVision: false
      });
    } catch (error) {
      console.error("Error saving camera:", error);
    }
  };

  const handleEdit = (camera: any) => {
    setEditingCamera(camera);
    setFormData({
      cameraId: camera.cameraId,
      name: camera.name,
      location: camera.location,
      status: camera.status,
      isRecording: camera.isRecording,
      aiFeatures: camera.aiFeatures,
      resolution: camera.resolution,
      nightVision: camera.nightVision
    });
    setShowAddForm(true);
  };

  const handleDelete = async (cameraId: any) => {
    if (confirm("Are you sure you want to delete this camera?")) {
      try {
        await deleteCCTVCamera({ cameraId });
      } catch (error) {
        console.error("Error deleting camera:", error);
      }
    }
  };

  if (!cameras) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter and sort cameras
  const filteredCameras = cameras
    .filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.cameraId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.location.zone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || camera.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "zone":
          return a.location.zone.localeCompare(b.location.zone);
        case "lastPing":
          return b.lastPing - a.lastPing;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">CCTV Camera Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingCamera(null);
                setFormData({
                  cameraId: "",
                  name: "",
                  location: { lat: 40.7128, lng: -74.0060, zone: "", description: "" },
                  status: "offline",
                  isRecording: false,
                  aiFeatures: { motionDetection: false, faceRecognition: false, intrusionDetection: false },
                  resolution: "1080p",
                  nightVision: false
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Camera
            </button>
            
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="zone">Sort by Zone</option>
              <option value="lastPing">Sort by Last Ping</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingCamera ? "Edit Camera" : "Add New Camera"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camera ID</label>
                    <input
                      type="text"
                      required
                      value={formData.cameraId}
                      onChange={(e) => setFormData({...formData, cameraId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <input
                      type="text"
                      required
                      value={formData.location.zone}
                      onChange={(e) => setFormData({...formData, location: {...formData.location, zone: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      required
                      value={formData.location.description}
                      onChange={(e) => setFormData({...formData, location: {...formData.location, description: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                    <select
                      value={formData.resolution}
                      onChange={(e) => setFormData({...formData, resolution: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRecording"
                      checked={formData.isRecording}
                      onChange={(e) => setFormData({...formData, isRecording: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isRecording" className="text-sm font-medium text-gray-700">Recording</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="nightVision"
                      checked={formData.nightVision}
                      onChange={(e) => setFormData({...formData, nightVision: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="nightVision" className="text-sm font-medium text-gray-700">Night Vision</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="motionDetection"
                      checked={formData.aiFeatures.motionDetection}
                      onChange={(e) => setFormData({...formData, aiFeatures: {...formData.aiFeatures, motionDetection: e.target.checked}})}
                      className="mr-2"
                    />
                    <label htmlFor="motionDetection" className="text-sm font-medium text-gray-700">Motion Detection</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="faceRecognition"
                      checked={formData.aiFeatures.faceRecognition}
                      onChange={(e) => setFormData({...formData, aiFeatures: {...formData.aiFeatures, faceRecognition: e.target.checked}})}
                      className="mr-2"
                    />
                    <label htmlFor="faceRecognition" className="text-sm font-medium text-gray-700">Face Recognition</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="intrusionDetection"
                      checked={formData.aiFeatures.intrusionDetection}
                      onChange={(e) => setFormData({...formData, aiFeatures: {...formData.aiFeatures, intrusionDetection: e.target.checked}})}
                      className="mr-2"
                    />
                    <label htmlFor="intrusionDetection" className="text-sm font-medium text-gray-700">Intrusion Detection</label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingCamera(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCamera ? "Update" : "Add"} Camera
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enhanced Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Features</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Live Feed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCameras.map((camera) => {
                const connectionStatus = getConnectionStatus(camera.lastPing);
                return (
                  <tr key={camera._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{camera.name}</div>
                        <div className="text-sm text-gray-500">ID: {camera.cameraId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(camera.status)}`}>
                        {getStatusIcon(camera.status)} {camera.status.toUpperCase()}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {camera.isRecording ? "🔴 Recording" : "⚫ Stopped"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{camera.location.zone}</div>
                      <div className="text-sm text-gray-500">{camera.location.description}</div>
                      <div className="text-xs text-gray-400">
                        {camera.location.lat.toFixed(4)}, {camera.location.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{camera.resolution}</div>
                      <div className="text-sm text-gray-500">
                        {camera.nightVision ? "🌙 Night Vision" : "☀️ Day Only"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {camera.aiFeatures.motionDetection && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Motion
                          </span>
                        )}
                        {camera.aiFeatures.faceRecognition && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Face ID
                          </span>
                        )}
                        {camera.aiFeatures.intrusionDetection && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Intrusion
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${connectionStatus.color}`}>
                        {connectionStatus.text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(camera.lastPing).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="bg-gray-900 rounded p-2 text-center min-w-[120px]">
                        {camera.status === "online" ? (
                          <div>
                            <div className="text-white text-xs mb-1">📹 LIVE</div>
                            <div className="bg-gray-800 rounded h-16 flex items-center justify-center">
                              <div className="text-green-400 text-xs">
                                🟢 {camera.resolution}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-white text-xs mb-1">📹 FEED</div>
                            <div className="bg-gray-800 rounded h-16 flex items-center justify-center">
                              <div className="text-red-400 text-xs">
                                🔴 OFFLINE
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-white text-xs mt-1 opacity-75">
                          Coming Soon
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => updateCameraStatus({ 
                            cameraId: camera._id, 
                            status: camera.status === "online" ? "offline" : "online" 
                          })}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          {camera.status === "online" ? "Offline" : "Online"}
                        </button>
                        <button
                          onClick={() => handleEdit(camera)}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(camera._id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCameras.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {cameras.length === 0 ? "No CCTV Cameras" : "No cameras match your filters"}
            </h3>
            <p className="text-gray-600">
              {cameras.length === 0 ? "Click 'Add Camera' to get started." : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
