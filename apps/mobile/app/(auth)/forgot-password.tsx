import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, MailCheck } from "lucide-react-native";

import { api, apiError } from "@/lib/api";
import { colors } from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (e) {
      // Do not reveal whether the account exists.
      setSent(true);
      void apiError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity className="mt-2 flex-row items-center" onPress={() => router.back()}>
        <ArrowLeft size={20} color={colors.gray[600]} />
        <Text className="ml-1 text-gray-600">Back</Text>
      </TouchableOpacity>

      <View className="mt-10">
        <Text className="text-2xl font-bold text-gray-900">Reset password</Text>
        <Text className="mt-1 text-sm text-gray-500">
          {sent
            ? "If an account exists for that email, we've sent a reset link."
            : "Enter your email and we'll send you a reset link."}
        </Text>
      </View>

      {!sent ? (
        <View className="mt-6 space-y-4">
          <TextInput
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
          <TouchableOpacity
            className="w-full items-center rounded-lg py-4"
            style={{ backgroundColor: colors.primary }}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-white">Send reset link</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-10 items-center">
          <MailCheck size={48} color={colors.success} />
          <TouchableOpacity className="mt-6" onPress={() => router.replace("/(auth)/login")}>
            <Text className="font-medium" style={{ color: colors.primary }}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
