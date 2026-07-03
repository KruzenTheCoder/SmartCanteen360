import React from "react";
import { ScrollView, Text, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Consistent screen chrome: safe area, optional title header and scroll. */
export function Screen({
  children,
  title,
  subtitle,
  scroll = true,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const header = title ? (
    <View className="px-5 pb-2 pt-2">
      <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text> : null}
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-5 pt-2">{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>{children}</View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-16">
      <Text className="text-center text-sm text-gray-400">{message}</Text>
    </View>
  );
}
