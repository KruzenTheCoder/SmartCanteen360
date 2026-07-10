import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Utensils } from "lucide-react-native";

import { useAuthStore } from "@/store/auth-store";
import { colors } from "@/constants/colors";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.replace("/(tabs)");
    } catch (error) {
      // Error is handled in the store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Logo */}
            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary }}
              >
                <Utensils size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                NetBite360
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Employee Mobile App
              </Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Password
                </Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View className="relative">
                      <TextInput
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 pr-12"
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        value={value}
                        onChangeText={onChange}
                      />
                      <TouchableOpacity
                        className="absolute right-3 top-3"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={colors.gray[400]} />
                        ) : (
                          <Eye size={20} color={colors.gray[400]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="self-end"
                onPress={() => router.push("/forgot-password")}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.primary }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full py-4 rounded-lg items-center mt-4"
                style={{ backgroundColor: colors.primary }}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
