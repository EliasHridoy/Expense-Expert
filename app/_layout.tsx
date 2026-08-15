import "../app/global.css";
import React, { useEffect, useState } from "react";
import { AppState, Platform, View } from "react-native";
import { Stack, router, useRootNavigationState } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { TelemetryHeader } from "../components/TelemetryHeader";
import { BiometricOverlay } from "../components/BiometricOverlay";
import { useLedgerStore } from "../src/store/ledger-store";
import { shouldPromptForBiometric } from "../src/security/biometric";

export default function RootLayout() {
  const navigationState = useRootNavigationState();
  const authenticated = useLedgerStore((state) => state.authenticated);
  const biometricEnabled = useLedgerStore((state) => state.biometricEnabled);
  const hydrated = useLedgerStore((state) => state._hasHydrated);
  const [locked, setLocked] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }
    if (!authenticated) {
      router.replace("/login");
      return;
    }
    router.replace("/dashboard");
  }, [authenticated, navigationState?.key]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      const previous = AppState.currentState;
      const shouldLock = shouldPromptForBiometric(previous, nextState, { hasHardware: true, isEnrolled: true }, biometricEnabled);
      if (shouldLock) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to resume Expense Expert"
        });
        setLocked(!result.success);
      }
    });
    return () => subscription.remove();
  }, [biometricEnabled]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F17" }}>
      <TelemetryHeader
        online={online}
        hydrated={hydrated}
        biometricEnabled={biometricEnabled}
        accountLabel={`Platform ${Platform.OS}`}
        onToggleOnline={() => setOnline((value) => !value)}
        onToggleBiometric={() => useLedgerStore.getState().setBiometricEnabled(!biometricEnabled)}
        onAddExpense={() => router.push("/dashboard")}
        onApplyDraft={() => router.push("/dashboard")}
        onPdfExport={() => router.push("/dashboard")}
        onLock={() => setLocked(true)}
      />
      <Stack screenOptions={{ headerShown: false }} />
      <BiometricOverlay locked={locked} onAuthenticate={() => setLocked(false)} />
    </View>
  );
}
