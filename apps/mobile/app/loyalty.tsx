import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Gift, Star } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList, useApiResource } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Me {
  employee?: { loyaltyAccount?: { pointsBalance: number; lifetimePoints: number; tier: string } | null } | null;
}
interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  stock: number | null;
}

export default function LoyaltyScreen() {
  const { data: me } = useApiResource<Me>("me", "/auth/me");
  const { data: rewards, isLoading } = useApiList<Reward>("rewards", "/loyalty/rewards");
  const acct = me?.employee?.loyaltyAccount;

  return (
    <Screen title="Loyalty">
      <View className="mb-4 rounded-2xl p-6" style={{ backgroundColor: colors.accent }}>
        <View className="flex-row items-center gap-2">
          <Star size={18} color="white" />
          <Text className="text-sm text-white/80">{acct?.tier ?? "BRONZE"} tier</Text>
        </View>
        <Text className="mt-1 text-3xl font-bold text-white">{acct?.pointsBalance ?? 0} pts</Text>
        <Text className="text-xs text-white/70">{acct?.lifetimePoints ?? 0} lifetime points</Text>
      </View>

      <Text className="mb-2 text-base font-semibold text-gray-900">Rewards</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-6" />
      ) : (rewards ?? []).length === 0 ? (
        <EmptyState message="No rewards available yet." />
      ) : (
        <View className="gap-2">
          {(rewards ?? []).map((r) => (
            <Card key={r.id}>
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.gray[100] }}>
                  <Gift size={18} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{r.name}</Text>
                  <Text className="text-xs text-gray-400">
                    {r.stock == null ? "In stock" : `${r.stock} left`}
                  </Text>
                </View>
                <Text className="font-semibold text-gray-900">{r.pointsCost} pts</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
