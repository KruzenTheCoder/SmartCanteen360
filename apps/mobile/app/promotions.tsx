import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Tag } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Promotion {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function PromotionsScreen() {
  const { data, isLoading } = useApiList<Promotion>("promotions", "/promotions");
  const active = (data ?? []).filter((p) => p.isActive);

  return (
    <Screen title="Promotions" subtitle="Deals available now">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : active.length === 0 ? (
        <EmptyState message="No active promotions right now." />
      ) : (
        <View className="gap-3">
          {active.map((p) => (
            <Card key={p.id}>
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary + "22" }}>
                  <Tag size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{p.name}</Text>
                  <Text className="text-xs text-gray-500">{p.type.replace(/_/g, " ")}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
