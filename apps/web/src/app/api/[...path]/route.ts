/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext, ACTIVE_COMPANY_COOKIE, type TenantContext } from "@/lib/data/context";
import { RESOURCES } from "@/lib/data/resources";

export const dynamic = "force-dynamic";

type Db = ReturnType<typeof createAdminClient>;

const ok = (data: unknown) => NextResponse.json(data);
const fail = (message: string, status = 400) => NextResponse.json({ message }, { status });
const list = (data: any[], total?: number, page = 1, pageSize = data.length || 1) =>
  ok({
    data,
    pagination: {
      page,
      pageSize,
      total: total ?? data.length,
      totalPages: Math.max(1, Math.ceil((total ?? data.length) / (pageSize || 1))),
    },
  });

/** Write an audit-log entry (best effort — never blocks the mutation). */
async function audit(
  db: Db,
  ctx: TenantContext,
  action: string,
  entity: string,
  entityId?: string,
  after?: unknown,
) {
  try {
    await db.from("audit_logs").insert({
      companyId: ctx.activeCompanyId ?? ctx.companyId ?? null,
      userId: ctx.userId,
      action,
      entity,
      entityId: entityId ?? null,
      after: after ?? null,
    });
  } catch {
    // auditing must not break the request
  }
}

/**
 * Scope a query to the active tenant. Non-super users are pinned to their
 * company; super admins are scoped to the tenant they've switched to, or see
 * all tenants when none is selected (activeCompanyId === null).
 */
function scope(q: any, ctx: TenantContext) {
  return ctx.activeCompanyId ? q.eq("companyId", ctx.activeCompanyId) : q;
}

const round = (n: number) => Math.round(n * 100) / 100;

