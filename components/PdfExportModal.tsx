import React from "react";
import { Pressable, Text, View } from "react-native";
import { ModalFrame } from "./ModalFrame";

export function PdfExportModal(props: {
  visible: boolean;
  previewHtml: string;
  onClose(): void;
  onExport(): void;
}) {
  return (
    <ModalFrame visible={props.visible} title="Generate Cross-Platform PDF Statement" maxWidth={620} onClose={props.onClose}>
      <View style={{ backgroundColor: "#0B0F17", borderWidth: 1, borderColor: "#222C3D", borderRadius: 10, padding: 16, gap: 6 }}>
        <Text style={{ color: "#10B981", fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: "700" }}>
          STATEMENT PREVIEW - EXPENSE EXPERT AUDIT
        </Text>
        <Text style={{ color: "#F8FAFC", fontFamily: "JetBrains Mono", fontSize: 11 }}>Preview generated from current hydrated ledger state.</Text>
        <Text style={{ color: "#94A3B8", fontFamily: "JetBrains Mono", fontSize: 11 }} numberOfLines={5}>
          {props.previewHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
        </Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#64748B", fontSize: 11 }}>Uses expo-print & web fallback printing</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={props.onClose} style={{ paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#222C3D", borderRadius: 6 }}>
            <Text style={{ color: "#F8FAFC", fontSize: 12, fontWeight: "600" }}>Close</Text>
          </Pressable>
          <Pressable onPress={props.onExport} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#10B981", borderRadius: 6 }}>
            <Text style={{ color: "#0B0F17", fontSize: 12, fontWeight: "700" }}>Download Statement PDF</Text>
          </Pressable>
        </View>
      </View>
    </ModalFrame>
  );
}
