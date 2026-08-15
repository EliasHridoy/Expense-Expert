import test from "node:test";
import { equal, ok } from "node:assert/strict";
import { lockState, shouldPromptForBiometric, unlockState } from "../src/security/biometric";

test("prompts only on foreground resume with biometric support", () => {
  ok(shouldPromptForBiometric("background", "active", { hasHardware: true, isEnrolled: true }, true));
  ok(!shouldPromptForBiometric("active", "background", { hasHardware: true, isEnrolled: true }, true));
  ok(!shouldPromptForBiometric("background", "active", { hasHardware: false, isEnrolled: true }, true));
});

test("locks and unlocks state", () => {
  equal(lockState().locked, true);
  equal(unlockState("2026-08-15T00:00:00.000Z").locked, false);
});
