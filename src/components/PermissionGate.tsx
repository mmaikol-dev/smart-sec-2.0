import { ReactNode } from "react";
import { usePermissions } from "../hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  fallback?: ReactNode;
  zone?: string;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
  zone,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    canAccessZone,
  } = usePermissions();

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Check single role
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && !roles.includes(userRole || "")) {
    return <>{fallback}</>;
  }

  // Check zone access
  if (zone && !canAccessZone(zone)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
