// TODO: pnpm add expo-notifications expo-device --filter finmy-mobile
// Push notification registration helpers

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "@/lib/api-client";

const PUSH_TOKEN_KEY = "expo_push_token";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permissions and get the Expo push token.
// Returns null if running on simulator/emulator or permissions denied.
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't receive push

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C8911A",
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenData.data;

  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return token;
}

// Send the token to the finmy API. Fails silently — does not block app startup.
export async function syncPushTokenWithServer(token: string): Promise<void> {
  try {
    await apiFetch("/api/push-tokens", {
      method: "POST",
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch (err) {
    console.warn("[notifications] Failed to sync push token:", err);
  }
}

// Get the cached token from SecureStore (set during a previous session).
export async function getCachedPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}
