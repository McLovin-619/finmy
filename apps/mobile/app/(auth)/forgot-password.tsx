import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { AuthHeader } from "@/components/ui/AuthHeader";
import { PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/auth-client";

const ForgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type ForgotInput = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: ForgotInput) {
    setLoading(true);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "finmy://reset-password",
    });
    setLoading(false);
    if (result.error) {
      Alert.alert("Error", result.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={styles.root}>
        <AuthHeader />
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.sentIconWrap}>
              <Ionicons name="mail-outline" size={40} color="#7C3AED" />
            </View>
            <Text style={styles.heading}>Check your email</Text>
            <Text style={styles.subheading}>
              If <Text style={styles.emailHighlight}>{getValues("email")}</Text> is registered with
              finmy, you will receive a password reset link shortly.
            </Text>
            <PrimaryButton
              label="Back to Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={styles.ctaButton}
            />
            <TouchableOpacity
              onPress={() => setSent(false)}
              style={styles.resendRow}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.resendLink}>Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
          <Text style={styles.heading}>Forgot password</Text>
          <Text style={styles.subheading}>
            Enter the email address linked to your finmy account and we will send you a reset link.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

          <PrimaryButton
            label="Send Reset Link"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.ctaButton}
          />

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={16} color="#7C3AED" />
            <Text style={styles.backLink}>Back to Sign In</Text>
          </TouchableOpacity>
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
  cardContent: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 48,
  },
  sentIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  emailHighlight: {
    fontFamily: "Inter_500Medium",
    color: "#374151",
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  ctaButton: {
    marginBottom: 20,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backLink: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#7C3AED",
  },
  resendRow: {
    alignItems: "center",
  },
  resendLink: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#7C3AED",
  },
});
