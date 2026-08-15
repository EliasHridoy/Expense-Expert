import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function AuthForm(props: {
  mode: "login" | "register";
  onSubmit(values: { email: string; password: string }): Promise<void> | void;
}) {
  const [email, setEmail] = useState("demo@expense.expert");
  const [password, setPassword] = useState("secret123");

  return (
    <View style={{ gap: 16, maxWidth: 460, width: "100%" }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: "#F8FAFC", fontSize: 32, fontWeight: "800", letterSpacing: -0.8 }}>
          {props.mode === "login" ? "Secure Ledger Access" : "Create New Operator"}
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: 14, lineHeight: 21 }}>
          Sign in to the tactical cashflow workstation with your Firebase email credentials.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
            placeholderTextColor="#64748B"
            style={{
              backgroundColor: "#0B0F17",
              color: "#F8FAFC",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#222C3D",
              paddingHorizontal: 12,
              paddingVertical: 12
            }}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            style={{
              backgroundColor: "#0B0F17",
              color: "#F8FAFC",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#222C3D",
              paddingHorizontal: 12,
              paddingVertical: 12
            }}
          />
        </View>
      </View>
      <Pressable
        onPress={() => props.onSubmit({ email, password })}
        style={{
          backgroundColor: "#10B981",
          paddingVertical: 12,
          borderRadius: 6,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "#0B0F17", fontSize: 13, fontWeight: "800" }}>
          {props.mode === "login" ? "Enter Dashboard" : "Create Operator"}
        </Text>
      </Pressable>
    </View>
  );
}
