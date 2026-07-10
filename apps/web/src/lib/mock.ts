/**
 * Demo mode — lets the web portal run with NO backend or database.
 *
 * Enabled by default; disable by setting NEXT_PUBLIC_DEMO_MODE="false" (and
 * pointing NEXT_PUBLIC_API_URL at the real API). All data below is in-memory
 * sample data so every page renders something realistic.
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Demo credentials shown on the login screen. */
export const DEMO_CREDENTIALS = {
  email: "admin@netbite360.io",
  password: "Admin@12345",
};

// ---------------------------------------------------------------------------
// Fake JWT (unsigned) so the client + dashboard layout accept the session.
// jwtDecode only base64-decodes the payload, so no real signing is needed.
// ---------------------------------------------------------------------------
function base64url(input: string): string {
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(input)
      : Buffer.from(input, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function makeDemoToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "demo-admin",
    email: DEMO_CREDENTIALS.email,
    roles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
    companyId: "demo-company",
    iat: now,
    exp: now + 8 * 60 * 60, // 8 hours
  };
  return `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}.demo-signature`;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------
const employees = [
  { id: "e1", employeeNumber: "E-0001", firstName: "Thabo", lastName: "Nkosi", status: "ACTIVE", department: { name: "Engineering" }, wallet: { balance: 250 }, loyaltyAccount: { pointsBalance: 120, tier: "SILVER" } },
  { id: "e2", employeeNumber: "E-0002", firstName: "Aisha", lastName: "Patel", status: "ACTIVE", department: { name: "Operations" }, wallet: { balance: 180.5 }, loyaltyAccount: { pointsBalance: 340, tier: "GOLD" } },
  { id: "e3", employeeNumber: "E-0003", firstName: "Johan", lastName: "van der Merwe", status: "ON_LEAVE", department: { name: "Finance" }, wallet: { balance: 42 }, loyaltyAccount: { pointsBalance: 60, tier: "BRONZE" } },
  { id: "e4", employeeNumber: "E-0004", firstName: "Lerato", lastName: "Mokoena", status: "ACTIVE", department: { name: "Human Resources" }, wallet: { balance: 512.75 }, loyaltyAccount: { pointsBalance: 890, tier: "GOLD" } },
  { id: "e5", employeeNumber: "E-0005", firstName: "Sipho", lastName: "Dlamini", status: "SUSPENDED", department: { name: "Engineering" }, wallet: { balance: 0 }, loyaltyAccount: { pointsBalance: 15, tier: "BRONZE" } },
];

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const meals = [
  { id: "m1", name: "Grilled Chicken & Veg", status: "PUBLISHED", category: { name: "Lunch Mains" }, imageUrl: img("1532550907401-a500c9a57435"), costPrice: 22.5, retailPrice: 45, subsidyPrice: 15, nutrition: { calories: 520, protein: 42, carbs: 38, fat: 16 } },
  { id: "m2", name: "Beef Burger & Chips", status: "PUBLISHED", category: { name: "Lunch Mains" }, imageUrl: img("1568901346375-23c9450c58cd"), costPrice: 28, retailPrice: 55, subsidyPrice: 20, nutrition: { calories: 780, protein: 35, carbs: 62, fat: 34 } },
  { id: "m3", name: "Vegetable Curry & Rice", status: "PUBLISHED", category: { name: "Lunch Mains" }, imageUrl: img("1631452180519-c014fe946bc7"), costPrice: 18, retailPrice: 40, subsidyPrice: 12, nutrition: { calories: 610, protein: 18, carbs: 88, fat: 14 } },
  { id: "m4", name: "Caesar Salad", status: "PUBLISHED", category: { name: "Salads" }, imageUrl: img("1550304943-4f24f54ddde9"), costPrice: 16, retailPrice: 38, subsidyPrice: 10, nutrition: { calories: 320, protein: 12, carbs: 18, fat: 22 } },
  { id: "m5", name: "Margherita Pizza", status: "PUBLISHED", category: { name: "Lunch Mains" }, imageUrl: img("1574071318508-1cdbab80d002"), costPrice: 25, retailPrice: 52, subsidyPrice: 18, nutrition: { calories: 690, protein: 26, carbs: 78, fat: 24 } },
  { id: "m6", name: "Sushi Platter", status: "PUBLISHED", category: { name: "Specials" }, imageUrl: img("1579584425555-c3ce17fd4351"), costPrice: 40, retailPrice: 78, subsidyPrice: 25, nutrition: { calories: 480, protein: 30, carbs: 62, fat: 10 } },
  { id: "m7", name: "Berry Breakfast Bowl", status: "PUBLISHED", category: { name: "Breakfast" }, imageUrl: img("1490474418585-ba9bad8fd0ea"), costPrice: 14, retailPrice: 34, subsidyPrice: 9, nutrition: { calories: 290, protein: 12, carbs: 46, fat: 6 } },
  { id: "m8", name: "Chocolate Brownie", status: "DRAFT", category: { name: "Desserts" }, imageUrl: img("1606313564200-e75d5e30476c"), costPrice: 8, retailPrice: 22, subsidyPrice: 5, nutrition: { calories: 410, protein: 5, carbs: 52, fat: 20 } },
];

const retailProducts = [
  { id: "r1", name: "Still Water 500ml", category: "WATER", price: 12 },
  { id: "r2", name: "Cola 330ml", category: "COLD_DRINK", price: 18 },
  { id: "r3", name: "Chocolate Bar", category: "CHOCOLATE", price: 15 },
  { id: "r4", name: "Cappuccino", category: "COFFEE", price: 25 },
  { id: "r5", name: "Rooibos Tea", category: "TEA", price: 14 },
  { id: "r6", name: "Potato Crisps", category: "SNACK", price: 20 },
];

const inventory = [
  { id: "i1", sku: "VEG-001", name: "Mixed Vegetables", unit: "kg", quantityOnHand: 45, reorderLevel: 20, unitCost: 28, category: { name: "Produce" } },
  { id: "i2", sku: "MEAT-001", name: "Chicken Breast", unit: "kg", quantityOnHand: 12, reorderLevel: 15, unitCost: 75, category: { name: "Protein" } },
  { id: "i3", sku: "GRN-001", name: "Basmati Rice", unit: "kg", quantityOnHand: 80, reorderLevel: 25, unitCost: 32, category: { name: "Grains" } },
  { id: "i4", sku: "BEV-001", name: "Cola 330ml (case)", unit: "case", quantityOnHand: 6, reorderLevel: 10, unitCost: 120, category: { name: "Beverages" } },
];

const suppliers = [
  { id: "s1", name: "Fresh Farms Co", contactName: "Maria Botha", email: "orders@freshfarms.co.za", phone: "+27 11 555 0100" },
  { id: "s2", name: "Prime Meats", contactName: "David Khumalo", email: "sales@primemeats.co.za", phone: "+27 21 555 0142" },
  { id: "s3", name: "Beverage Direct", contactName: "Nadia Ally", email: "hello@bevdirect.co.za", phone: "+27 31 555 0199" },
];

const bookings = [
  { id: "b1", bookingRef: "BK-A1B2C3", status: "CONFIRMED", quantity: 1, totalPrice: 30, employee: { employeeNumber: "E-0001", firstName: "Thabo", lastName: "Nkosi" }, schedule: { meal: { name: "Grilled Chicken & Veg" }, serviceDate: new Date().toISOString() } },
  { id: "b2", bookingRef: "BK-D4E5F6", status: "COLLECTED", quantity: 1, totalPrice: 35, employee: { employeeNumber: "E-0002", firstName: "Aisha", lastName: "Patel" }, schedule: { meal: { name: "Beef Burger & Chips" }, serviceDate: new Date().toISOString() } },
  { id: "b3", bookingRef: "BK-G7H8I9", status: "PENDING", quantity: 2, totalPrice: 56, employee: { employeeNumber: "E-0004", firstName: "Lerato", lastName: "Mokoena" }, schedule: { meal: { name: "Vegetable Curry & Rice" }, serviceDate: new Date().toISOString() } },
];

const promotions = [
  { id: "p1", name: "Burger Friday", type: "PERCENTAGE_DISCOUNT", priority: 10, isActive: true },
  { id: "p2", name: "Healthy Week Combo", type: "COMBO", priority: 5, isActive: true },
  { id: "p3", name: "Lucky Draw", type: "LUCKY_DRAW", priority: 1, isActive: false },
];

const users = [
  { id: "u1", email: "admin@smartcanteen.local", firstName: "System", lastName: "Administrator", status: "ACTIVE", roles: [{ role: { name: "SUPER_ADMIN", label: "Super Admin" } }, { role: { name: "COMPANY_ADMIN", label: "Company Admin" } }] },
  { id: "u2", email: "chef@demo-corp.local", firstName: "Mike", lastName: "Roberts", status: "ACTIVE", roles: [{ role: { name: "KITCHEN_MANAGER", label: "Kitchen Manager" } }] },
  { id: "u3", email: "cashier@demo-corp.local", firstName: "Nomsa", lastName: "Zulu", status: "ACTIVE", roles: [{ role: { name: "CASHIER", label: "Cashier" } }] },
];

const auditLogs = [
  { id: "a1", action: "LOGIN", entity: "User", entityId: "u1", createdAt: new Date().toISOString(), user: { email: "admin@smartcanteen.local" } },
  { id: "a2", action: "CREATE", entity: "Meal", entityId: "m4", createdAt: new Date(Date.now() - 3600e3).toISOString(), user: { email: "chef@demo-corp.local" } },
  { id: "a3", action: "REFUND", entity: "PosTransaction", entityId: "t1", createdAt: new Date(Date.now() - 7200e3).toISOString(), user: { email: "cashier@demo-corp.local" } },
];

const notifications = [
  { id: "n1", title: "Low stock: Chicken Breast", body: "Below reorder level (12kg / 15kg).", type: "LOW_STOCK", channel: "IN_APP", status: "DELIVERED", createdAt: new Date().toISOString() },
  { id: "n2", title: "Burger Friday is live", body: "20% off all burgers today.", type: "PROMOTION", channel: "PUSH", status: "SENT", createdAt: new Date(Date.now() - 1800e3).toISOString() },
];

const rewards = [
  { id: "rw1", name: "Free Coffee", pointsCost: 100, stock: null, status: "AVAILABLE" },
  { id: "rw2", name: "Free Lunch", pointsCost: 500, stock: 25, status: "AVAILABLE" },
  { id: "rw3", name: "NetBite360 Mug", pointsCost: 250, stock: 8, status: "AVAILABLE" },
];

const leaderboard = employees
  .map((e, i) => ({ id: `l${i}`, lifetimePoints: (e.loyaltyAccount?.pointsBalance ?? 0) * 3, employee: { firstName: e.firstName, lastName: e.lastName, employeeNumber: e.employeeNumber } }))
  .sort((a, b) => b.lifetimePoints - a.lifetimePoints);

const kitchenDashboard = [
  { scheduleId: "sch1", meal: "Grilled Chicken & Veg", toPrepare: 84, collected: 40, pending: 44, capacity: 120 },
  { scheduleId: "sch2", meal: "Beef Burger & Chips", toPrepare: 65, collected: 30, pending: 35, capacity: 100 },
  { scheduleId: "sch3", meal: "Vegetable Curry & Rice", toPrepare: 38, collected: 12, pending: 26, capacity: 80 },
];

function upcomingSchedules() {
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const meal = meals[i % meals.length]!;
    return { id: `sch-${i}`, serviceDate: d.toISOString(), status: "OPEN", capacity: 120 - i * 8, meal: { id: meal.id, name: meal.name } };
  });
}

