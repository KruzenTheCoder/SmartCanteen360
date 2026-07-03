import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";

import { Screen, Card, EmptyState } from "@/components/screen";
import { useApiResource } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors } from "@/constants/colors";

interface Me {
  employee?: { id: string; wallet?: { balance: number } | null } | null;
}
interface Txn {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
}

const zar = (n: number) => `R ${Number(n).toFixed(2)}`;
const isCredit = (t: string) => !["DEBIT"].includes(t);

export default function WalletScreen() {
  const { data: me } = useApiResource<Me>("me", "/auth/me");
  const employeeId = me?.employee?.id;

  const { data: txns, isLoading } = useQuery<Txn[]>({
    queryKey: ["wallet-txns", employeeId],
    enabled: !!employeeId,
    queryFn: async () => (await api.get<Txn[]>(`/wallet/${employeeId}/transactions`)).data,
  });

  return (
    <Screen title="Wallet">
      <View className="mb-4 rounded-2xl p-6" style={{ backgroundColor: colors.primary }}>
        <Text className="text-sm text-white/80">Available balance</Text>
        <Text className="mt-1 text-3xl font-bold text-white">
          {zar(me?.employee?.wallet?.balance ?? 0)}
        </Text>
      </View>

      <Text className="mb-2 text-base font-semibold text-gray-900">Transactions</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} className="mt-6" />
      ) : (txns ?? []).length === 0 ? (
        <EmptyState message="No transactions yet." />
      ) : (
        <View className="gap-2">
          {(txns ?? []).map((t) => {
            const credit = isCredit(t.type);
            return (
              <Card key={t.id}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: (credit ? colors.success : colors.danger) + "22" }}
                  >
                    {credit ? (
                      <ArrowDownLeft size={18} color={colors.success} />
                    ) : (
                      <ArrowUpRight size={18} color={colors.danger} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{t.description ?? t.type}</Text>
                    <Text className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text className="font-semibold" style={{ color: credit ? colors.success : colors.danger }}>
                    {credit ? "+" : "-"}
                    {zar(t.amount)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
