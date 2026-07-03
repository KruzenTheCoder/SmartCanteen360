"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  ChefHat,
  ShoppingCart,
  Wallet,
  Star,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for dashboard stats
const dashboardStats = [
  {
    title: "Today's Meals",
    value: "1,248",
    change: "+12%",
    trend: "up",
    icon: ChefHat,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    title: "Active Employees",
    value: "3,642",
    change: "+5%",
    trend: "up",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Today's Revenue",
    value: "R 45,280",
    change: "+18%",
    trend: "up",
    icon: Wallet,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    title: "Avg Rating",
    value: "4.8",
    change: "+0.2",
    trend: "up",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
];

const recentActivity = [
  { id: 1, action: "New meal added", item: "Grilled Salmon", user: "Chef Mike", time: "2 min ago", type: "add" },
  { id: 2, action: "Booking confirmed", item: "Lunch - John Doe", user: "System", time: "5 min ago", type: "booking" },
  { id: 3, action: "Inventory updated", item: "Rice stock +50kg", user: "Inventory Manager", time: "15 min ago", type: "inventory" },
  { id: 4, action: "Payment received", item: "R 1,250.00", user: "POS Terminal 1", time: "20 min ago", type: "payment" },
  { id: 5, action: "New employee added", item: "Sarah Johnson", user: "HR Admin", time: "1 hour ago", type: "employee" },
];

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      // This would fetch real data from the API
      // const response = await api.get("/analytics/dashboard");
      // return response;
      return null;
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening in your canteen today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} ${stat.color} rounded-lg p-2`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="ml-1">vs yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across your canteen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`
                    h-9 w-9 rounded-full flex items-center justify-center shrink-0
                    ${activity.type === 'add' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}
                    ${activity.type === 'booking' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : ''}
                    ${activity.type === 'inventory' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' : ''}
                    ${activity.type === 'payment' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : ''}
                    ${activity.type === 'employee' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300' : ''}
                  `}>
                    {activity.type === 'add' && <ChefHat className="h-4 w-4" />}
                    {activity.type === 'booking' && <Calendar className="h-4 w-4" />}
                    {activity.type === 'inventory' && <ShoppingCart className="h-4 w-4" />}
                    {activity.type === 'payment' && <Wallet className="h-4 w-4" />}
                    {activity.type === 'employee' && <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.item} • {activity.user}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats & Actions */}
        <div className="lg:col-span-3 space-y-8">
          {/* Today's Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Menu</CardTitle>
              <CardDescription>Popular meals for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Grilled Chicken Salad", orders: 156, rating: 4.8 },
                  { name: "Beef Burger & Fries", orders: 142, rating: 4.6 },
                  { name: "Vegetable Curry & Rice", orders: 98, rating: 4.7 },
                ].map((meal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.orders} orders</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{meal.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Add Meal", icon: ChefHat, href: "/meals/new" },
                  { label: "New Booking", icon: Calendar, href: "/bookings/new" },
                  { label: "POS Terminal", icon: ShoppingCart, href: "/pos" },
                  { label: "Reports", icon: TrendingUp, href: "/reports" },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4 hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <Link href={action.href}>
                      <action.icon className="h-5 w-5" />
                      <span className="text-xs">{action.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
