import React, { useEffect } from "react";
import { View } from "react-native";
import { Redirect, router, useRootNavigationState } from "expo-router";
import { useLedgerStore } from "../src/store/ledger-store";

export default function IndexRoute() {
  const navigationState = useRootNavigationState();
  const authenticated = useLedgerStore((state) => state.authenticated);

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }
    router.replace(authenticated ? "/dashboard" : "/login");
  }, [authenticated, navigationState?.key]);

  return <Redirect href={authenticated ? "/dashboard" : "/login"} />;
}
