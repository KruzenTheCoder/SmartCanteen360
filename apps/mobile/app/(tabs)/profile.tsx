import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import {
  ChevronRight,
  Wallet,
  Star,
  Bell,
  Apple,
  Heart,
  Tag,
  Trophy,
  Settings,
  LogOut,
} from "lucide-react-native";

import { Screen, Card } from "@/components/screen";
import { useApiResource } from "@/lib/hooks";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";

interface Me {
  firstName: string;
  lastName: string;
  email: string;
  employee?: { employeeNumber: string } | null;
}

const LINKS = [
  { label: "Wallet", icon: Wallet, href: "/wallet" as const },
  { label: "Loyalty", icon: Star, href: "/loyalty" as const },
  { label: "Nutrition", icon: Apple, href: "/nutrition" as const },
  { label: "Favourite Meals", icon: Heart, href: "/favourites" as const },
  { label: "Promotions", icon: Tag, href: "/promotions" as const },
  { label: "Competition", icon: Trophy, href: "/competition" as const },
  { label: "Notifications", icon: Bell, href: "/notifications" as const },
  { label: "Settings", icon: Settings, href: "/settings" as const },
];

export default function ProfileScreen() {
  const { data: me } = useApiResource<Me>("me", "/auth/me");
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen title="Profile">
      <Card className="mb-4 flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
          <Text className="text-lg font-bold text-white">
            {(me?.firstName?.[0] ?? "") + (me?.lastName?.[0] ?? "")}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">
            {me?.firstName} {me?.lastName}
          </Text>
          <Text className="text-xs text-gray-500">{me?.email}</Text>
          <Text className="text-xs text-gray-400">{me?.employee?.employeeNumber}</Text>
        </View>
      </Card>

      <Card className="gap-1 p-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <TouchableOpacity
              key={l.label}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3"
              onPress={() => router.push(l.href)}
            >
              <Icon size={20} color={colors.gray[600]} />
              <Text className="flex-1 text-gray-800">{l.label}</Text>
              <ChevronRight size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          );
        })}
      </Card>

      <TouchableOpacity
        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border py-3"
        style={{ borderColor: colors.danger }}
        onPress={logout}
      >
        <LogOut size={18} color={colors.danger} />
        <Text className="font-semibold" style={{ color: colors.danger }}>
          Sign out
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
