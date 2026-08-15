import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AuthForm } from "../../components/AuthForm";
import { useLedgerStore } from "../../src/store/ledger-store";

export default function LoginScreen() {
  const setAuthenticated = useLedgerStore((state) => state.setAuthenticated);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0B0F17" }}>
      <AuthForm
        mode="login"
        onSubmit={async () => {
          setAuthenticated(true);
          router.replace("/dashboard");
        }}
      />
    </View>
  );
}
