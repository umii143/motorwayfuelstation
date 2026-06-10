import React from 'react';
import { useAuthStore, UserRole, UserPermissions } from '../../stores/useAuthStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof UserPermissions;
  fallback?: React.ReactNode;
  fallbackMessage?: string;
}

/**
 * RoleGuard conditionally renders its children based on the current user's role or permissions.
 * If the user does not meet the requirements, it either renders null or the provided fallback.
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  requiredPermission, 
  fallback = null,
  fallbackMessage
}: RoleGuardProps) {
  const { user, hasPermission } = useAuthStore();

  if (!user) {
    return <>{fallback}</>;
  }

  // Owner always bypasses RoleGuard
  if (user.role === 'Owner') {
    return <>{children}</>;
  }

  let isAllowed = true;

  // Check roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    isAllowed = allowedRoles.includes(user.role);
  }

  // Check permissions if specified and still allowed
  if (isAllowed && requiredPermission) {
    isAllowed = hasPermission(requiredPermission);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-500">{fallbackMessage}</p>
      </div>
    );
  }

  return <>{fallback}</>;
}
