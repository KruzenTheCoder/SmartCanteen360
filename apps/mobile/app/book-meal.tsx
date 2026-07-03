import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { api, apiError } from "@/lib/api";
import { colors } from "@/constants/colors";

interface Schedule {
  id: string;
  serviceDate: string;
  capacity: number | null;
  meal?: { name: string; imageUrl?: string | null } | null;
}

function range() {
  const from = new Date().toISOString().slice(0, 10);
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 14);
  return { from, to: toDate.toISOString().slice(0, 10) };
}

export default function BookMealScreen() {
  const { from, to } = range();
  const { data, isLoading } = useApiList<Schedule>("book-schedules", `/meal-schedules?from=${from}&to=${to}`);
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();

  const book = async (scheduleId: string) => {
    setBusy(scheduleId);
    try {
      await api.post("/bookings", { scheduleId });
      await qc.invalidateQueries({ queryKey: ["my-bookings"] });
      Alert.alert("Booked", "Your meal has been booked.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Could not book", apiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title="Book a Meal" subtitle="Next 14 days">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No meals scheduled yet. Check back soon." />
      ) : (
        <View className="gap-3">
          {(data ?? []).map((s) => (
            <Card key={s.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{s.meal?.name ?? "Meal"}</Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {new Date(s.serviceDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {s.capacity != null ? ` · ${s.capacity} left` : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  className="rounded-lg px-4 py-2"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => book(s.id)}
                  disabled={busy === s.id}
                >
                  {busy === s.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="font-semibold text-white">Book</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
