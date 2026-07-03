import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Bell } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export default function NotificationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useApiList<Notification>("notifications", "/notifications");

  return (
    <Screen title="Notifications" onRefresh={refetch} refreshing={isRefetching}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="You're all caught up." />
      ) : (
        <View className="gap-2">
          {(data ?? []).map((n) => (
            <Card key={n.id} className={n.readAt ? "opacity-70" : ""}>
              <View className="flex-row gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.gray[100] }}>
                  <Bell size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{n.title}</Text>
                  <Text className="text-sm text-gray-600">{n.body}</Text>
                  <Text className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
