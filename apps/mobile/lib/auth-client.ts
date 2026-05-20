import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

// Token key in SecureStore
const TOKEN_KEY = "finmy_session_token";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
  fetchOptions: {
    // Attach stored bearer token on every request
    onRequest: async (ctx) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
    // Persist the token returned by sign-in / sign-up
    onResponse: async (ctx) => {
      const setCookie = ctx.response.headers.get("set-cookie");
      if (!setCookie) return;
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match?.[1]) {
        await SecureStore.setItemAsync(TOKEN_KEY, match[1]);
      }
    },
  },
});

export async function clearStoredToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
