import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Plus, Minus, ShoppingBag } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiList, useApiResource } from "@/lib/hooks";
import { api, apiError } from "@/lib/api";
import { colors } from "@/constants/colors";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}
interface Me {
  employee?: { id: string } | null;
}

const zar = (n: number) => `R ${Number(n).toFixed(2)}`;

export default function ShopScreen() {
  const { data: products, isLoading, refetch, isRefetching } = useApiList<Product>("shop", "/pos/products");
  const { data: me } = useApiResource<Me>("me", "/auth/me");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const items = products ?? [];
  const qty = (id: string) => cart[id] ?? 0;
  const change = (id: string, d: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + d);
      const updated = { ...c, [id]: next };
      if (next === 0) delete updated[id];
      return updated;
    });

  const total = items.reduce((sum, p) => sum + p.price * qty(p.id), 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const checkout = async () => {
    if (count === 0 || !me?.employee?.id) return;
    setSubmitting(true);
    try {
      await api.post("/pos/checkout", {
        employeeId: me.employee.id,
        method: "WALLET",
        items: items
          .filter((p) => qty(p.id) > 0)
          .map((p) => ({ retailProductId: p.id, label: p.name, quantity: qty(p.id), unitPrice: p.price })),
      });
      Alert.alert("Paid", `Charged ${zar(total)} to your wallet.`);
      setCart({});
    } catch (e) {
      Alert.alert("Payment failed", apiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Shop" subtitle="Snacks, drinks and more" onRefresh={refetch} refreshing={isRefetching} scroll={false}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-10" />
      ) : items.length === 0 ? (
        <EmptyState message="No products available right now." />
      ) : (
        <View className="flex-1">
          <View className="gap-3 pb-28 pt-2">
            {items.map((p) => (
              <Card key={p.id}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{p.name}</Text>
                    <Text className="text-xs text-gray-500">{p.category}</Text>
                    <Text className="mt-1 font-bold text-gray-900">{zar(p.price)}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    {qty(p.id) > 0 ? (
                      <>
                        <TouchableOpacity onPress={() => change(p.id, -1)} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <Minus size={16} color={colors.gray[700]} />
                        </TouchableOpacity>
                        <Text className="w-4 text-center">{qty(p.id)}</Text>
                      </>
                    ) : null}
                    <TouchableOpacity onPress={() => change(p.id, 1)} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
                      <Plus size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {count > 0 ? (
            <View className="absolute bottom-4 left-0 right-0">
              <TouchableOpacity
                className="flex-row items-center justify-between rounded-2xl px-5 py-4"
                style={{ backgroundColor: colors.primary }}
                onPress={checkout}
                disabled={submitting}
              >
                <View className="flex-row items-center gap-2">
                  <ShoppingBag size={18} color="white" />
                  <Text className="font-semibold text-white">{count} item{count > 1 ? "s" : ""}</Text>
                </View>
                <Text className="font-semibold text-white">
                  {submitting ? "Paying…" : `Pay ${zar(total)}`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
