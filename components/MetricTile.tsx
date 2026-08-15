import React from "react";
import { Text, View } from "react-native";

export interface MetricTileProps {
  label: string;
  value: string;
  tag: string;
  delta: string;
  note: string;
  tone: "positive" | "negative" | "accent" | "info";
}

const toneMap: Record<MetricTileProps["tone"], string> = {
  positive: "#10B981",
  negative: "#F43F5E",
  accent: "#F59E0B",
  info: "#3B82F6"
};

export function MetricTile(props: MetricTileProps) {
  return (
    <View
      style={{
        backgroundColor: "#141A24",
        borderWidth: 1,
        borderColor: "#222C3D",
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 8,
        position: "relative"
      }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: toneMap[props.tone] }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "600", textTransform: "uppercase" }}>{props.label}</Text>
        <Text style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 10 }}>{props.tag}</Text>
      </View>
      <Text style={{ color: "#F8FAFC", fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: "700" }}>{props.value}</Text>
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <Text style={{ color: toneMap[props.tone], fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: "700" }}>
          {props.delta}
        </Text>
        <Text style={{ color: "#64748B", fontSize: 11 }}>{props.note}</Text>
      </View>
    </View>
  );
}
