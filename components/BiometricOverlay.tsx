import React from "react";
import { Pressable, Text, View } from "react-native";

export function BiometricOverlay(props: { locked: boolean; onAuthenticate(): void }) {
  if (!props.locked) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0B0F17",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        zIndex: 50
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#10B981",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#141A24"
        }}
      >
        <Text style={{ color: "#10B981", fontSize: 32 }}>🔐</Text>
      </View>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Text style={{ color: "#F8FAFC", fontSize: 20, fontWeight: "800" }}>Expense Expert Secured</Text>
        <Text style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", maxWidth: 320 }}>
          AppState shifted to background. Touch ID / Face ID required.
        </Text>
      </View>
      <Pressable
        onPress={props.onAuthenticate}
        style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 6,
          backgroundColor: "#10B981"
        }}
      >
        <Text style={{ color: "#0B0F17", fontWeight: "800" }}>Authenticate with Face ID</Text>
      </Pressable>
    </View>
  );
}
