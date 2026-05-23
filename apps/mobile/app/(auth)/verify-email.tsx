import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthHeader } from "@/components/ui/AuthHeader";
import { PrimaryButton } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { refreshSession } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleSubmit(otp: string) {
    if (!email || otp.length !== CODE_LENGTH) return;
    setSubmitting(true);
    const res = await authClient.emailOtp.verifyEmail({ email, otp });
    setSubmitting(false);
    if (res.error) {
      Alert.alert("Invalid code", res.error.message ?? "The code is incorrect or expired.");
      setCode("");
      inputRef.current?.focus();
      return;
    }
    await refreshSession();
    router.replace("/onboarding" as any);
  }

  function handleChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(cleaned);
    if (cleaned.length === CODE_LENGTH) handleSubmit(cleaned);
  }

  async function handleResend() {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    const res = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResending(false);
    if (res.error) {
      Alert.alert("Could not resend", res.error.message ?? "Please try again.");
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  const digits = code.padEnd(CODE_LENGTH, " ").split("");

  return (
    <View style={styles.root}>
      <AuthHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Verify your email</Text>
          <Text style={styles.subheading}>
            Enter the 6-digit code we sent to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
            {digits.map((digit, idx) => {
              const isFilled = digit.trim().length > 0;
              const isActive = idx === code.length;
              return (
                <View
                  key={idx}
                  style={[styles.codeBox, isFilled && styles.codeBoxFilled, isActive && styles.codeBoxActive]}
                >
                  <Text style={styles.codeDigit}>{digit.trim()}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            caretHidden
          />

          <PrimaryButton
            label="Verify"
            onPress={() => handleSubmit(code)}
            loading={submitting}
            disabled={code.length !== CODE_LENGTH}
            style={styles.ctaButton}
          />

          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.resend, (cooldown > 0 || resending) && styles.resendDisabled]}>
              {resending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.backRow}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>Use a different email</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#7C3AED" },
  keyboardView: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  heading: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 32,
  },
  email: { fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxFilled: { borderColor: "#7C3AED", backgroundColor: "#F4F1FA" },
  codeBoxActive: { borderColor: "#7C3AED" },
  codeDigit: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  ctaButton: { marginBottom: 24 },
  resend: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#7C3AED",
    paddingVertical: 8,
  },
  resendDisabled: { color: "#9CA3AF" },
  backRow: { marginTop: 8 },
  backText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    paddingVertical: 8,
  },
});
