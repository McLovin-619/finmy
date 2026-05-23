import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, router, useRootNavigationState, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { registerPushToken, syncPushTokenWithServer } from "@/lib/notifications";
import "../global.css";

if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 0 : 0.2,
  });
}

SplashScreen.preventAutoHideAsync();

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const segments = useSegments();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavState?.key) return;
    if (state.status === "loading") return;

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = state.status === "authenticated";
    const onboardingComplete = isAuthenticated && state.onboardingComplete;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(onboardingComplete ? "/" : ("/onboarding" as any));
    }
  }, [state, segments, rootNavState]);

  useEffect(() => {
    if (state.status !== "authenticated" || !rootNavState?.key) return;
    (async () => {
      try {
        const token = await registerPushToken();
        if (token) await syncPushTokenWithServer(token);
      } catch {
        // never block startup
      }
    })();
  }, [state.status, rootNavState?.key]);

  return <>{children}</>;
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="transactions" />
                <Stack.Screen name="transaction/[id]" />
                <Stack.Screen name="fund/[id]" />
                <Stack.Screen name="send" options={{ presentation: "modal" }} />
                <Stack.Screen name="request" options={{ presentation: "modal" }} />
                <Stack.Screen name="top-up" options={{ presentation: "modal" }} />
                <Stack.Screen name="subscriptions" />
                <Stack.Screen name="bills" />
                <Stack.Screen name="investments" />
                <Stack.Screen name="cards" />
                <Stack.Screen name="allowances" />
                <Stack.Screen name="loyalty" />
                <Stack.Screen name="stocks" />
                <Stack.Screen name="stocks/[symbol]" />
                <Stack.Screen name="reports" />
                <Stack.Screen name="store" />
                <Stack.Screen name="deals" />
              </Stack>
              <StatusBar style="auto" />
            </NavigationGuard>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
