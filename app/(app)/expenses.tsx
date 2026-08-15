import React from "react";
import { View, Text } from "react-native";

export default function ExpensesRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F17", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#F8FAFC" }}>Expense CRUD lives in the dashboard ledger and modal flow.</Text>
    </View>
  );
}
