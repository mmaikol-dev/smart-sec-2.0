import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePermissions() {
  const permissions = useQuery(api.permissions.getUserPermissions) || [];
  const currentUser = useQuery(api.userProfiles.getCurrentUserProfile);
  
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]) => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]) => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  const canAccessZone = (zone: string) => {
    if (permissions.includes("access_all_zones")) {
      return true;
    }
    return currentUser?.profile?.assignedZones?.includes(zone) || false;
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessZone,
    userRole: currentUser?.profile?.role,
    isAdmin: currentUser?.profile?.role === "admin",
    isSecurityManager: currentUser?.profile?.role === "security_manager",
    isBodyguard: currentUser?.profile?.role === "bodyguard",
    isDogHandler: currentUser?.profile?.role === "dog_handler",
    isCCTVOperator: currentUser?.profile?.role === "cctv_operator",
    isViewer: currentUser?.profile?.role === "viewer",
  };
}
