import * as LocalAuthentication from "expo-local-authentication";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authClient, clearStoredToken, getStoredToken } from "./auth-client";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User; onboardingComplete: boolean };

type User = {
  id: string;
  name: string;
  email: string | null | undefined;
  image: string | null | undefined;
};

type AuthContext = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  biometricSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  // On mount, check if there's an existing valid session
  useEffect(() => {
    authClient.getSession().then((result) => {
      if (result.data?.user) {
        setState({
          status: "authenticated",
          onboardingComplete: true,
          user: {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            image: result.data.user.image,
          },
        });
      } else {
        setState({ status: "unauthenticated" });
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState({ status: "loading" });
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setState({ status: "unauthenticated" });
      throw new Error(result.error.message ?? "Sign in failed");
    }
    if (!result.data?.user) {
      setState({ status: "unauthenticated" });
      throw new Error("Sign in failed");
    }
    setState({
      status: "authenticated",
      onboardingComplete: true,
      user: {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        image: result.data.user.image,
      },
    });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setState({ status: "loading" });
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      setState({ status: "unauthenticated" });
      throw new Error(result.error.message ?? "Sign up failed");
    }
    if (!result.data?.user) {
      setState({ status: "unauthenticated" });
      throw new Error("Sign up failed");
    }
    setState({
      status: "authenticated",
      onboardingComplete: false,
      user: {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        image: result.data.user.image,
      },
    });
  }, []);

  const biometricSignIn = useCallback(async () => {
    const token = await getStoredToken();
    if (!token) throw new Error("No saved session — sign in first");

    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!supported || !enrolled) throw new Error("Biometrics not available");

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify your identity",
      cancelLabel: "Cancel",
    });
    if (!result.success) throw new Error("Biometric authentication failed");

    // Token already set — just refresh session state
    const session = await authClient.getSession();
    if (!session.data?.user) throw new Error("Session expired — sign in again");

    setState({
      status: "authenticated",
      onboardingComplete: true,
      user: {
        id: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        image: session.data.user.image,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await clearStoredToken();
    setState({ status: "unauthenticated" });
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) =>
      prev.status === "authenticated" ? { ...prev, onboardingComplete: true } : prev,
    );
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signUp, biometricSignIn, signOut, completeOnboarding }),
    [state, signIn, signUp, biometricSignIn, signOut, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
