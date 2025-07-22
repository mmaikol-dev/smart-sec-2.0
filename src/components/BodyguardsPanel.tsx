import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface BodyguardForm {
  name: string;
  employeeId: string;
  assignedZone: string;
  status: "on_duty" | "off_duty" | "break" | "emergency";
  currentActivity: string;
  shiftStart: number;
  shiftEnd: number;
  location: {
    lat: number;
    lng: number;
  };
  contact: string;
  certifications: string[];
}

export function BodyguardsPanel() {
  const guards = useQuery(api.security.getBodyguards);
  const addBodyguard = useMutation(api.security.addBodyguard);
  const updateBodyguard = useMutation(api.security.updateBodyguard);
  const updateGuardStatus = useMutation(api.security.updateGuardStatus);
  const deleteBodyguard = useMutation(api.security.deleteBodyguard);
  
  const [sortBy, setSortBy] = useState<"name" | "status" | "zone" | "shift">("name");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuard, setEditingGuard] = useState<any>(null);
  const [formData, setFormData] = useState<BodyguardForm>({
    name: "",
    employeeId: "",
    assignedZone: "",
    status: "off_duty",
    currentActivity: "",
    shiftStart: Date.now(),
    shiftEnd: Date.now() + 8 * 60 * 60 * 1000,
    location: { lat: 40.7128, lng: -74.0060 },
    contact: "",
    certifications: []
  });
  const [newCertification, setNewCertification] = useState("");

  const getStatusColor = (status: string) => {
    const colors = {
      on_duty: "bg-green-100 text-green-800",
      off_duty: "bg-gray-100 text-gray-800",
      break: "bg-yellow-100 text-yellow-800",
      emergency: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || colors.off_duty;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      on_duty: "🟢",
      off_duty: "⚫",
      break: "🟡",
      emergency: "🔴",
    };
    return icons[status as keyof typeof icons] || "⚫";
  };

  const getShiftStatus = (shiftStart: number, shiftEnd: number) => {
    const now = Date.now();
    if (now < shiftStart) return { status: "upcoming", color: "text-blue-600" };
    if (now > shiftEnd) return { status: "ended", color: "text-gray-600" };
    return { status: "active", color: "text-green-600" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGuard) {
        await updateBodyguard({ guardId: editingGuard._id, ...formData });
        setEditingGuard(null);
      } else {
        await addBodyguard(formData);
      }
      setShowAddForm(false);
      setFormData({
        name: "",
        employeeId: "",
        assignedZone: "",
        status: "off_duty",
        currentActivity: "",
        shiftStart: Date.now(),
        shiftEnd: Date.now() + 8 * 60 * 60 * 1000,
        location: { lat: 40.7128, lng: -74.0060 },
        contact: "",
        certifications: []
      });
    } catch (error) {
      console.error("Error saving bodyguard:", error);
    }
  };

  const handleEdit = (guard: any) => {
    setEditingGuard(guard);
    setFormData({
      name: guard.name,
      employeeId: guard.employeeId,
      assignedZone: guard.assignedZone,
      status: guard.status,
      currentActivity: guard.currentActivity,
      shiftStart: guard.shiftStart,
      shiftEnd: guard.shiftEnd,
      location: guard.location,
      contact: guard.contact,
      certifications: guard.certifications
    });
    setShowAddForm(true);
  };

  const handleDelete = async (guardId: any) => {
    if (confirm("Are you sure you want to delete this bodyguard?")) {
      try {
        await deleteBodyguard({ guardId });
      } catch (error) {
        console.error("Error deleting bodyguard:", error);
      }
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()]
      });
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  if (!guards) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter and sort guards
  const filteredGuards = guards
    .filter(guard => {
      const matchesSearch = guard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guard.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guard.assignedZone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || guard.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "zone":
          return a.assignedZone.localeCompare(b.assignedZone);
        case "shift":
          return a.shiftStart - b.shiftStart;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Bodyguards Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingGuard(null);
                setFormData({
                  name: "",
                  employeeId: "",
                  assignedZone: "",
                  status: "off_duty",
                  currentActivity: "",
                  shiftStart: Date.now(),
                  shiftEnd: Date.now() + 8 * 60 * 60 * 1000,
                  location: { lat: 40.7128, lng: -74.0060 },
                  contact: "",
                  certifications: []
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Bodyguard
            </button>
            
            <input
              type="text"
              placeholder="Search guards..."
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
              <option value="on_duty">On Duty</option>
              <option value="off_duty">Off Duty</option>
              <option value="break">On Break</option>
              <option value="emergency">Emergency</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="zone">Sort by Zone</option>
              <option value="shift">Sort by Shift</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingGuard ? "Edit Bodyguard" : "Add New Bodyguard"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Zone</label>
                    <input
                      type="text"
                      required
                      value={formData.assignedZone}
                      onChange={(e) => setFormData({...formData, assignedZone: e.target.value})}
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
                      <option value="on_duty">On Duty</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="break">On Break</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Activity</label>
                    <input
                      type="text"
                      required
                      value={formData.currentActivity}
                      onChange={(e) => setFormData({...formData, currentActivity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                    <input
                      type="text"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={new Date(formData.shiftStart).toISOString().slice(0, 16)}
                      onChange={(e) => setFormData({...formData, shiftStart: new Date(e.target.value).getTime()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift End</label>
                    <input
                      type="datetime-local"
                      required
                      value={new Date(formData.shiftEnd).toISOString().slice(0, 16)}
                      onChange={(e) => setFormData({...formData, shiftEnd: new Date(e.target.value).getTime()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add certification..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addCertification}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingGuard(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingGuard ? "Update" : "Add"} Bodyguard
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certifications</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuards.map((guard) => {
                const shiftStatus = getShiftStatus(guard.shiftStart, guard.shiftEnd);
                return (
                  <tr key={guard._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{guard.name}</div>
                        <div className="text-sm text-gray-500">ID: {guard.employeeId}</div>
                        <div className="text-sm text-gray-500">{guard.contact}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(guard.status)}`}>
                        {getStatusIcon(guard.status)} {guard.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guard.assignedZone}</div>
                      <div className="text-sm text-gray-500">
                        {guard.location.lat.toFixed(4)}, {guard.location.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guard.currentActivity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(guard.shiftStart).toLocaleTimeString()} - {new Date(guard.shiftEnd).toLocaleTimeString()}
                      </div>
                      <div className={`text-sm font-medium ${shiftStatus.color}`}>
                        {shiftStatus.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {guard.certifications.slice(0, 2).map((cert, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cert}
                          </span>
                        ))}
                        {guard.certifications.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{guard.certifications.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateGuardStatus({ 
                            guardId: guard._id, 
                            status: guard.status === "on_duty" ? "break" : "on_duty" 
                          })}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {guard.status === "on_duty" ? "Break" : "Resume"}
                        </button>
                        <button
                          onClick={() => handleEdit(guard)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guard._id)}
                          className="text-red-600 hover:text-red-900"
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

        {filteredGuards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👮</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {guards.length === 0 ? "No Bodyguards" : "No guards match your filters"}
            </h3>
            <p className="text-gray-600">
              {guards.length === 0 ? "Click 'Add Bodyguard' to get started." : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
