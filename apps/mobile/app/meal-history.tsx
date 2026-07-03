import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  totalPrice: number;
  schedule?: { serviceDate?: string; meal?: { name: string } };
}

export default function MealHistoryScreen() {
  const { data, isLoading, refetch, isRefetching } = useApiList<Booking>("meal-history", "/bookings/me");

  return (
    <Screen title="Meal History" onRefresh={refetch} refreshing={isRefetching}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No past meals yet." />
      ) : (
        <View className="gap-3">
          {(data ?? []).map((b) => (
            <Card key={b.id}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-semibold text-gray-900">{b.schedule?.meal?.name ?? "Meal"}</Text>
                  <Text className="text-xs text-gray-500">
                    {b.schedule?.serviceDate ? new Date(b.schedule.serviceDate).toLocaleDateString() : ""}
                  </Text>
                </View>
                <Text className="text-xs font-medium text-gray-600">{b.status}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
