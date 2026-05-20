import { getStoredToken } from "@/lib/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getStoredToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
