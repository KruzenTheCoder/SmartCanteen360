-- ============================================================================
-- Enable Row-Level Security on all application tables.
--
-- SmartCanteen 360's only database client is the NestJS API, which connects as
-- the Supabase `postgres` / service role (BYPASSRLS). Enabling RLS with NO
-- policies denies the Supabase `anon` and `authenticated` roles entirely, so a
-- leaked anon key can never read tenant data directly. Tenant isolation itself
-- is enforced in the API (companyId scoping); this is defence-in-depth.
--
-- NOTE: not FORCED, so the table owner / service role continue to bypass RLS.
-- ============================================================================

ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_resets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "push_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cost_centres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_nutrition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_ingredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_allergens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meal_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "booking_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallet_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loyalty_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loyalty_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reward_redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retail_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pos_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pos_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pos_shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kitchen_productions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waste_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "qr_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_snapshots" ENABLE ROW LEVEL SECURITY;
