import { buildMonthlyStatementHtml } from "../lib/pdf";
import type { DashboardSnapshot } from "./types";

export function previewStatement(snapshot: DashboardSnapshot, month: string): string {
  return buildMonthlyStatementHtml(snapshot, month);
}
