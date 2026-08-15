import type { DashboardSnapshot } from "../domain/types";
import { buildStatementHtml } from "../domain/finance";

export interface PdfExportResult {
  mode: "print" | "share" | "download";
  uri?: string;
}

export function buildMonthlyStatementHtml(snapshot: DashboardSnapshot, month: string): string {
  return buildStatementHtml(snapshot, month);
}

export async function exportMonthlyStatement(
  snapshot: DashboardSnapshot,
  month: string,
  platform: "web" | "ios" | "android" = "web",
  deps: {
    printAsync?: (options: { html: string }) => Promise<void>;
    printToFileAsync?: (options: { html: string }) => Promise<{ uri: string }>;
    isSharingAvailable?: () => Promise<boolean>;
    shareAsync?: (uri: string) => Promise<void>;
  } = {}
): Promise<PdfExportResult> {
  const html = buildMonthlyStatementHtml(snapshot, month);
  if (platform === "web") {
    const printAsync = deps.printAsync ?? (async () => undefined);
    await printAsync({ html });
    return { mode: "print" };
  }

  const printToFileAsync = deps.printToFileAsync ?? (async () => ({ uri: "file://statement.pdf" }));
  const isSharingAvailable = deps.isSharingAvailable ?? (async () => false);
  const shareAsync = deps.shareAsync ?? (async () => undefined);
  const file = await printToFileAsync({ html });
  if (await isSharingAvailable()) {
    await shareAsync(file.uri);
    return { mode: "share", uri: file.uri };
  }
  return { mode: "download", uri: file.uri };
}
