"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  ChefHat,
  ShoppingCart,
  Boxes,
  Truck,
  Wallet,
  Star,
  Megaphone,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  ScrollText,
  UserCog,
  Utensils,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand-provider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Operations",
    items: [
      { label: "Employees", href: "/employees", icon: Users },
      { label: "Meals", href: "/meals", icon: UtensilsCrossed },
      { label: "Meal Calendar", href: "/meal-calendar", icon: CalendarDays },
      { label: "Bookings", href: "/bookings", icon: ClipboardList },
      { label: "Kitchen", href: "/kitchen", icon: ChefHat },
      { label: "POS", href: "/pos", icon: ShoppingCart },
    ],
  },
  {
    section: "Supply",
    items: [
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    section: "Engagement",
    items: [
      { label: "Wallet", href: "/wallet", icon: Wallet },
      { label: "Loyalty", href: "/loyalty", icon: Star },
      { label: "Promotions", href: "/promotions", icon: Megaphone },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Users", href: "/users", icon: UserCog },
      { label: "Permissions", href: "/permissions", icon: Shield },
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const brand = useBrand();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-card lg:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.name} className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            <Utensils className="h-5 w-5 text-white" />
          </div>
        )}
        <span className="gradient-text text-lg font-bold tracking-tight">{brand.name}</span>
      </div>

      <nav className="sc-scrollbar h-[calc(100vh-4rem)] space-y-6 overflow-y-auto px-4 py-6">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
