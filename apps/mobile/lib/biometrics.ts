import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const ENABLED_KEY = "biometric_enabled";

export type BiometricType = "faceid" | "fingerprint" | null;

export async function getBiometricType(): Promise<BiometricType> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return null;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return null;
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "faceid";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "fingerprint";
  return null;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(ENABLED_KEY);
  return val === "true";
}

export async function enableBiometrics(): Promise<void> {
  await SecureStore.setItemAsync(ENABLED_KEY, "true");
}

export async function disableBiometrics(): Promise<void> {
  await SecureStore.deleteItemAsync(ENABLED_KEY);
}

export async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to finmy",
    cancelLabel: "Use password",
    disableDeviceFallback: false,
  });
  return result.success;
}
