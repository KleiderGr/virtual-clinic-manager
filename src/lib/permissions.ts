export type AppRole = 'patient' | 'doctor' | 'admin';

export type Permission =
  // Doctor permissions
  | 'doctors.view'
  | 'doctors.create'
  | 'doctors.edit'
  | 'doctors.delete'
  // Patient permissions
  | 'patients.view'
  | 'patients.edit'
  | 'patients.delete'
  // Schedule permissions
  | 'schedules.view'
  | 'schedules.create'
  | 'schedules.edit'
  | 'schedules.delete'
  // Appointment permissions
  | 'appointments.view.own'
  | 'appointments.view.all'
  | 'appointments.create'
  | 'appointments.edit.own'
  | 'appointments.edit.all'
  | 'appointments.cancel.own'
  | 'appointments.cancel.all'
  // Admin permissions
  | 'admin.access'
  | 'roles.manage'
  | 'users.manage';

// Role-permission mappings
const rolePermissions: Record<AppRole, Permission[]> = {
  patient: [
    'appointments.view.own',
    'appointments.create',
    'appointments.edit.own',
    'appointments.cancel.own',
  ],
  doctor: [
    'appointments.view.all',
    'appointments.edit.all',
    'schedules.view',
    'schedules.create',
    'schedules.edit',
  ],
  admin: [
    // All permissions
    'doctors.view',
    'doctors.create',
    'doctors.edit',
    'doctors.delete',
    'patients.view',
    'patients.edit',
    'patients.delete',
    'schedules.view',
    'schedules.create',
    'schedules.edit',
    'schedules.delete',
    'appointments.view.all',
    'appointments.edit.all',
    'appointments.cancel.all',
    'admin.access',
    'roles.manage',
    'users.manage',
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRoles: AppRole[], permission: Permission): boolean {
  return userRoles.some((role) => rolePermissions[role]?.includes(permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(userRoles: AppRole[], role: AppRole): boolean {
  return userRoles.includes(role);
}

/**
 * Get all permissions for a user based on their roles
 */
export function getUserPermissions(userRoles: AppRole[]): Permission[] {
  const permissions = new Set<Permission>();
  
  userRoles.forEach((role) => {
    rolePermissions[role]?.forEach((permission) => {
      permissions.add(permission);
    });
  });
  
  return Array.from(permissions);
}

/**
 * Check if user can perform an action on a resource
 */
export function can(
  userRoles: AppRole[],
  action: 'view' | 'create' | 'edit' | 'delete',
  resource: 'doctors' | 'patients' | 'schedules' | 'appointments'
): boolean {
  const permission = `${resource}.${action}` as Permission;
  return hasPermission(userRoles, permission);
}
