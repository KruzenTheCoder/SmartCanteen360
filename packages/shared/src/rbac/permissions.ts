/**
 * Canonical RBAC catalogue for SmartCanteen 360.
 *
 * A permission is `"<resource>:<action>"`. The API's PermissionsGuard checks
 * these keys; the web admin uses the same list to show/hide UI. Keep this file
 * the single source of truth — do not hard-code permission strings elsewhere.
 */

export const RESOURCES = [
  'dashboard',
  'employees',
  'departments',
  'meals',
  'meal-schedules',
  'bookings',
  'kitchen',
  'pos',
  'retail',
  'inventory',
  'suppliers',
  'purchase-orders',
  'wallet',
  'loyalty',
  'promotions',
  'analytics',
  'reports',
  'notifications',
  'users',
  'roles',
  'audit-logs',
  'settings',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'export',
  'approve',
  'manage',
] as const;

export type Action = (typeof ACTIONS)[number];

export type PermissionKey = `${Resource}:${Action}`;

/** Build a strongly-typed permission key. */
export const perm = (resource: Resource, action: Action): PermissionKey =>
  `${resource}:${action}` as PermissionKey;

/**
 * Full permission catalogue with human-readable descriptions. Seeded into the
 * `permissions` table.
 */
export interface PermissionDefinition {
  key: PermissionKey;
  resource: Resource;
  action: Action;
  description: string;
}

const crud = (
  resource: Resource,
  actions: Action[],
  label: string,
): PermissionDefinition[] =>
  actions.map((action) => ({
    key: perm(resource, action),
    resource,
    action,
    description: `${action[0]!.toUpperCase()}${action.slice(1)} ${label}`,
  }));

export const PERMISSIONS: PermissionDefinition[] = [
  ...crud('dashboard', ['read'], 'the executive dashboard'),
  ...crud('employees', ['read', 'create', 'update', 'delete', 'export'], 'employees'),
  ...crud('departments', ['read', 'create', 'update', 'delete'], 'departments & cost centres'),
  ...crud('meals', ['read', 'create', 'update', 'delete'], 'meals'),
  ...crud('meal-schedules', ['read', 'create', 'update', 'delete'], 'the meal scheduler'),
  ...crud('bookings', ['read', 'create', 'update', 'delete', 'export'], 'bookings'),
  ...crud('kitchen', ['read', 'update'], 'the kitchen board'),
  ...crud('pos', ['read', 'create', 'update', 'delete'], 'the point of sale'),
  ...crud('retail', ['read', 'create', 'update', 'delete'], 'retail products'),
  ...crud('inventory', ['read', 'create', 'update', 'delete'], 'inventory'),
  ...crud('suppliers', ['read', 'create', 'update', 'delete'], 'suppliers'),
  ...crud('purchase-orders', ['read', 'create', 'update', 'delete', 'approve'], 'purchase orders'),
  ...crud('wallet', ['read', 'create', 'update', 'export'], 'employee wallets'),
  ...crud('loyalty', ['read', 'create', 'update'], 'loyalty & rewards'),
  ...crud('promotions', ['read', 'create', 'update', 'delete'], 'promotions & campaigns'),
  ...crud('analytics', ['read', 'export'], 'analytics'),
  ...crud('reports', ['read', 'export'], 'reports'),
  ...crud('notifications', ['read', 'create'], 'notifications'),
  ...crud('users', ['read', 'create', 'update', 'delete'], 'admin users'),
  ...crud('roles', ['read', 'update'], 'roles & permissions'),
  ...crud('audit-logs', ['read', 'export'], 'audit logs'),
  ...crud('settings', ['read', 'update'], 'settings'),
];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);
