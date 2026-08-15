import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ModalFrame } from "./ModalFrame";

export interface ExpenseFormValue {
  title: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  date: string;
}

const emptyValue: ExpenseFormValue = {
  title: "",
  description: "",
  amount: "",
  category: "Infra",
  type: "EXPENSE",
  date: new Date().toISOString().slice(0, 10)
};

export function ExpenseFormModal(props: {
  visible: boolean;
  initialValue?: Partial<ExpenseFormValue>;
  title: string;
  onClose(): void;
  onSubmit(value: ExpenseFormValue): void;
}) {
  const [value, setValue] = useState<ExpenseFormValue>(emptyValue);

  useEffect(() => {
    setValue({ ...emptyValue, ...props.initialValue });
  }, [props.initialValue, props.visible]);

  return (
    <ModalFrame visible={props.visible} title={props.title} onClose={props.onClose}>
      <View style={{ gap: 12 }}>
        {[
          ["Title", "title"],
          ["Description", "description"],
          ["Amount", "amount"],
          ["Category", "category"],
          ["Type", "type"],
          ["Date", "date"]
        ].map(([label, key]) => (
          <View key={key} style={{ gap: 6 }}>
            <Text style={{ color: "#94A3B8", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
            <TextInput
              value={value[key as keyof ExpenseFormValue]}
              onChangeText={(next: string) => setValue((current) => ({ ...current, [key]: next }))}
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: "#0B0F17",
                borderWidth: 1,
                borderColor: "#222C3D",
                color: "#F8FAFC",
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10
              }}
            />
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <Pressable onPress={props.onClose} style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#222C3D", borderRadius: 6 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 12, fontWeight: "600" }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={() => props.onSubmit(value)} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#10B981", borderRadius: 6 }}>
            <Text style={{ color: "#0B0F17", fontSize: 12, fontWeight: "700" }}>Commit Transaction</Text>
          </Pressable>
        </View>
      </View>
    </ModalFrame>
  );
}
