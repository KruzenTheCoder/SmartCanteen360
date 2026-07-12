#!/usr/bin/env node
/**
 * NetBite360 API smoke test.
 *
 * Signs in via Supabase Auth (password grant) and hits every read endpoint of
 * the deployed web /api, reporting status + row counts. Optionally exercises a
 * create → update → delete cycle on a meal (SMOKE_WRITE=true).
 *
 * Usage (PowerShell):
 *   $env:SMOKE_BASE_URL="https://your-app.vercel.app"
 *   $env:SMOKE_SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SMOKE_SUPABASE_ANON_KEY="<anon key>"
 *   $env:SMOKE_EMAIL="admin@netbite360.io"
 *   $env:SMOKE_PASSWORD="<password>"
 *   node scripts/smoke-test.mjs
 *
 * Requires Node 18+ (global fetch). No dependencies.
 */

const {
  SMOKE_BASE_URL: BASE,
  SMOKE_SUPABASE_URL: SUPA,
  SMOKE_SUPABASE_ANON_KEY: ANON,
  SMOKE_EMAIL: EMAIL,
  SMOKE_PASSWORD: PASSWORD,
  SMOKE_WRITE,
} = process.env;

for (const [k, v] of Object.entries({ SMOKE_BASE_URL: BASE, SMOKE_SUPABASE_URL: SUPA, SMOKE_SUPABASE_ANON_KEY: ANON, SMOKE_EMAIL: EMAIL, SMOKE_PASSWORD: PASSWORD })) {
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(2);
  }
}

const api = BASE.replace(/\/$/, "") + "/api";
const today = new Date().toISOString().slice(0, 10);
const to = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

const GET_ENDPOINTS = [
  "/auth/me",
  "/companies",
  "/employees",
  "/employees/analytics",
  "/meals",
  "/meals/categories",
  "/bookings",
  `/meal-schedules?from=${today}&to=${to}`,
  `/kitchen/dashboard?date=${today}`,
  `/kitchen/queue?date=${today}`,
  "/pos/products",
  "/inventory",
  "/inventory/dashboard",
  "/inventory/low-stock",
  "/inventory/categories",
  "/suppliers",
  "/suppliers/purchase-orders",
  "/loyalty/rewards",
  "/loyalty/leaderboard",
  "/promotions",
  "/promotions/campaigns",
  "/notifications",
  "/notifications/unread-count",
  "/analytics/dashboard",
  "/analytics/revenue-trend",
  "/analytics/popular-meals",
  "/analytics/department-usage",
  "/analytics/waste",
  "/users",
  "/audit-logs",
  "/settings",
];

async function login() {
  const res = await fetch(`${SUPA.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Supabase login failed (${res.status}): ${body.error_description || body.msg || JSON.stringify(body)}`);
  }
  return body.access_token;
}

function count(body) {
  if (Array.isArray(body)) return body.length;
  if (Array.isArray(body?.data)) return body.data.length;
  if (body && typeof body === "object") return 1;
  return 0;
}

async function req(token, method, path, json) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) },
    body: json ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log(`\n🔎  NetBite360 smoke test → ${api}\n`);
  const token = await login();
  console.log("✓ Supabase login OK\n");

  let pass = 0;
  let fail = 0;
  for (const ep of GET_ENDPOINTS) {
    const r = await req(token, "GET", ep);
    if (r.ok) {
      pass++;
      console.log(`  ✓ GET ${ep}  (${count(r.body)})`);
    } else {
      fail++;
      console.log(`  ✗ GET ${ep}  → ${r.status} ${r.body?.message ?? ""}`);
    }
  }

  if (String(SMOKE_WRITE).toLowerCase() === "true") {
    console.log("\n  writing (create → update → delete a test meal)…");
    const created = await req(token, "POST", "/meals", { name: `Smoke Test Meal ${Date.now()}`, status: "DRAFT", retailPrice: 1 });
    if (created.ok && created.body?.id) {
      const id = created.body.id;
      const patched = await req(token, "PATCH", `/meals/${id}`, { retailPrice: 2 });
      const deleted = await req(token, "DELETE", `/meals/${id}`);
      const okAll = patched.ok && deleted.ok;
      okAll ? pass++ : fail++;
      console.log(okAll ? "  ✓ meal create/update/delete OK" : `  ✗ write cycle failed (patch ${patched.status}, delete ${deleted.status})`);
    } else {
      fail++;
      console.log(`  ✗ meal create failed → ${created.status} ${created.body?.message ?? ""}`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
