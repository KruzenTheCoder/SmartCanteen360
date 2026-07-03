import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SvgXml } from "react-native-svg";
import QRCode from "qrcode";

import { Screen, Card } from "@/components/screen";
import { useApiResource } from "@/lib/hooks";
import { colors } from "@/constants/colors";

interface Me {
  firstName: string;
  lastName: string;
  employee?: {
    employeeNumber: string;
    department?: { name: string } | null;
    qrCard?: { code: string; isActive: boolean } | null;
  } | null;
}

export default function QrCardScreen() {
  const { data: me } = useApiResource<Me>("me", "/auth/me");
  const [svg, setSvg] = useState<string | null>(null);

  const code = me?.employee?.qrCard?.code ?? me?.employee?.employeeNumber ?? "";

  useEffect(() => {
    if (!code) return;
    QRCode.toString(code, { type: "svg", margin: 1, width: 220 })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, [code]);

  return (
    <Screen title="My Card" subtitle="Scan at the till to pay or collect">
      <Card className="mt-2 items-center py-8">
        <View className="mb-6 items-center">
          <Text className="text-lg font-bold text-gray-900">
            {me?.firstName} {me?.lastName}
          </Text>
          <Text className="text-sm text-gray-500">
            {me?.employee?.employeeNumber} · {me?.employee?.department?.name ?? "—"}
          </Text>
        </View>

        <View className="rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: colors.gray[200] }}>
          {svg ? (
            <SvgXml xml={svg} width={220} height={220} />
          ) : (
            <View className="h-[220px] w-[220px] items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        <Text className="mt-6 text-center text-xs text-gray-400">
          This code identifies you securely for wallet, loyalty and meal collection.
        </Text>
      </Card>
    </Screen>
  );
}
