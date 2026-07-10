import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { BrandProvider } from "@/components/brand-provider";
import { DEFAULT_BRAND, type Brand } from "@/lib/branding";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getBrand } from "@/lib/supabase/tenant";

interface TokenPayload {
  sub: string;
  email: string;
  exp: number;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let brand: Brand = DEFAULT_BRAND;

  if (isSupabaseConfigured) {
    // Production: real Supabase Auth (middleware also guards these routes).
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    brand = await getBrand();
  } else {
    // Demo mode: verify the fake session cookie.
    const token = cookies().get("access_token")?.value;
    if (!token) redirect("/login");
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.exp * 1000 < Date.now()) redirect("/login");
    } catch {
      redirect("/login");
    }
  }

  return (
    <BrandProvider brand={brand}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
