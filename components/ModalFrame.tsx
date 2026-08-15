import React, { type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export function ModalFrame(props: {
  visible: boolean;
  title: string;
  maxWidth?: number;
  children?: ReactNode;
  onClose(): void;
}) {
  return (
    <Modal transparent visible={props.visible} animationType="fade" onRequestClose={props.onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(11,15,23,0.85)",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: props.maxWidth ?? 520,
            backgroundColor: "#141A24",
            borderWidth: 1,
            borderColor: "#222C3D",
            borderRadius: 14,
            padding: 20,
            gap: 18
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#F8FAFC", fontSize: 16, fontWeight: "700" }}>{props.title}</Text>
            <Pressable onPress={props.onClose}>
              <Text style={{ color: "#94A3B8", fontSize: 20 }}>×</Text>
            </Pressable>
          </View>
          {props.children}
        </View>
      </View>
    </Modal>
  );
}
