export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
}

export function shouldPromptForBiometric(previousState: string | null, nextState: string, capabilities: BiometricCapabilities, biometricEnabled: boolean): boolean {
  if (!biometricEnabled) {
    return false;
  }
  if (!capabilities.hasHardware || !capabilities.isEnrolled) {
    return false;
  }
  return previousState === "background" && nextState === "active";
}

export interface LockState {
  locked: boolean;
  authenticatedAt?: string;
}

export function unlockState(now: string): LockState {
  return {
    locked: false,
    authenticatedAt: now
  };
}

export function lockState(): LockState {
  return { locked: true };
}
