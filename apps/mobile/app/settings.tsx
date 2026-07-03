import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { LogOut } from "lucide-react-native";

import { Screen, Card } from "@/components/screen";
import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";

function Row({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-3 py-3">
      <Text className="text-gray-800">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.gray[300] }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [push, setPush] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [promos, setPromos] = useState(false);

  return (
    <Screen title="Settings">
      <Text className="mb-2 text-xs font-semibold uppercase text-gray-400">Notifications</Text>
      <Card className="mb-4 p-1">
        <Row label="Push notifications" value={push} onValueChange={setPush} />
        <View className="h-px bg-gray-100" />
        <Row label="Booking reminders" value={reminders} onValueChange={setReminders} />
        <View className="h-px bg-gray-100" />
        <Row label="Promotions" value={promos} onValueChange={setPromos} />
      </Card>

      <Text className="mb-2 text-xs font-semibold uppercase text-gray-400">About</Text>
      <Card className="mb-4 gap-2 p-4">
        <View className="flex-row justify-between">
          <Text className="text-gray-500">Version</Text>
          <Text className="text-gray-800">0.1.0</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-500">App</Text>
          <Text className="text-gray-800">SmartCanteen 360</Text>
        </View>
      </Card>

      <TouchableOpacity
        className="flex-row items-center justify-center gap-2 rounded-xl border py-3"
        style={{ borderColor: colors.danger }}
        onPress={logout}
      >
        <LogOut size={18} color={colors.danger} />
        <Text className="font-semibold" style={{ color: colors.danger }}>
          Sign out
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
