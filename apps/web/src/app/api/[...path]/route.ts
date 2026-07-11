/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext, ACTIVE_COMPANY_COOKIE, type TenantContext } from "@/lib/data/context";
import { RESOURCES } from "@/lib/data/resources";

export const dynamic = "force-dynamic";

type Db = ReturnType<typeof createAdminClient>;

const ok = (data: unknown) => NextResponse.json(data);
const fail = (message: string, status = 400) => NextResponse.json({ message }, { status });
const list = (data: any[], total?: number) =>
  ok({ data, pagination: { page: 1, pageSize: data.length, total: total ?? data.length, totalPages: 1 } });

/**
 * Scope a query to the active tenant. Non-super users are pinned to their
 * company; super admins are scoped to the tenant they've switched to, or see
 * all tenants when none is selected (activeCompanyId === null).
 */
function scope(q: any, ctx: TenantContext) {
  return ctx.activeCompanyId ? q.eq("companyId", ctx.activeCompanyId) : q;
}

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
      let q = scope(db.from(res.table).select(res.select, { count: "exact" }), ctx);
      if (res.softDelete) q = q.is("deletedAt", null);
      const term = qp.get("search");
      if (term && res.searchFields?.length) {
        q = q.or(res.searchFields.map((f) => `${f}.ilike.%${term}%`).join(","));
      }
      q = q.order(res.orderBy.column, { ascending: res.orderBy.ascending });
      const { data, count, error } = await q;
      if (error) return fail(error.message, 500);
      return list(data ?? [], count ?? undefined);
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

      case "kitchen/queue":
        return ok([]);

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

    // Generic resource create.
    const res = RESOURCES[segs[0] ?? ""];
    if (res && segs.length === 1 && res.toInsert) {
      if (!companyId) return fail("No tenant in context", 400);
      const { data, error } = await db.from(res.table).insert(res.toInsert(body, companyId)).select().single();
      if (error) return fail(error.message, 400);
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
      const ref = `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { data, error } = await db.from("bookings").insert({
        companyId,
        employeeId: body.employeeId,
        scheduleId: body.scheduleId,
        bookingRef: ref,
        status: "CONFIRMED",
        quantity: Number(body.quantity ?? 1),
      }).select().single();
      return error ? fail(error.message, 400) : ok(data);
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
  const res = RESOURCES[segs[0] ?? ""];
  if (!res || segs.length !== 2) return fail("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const shape = res.toUpdate ? res.toUpdate(body) : body;
  const patch = Object.fromEntries(Object.entries(shape).filter(([, v]) => v !== undefined));

  try {
    const { data, error } = await scope(db.from(res.table).update(patch), ctx).eq("id", segs[1]).select().single();
    if (error) return fail(error.message, 400);
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
  const res = RESOURCES[segs[0] ?? ""];
  if (!res || segs.length !== 2) return fail("Not found", 404);

  try {
    const q = res.softDelete
      ? scope(db.from(res.table).update({ deletedAt: new Date().toISOString() }), ctx)
      : scope(db.from(res.table).delete(), ctx);
    const { error } = await q.eq("id", segs[1]);
    if (error) return fail(error.message, 400);
    return ok({ id: segs[1], deleted: true });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// ---- Helpers ---------------------------------------------------------------
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

async function posCheckout(db: Db, ctx: TenantContext, body: any) {
  const companyId = ctx.companyId ?? body.companyId;
  const items: any[] = body.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0);
  const discount = Number(body.discount ?? 0);
  const total = Math.max(0, subtotal - discount);
  const receiptNumber = `RC-${Date.now().toString(36).toUpperCase()}`;

  const { data: txn, error } = await db.from("pos_transactions").insert({
    companyId,
    cashierId: ctx.userId,
    employeeId: body.employeeId ?? null,
    receiptNumber,
    status: "COMPLETED",
    subtotal,
    discount,
    total,
  }).select().single();
  if (error || !txn) return fail(error?.message ?? "Checkout failed", 400);

  if (items.length) {
    await db.from("pos_items").insert(
      items.map((i) => ({
        transactionId: txn.id,
        retailProductId: i.retailProductId ?? null,
        label: i.label,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.unitPrice) * Number(i.quantity),
      })),
    );
  }
  await db.from("payments").insert({
    companyId,
    posTransactionId: txn.id,
    method: body.method ?? "CASH",
    provider: body.method === "CARD" ? "YOCO" : body.method === "WALLET" ? "WALLET" : "CASH",
    status: "CAPTURED",
    amount: total,
  });
  return ok({ transaction: txn, total });
}
