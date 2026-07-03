import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Wallet, Star, CalendarPlus, History, Bell, UtensilsCrossed } from "lucide-react-native";

import { Screen, Card } from "@/components/screen";
import { useApiResource } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Me {
  firstName: string;
  lastName: string;
  employee?: {
    id: string;
    wallet?: { balance: number } | null;
    loyaltyAccount?: { pointsBalance: number; tier: string } | null;
  } | null;
}

const zar = (n: number) => `R ${Number(n).toFixed(2)}`;

export default function DashboardScreen() {
  const { data: me, refetch, isRefetching } = useApiResource<Me>("me", "/auth/me");

  const quickActions = [
    { label: "Book Meal", icon: CalendarPlus, href: "/book-meal" as const },
    { label: "History", icon: History, href: "/meal-history" as const },
    { label: "Wallet", icon: Wallet, href: "/wallet" as const },
    { label: "Notifications", icon: Bell, href: "/notifications" as const },
  ];

  return (
    <Screen
      title={`Hi, ${me?.firstName ?? "there"} 👋`}
      subtitle="Welcome back to SmartCanteen"
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      {/* Balance + loyalty */}
      <View className="flex-row gap-3">
        <Card className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <Wallet size={18} color={colors.primary} />
            <Text className="text-xs text-gray-500">Wallet</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {zar(me?.employee?.wallet?.balance ?? 0)}
          </Text>
        </Card>
        <Card className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <Star size={18} color={colors.warning} />
            <Text className="text-xs text-gray-500">Loyalty</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {me?.employee?.loyaltyAccount?.pointsBalance ?? 0} pts
          </Text>
          <Text className="text-xs text-gray-400">{me?.employee?.loyaltyAccount?.tier ?? "BRONZE"}</Text>
        </Card>
      </View>

      {/* Quick actions */}
      <Text className="mb-3 mt-6 text-base font-semibold text-gray-900">Quick actions</Text>
      <View className="flex-row flex-wrap gap-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <TouchableOpacity
              key={a.label}
              className="w-[47%] flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
              onPress={() => router.push(a.href)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.gray[100] }}>
                <Icon size={20} color={colors.primary} />
              </View>
              <Text className="font-medium text-gray-800">{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Promo card */}
      <TouchableOpacity onPress={() => router.push("/promotions")}>
        <View className="mt-6 overflow-hidden rounded-2xl p-5" style={{ backgroundColor: colors.primary }}>
          <View className="flex-row items-center gap-2">
            <UtensilsCrossed size={20} color="white" />
            <Text className="font-semibold text-white">Today's specials</Text>
          </View>
          <Text className="mt-1 text-sm text-white/80">Tap to see promotions and combos available now.</Text>
        </View>
      </TouchableOpacity>
    </Screen>
  );
}
