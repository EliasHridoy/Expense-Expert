import React from "react";
import { Text, View } from "react-native";

export function CategoryBreakdown(props: { categories: Array<{ name: string; amount: number; color: string }>; total: number }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
          Category Breakdown
        </Text>
        <Text style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 10 }}>THIS MONTH</Text>
      </View>
      <View style={{ gap: 10 }}>
        {props.categories.map((category) => {
          const ratio = props.total === 0 ? 0 : (category.amount / props.total) * 100;
          return (
            <View key={category.name} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: category.color }} />
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>{category.name}</Text>
                </View>
                <Text style={{ color: "#F8FAFC", fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: "600" }}>
                  ${category.amount.toFixed(2)} ({ratio.toFixed(1)}%)
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "#1C2433" }}>
                <View style={{ height: "100%", width: `${ratio}%`, backgroundColor: category.color }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
