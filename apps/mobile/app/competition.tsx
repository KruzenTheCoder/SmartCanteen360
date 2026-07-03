import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Trophy } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface LeaderRow {
  id: string;
  lifetimePoints: number;
  employee?: { firstName: string; lastName: string } | null;
}

const medal = ["#f59e0b", "#94a3b8", "#b45309"];

export default function CompetitionScreen() {
  const { data, isLoading } = useApiList<LeaderRow>("leaderboard", "/loyalty/leaderboard");

  return (
    <Screen title="Competition" subtitle="Top earners this season">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No leaderboard activity yet." />
      ) : (
        <View className="gap-2">
          {(data ?? []).map((row, i) => (
            <Card key={row.id}>
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: (medal[i] ?? colors.gray[300]) + "33" }}>
                  {i < 3 ? (
                    <Trophy size={16} color={medal[i]} />
                  ) : (
                    <Text className="text-xs font-bold text-gray-500">{i + 1}</Text>
                  )}
                </View>
                <Text className="flex-1 font-medium text-gray-900">
                  {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : "—"}
                </Text>
                <Text className="font-semibold text-gray-900">{row.lifetimePoints} pts</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
