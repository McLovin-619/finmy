import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { SocialButton } from "@/components/ui/SocialButton";
import {
  authenticate,
  enableBiometrics,
  getBiometricType,
  isBiometricEnabled,
  type BiometricType,
} from "@/lib/biometrics";
import { useAuth } from "@/lib/auth";

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});
type SignInInput = z.infer<typeof SignInSchema>;

export default function SignInScreen() {
  const { signIn, biometricSignIn, state } = useAuth();
  const loading = state.status === "loading";

  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    (async () => {
      const [type, enabled] = await Promise.all([getBiometricType(), isBiometricEnabled()]);
      setBiometricType(type);
      setBiometricEnabled(enabled);
    })();
  }, []);

  // Auto-trigger biometric on load if previously enabled
  useEffect(() => {
    if (biometricEnabled && biometricType) {
      triggerBiometric();
    }
  }, [biometricEnabled, biometricType]);

  const triggerBiometric = useCallback(async () => {
    const success = await authenticate();
    if (success) {
      await biometricSignIn();
      router.replace("/");
    }
  }, [biometricSignIn]);

  async function onSubmit(data: SignInInput) {
    try {
      await signIn(data.email, data.password);
    } catch (err) {
      Alert.alert("Sign in failed", err instanceof Error ? err.message : "Please try again.");
      return;
    }
    // Offer to enable biometrics after first password sign-in
    if (biometricType && !biometricEnabled) {
      const label = biometricType === "faceid" ? "Face ID" : "Fingerprint";
      Alert.alert(`Enable ${label}`, `Sign in faster next time using ${label}.`, [
        { text: "Not now", style: "cancel" },
        {
          text: "Enable",
          onPress: async () => {
            await enableBiometrics();
            setBiometricEnabled(true);
          },
        },
      ]);
    }
    router.replace("/");
  }

  const biometricLabel = biometricType === "faceid" ? "Face ID" : "Fingerprint";
  const biometricIcon = biometricType === "faceid" ? "scan-outline" : "finger-print-outline";

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
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Sign in with your finmy account to manage your money, investments, and family
            allowances.
          </Text>

          {biometricEnabled && biometricType ? (
            <TouchableOpacity
              style={styles.biometricCard}
              onPress={triggerBiometric}
              activeOpacity={0.8}
            >
              <View style={styles.biometricIconWrap}>
                <Ionicons name={biometricIcon as any} size={32} color="#7C3AED" />
              </View>
              <Text style={styles.biometricLabel}>Sign in with {biometricLabel}</Text>
              <Text style={styles.biometricSub}>or fill in your details below</Text>
            </TouchableOpacity>
          ) : null}

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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

          <View style={styles.rememberRow}>
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  checked={value ?? false}
                  onToggle={() => onChange(!value)}
                  label={<Text style={styles.rememberLabel}>Remember me</Text>}
                />
              )}
            />
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <PrimaryButton
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.ctaButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton provider="apple" />
            <SocialButton provider="google" />
          </View>

          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  biometricCard: {
    alignItems: "center",
    backgroundColor: "#F4F1FA",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  biometricIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  biometricLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    marginBottom: 4,
  },
  biometricSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    marginTop: 4,
  },
  rememberLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#374151",
  },
  forgotLink: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#7C3AED",
  },
  ctaButton: {
    marginBottom: 24,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpPrompt: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  signUpLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontFamily: "Inter_600SemiBold",
  },
});
