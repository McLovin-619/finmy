import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";
import { AuthHeader } from "@/components/ui/AuthHeader";
import { PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";

const ResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetInput = z.infer<typeof ResetSchema>;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <View style={styles.root}>
        <AuthHeader />
        <View style={[styles.card, styles.invalidContent]}>
          <Text style={styles.heading}>Link expired</Text>
          <Text style={styles.subheading}>
            This reset link is invalid or has expired. Request a new one from the sign-in screen.
          </Text>
          <PrimaryButton
            label="Back to Sign In"
            onPress={() => router.replace("/(auth)/sign-in")}
            style={styles.ctaButton}
          />
        </View>
      </View>
    );
  }

  async function onSubmit({ newPassword }: ResetInput) {
    setLoading(true);
    const result = await authClient.resetPassword({ newPassword, token: token! });
    setLoading(false);
    if (result.error) {
      Alert.alert(
        "Reset failed",
        result.error.message ?? "The link may have expired. Request a new one.",
      );
      return;
    }
    Alert.alert(
      "Password updated",
      "Your password has been reset. Sign in with your new password.",
      [{ text: "Sign In", onPress: () => router.replace("/(auth)/sign-in") }],
    );
  }

  return (
    <View style={styles.root}>
      <AuthHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Set new password</Text>
          <Text style={styles.subheading}>Choose a strong password for your finmy account.</Text>

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Min. 8 characters"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

          <PrimaryButton
            label="Reset Password"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.ctaButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#7C3AED",
  },
  keyboardView: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  invalidContent: {
    paddingHorizontal: 32,
    paddingTop: 28,
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 28,
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  ctaButton: {
    marginBottom: 24,
  },
});
