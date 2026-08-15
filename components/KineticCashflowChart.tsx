import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { buildAreaPath, buildLinePath, scaleSeries } from "../src/domain/charts";

export interface CashflowSeriesPoint {
  label: string;
  income: number;
  expense: number;
}

export function KineticCashflowChart(props: { period: "monthly" | "quarterly"; points: CashflowSeriesPoint[] }) {
  const values = props.points.map((point) => point.income - point.expense);
  const scaled = scaleSeries(values, 380, 180);
  const path = buildLinePath(scaled);
  const area = buildAreaPath(scaled, 180);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#F8FAFC", fontSize: 15, fontWeight: "700" }}>Cashflow Telemetry</Text>
        <Text style={{ color: "#3B82F6", fontFamily: "JetBrains Mono", fontSize: 10, borderWidth: 1, borderColor: "#222C3D", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
          {props.period.toUpperCase()}
        </Text>
      </View>
      <View style={{ width: "100%", height: 200 }}>
        <Svg width="100%" height="100%" viewBox="0 0 380 180">
          <Line x1="0" y1="30" x2="380" y2="30" stroke="#222C3D" strokeDasharray="3 3" />
          <Line x1="0" y1="80" x2="380" y2="80" stroke="#222C3D" strokeDasharray="3 3" />
          <Line x1="0" y1="130" x2="380" y2="130" stroke="#222C3D" strokeDasharray="3 3" />
          <Path d={area} fill="rgba(16,185,129,0.08)" />
          <Path d={path} fill="none" stroke="#10B981" strokeWidth="2.5" />
          {scaled.map((point, index) => (
            <Circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="4" fill="#10B981" stroke="#0B0F17" strokeWidth="2" />
          ))}
        </Svg>
      </View>
    </View>
  );
}
