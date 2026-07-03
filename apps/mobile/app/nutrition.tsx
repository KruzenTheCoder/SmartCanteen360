import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Meal {
  id: string;
  name: string;
  nutrition?: { calories: number; protein: number; carbs: number; fat: number } | null;
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View className="items-center">
      <Text className="text-sm font-bold text-gray-900">
        {Math.round(Number(value))}
        {unit}
      </Text>
      <Text className="text-[10px] uppercase text-gray-400">{label}</Text>
    </View>
  );
}

export default function NutritionScreen() {
  const { data, isLoading } = useApiList<Meal>("meals-nutrition", "/meals");

  return (
    <Screen title="Nutrition" subtitle="Macros per meal">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No meals to show yet." />
      ) : (
        <View className="gap-3">
          {(data ?? []).map((m) => (
            <Card key={m.id}>
              <Text className="mb-3 font-semibold text-gray-900">{m.name}</Text>
              <View className="flex-row justify-between">
                <Macro label="kcal" value={m.nutrition?.calories ?? 0} unit="" />
                <Macro label="protein" value={m.nutrition?.protein ?? 0} unit="g" />
                <Macro label="carbs" value={m.nutrition?.carbs ?? 0} unit="g" />
                <Macro label="fat" value={m.nutrition?.fat ?? 0} unit="g" />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
