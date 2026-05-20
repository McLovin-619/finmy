import type { SignInInput, SignUpInput, User } from "@finmy/users";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type AuthState =
  | { status: "unauthenticated" }
  | { status: "loading" }
  | { status: "authenticated"; user: User; onboardingComplete: boolean };

type AuthContext = {
  state: AuthState;
  signIn: (data: SignInInput) => Promise<void>;
  signUp: (data: SignUpInput) => Promise<void>;
  biometricSignIn: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContext | null>(null);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "unauthenticated" });

  const signIn = useCallback(async (data: SignInInput) => {
    setState({ status: "loading" });
    await new Promise((r) => setTimeout(r, 900));
    setState({
      status: "authenticated",
      onboardingComplete: true,
      user: {
        id: "mock-user-1",
        fullName: "Abdullah Al-Saud",
        email: data.emailOrPhone.includes("@") ? data.emailOrPhone : undefined,
        mobileNumber: data.emailOrPhone.includes("@") ? "+966501234567" : data.emailOrPhone,
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const signUp = useCallback(async (data: SignUpInput) => {
    setState({ status: "loading" });
    await new Promise((r) => setTimeout(r, 900));
    setState({
      status: "authenticated",
      onboardingComplete: false,
      user: {
        id: "mock-user-1",
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const biometricSignIn = useCallback(async () => {
    setState({ status: "loading" });
    await new Promise((r) => setTimeout(r, 400));
    setState({
      status: "authenticated",
      onboardingComplete: true,
      user: {
        id: "mock-user-1",
        fullName: "Abdullah Al-Saud",
        email: "abdullah@example.com",
        mobileNumber: "+966501234567",
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const signOut = useCallback(() => {
    setState({ status: "unauthenticated" });
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "authenticated") return prev;
      return { ...prev, onboardingComplete: true };
    });
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signUp, biometricSignIn, signOut, completeOnboarding }),
    [state, signIn, signUp, biometricSignIn, signOut, completeOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useMockAuth must be used within MockAuthProvider");
  return ctx;
}
