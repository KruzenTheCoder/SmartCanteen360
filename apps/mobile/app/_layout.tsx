import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function useProtectedRoute() {
  const { user, isBootstrapping } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, segments, isBootstrapping, router]);
}

function RootNavigator() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useProtectedRoute();

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.gray[50] } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book-meal" options={{ presentation: "modal", headerShown: true, title: "Book a Meal" }} />
      <Stack.Screen name="meal-history" options={{ headerShown: true, title: "Meal History" }} />
      <Stack.Screen name="wallet" options={{ headerShown: true, title: "Wallet" }} />
      <Stack.Screen name="loyalty" options={{ headerShown: true, title: "Loyalty" }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications" }} />
      <Stack.Screen name="nutrition" options={{ headerShown: true, title: "Nutrition" }} />
      <Stack.Screen name="favourites" options={{ headerShown: true, title: "Favourite Meals" }} />
      <Stack.Screen name="promotions" options={{ headerShown: true, title: "Promotions" }} />
      <Stack.Screen name="competition" options={{ headerShown: true, title: "Competition" }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
