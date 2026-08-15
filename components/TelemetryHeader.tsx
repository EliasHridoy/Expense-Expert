import React from "react";
import { Pressable, Text, View } from "react-native";

export interface TelemetryHeaderProps {
  online: boolean;
  hydrated: boolean;
  biometricEnabled: boolean;
  accountLabel: string;
  onToggleOnline(): void;
  onToggleBiometric(): void;
  onAddExpense(): void;
  onApplyDraft(): void;
  onPdfExport(): void;
  onLock(): void;
}

function ActionButton(props: { label: string; tone?: "primary" | "neutral"; onPress(): void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: props.tone === "primary" ? "#10B981" : "#1C2433",
        borderWidth: 1,
        borderColor: props.tone === "primary" ? "#10B981" : "#222C3D"
      }}
    >
      <Text
        style={{
          color: props.tone === "primary" ? "#0B0F17" : "#F8FAFC",
          fontFamily: "Plus Jakarta Sans",
          fontWeight: "700",
          fontSize: 12
        }}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

export function TelemetryHeader(props: TelemetryHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: "#141A24",
        borderBottomWidth: 1,
        borderBottomColor: "#222C3D",
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap"
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: "#10B981",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text style={{ color: "#0B0F17", fontWeight: "800" }}>EE</Text>
        </View>
        <View>
          <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }}>
            EXPENSE EXPERT
          </Text>
          <Text style={{ color: "#3B82F6", fontFamily: "JetBrains Mono", fontSize: 10 }}>
            RN-EXPO v2.4
          </Text>
        </View>
      </View>

      <Pressable
        onPress={props.onToggleOnline}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: props.online ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)",
          backgroundColor: props.online ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)"
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 6,
            backgroundColor: props.online ? "#10B981" : "#F59E0B"
          }}
        />
        <Text style={{ color: props.online ? "#10B981" : "#F59E0B", fontFamily: "JetBrains Mono", fontSize: 11 }}>
          {props.online ? "ONLINE SYNC" : "OFFLINE CACHED"}
        </Text>
        <Text style={{ color: "#64748B", fontSize: 11 }}>{props.hydrated ? "HYDRATED" : "SYNCING"}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Pressable
          onPress={props.onToggleBiometric}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "#222C3D",
            backgroundColor: props.biometricEnabled ? "#1C2433" : "#141A24"
          }}
        >
          <Text style={{ color: "#F8FAFC", fontSize: 12, fontWeight: "600" }}>
            Biometric {props.biometricEnabled ? "On" : "Off"}
          </Text>
        </Pressable>
        <Pressable
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "#222C3D",
            backgroundColor: "#141A24"
          }}
        >
          <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "600" }}>{props.accountLabel}</Text>
        </Pressable>
        <ActionButton label="+ Expense" tone="primary" onPress={props.onAddExpense} />
        <ActionButton label="Apply Draft" onPress={props.onApplyDraft} />
        <ActionButton label="PDF Export" onPress={props.onPdfExport} />
        <ActionButton label="Lock App" onPress={props.onLock} />
      </View>
    </View>
  );
}
