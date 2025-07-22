import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PermissionGate } from "./PermissionGate";
import { usePermissions } from "../hooks/usePermissions";

export function GuardDogsPanel() {
  const dogs = useQuery(api.security.getGuardDogs);
  const addDog = useMutation(api.security.addGuardDog);
  const updateDog = useMutation(api.security.updateGuardDog);
  const updateDogStatus = useMutation(api.security.updateDogStatus);
  const deleteDog = useMutation(api.security.deleteGuardDog);
  
  const { hasPermission, canAccessZone } = usePermissions();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDog, setEditingDog] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: 3,
    status: "active" as const,
    location: { lat: 40.7128, lng: -74.0060, zone: "" },
    handler: { name: "", contact: "" },
    healthMetrics: { heartRate: 85, temperature: 101.5, lastCheckup: Date.now() }
  });

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      resting: "bg-yellow-100 text-yellow-800",
      offline: "bg-red-100 text-red-800",
      medical: "bg-orange-100 text-orange-800",
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: "🟢",
      resting: "🟡",
      offline: "🔴",
      medical: "🏥",
    };
    return icons[status as keyof typeof icons] || "❓";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDog) {
        await updateDog({ dogId: editingDog._id, ...formData });
        setEditingDog(null);
      } else {
        await addDog(formData);
      }
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving dog:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      breed: "",
      age: 3,
      status: "active",
      location: { lat: 40.7128, lng: -74.0060, zone: "" },
      handler: { name: "", contact: "" },
      healthMetrics: { heartRate: 85, temperature: 101.5, lastCheckup: Date.now() }
    });
  };

  const handleEdit = (dog: any) => {
    setEditingDog(dog);
    setFormData({
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      status: dog.status,
      location: dog.location,
      handler: dog.handler,
      healthMetrics: dog.healthMetrics
    });
    setShowAddForm(true);
  };

  const handleStatusChange = async (dogId: any, newStatus: any) => {
    try {
      await updateDogStatus({ dogId, status: newStatus });
    } catch (error) {
      console.error("Error updating dog status:", error);
    }
  };

  const handleDelete = async (dogId: any) => {
    if (confirm("Are you sure you want to delete this guard dog?")) {
      try {
        await deleteDog({ dogId });
      } catch (error) {
        console.error("Error deleting dog:", error);
      }
    }
  };

  if (!dogs) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter dogs based on permissions and search
  const filteredDogs = dogs
    .filter(dog => {
      // Zone access check
      if (!canAccessZone(dog.location.zone)) {
        return false;
      }
      
      // Status filter
      const matchesStatus = filterStatus === "all" || dog.status === filterStatus;
      
      // Search filter
      const matchesSearch = dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dog.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dog.handler.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guard Dogs</h2>
          <p className="text-gray-600">Monitor and manage K9 security units</p>
        </div>
        <PermissionGate permission="manage_guard_dogs">
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingDog(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            + Add Guard Dog
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search dogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="resting">Resting</option>
            <option value="offline">Offline</option>
            <option value="medical">Medical</option>
          </select>
        </div>
      </div>

      {/* Dogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDogs.map((dog) => (
          <div key={dog._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🐕</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dog.name}</h3>
                    <p className="text-sm text-gray-600">{dog.breed}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dog.status)}`}>
                  {getStatusIcon(dog.status)} {dog.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Age:</span>
                    <p className="text-gray-900">{dog.age} years</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Zone:</span>
                    <p className="text-gray-900">{dog.location.zone}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-500 text-sm">Handler:</span>
                  <p className="text-gray-900 text-sm">{dog.handler.name}</p>
                  <p className="text-gray-600 text-xs">{dog.handler.contact}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-500 text-sm">Health:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-1">
                    <div>HR: {dog.healthMetrics.heartRate} bpm</div>
                    <div>Temp: {dog.healthMetrics.temperature}°F</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Last patrol: {new Date(dog.lastPatrol).toLocaleString()}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <PermissionGate permission="update_dog_status">
                  <select
                    value={dog.status}
                    onChange={(e) => handleStatusChange(dog._id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="resting">Resting</option>
                    <option value="offline">Offline</option>
                    <option value="medical">Medical</option>
                  </select>
                </PermissionGate>
                
                <PermissionGate permission="manage_guard_dogs">
                  <button
                    onClick={() => handleEdit(dog)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dog._id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐕</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Guard Dogs Found</h3>
          <p className="text-gray-600">
            {dogs.length === 0 
              ? "No guard dogs have been added yet." 
              : "No dogs match your current filters or zone access."}
          </p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingDog ? "Edit Guard Dog" : "Add New Guard Dog"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                    <input
                      type="text"
                      required
                      value={formData.breed}
                      onChange={(e) => setFormData({...formData, breed: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="resting">Resting</option>
                      <option value="offline">Offline</option>
                      <option value="medical">Medical</option>
                    </select>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Handler Name</label>
                    <input
                      type="text"
                      required
                      value={formData.handler.name}
                      onChange={(e) => setFormData({...formData, handler: {...formData.handler, name: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Handler Contact</label>
                    <input
                      type="text"
                      required
                      value={formData.handler.contact}
                      onChange={(e) => setFormData({...formData, handler: {...formData.handler, contact: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      min="60"
                      max="120"
                      value={formData.healthMetrics.heartRate}
                      onChange={(e) => setFormData({...formData, healthMetrics: {...formData.healthMetrics, heartRate: parseInt(e.target.value)}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingDog(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    {editingDog ? "Update" : "Add"} Dog
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
