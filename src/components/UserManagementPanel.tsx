import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name?: string;
  email?: string;
  profile?: {
    _id: Id<"userProfiles">;
    role: string;
    department: string;
    employeeId?: string;
    isActive: boolean;
    lastLogin?: number;
    assignedZones: string[];
  };
}

export function UserManagementPanel() {
  const users = useQuery(api.userProfiles.getAllUsers) as User[] | undefined;
  const usersWithoutProfile = useQuery(api.userProfiles.getUsersWithoutProfile);
  const rolePermissions = useQuery(api.permissions.getRolePermissions);
  const createProfile = useMutation(api.userProfiles.createUserProfile);
  const updateProfile = useMutation(api.userProfiles.updateUserProfile);
  const initializeRoles = useMutation(
    api.permissions.initializeRolePermissions
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    userId: "" as Id<"users"> | "",
    role: "viewer" as const,
    department: "",
    employeeId: "",
    assignedZones: [] as string[],
  });

  const handleInitializeRoles = async () => {
    try {
      await initializeRoles();
      alert("Role permissions have been initialized!");
    } catch (error) {
      console.error("Failed to initialize roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { userId, ...updateData } = formData;
        await updateProfile({
          profileId: editingUser.profile!._id,
          ...updateData,
        });
      } else {
        if (!formData.userId) {
          alert("Please select a user.");
          return;
        }
        await createProfile({
          userId: formData.userId,
          role: formData.role,
          department: formData.department,
          employeeId: formData.employeeId,
          assignedZones: formData.assignedZones,
        });
      }
      setShowCreateForm(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      role: "viewer",
      department: "",
      employeeId: "",
      assignedZones: [],
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      userId: user._id,
      role: (user.profile?.role as any) || "viewer",
      department: user.profile?.department || "",
      employeeId: user.profile?.employeeId || "",
      assignedZones: user.profile?.assignedZones || [],
    });
    setShowCreateForm(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      security_manager: "bg-blue-100 text-blue-800",
      bodyguard: "bg-green-100 text-green-800",
      dog_handler: "bg-yellow-100 text-yellow-800",
      cctv_operator: "bg-purple-100 text-purple-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const availableZones = [
    "Main Building",
    "North Gate",
    "South Entrance",
    "East Wing",
    "West Wing",
    "Parking Lot",
    "Reception Area",
    "Emergency Exit",
    "Control Room",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleInitializeRoles}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
          >
            Initialize Roles
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingUser(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            + Add User Profile
          </button>
        </div>
      </div>

      {/* Role Permissions Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolePermissions?.map((role) => (
            <div key={role._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {role.role.replace("_", " ")}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    role.role
                  )}`}
                >
                  {role.permissions.length} permissions
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="text-xs text-gray-500">
                Key permissions: {role.permissions.slice(0, 3).join(", ")}
                {role.permissions.length > 3 && "..."}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user._id}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {user.profile ? (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          user.profile.role
                        )}`}
                      >
                        {user.profile.role.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No profile</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.profile?.department || "-"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {user.profile ? (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.profile.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.profile.isActive ? "Active" : "Inactive"}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.profile?.lastLogin
                      ? new Date(user.profile.lastLogin).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser
                  ? `Edit Profile for ${editingUser.name || editingUser.email}`
                  : "Create User Profile"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!editingUser && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User
                      </label>
                      <select
                        value={formData.userId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            userId: e.target.value as Id<"users">,
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="" disabled>
                          Select a user
                        </option>
                        {usersWithoutProfile?.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="admin">Administrator</option>
                      <option value="security_manager">Security Manager</option>
                      <option value="bodyguard">Bodyguard</option>
                      <option value="dog_handler">Dog Handler</option>
                      <option value="cctv_operator">CCTV Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Zones
                    </label>
                    <select
                      multiple
                      value={formData.assignedZones}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assignedZones: Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      size={4}
                    >
                      {availableZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd to select multiple zones
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    {editingUser ? "Update" : "Create"} Profile
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
