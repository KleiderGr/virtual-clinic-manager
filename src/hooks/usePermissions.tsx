import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasPermission, hasRole, getUserPermissions, can, AppRole, Permission } from '@/lib/permissions';

export function usePermissions() {
  const { roles } = useAuth();
  
  const userRoles: AppRole[] = useMemo(() => {
    return roles.map((r) => r.role);
  }, [roles]);

  const permissions = useMemo(() => {
    return getUserPermissions(userRoles);
  }, [userRoles]);

  return {
    // Role checks
    isAdmin: hasRole(userRoles, 'admin'),
    isDoctor: hasRole(userRoles, 'doctor'),
    isPatient: hasRole(userRoles, 'patient'),
    hasRole: (role: AppRole) => hasRole(userRoles, role),
    
    // Permission checks
    hasPermission: (permission: Permission) => hasPermission(userRoles, permission),
    can: (action: 'view' | 'create' | 'edit' | 'delete', resource: 'doctors' | 'patients' | 'schedules' | 'appointments') =>
      can(userRoles, action, resource),
    
    // Get all permissions
    permissions,
    roles: userRoles,
  };
}
