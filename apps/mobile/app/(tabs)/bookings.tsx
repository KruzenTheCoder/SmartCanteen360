import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { CalendarPlus } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  quantity: number;
  schedule?: { serviceDate?: string; meal?: { name: string } };
}

const statusColor: Record<string, string> = {
  CONFIRMED: colors.info,
  COLLECTED: colors.success,
  PENDING: colors.warning,
  CANCELLED: colors.danger,
};

export default function BookingsScreen() {
  const { data, isLoading, refetch, isRefetching } = useApiList<Booking>("my-bookings", "/bookings/me");

  return (
    <Screen title="My Bookings" onRefresh={refetch} refreshing={isRefetching}>
      <TouchableOpacity
        className="mb-4 flex-row items-center justify-center gap-2 rounded-xl py-3"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push("/book-meal")}
      >
        <CalendarPlus size={18} color="white" />
        <Text className="font-semibold text-white">Book a Meal</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No bookings yet. Book your next meal above." />
      ) : (
        <View className="gap-3">
          {(data ?? []).map((b) => (
            <Card key={b.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {b.schedule?.meal?.name ?? "Meal"}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {b.schedule?.serviceDate
                      ? new Date(b.schedule.serviceDate).toLocaleDateString()
                      : ""}{" "}
                    · {b.bookingRef}
                  </Text>
                </View>
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: (statusColor[b.status] ?? colors.gray[400]) + "22" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: statusColor[b.status] ?? colors.gray[600] }}>
                    {b.status}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