const PROVIDER_FOR: Record<string, string> = {
  WALLET: "WALLET",
  LOYALTY: "LOYALTY",
  PAYROLL_DEDUCTION: "PAYROLL",
  CARD: "YOCO",
  EFT: "OZOW",
  CASH: "CASH",
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

// ============================================================================
// GET
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return fail("Unauthorized", 401);

  const segs = params.path ?? [];
  const path = segs.join("/");
  const db = createAdminClient();
  const qp = req.nextUrl.searchParams;

  try {
    // ---- Generic resource list -------------------------------------------
    const res = RESOURCES[segs[0] ?? ""];
    if (res && segs.length === 1) {
      const page = Math.max(1, Number(qp.get("page") ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(qp.get("pageSize") ?? 25) || 25));
      let q = scope(db.from(res.table).select(res.select, { count: "exact" }), ctx);
      if (res.softDelete) q = q.is("deletedAt", null);
      const term = qp.get("search");
      if (term && res.searchFields?.length) {
        q = q.or(res.searchFields.map((f) => `${f}.ilike.%${term}%`).join(","));
      }
      q = q.order(res.orderBy.column, { ascending: res.orderBy.ascending }).range((page - 1) * pageSize, page * pageSize - 1);
      const { data, count, error } = await q;
      if (error) return fail(error.message, 500);
      return list(data ?? [], count ?? undefined, page, pageSize);
    }

    // ---- Bespoke reads ----------------------------------------------------
    switch (path) {
      case "auth/me": {
        const { data: p } = await db.from("profiles").select("fullName, role, companyId").eq("id", ctx.userId).single();
        let employee: any = null;
        let first = (p?.fullName ?? ctx.email).split(" ")[0] ?? "";
        let last = (p?.fullName ?? "").split(" ").slice(1).join(" ");
        if (ctx.employeeId) {
          const { data: emp } = await db
            .from("employees")
            .select(
              "id,employeeNumber,firstName,lastName,department:departments(name),wallet:wallets(balance),loyaltyAccount:loyalty_accounts(pointsBalance,lifetimePoints,tier),qrCard:qr_cards(code,isActive)",
            )
            .eq("id", ctx.employeeId)
            .single();
          if (emp) {
            employee = emp;
            first = emp.firstName ?? first;
            last = emp.lastName ?? last;
          }
        }
        return ok({
          id: ctx.userId,
          email: ctx.email,
          firstName: first,
          lastName: last,
          role: p?.role ?? ctx.role,
          companyId: p?.companyId ?? ctx.companyId,
          employee,
        });
      }

      case "companies": {
        const base = db.from("companies").select("id,name,slug,logoUrl,primaryColor").is("deletedAt", null).order("name");
        const { data } = ctx.isSuperAdmin ? await base : await base.eq("id", ctx.companyId ?? "");
        return ok(data ?? []);
      }

      case "meals/categories":
        return ok((await scope(db.from("meal_categories").select("id,name"), ctx).order("sortOrder")).data ?? []);

      case "inventory/categories":
        return ok((await scope(db.from("inventory_categories").select("id,name"), ctx).order("name")).data ?? []);

      case "inventory/low-stock": {
        const { data } = await scope(db.from("inventory_products").select("*"), ctx).is("deletedAt", null);
        return ok((data ?? []).filter((p: any) => Number(p.quantityOnHand) <= Number(p.reorderLevel)));
      }

      case "inventory/dashboard": {
        const { data } = await scope(db.from("inventory_products").select("quantityOnHand,unitCost"), ctx).is("deletedAt", null);
        const value = (data ?? []).reduce((s: number, p: any) => s + Number(p.quantityOnHand) * Number(p.unitCost), 0);
        return ok({ productCount: data?.length ?? 0, inventoryValue: value });
      }

      case "pos/products":
        return ok((await scope(db.from("retail_products").select("*"), ctx).eq("isActive", true).is("deletedAt", null).order("name")).data ?? []);

      case "loyalty/rewards":
        return ok((await scope(db.from("rewards").select("*"), ctx).eq("status", "AVAILABLE").is("deletedAt", null).order("pointsCost")).data ?? []);

      case "loyalty/leaderboard": {
        const { data } = await db
          .from("loyalty_accounts")
          .select("id,lifetimePoints,employee:employees(firstName,lastName,employeeNumber,companyId)")
          .order("lifetimePoints", { ascending: false })
          .limit(50);
        const rows = (data ?? []).filter(
          (r: any) => !ctx.activeCompanyId || r.employee?.companyId === ctx.activeCompanyId,
        );
        return ok(rows.slice(0, 10));
      }

      case "promotions/campaigns":
        return ok((await scope(db.from("campaigns").select("*, promotions(*)"), ctx).is("deletedAt", null).order("createdAt", { ascending: false })).data ?? []);

      case "suppliers/purchase-orders":
        return ok((await scope(db.from("purchase_orders").select("*, supplier:suppliers(name)"), ctx).is("deletedAt", null).order("orderDate", { ascending: false })).data ?? []);

      case "notifications/unread-count": {
        const { count } = await scope(db.from("notifications").select("id", { count: "exact", head: true }), ctx).is("readAt", null);
        return ok(count ?? 0);
      }

      case "bookings/me": {
        if (!ctx.employeeId) return list([]);
        const { data } = await db
          .from("bookings")
          .select("*, schedule:meal_schedules(serviceDate, meal:meals(name))")
          .eq("employeeId", ctx.employeeId)
          .order("createdAt", { ascending: false })
          .limit(50);
        return list(data ?? []);
      }

      case "meal-schedules": {
        const from = qp.get("from");
        const to = qp.get("to");
        let q = scope(db.from("meal_schedules").select("*, meal:meals(id,name,imageUrl)"), ctx).is("deletedAt", null);
        if (from) q = q.gte("serviceDate", from);
        if (to) q = q.lte("serviceDate", to);
        return list((await q.order("serviceDate")).data ?? []);
      }

      case "kitchen/dashboard": {
        const date = qp.get("date") ?? new Date().toISOString().slice(0, 10);
        const { data } = await scope(
          db.from("meal_schedules").select("id,capacity,meal:meals(name),bookings(status,quantity)"),
          ctx,
        ).eq("serviceDate", date);
        return ok(
          (data ?? []).map((s: any) => {
            const bk = s.bookings ?? [];
            const sum = (st: string) => bk.filter((b: any) => b.status === st).reduce((n: number, b: any) => n + b.quantity, 0);
            return {
              scheduleId: s.id,
              meal: s.meal?.name ?? "Meal",
              toPrepare: bk.reduce((n: number, b: any) => n + b.quantity, 0),
              collected: sum("COLLECTED"),
              pending: sum("CONFIRMED"),
              capacity: s.capacity,
            };
          }),
        );
      }

      case "kitchen/queue": {
        const date = qp.get("date") ?? new Date().toISOString().slice(0, 10);
        const { data: schedules } = await scope(db.from("meal_schedules").select("id"), ctx).eq("serviceDate", date);
        const ids = (schedules ?? []).map((s: any) => s.id);
        if (ids.length === 0) return ok([]);
        const { data } = await db
          .from("bookings")
          .select("*, employee:employees(employeeNumber,firstName,lastName), schedule:meal_schedules(meal:meals(name))")
          .in("scheduleId", ids)
          .eq("status", "CONFIRMED")
          .order("createdAt", { ascending: true });
        return ok(data ?? []);
      }

      case "analytics/waste": {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data } = await scope(db.from("waste_records").select("reason,quantity,estimatedCost"), ctx).gte(
          "recordedAt",
          since.toISOString(),
        );
        const byReason = new Map<string, { cost: number; quantity: number }>();
        (data ?? []).forEach((w: any) => {
          const cur = byReason.get(w.reason) ?? { cost: 0, quantity: 0 };
          cur.cost += Number(w.estimatedCost ?? 0);
          cur.quantity += Number(w.quantity ?? 0);
          byReason.set(w.reason, cur);
        });
        return ok(
          [...byReason.entries()]
            .map(([reason, v]) => ({ reason, cost: Math.round(v.cost * 100) / 100, quantity: v.quantity }))
            .sort((a, b) => b.cost - a.cost),
        );
      }

      case "analytics/dashboard": {
        const { start, end } = todayRange();
        const [emp, meals, pos, inv, mealsToday, collected, upcoming] = await Promise.all([
          scope(db.from("employees").select("id", { count: "exact", head: true }), ctx).is("deletedAt", null).eq("status", "ACTIVE"),
          scope(db.from("meals").select("id", { count: "exact", head: true }), ctx).is("deletedAt", null),
          scope(db.from("pos_transactions").select("total"), ctx).eq("status", "COMPLETED").gte("createdAt", start).lt("createdAt", end),
          scope(db.from("inventory_products").select("quantityOnHand,unitCost"), ctx).is("deletedAt", null),
          scope(db.from("bookings").select("id", { count: "exact", head: true }), ctx).gte("createdAt", start).lt("createdAt", end),
          scope(db.from("bookings").select("id", { count: "exact", head: true }), ctx).eq("status", "COLLECTED").gte("collectedAt", start).lt("collectedAt", end),
          scope(db.from("bookings").select("id", { count: "exact", head: true }), ctx).eq("status", "CONFIRMED"),
        ]);
        const revenueToday = (pos.data ?? []).reduce((s: number, t: any) => s + Number(t.total), 0);
        const inventoryValue = (inv.data ?? []).reduce((s: number, p: any) => s + Number(p.quantityOnHand) * Number(p.unitCost), 0);
        return ok({
          mealsToday: mealsToday.count ?? 0,
          collectedToday: collected.count ?? 0,
          revenueToday,
          inventoryValue,
          upcomingBookings: upcoming.count ?? 0,
          activeEmployees: emp.count ?? 0,
          publishedMeals: meals.count ?? 0,
        });
      }

      case "analytics/revenue-trend": {
        const since = new Date();
        since.setDate(since.getDate() - 14);
        const { data } = await scope(db.from("pos_transactions").select("total,createdAt"), ctx)
          .eq("status", "COMPLETED")
          .gte("createdAt", since.toISOString());
        const buckets = new Map<string, number>();
        (data ?? []).forEach((t: any) => {
          const day = String(t.createdAt).slice(0, 10);
          buckets.set(day, (buckets.get(day) ?? 0) + Number(t.total));
        });
        return ok([...buckets.entries()].map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date)));
      }

      case "analytics/popular-meals": {
        const { data } = await scope(
          db.from("bookings").select("quantity, schedule:meal_schedules(meal:meals(name))"),
          ctx,
        ).limit(2000);
        const counts = new Map<string, number>();
        (data ?? []).forEach((b: any) => {
          const name = b.schedule?.meal?.name;
          if (name) counts.set(name, (counts.get(name) ?? 0) + (b.quantity ?? 1));
        });
        return ok(
          [...counts.entries()]
            .map(([name, bookings]) => ({ name, bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 10),
        );
      }

      case "analytics/department-usage": {
        const { data } = await scope(
          db.from("bookings").select("quantity, employee:employees(department:departments(name))"),
          ctx,
        ).limit(2000);
        const counts = new Map<string, number>();
        (data ?? []).forEach((b: any) => {
          const name = b.employee?.department?.name ?? "Unassigned";
          counts.set(name, (counts.get(name) ?? 0) + (b.quantity ?? 1));
        });
        return ok(
          [...counts.entries()]
            .map(([department, bookings]) => ({ department, bookings }))
            .sort((a, b) => b.bookings - a.bookings),
        );
      }

      default:
        break;
    }

    // ---- Path-parameterised reads ----------------------------------------
    // /pos/lookup/:code
    if (segs[0] === "pos" && segs[1] === "lookup" && segs[2]) {
      const code = decodeURIComponent(segs[2]);
      const { data } = await scope(
        db.from("employees").select("id,employeeNumber,firstName,lastName,wallet:wallets(balance),loyaltyAccount:loyalty_accounts(pointsBalance)"),
        ctx,
      )
        .or(`employeeNumber.eq.${code},id.eq.${code}`)
        .limit(1);
      if (!data?.length) return fail("Customer not found", 404);
      return ok(data[0]);
    }
    // /wallet/:id/transactions
    if (segs[0] === "wallet" && segs[2] === "transactions") {
      const employeeId = segs[1];
      const { data: wallet } = await db.from("wallets").select("id").eq("employeeId", employeeId).single();
      if (!wallet) return ok([]);
      const { data } = await db.from("wallet_transactions").select("*").eq("walletId", wallet.id).order("createdAt", { ascending: false }).limit(50);
      return ok(data ?? []);
    }
    // /loyalty/:employeeId
    if (segs[0] === "loyalty" && segs[1] && segs.length === 2) {
      const { data } = await db.from("loyalty_accounts").select("*, transactions:loyalty_transactions(*)").eq("employeeId", segs[1]).single();
      return ok(data ?? {});
    }

    // Special case: admin users list (profiles + auth emails)
    if (path === "users") return usersList(db, ctx);

    // Single user (profile + auth email) for the edit page
    if (segs[0] === "users" && segs.length === 2) {
      const { data: p } = await db.from("profiles").select("*").eq("id", segs[1]).single();
      if (!ctx.isSuperAdmin && (p as any)?.companyId !== ctx.companyId) return fail("Forbidden", 403);
      const { data: u } = await db.auth.admin.getUserById(segs[1]!);
      const [first, ...rest] = ((p as any)?.fullName ?? "").split(" ");
      return ok({
        id: segs[1],
        email: u.user?.email ?? "",
        firstName: first ?? "",
        lastName: rest.join(" "),
        fullName: (p as any)?.fullName ?? "",
        role: (p as any)?.role ?? "EMPLOYEE",
        status: (p as any)?.isActive ? "ACTIVE" : "DISABLED",
      });
    }

    // Single company (tenant management)
    if (segs[0] === "companies" && segs.length === 2) {
      if (!ctx.isSuperAdmin && segs[1] !== ctx.companyId) return fail("Forbidden", 403);
      const { data, error } = await db.from("companies").select("*").eq("id", segs[1]).single();
      if (error) return fail(error.message, 404);
      return ok(data);
    }

    // Generic single record: /resource/:id
    const singleRes = RESOURCES[segs[0] ?? ""];
    if (singleRes && segs.length === 2) {
      let q = scope(db.from(singleRes.table).select(singleRes.select), ctx).eq("id", segs[1]);
      if (singleRes.softDelete) q = q.is("deletedAt", null);
      const { data, error } = await q.single();
      if (error) return fail(error.message, 404);
      return ok(data);
    }

    return list([]); // unknown → empty so the UI shows an empty state
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// ============================================================================
// POST
// ============================================================================
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return fail("Unauthorized", 401);

  const segs = params.path ?? [];
  const path = segs.join("/");
  const db = createAdminClient();
  const body = await req.json().catch(() => ({}));
  const companyId = ctx.activeCompanyId ?? ctx.companyId ?? body.companyId;

  try {
    // Auth no-ops (Supabase Auth handles these client-side).
    if (["auth/logout", "auth/forgot-password", "auth/reset-password"].includes(path)) return ok({ ok: true });

    // Super-admin tenant switch: set/clear the active-company cookie.
    if (path === "tenant/switch") {
      if (!ctx.isSuperAdmin) return fail("Forbidden", 403);
      const res = NextResponse.json({ ok: true });
      const target = (body.companyId as string | undefined)?.trim();
      if (target) {
        res.cookies.set(ACTIVE_COMPANY_COOKIE, target, { httpOnly: true, sameSite: "lax", path: "/" });
      } else {
        res.cookies.delete(ACTIVE_COMPANY_COOKIE);
      }
      return res;
    }

    // ---- Tenant management (super admin) ---------------------------------
    if (path === "companies") {
      if (!ctx.isSuperAdmin) return fail("Forbidden", 403);
      const id = crypto.randomUUID();
      const slug = String(body.slug || body.name || id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const { data, error } = await db.from("companies").insert({
        id,
        name: body.name,
        slug,
        primaryColor: body.primaryColor || "#4f46e5",
        secondaryColor: body.secondaryColor || "#7c3aed",
        logoUrl: body.logoUrl || null,
        currency: body.currency || "ZAR",
        timezone: body.timezone || "Africa/Johannesburg",
        supportEmail: body.supportEmail || null,
        isActive: true,
        updatedAt: new Date().toISOString(),
      }).select().single();
      if (error) return fail(error.message, 400);
      return ok(data);
    }

    // Invite a tenant's first admin: /companies/:id/invite
    if (segs[0] === "companies" && segs[2] === "invite" && segs[1]) {
      if (!ctx.isSuperAdmin) return fail("Forbidden", 403);
      const { data, error } = await db.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { companyId: segs[1], role: body.role || "COMPANY_ADMIN", fullName: body.fullName },
      });
      if (error) return fail(error.message, 400);
      return ok({ id: data.user?.id, email: body.email });
    }

    // Employees: create + provision wallet / loyalty / QR card.
    if (path === "employees") {
      if (!companyId) return fail("No tenant in context", 400);
      const { data, error } = await db.from("employees").insert(RESOURCES.employees.toInsert!(body, companyId)).select().single();
      if (error) return fail(error.message, 400);
      await provisionEmployees(db, [data.id]);
      return ok(data);
    }

    // Bulk CSV import: { rows: [...] }
    if (path === "employees/import") {
      if (!companyId) return fail("No tenant in context", 400);
      const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
      if (rows.length === 0) return fail("No rows to import", 400);
      const { data, error } = await db
        .from("employees")
        .insert(rows.map((r) => RESOURCES.employees.toInsert!(r, companyId)))
        .select("id");
      if (error) return fail(error.message, 400);
      const ids = (data ?? []).map((e: any) => e.id);
      await provisionEmployees(db, ids);
      return ok({ created: ids.length });
    }

    // Tenant settings upsert: { key, value }
    if (path === "settings") {
      if (!companyId) return fail("No tenant in context", 400);
      const { data, error } = await db
        .from("settings")
        .upsert({ companyId, key: body.key, value: body.value ?? {} }, { onConflict: "companyId,key" })
        .select()
        .single();
      if (error) return fail(error.message, 400);
      return ok(data);
    }

    // Generic resource create.
    const res = RESOURCES[segs[0] ?? ""];
    if (res && segs.length === 1 && res.toInsert) {
      if (!companyId) return fail("No tenant in context", 400);
      const { data, error } = await db.from(res.table).insert(res.toInsert(body, companyId)).select().single();
      if (error) return fail(error.message, 400);
      await audit(db, ctx, "CREATE", res.table, data?.id);
      return ok(data);
    }

    // Nested creates.
    if (path === "meals/categories") {
      const { data, error } = await db.from("meal_categories").insert({ companyId, name: body.name }).select().single();
      return error ? fail(error.message, 400) : ok(data);
    }
    if (path === "inventory/categories") {
      const { data, error } = await db.from("inventory_categories").insert({ companyId, name: body.name }).select().single();
      return error ? fail(error.message, 400) : ok(data);
    }
    if (path === "promotions/campaigns") {
      const { data, error } = await db.from("campaigns").insert({ companyId, name: body.name, description: body.description, status: "DRAFT" }).select().single();
      return error ? fail(error.message, 400) : ok(data);
    }

    if (path === "notifications/broadcast") {
      const { data, error } = await db.from("notifications").insert({ companyId, type: body.type ?? "ANNOUNCEMENT", channel: "IN_APP", status: "DELIVERED", title: body.title, body: body.body }).select().single();
      return error ? fail(error.message, 400) : ok(data);
    }

    if (path === "bookings") {
      const scheduleId = body.scheduleId;
      const quantity = Number(body.quantity ?? 1);
      const employeeId = body.employeeId ?? ctx.employeeId;
      if (!employeeId) return fail("No employee to book for", 400);
      if (!scheduleId) return fail("scheduleId is required", 400);

      const { data: schedule } = await db
        .from("meal_schedules")
        .select("id,status,capacity,bookingCutoff,meal:meals(retailPrice)")
        .eq("id", scheduleId)
        .single();
      if (!schedule) return fail("Meal schedule not found", 404);
      if (schedule.status !== "OPEN") return fail("Bookings are closed for this meal", 400);
      if (schedule.bookingCutoff && new Date(schedule.bookingCutoff) < new Date()) return fail("Booking cutoff has passed", 400);

      if (schedule.capacity != null) {
        const { data: existing } = await db
          .from("bookings")
          .select("quantity")
          .eq("scheduleId", scheduleId)
          .in("status", ["PENDING", "CONFIRMED", "COLLECTED"]);
        const used = (existing ?? []).reduce((n: number, b: any) => n + b.quantity, 0);
        if (used + quantity > schedule.capacity) return fail("Meal capacity exceeded", 400);
      }

      const { data: emp } = await db.from("employees").select("mealSubsidy").eq("id", employeeId).single();
      const retail = Number((schedule as any).meal?.retailPrice ?? 0);
      const subsidy = Math.min(Number(emp?.mealSubsidy ?? 0), retail);
      const ref = `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { data, error } = await db.from("bookings").insert({
        companyId,
        employeeId,
        scheduleId,
        bookingRef: ref,
        status: "CONFIRMED",
        quantity,
        unitPrice: retail,
        subsidyApplied: round(subsidy * quantity),
        totalPrice: round((retail - subsidy) * quantity),
      }).select().single();
      if (error) return fail(error.message, 400);
      await audit(db, ctx, "CREATE", "bookings", data?.id);
      return ok(data);
    }

    // Wallet top-up / adjustment ledger
    if (segs[0] === "wallet" && segs[2] === "topup" && segs[1]) {
      const employeeId = segs[1];
      const amount = round(Number(body.amount ?? 0));
      if (amount <= 0) return fail("Amount must be positive", 400);
      const { data: w } = await db.from("wallets").select("*").eq("employeeId", employeeId).single();
      if (!w) return fail("Wallet not found", 404);
      const balanceAfter = round(Number(w.balance) + amount);
      await db.from("wallets").update({ balance: balanceAfter }).eq("id", w.id);
      await db.from("wallet_transactions").insert({
        walletId: w.id,
        type: body.payroll ? "PAYROLL_TOPUP" : "CREDIT",
        amount,
        balanceAfter,
        description: body.description ?? "Top-up",
      });
      await audit(db, ctx, "UPDATE", "wallets", w.id, { topup: amount });
      return ok({ balance: balanceAfter });
    }

    // Loyalty reward redemption: /loyalty/:employeeId/redeem/:rewardId
    if (segs[0] === "loyalty" && segs[2] === "redeem" && segs[1] && segs[3]) {
      const employeeId = segs[1];
      const rewardId = segs[3];
      const [{ data: acct }, { data: reward }] = await Promise.all([
        db.from("loyalty_accounts").select("*").eq("employeeId", employeeId).single(),
        db.from("rewards").select("*").eq("id", rewardId).single(),
      ]);
      if (!acct) return fail("Loyalty account not found", 404);
      if (!reward) return fail("Reward not found", 404);
      if (reward.stock != null && reward.stock <= 0) return fail("Reward out of stock", 400);
      if (acct.pointsBalance < reward.pointsCost) return fail("Insufficient points", 400);

      const balanceAfter = acct.pointsBalance - reward.pointsCost;
      await db.from("loyalty_accounts").update({ pointsBalance: balanceAfter }).eq("id", acct.id);
      await db.from("loyalty_transactions").insert({ accountId: acct.id, type: "REDEEM", points: reward.pointsCost, balanceAfter, description: `Redeemed: ${reward.name}` });
      if (reward.stock != null) await db.from("rewards").update({ stock: reward.stock - 1 }).eq("id", reward.id);
      const { data: redemption } = await db
        .from("reward_redemptions")
        .insert({ rewardId, accountId: acct.id, pointsSpent: reward.pointsCost, status: "FULFILLED" })
        .select()
        .single();
      await audit(db, ctx, "UPDATE", "loyalty_accounts", acct.id, { redeemed: reward.name });
      return ok(redemption ?? { ok: true });
    }

    if (path === "pos/checkout") return posCheckout(db, ctx, body);

    return ok({ ok: true });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// ============================================================================
// PATCH — update a resource by id
// ============================================================================
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return fail("Unauthorized", 401);
  const segs = params.path ?? [];
  const db = createAdminClient();

  // User role/status update (super admin, or company admin for their own tenant).
  if (segs[0] === "users" && segs.length === 2) {
    const b = await req.json().catch(() => ({}));
    const { data: p } = await db.from("profiles").select("companyId").eq("id", segs[1]).single();
    if (!ctx.isSuperAdmin && (p as any)?.companyId !== ctx.companyId) return fail("Forbidden", 403);
    const patch: Record<string, unknown> = {};
    if (b.role) patch.role = b.role;
    if (b.status) patch.isActive = b.status === "ACTIVE";
    if (b.fullName !== undefined) patch.fullName = b.fullName;
    try {
      const { error } = await db.from("profiles").update(patch).eq("id", segs[1]);
      if (error) return fail(error.message, 400);
      return ok({ id: segs[1], ...patch });
    } catch (e) {
      return fail((e as Error).message, 500);
    }
  }

  // Company branding update (super admin, or company admin for their own tenant).
  if (segs[0] === "companies" && segs.length === 2) {
    if (!ctx.isSuperAdmin && segs[1] !== ctx.companyId) return fail("Forbidden", 403);
    const b = await req.json().catch(() => ({}));
    const patch = Object.fromEntries(
      Object.entries({
        name: b.name,
        logoUrl: b.logoUrl,
        primaryColor: b.primaryColor,
        secondaryColor: b.secondaryColor,
        supportEmail: b.supportEmail,
        currency: b.currency,
        timezone: b.timezone,
        updatedAt: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined),
    );
    try {
      const { data, error } = await db.from("companies").update(patch).eq("id", segs[1]).select().single();
      if (error) return fail(error.message, 400);
      return ok(data);
    } catch (e) {
      return fail((e as Error).message, 500);
    }
  }

  const res = RESOURCES[segs[0] ?? ""];
  if (!res || segs.length !== 2) return fail("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const shape = res.toUpdate ? res.toUpdate(body) : body;
  const patch = Object.fromEntries(Object.entries(shape).filter(([, v]) => v !== undefined));

  try {
    const { data, error } = await scope(db.from(res.table).update(patch), ctx).eq("id", segs[1]).select().single();
    if (error) return fail(error.message, 400);
    await audit(db, ctx, "UPDATE", res.table, segs[1]);
    return ok(data);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// ============================================================================
// DELETE — soft-delete (or hard delete) a resource by id
// ============================================================================
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return fail("Unauthorized", 401);
  const segs = params.path ?? [];
  const db = createAdminClient();

  // Deactivate a user (soft) rather than deleting the auth account.
  if (segs[0] === "users" && segs.length === 2) {
    const { data: p } = await db.from("profiles").select("companyId").eq("id", segs[1]).single();
    if (!ctx.isSuperAdmin && (p as any)?.companyId !== ctx.companyId) return fail("Forbidden", 403);
    const { error } = await db.from("profiles").update({ isActive: false }).eq("id", segs[1]);
    if (error) return fail(error.message, 400);
    return ok({ id: segs[1], deleted: true });
  }

  const res = RESOURCES[segs[0] ?? ""];
  if (!res || segs.length !== 2) return fail("Not found", 404);

  try {
    const q = res.softDelete
      ? scope(db.from(res.table).update({ deletedAt: new Date().toISOString() }), ctx)
      : scope(db.from(res.table).delete(), ctx);
    const { error } = await q.eq("id", segs[1]);
    if (error) return fail(error.message, 400);
    await audit(db, ctx, "DELETE", res.table, segs[1]);
    return ok({ id: segs[1], deleted: true });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// ---- Helpers ---------------------------------------------------------------
/** Give each new employee a wallet, loyalty account and QR card. */
async function provisionEmployees(db: Db, ids: string[]) {
  if (ids.length === 0) return;
  await db.from("wallets").insert(ids.map((employeeId) => ({ employeeId, balance: 0 })));
  await db.from("loyalty_accounts").insert(ids.map((employeeId) => ({ employeeId })));
  await db.from("qr_cards").insert(
    ids.map((employeeId) => ({ employeeId, code: crypto.randomUUID(), encryptedData: crypto.randomUUID() })),
  );
}

async function usersList(db: Db, ctx: TenantContext) {
  const { data: profiles } = ctx.isSuperAdmin
    ? await db.from("profiles").select("*")
    : await db.from("profiles").select("*").eq("companyId", ctx.companyId);
  const { data: authList } = await db.auth.admin.listUsers();
  const emailById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email]));
  const rows = (profiles ?? []).map((p: any) => {
    const [first, ...rest] = (p.fullName ?? "").split(" ");
    return {
      id: p.id,
      email: emailById.get(p.id) ?? "",
      firstName: first ?? "",
      lastName: rest.join(" "),
      status: p.isActive ? "ACTIVE" : "DISABLED",
      roles: [{ role: { name: p.role, label: p.role } }],
    };
  });
  return list(rows);
}

/**
 * Full POS settlement: records the sale, takes payment (wallet debit / loyalty
 * redeem), issues a receipt, accrues loyalty and deducts inventory. Balance
 * checks run before any writes. Sequential (not a single DB transaction) — for
 * strict atomicity move this into a Postgres RPC.
 */
async function posCheckout(db: Db, ctx: TenantContext, body: any) {
  const companyId = ctx.activeCompanyId ?? ctx.companyId ?? body.companyId;
  const items: any[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return fail("Cart is empty", 400);

  const subtotal = round(items.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0));
  const discount = Number(body.discount ?? 0);
  const total = Math.max(0, round(subtotal - discount));
  const method: string = body.method ?? "CASH";
  const employeeId: string | null = body.employeeId ?? null;
  const receiptNumber = `RC-${Date.now().toString(36).toUpperCase()}`;

  // Pre-flight balance checks (fail before writing anything).
  let wallet: any = null;
  let redeemAccount: any = null;
  if (employeeId && method === "WALLET") {
    ({ data: wallet } = await db.from("wallets").select("*").eq("employeeId", employeeId).single());
    if (!wallet) return fail("Employee wallet not found", 400);
    if (Number(wallet.balance) < total) return fail("Insufficient wallet balance", 400);
  }
  if (employeeId && method === "LOYALTY") {
    ({ data: redeemAccount } = await db.from("loyalty_accounts").select("*").eq("employeeId", employeeId).single());
    if (!redeemAccount || redeemAccount.pointsBalance < Math.ceil(total)) return fail("Insufficient loyalty points", 400);
  }

  const { data: txn, error } = await db.from("pos_transactions").insert({
    companyId,
    cashierId: ctx.userId,
    employeeId,
    receiptNumber,
    status: "COMPLETED",
    subtotal,
    discount,
    total,
  }).select().single();
  if (error || !txn) return fail(error?.message ?? "Checkout failed", 400);

  await db.from("pos_items").insert(
    items.map((i) => ({
      transactionId: txn.id,
      retailProductId: i.retailProductId ?? null,
      label: i.label,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      lineTotal: round(Number(i.unitPrice) * Number(i.quantity)),
    })),
  );
  await db.from("payments").insert({
    companyId,
    posTransactionId: txn.id,
    method,
    provider: PROVIDER_FOR[method] ?? "CASH",
    status: "CAPTURED",
    amount: total,
  });
  await db.from("receipts").insert({ posTransactionId: txn.id, number: receiptNumber });

  // Wallet debit
  if (wallet) {
    const balanceAfter = round(Number(wallet.balance) - total);
    await db.from("wallets").update({ balance: balanceAfter }).eq("id", wallet.id);
    await db.from("wallet_transactions").insert({
      walletId: wallet.id, type: "DEBIT", amount: total, balanceAfter, posTransactionId: txn.id, description: `POS ${receiptNumber}`,
    });
  }
  // Loyalty redemption
  if (redeemAccount) {
    const points = Math.ceil(total);
    const balanceAfter = redeemAccount.pointsBalance - points;
    await db.from("loyalty_accounts").update({ pointsBalance: balanceAfter }).eq("id", redeemAccount.id);
    await db.from("loyalty_transactions").insert({ accountId: redeemAccount.id, type: "REDEEM", points, balanceAfter, description: `POS ${receiptNumber}` });
  }
  // Loyalty accrual (earn 0.1 pt per currency unit) for non-loyalty payments
  if (employeeId && method !== "LOYALTY") {
    const { data: acct } = await db.from("loyalty_accounts").select("*").eq("employeeId", employeeId).single();
    const earn = Math.floor(total * 0.1);
    if (acct && earn > 0) {
      const balanceAfter = acct.pointsBalance + earn;
      await db.from("loyalty_accounts").update({ pointsBalance: balanceAfter, lifetimePoints: acct.lifetimePoints + earn }).eq("id", acct.id);
      await db.from("loyalty_transactions").insert({ accountId: acct.id, type: "EARN", points: earn, balanceAfter, description: `POS ${receiptNumber}` });
    }
  }
  // Deduct inventory for retail items linked to stock
  for (const item of items) {
    if (!item.retailProductId) continue;
    const { data: rp } = await db.from("retail_products").select("inventoryProductId").eq("id", item.retailProductId).single();
    if (!rp?.inventoryProductId) continue;
    const { data: prod } = await db.from("inventory_products").select("id,quantityOnHand").eq("id", rp.inventoryProductId).single();
    if (!prod) continue;
    const balanceAfter = round(Number(prod.quantityOnHand) - Number(item.quantity));
    await db.from("inventory_products").update({ quantityOnHand: balanceAfter }).eq("id", prod.id);
    await db.from("stock_movements").insert({ productId: prod.id, type: "SALE_DEDUCTION", quantity: -Number(item.quantity), balanceAfter, reference: receiptNumber });
  }

  await audit(db, ctx, "CREATE", "pos_transactions", txn.id, { total, method });
  return ok({ transaction: txn, receipt: receiptNumber, total });
}
