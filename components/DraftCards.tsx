import React from "react";
import { Pressable, Text, View } from "react-native";

export function DraftCards(props: {
  drafts: Array<{ id: string; title: string; notes?: string; targetAmount: number; installmentCount: number; category: string; isLoan: boolean }>;
  onApply(draftId: string): void;
  onLoanLog(): void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
        Recurring Monthly Draft Templates
      </Text>
      {props.drafts.map((draft) => (
        <View
          key={draft.id}
          style={{
            backgroundColor: "#1C2433",
            borderWidth: 1,
            borderColor: "#222C3D",
            borderRadius: 10,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 13, fontWeight: "600" }}>{draft.title}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              {draft.installmentCount} items, {draft.notes ?? draft.category}
            </Text>
          </View>
          <Pressable
            onPress={draft.isLoan ? props.onLoanLog : () => props.onApply(draft.id)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: draft.isLoan ? "#141A24" : "#10B981",
              borderWidth: 1,
              borderColor: draft.isLoan ? "#222C3D" : "#10B981"
            }}
          >
            <Text style={{ color: draft.isLoan ? "#F8FAFC" : "#0B0F17", fontSize: 11, fontWeight: "700" }}>
              {draft.isLoan ? "Log $400" : "Apply Draft"}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