const analyticsSummary = {
  mealsToday: 187,
  collectedToday: 82,
  revenueToday: 12480.5,
  inventoryValue: 48210,
  upcomingBookings: 214,
  activeEmployees: 342,
};

const revenueTrend = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return { date: d.toISOString().slice(0, 10), revenue: 8000 + Math.round(Math.sin(i) * 2000 + i * 250) };
});

const popularMeals = meals.map((m, i) => ({ name: m.name, bookings: 160 - i * 28 }));

const walletTransactions = [
  { id: "wt1", type: "PAYROLL_TOPUP", amount: 300, balanceAfter: 550, description: "Monthly payroll top-up", createdAt: new Date().toISOString() },
  { id: "wt2", type: "DEBIT", amount: 45, balanceAfter: 505, description: "Lunch — Grilled Chicken", createdAt: new Date(Date.now() - 3600e3).toISOString() },
  { id: "wt3", type: "DEBIT", amount: 18, balanceAfter: 487, description: "Cola 330ml", createdAt: new Date(Date.now() - 7200e3).toISOString() },
];

const me = {
  id: "demo-admin",
  firstName: "System",
  lastName: "Administrator",
  email: DEMO_CREDENTIALS.email,
  companyId: "demo-company",
  roles: [{ role: { name: "SUPER_ADMIN" } }, { role: { name: "COMPANY_ADMIN" } }],
  employee: {
    id: "e1",
    employeeNumber: "E-0001",
    department: { name: "Administration" },
    wallet: { balance: 505 },
    loyaltyAccount: { pointsBalance: 120, lifetimePoints: 360, tier: "SILVER" },
    qrCard: { code: "demo-qr-code", isActive: true },
  },
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const wrap = <T>(data: T[]) => ({ data, pagination: { page: 1, pageSize: data.length, total: data.length, totalPages: 1 } });

export function mockGet(endpoint: string): unknown {
  const path = endpoint.split("?")[0] ?? endpoint;

  if (path === "/auth/me") return me;

  if (path === "/employees/analytics") return { total: employees.length, byDepartment: [] };
  if (path === "/employees") return wrap(employees);

  if (path === "/meals/categories") return [{ id: "c1", name: "Lunch Mains" }, { id: "c2", name: "Salads" }];
  if (path === "/meals") return wrap(meals);

  if (path === "/bookings/me") return wrap(bookings);
  if (path === "/bookings") return wrap(bookings);

  if (path === "/meal-schedules/production") return kitchenDashboard.map((k) => ({ scheduleId: k.scheduleId, meal: k.meal, capacity: k.capacity, booked: k.pending + k.collected }));
  if (path === "/meal-schedules") return wrap(upcomingSchedules());

  if (path === "/kitchen/dashboard") return kitchenDashboard;
  if (path === "/kitchen/queue") return [];

  if (path === "/pos/products") return retailProducts;

  if (path === "/inventory/dashboard") return { productCount: inventory.length, inventoryValue: 48210 };
  if (path === "/inventory/low-stock") return inventory.filter((p) => p.quantityOnHand <= p.reorderLevel);
  if (path === "/inventory/categories") return [{ id: "ic1", name: "Produce" }, { id: "ic2", name: "Protein" }];
  if (path === "/inventory") return wrap(inventory);

  if (path === "/suppliers/purchase-orders") return [];
  if (path === "/suppliers") return wrap(suppliers);

  if (path === "/loyalty/rewards") return rewards;
  if (path === "/loyalty/leaderboard") return leaderboard;

  if (path === "/promotions/campaigns") return [];
  if (path === "/promotions") return wrap(promotions);

  if (path === "/notifications/unread-count") return notifications.length;
  if (path === "/notifications") return wrap(notifications);

  if (path === "/analytics/dashboard") return analyticsSummary;
  if (path === "/analytics/revenue-trend") return revenueTrend;
  if (path === "/analytics/popular-meals") return popularMeals;
  if (path === "/analytics/department-usage") return [];

  if (path === "/users") return wrap(users);
  if (path === "/audit-logs") return wrap(auditLogs);
  if (path === "/settings") return [];

  if (path.startsWith("/wallet/") && path.endsWith("/transactions")) return walletTransactions;

  if (path.startsWith("/pos/lookup/")) {
    const code = decodeURIComponent(path.split("/").pop() ?? "");
    return employees.find((e) => e.employeeNumber.toLowerCase() === code.toLowerCase()) ?? employees[0];
  }

  // Unknown endpoint → empty list is the safest default for the UI.
  return wrap([]);
}

export function mockPost(endpoint: string): unknown {
  if (endpoint === "/pos/checkout") return { transaction: { id: "demo-txn" }, total: 0 };
  return { ok: true };
}

/** Validate demo login. Accepts the documented admin credentials. */
export function mockLogin(email: string, password: string) {
  if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    throw new Error("Invalid credentials. Use the demo admin login shown below.");
  }
  const accessToken = makeDemoToken();
  return { user: me, accessToken, refreshToken: "demo-refresh-token" };
}
