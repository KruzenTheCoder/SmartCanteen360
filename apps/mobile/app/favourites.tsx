import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Heart } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Meal {
  id: string;
  name: string;
  retailPrice: number;
  category?: { name: string } | null;
}

/**
 * Favourites: until per-user favourites are persisted server-side, this shows
 * the published meal catalogue with a favourite affordance.
 */
export default function FavouritesScreen() {
  const { data, isLoading } = useApiList<Meal>("fav-meals", "/meals");

  return (
    <Screen title="Favourite Meals">
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="Your favourite meals will appear here." />
      ) : (
        <View className="gap-3">
          {(data ?? []).map((m) => (
            <Card key={m.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{m.name}</Text>
                  <Text className="text-xs text-gray-500">{m.category?.name ?? "Meal"}</Text>
                </View>
                <Heart size={20} color={colors.danger} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
