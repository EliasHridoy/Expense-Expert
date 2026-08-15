import React from "react";
import { View, Text } from "react-native";

export default function SavingsRoute() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F17", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#F8FAFC" }}>Savings goals and bank accounts are represented in the hydrated store.</Text>
    </View>
  );
}
