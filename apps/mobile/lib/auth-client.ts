import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

// Token key in SecureStore
const TOKEN_KEY = "finmy_session_token";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
  plugins: [emailOTPClient()],
  fetchOptions: {
    // Attach stored bearer token on every request
    onRequest: async (ctx) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
    // Persist the bearer token emitted by Better Auth's bearer plugin
    onResponse: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
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
