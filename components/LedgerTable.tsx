import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export interface LedgerRow {
  id: string;
  date: string;
  title: string;
  category: string;
  type: string;
  amount: number;
}

export function LedgerTable(props: {
  rows: LedgerRow[];
  search: string;
  category: string;
  onSearchChange(value: string): void;
  onCategoryChange(value: string): void;
  onEdit(id: string): void;
  onDelete(id: string): void;
}) {
  const filterButton = (label: string, value: string) => (
    <Pressable
      onPress={() => props.onCategoryChange(value)}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: props.category === value ? "#1C2433" : "#0B0F17"
      }}
    >
      <Text style={{ color: "#F8FAFC", fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <TextInput
            value={props.search}
            onChangeText={props.onSearchChange}
            placeholder="Search transactions, categories, tags..."
            placeholderTextColor="#64748B"
            style={{
              backgroundColor: "#0B0F17",
              borderWidth: 1,
              borderColor: "#222C3D",
              borderRadius: 6,
              color: "#F8FAFC",
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 12
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {filterButton("All", "ALL")}
          {filterButton("Housing", "Housing")}
          {filterButton("Infra", "Infra")}
          {filterButton("Loans", "Loan")}
        </View>
      </View>
      <View style={{ borderWidth: 1, borderColor: "#222C3D", borderRadius: 10, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", backgroundColor: "#0B0F17", paddingVertical: 10, paddingHorizontal: 12 }}>
          <Text style={{ flex: 1, color: "#64748B", fontSize: 11, fontWeight: "700" }}>Date</Text>
          <Text style={{ flex: 2, color: "#64748B", fontSize: 11, fontWeight: "700" }}>Description / Payee</Text>
          <Text style={{ flex: 1, color: "#64748B", fontSize: 11, fontWeight: "700" }}>Category</Text>
          <Text style={{ flex: 1, color: "#64748B", fontSize: 11, fontWeight: "700" }}>Type</Text>
          <Text style={{ flex: 1, color: "#64748B", fontSize: 11, fontWeight: "700", textAlign: "right" }}>Amount</Text>
          <Text style={{ width: 96, color: "#64748B", fontSize: 11, fontWeight: "700", textAlign: "center" }}>Action</Text>
        </View>
        {props.rows.map((row) => (
          <View
            key={row.id}
            style={{
              flexDirection: "row",
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderTopWidth: 1,
              borderTopColor: "#222C3D",
              alignItems: "center"
            }}
          >
            <Text style={{ flex: 1, color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 11 }}>{row.date}</Text>
            <Text style={{ flex: 2, color: "#F8FAFC", fontSize: 12, fontWeight: "600" }}>{row.title}</Text>
            <Text style={{ flex: 1, color: "#94A3B8", fontSize: 11 }}>{row.category}</Text>
            <Text style={{ flex: 1, color: "#F8FAFC", fontSize: 11 }}>{row.type}</Text>
            <Text
              style={{
                flex: 1,
                color: row.type === "INCOME" ? "#10B981" : row.type === "LOAN" ? "#F59E0B" : "#F43F5E",
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                fontWeight: "700",
                textAlign: "right"
              }}
            >
              {row.type === "INCOME" ? "+" : "-"}${row.amount.toFixed(2)}
            </Text>
            <View style={{ width: 96, flexDirection: "row", justifyContent: "center", gap: 6 }}>
              <Pressable onPress={() => props.onEdit(row.id)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#222C3D", borderRadius: 4 }}>
                <Text style={{ color: "#F8FAFC", fontSize: 10 }}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => props.onDelete(row.id)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(244,63,94,0.3)", borderRadius: 4, backgroundColor: "rgba(244,63,94,0.1)" }}>
                <Text style={{ color: "#F43F5E", fontSize: 10 }}>Del</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
