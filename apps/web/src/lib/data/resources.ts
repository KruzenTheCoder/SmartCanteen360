/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Config-driven CRUD resources. Each maps a REST-ish path segment to a Supabase
 * table, the columns/relations to select, searchable fields, and how to shape an
 * insert (always injecting the caller's companyId for tenant isolation).
 */
export interface ResourceConfig {
  table: string;
  select: string;
  searchFields?: string[];
  orderBy: { column: string; ascending: boolean };
  softDelete: boolean;
  toInsert?: (body: any, companyId: string) => Record<string, any>;
  toUpdate?: (body: any) => Record<string, any>;
}

const num = (v: unknown, d = 0) => (v === undefined || v === null || v === "" ? d : Number(v));

export const RESOURCES: Record<string, ResourceConfig> = {
  employees: {
    table: "employees",
    select:
      "*, department:departments(id,name), wallet:wallets(id,balance), loyaltyAccount:loyalty_accounts(id,pointsBalance,tier)",
    searchFields: ["firstName", "lastName", "employeeNumber", "email"],
    orderBy: { column: "createdAt", ascending: false },
    softDelete: true,
    toInsert: (b, c) => ({
      companyId: c,
      employeeNumber: b.employeeNumber,
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email || null,
      phone: b.phone || null,
      mealSubsidy: num(b.mealSubsidy),
      status: b.status || "ACTIVE",
    }),
    toUpdate: (b) => ({
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email,
      phone: b.phone,
      status: b.status,
      ...(b.mealSubsidy !== undefined ? { mealSubsidy: num(b.mealSubsidy) } : {}),
    }),
  },

  meals: {
    table: "meals",
    select: "*, category:meal_categories(id,name), nutrition:meal_nutrition(calories,protein,carbs,fat)",
    searchFields: ["name"],
    orderBy: { column: "createdAt", ascending: false },
    softDelete: true,
    toInsert: (b, c) => ({
      companyId: c,
      name: b.name,
      description: b.description || null,
      imageUrl: b.imageUrl || null,
      costPrice: num(b.costPrice),
      retailPrice: num(b.retailPrice),
      subsidyPrice: num(b.subsidyPrice),
      capacity: b.capacity ? num(b.capacity) : null,
      status: b.status || "DRAFT",
    }),
    toUpdate: (b) => ({
      name: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
      status: b.status,
      ...(b.costPrice !== undefined ? { costPrice: num(b.costPrice) } : {}),
      ...(b.retailPrice !== undefined ? { retailPrice: num(b.retailPrice) } : {}),
      ...(b.subsidyPrice !== undefined ? { subsidyPrice: num(b.subsidyPrice) } : {}),
      ...(b.capacity !== undefined ? { capacity: b.capacity ? num(b.capacity) : null } : {}),
    }),
  },

  inventory: {
    table: "inventory_products",
    select: "*, category:inventory_categories(id,name)",
    searchFields: ["name", "sku", "barcode"],
    orderBy: { column: "name", ascending: true },
    softDelete: true,
    toInsert: (b, c) => ({
      companyId: c,
      sku: b.sku,
      name: b.name,
      unit: b.unit || "unit",
      barcode: b.barcode || null,
      reorderLevel: num(b.reorderLevel),
      unitCost: num(b.unitCost),
    }),
    toUpdate: (b) => ({
      name: b.name,
      unit: b.unit,
      barcode: b.barcode,
      ...(b.reorderLevel !== undefined ? { reorderLevel: num(b.reorderLevel) } : {}),
      ...(b.unitCost !== undefined ? { unitCost: num(b.unitCost) } : {}),
    }),
  },

  suppliers: {
    table: "suppliers",
    select: "*",
    searchFields: ["name"],
    orderBy: { column: "name", ascending: true },
    softDelete: true,
    toInsert: (b, c) => ({
      companyId: c,
      name: b.name,
      contactName: b.contactName || null,
      email: b.email || null,
      phone: b.phone || null,
      address: b.address || null,
    }),
    toUpdate: (b) => ({
      name: b.name,
      contactName: b.contactName,
      email: b.email,
      phone: b.phone,
      address: b.address,
    }),
  },

  promotions: {
    table: "promotions",
    select: "*",
    searchFields: ["name"],
    orderBy: { column: "priority", ascending: false },
    softDelete: true,
    toInsert: (b, c) => ({
      companyId: c,
      name: b.name,
      type: b.type,
      rules: b.rules ?? {},
      priority: num(b.priority),
      isActive: true,
    }),
    toUpdate: (b) => ({
      name: b.name,
      type: b.type,
      ...(b.priority !== undefined ? { priority: num(b.priority) } : {}),
      ...(b.isActive !== undefined ? { isActive: Boolean(b.isActive) } : {}),
    }),
  },

  notifications: {
    table: "notifications",
    select: "*",
    orderBy: { column: "createdAt", ascending: false },
    softDelete: false,
    toInsert: (b, c) => ({
      companyId: c,
      type: b.type || "ANNOUNCEMENT",
      channel: b.channel || "IN_APP",
      status: "DELIVERED",
      title: b.title,
      body: b.body,
    }),
  },

  settings: {
    table: "settings",
    select: "*",
    orderBy: { column: "key", ascending: true },
    softDelete: false,
  },

  "audit-logs": {
    table: "audit_logs",
    select: "*",
    orderBy: { column: "createdAt", ascending: false },
    softDelete: false,
  },
};
