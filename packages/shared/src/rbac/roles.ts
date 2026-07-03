/**
 * Role definitions and the default role → permission grants.
 * Mirrors the `RoleName` enum in the Prisma schema.
 */
import { PERMISSION_KEYS, PermissionKey, perm } from './permissions';

export const ROLE_NAMES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'KITCHEN_MANAGER',
  'KITCHEN_STAFF',
  'CASHIER',
  'INVENTORY_MANAGER',
  'FINANCE',
  'HR',
  'EMPLOYEE',
  'AUDITOR',
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export interface RoleDefinition {
  name: RoleName;
  label: string;
  description: string;
}

export const ROLES: RoleDefinition[] = [
  { name: 'SUPER_ADMIN', label: 'Super Admin', description: 'Platform owner with unrestricted access across all tenants.' },
  { name: 'COMPANY_ADMIN', label: 'Company Admin', description: 'Full administrative access within a single company.' },
  { name: 'KITCHEN_MANAGER', label: 'Kitchen Manager', description: 'Runs meals, scheduling, production and waste.' },
  { name: 'KITCHEN_STAFF', label: 'Kitchen Staff', description: 'Executes production and marks collections.' },
  { name: 'CASHIER', label: 'Cashier', description: 'Operates the POS and processes sales.' },
  { name: 'INVENTORY_MANAGER', label: 'Inventory Manager', description: 'Manages stock, suppliers and purchasing.' },
  { name: 'FINANCE', label: 'Finance', description: 'Wallet, payments, reports and reconciliation.' },
  { name: 'HR', label: 'HR', description: 'Manages employees and subsidies.' },
  { name: 'EMPLOYEE', label: 'Employee', description: 'End user: bookings, wallet, loyalty, shop (mobile).' },
  { name: 'AUDITOR', label: 'Auditor', description: 'Read-only oversight across the platform.' },
];

const READ_ONLY = PERMISSION_KEYS.filter((k) => k.endsWith(':read') || k.endsWith(':export'));

/**
 * Default grants. SUPER_ADMIN and COMPANY_ADMIN receive every permission; the
 * API additionally treats SUPER_ADMIN as an implicit wildcard.
 */
export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  SUPER_ADMIN: [...PERMISSION_KEYS],
  COMPANY_ADMIN: [...PERMISSION_KEYS],
  KITCHEN_MANAGER: [
    perm('dashboard', 'read'),
    perm('meals', 'read'), perm('meals', 'create'), perm('meals', 'update'), perm('meals', 'delete'),
    perm('meal-schedules', 'read'), perm('meal-schedules', 'create'), perm('meal-schedules', 'update'), perm('meal-schedules', 'delete'),
    perm('bookings', 'read'), perm('bookings', 'export'),
    perm('kitchen', 'read'), perm('kitchen', 'update'),
    perm('inventory', 'read'),
    perm('reports', 'read'), perm('reports', 'export'),
    perm('notifications', 'read'), perm('notifications', 'create'),
  ],
  KITCHEN_STAFF: [
    perm('dashboard', 'read'),
    perm('kitchen', 'read'), perm('kitchen', 'update'),
    perm('meals', 'read'),
    perm('bookings', 'read'),
  ],
  CASHIER: [
    perm('dashboard', 'read'),
    perm('pos', 'read'), perm('pos', 'create'), perm('pos', 'update'),
    perm('retail', 'read'),
    perm('wallet', 'read'),
    perm('loyalty', 'read'),
    perm('employees', 'read'),
  ],
  INVENTORY_MANAGER: [
    perm('dashboard', 'read'),
    perm('inventory', 'read'), perm('inventory', 'create'), perm('inventory', 'update'), perm('inventory', 'delete'),
    perm('suppliers', 'read'), perm('suppliers', 'create'), perm('suppliers', 'update'), perm('suppliers', 'delete'),
    perm('purchase-orders', 'read'), perm('purchase-orders', 'create'), perm('purchase-orders', 'update'), perm('purchase-orders', 'approve'),
    perm('retail', 'read'), perm('retail', 'create'), perm('retail', 'update'),
    perm('reports', 'read'), perm('reports', 'export'),
  ],
  FINANCE: [
    perm('dashboard', 'read'),
    perm('wallet', 'read'), perm('wallet', 'create'), perm('wallet', 'update'), perm('wallet', 'export'),
    perm('loyalty', 'read'),
    perm('pos', 'read'),
    perm('analytics', 'read'), perm('analytics', 'export'),
    perm('reports', 'read'), perm('reports', 'export'),
    perm('audit-logs', 'read'),
  ],
  HR: [
    perm('dashboard', 'read'),
    perm('employees', 'read'), perm('employees', 'create'), perm('employees', 'update'), perm('employees', 'delete'), perm('employees', 'export'),
    perm('departments', 'read'), perm('departments', 'create'), perm('departments', 'update'), perm('departments', 'delete'),
    perm('reports', 'read'), perm('reports', 'export'),
  ],
  EMPLOYEE: [
    perm('bookings', 'read'), perm('bookings', 'create'), perm('bookings', 'update'),
    perm('wallet', 'read'),
    perm('loyalty', 'read'),
    perm('retail', 'read'),
    perm('notifications', 'read'),
  ],
  AUDITOR: [...READ_ONLY],
};
