import test from "node:test";
import { equal, ok, strictEqual } from "node:assert/strict";
import { buildAreaPath, buildLinePath, barWidth, scaleSeries } from "../src/domain/charts";

test("scales and renders chart paths", () => {
  const points = scaleSeries([0, 10, 5], 100, 50, 10);
  strictEqual(points.length, 3);
  ok(points[1].y < points[2].y);
  const line = buildLinePath(points);
  ok(line.startsWith("M "));
  const area = buildAreaPath(points, 50);
  ok(area.endsWith("Z"));
});

test("computes chart bar width", () => {
  equal(barWidth(380, 4), 89);
});
