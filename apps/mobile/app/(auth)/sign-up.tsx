import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React from "react";
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
import { useAuth } from "@/lib/auth";

const SignUpSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to continue" }),
  }),
});
type SignUpInput = z.infer<typeof SignUpSchema>;

export default function SignUpScreen() {
  const { signUp, state } = useAuth();
  const loading = state.status === "loading";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: "", password: "", agreeToTerms: undefined as any },
  });

  async function onSubmit(data: SignUpInput) {
    try {
      await signUp(data.name, data.email, data.password);
    } catch (err) {
      Alert.alert("Sign up failed", err instanceof Error ? err.message : "Please try again.");
      return;
    }
    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email: data.email },
    } as any);
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
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>
            Your money. Your investments. Your family. All in one place.
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

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
                placeholder="Create a password (min 8 characters)"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                containerStyle={styles.fieldSpacing}
              />
            )}
          />

          <Controller
            control={control}
            name="agreeToTerms"
            render={({ field: { onChange, value } }) => (
              <View style={styles.termsContainer}>
                <Checkbox
                  checked={value === true}
                  onToggle={() => onChange(value === true ? undefined : true)}
                  label={
                    <Text style={styles.termsText}>
                      I agree to the <Text style={styles.termsLink}>Terms</Text>
                      {" and "}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                      {", and confirm I am a Saudi resident."}
                    </Text>
                  }
                />
                {errors.agreeToTerms ? (
                  <Text style={styles.termsError}>{errors.agreeToTerms.message}</Text>
                ) : null}
              </View>
            )}
          />

          <PrimaryButton
            label="Create Account"
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

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign in</Text>
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
  },
  cardContent: {
    padding: 28,
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
  termsContainer: {
    marginBottom: 28,
    marginTop: 4,
  },
  termsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 20,
  },
  termsLink: {
    color: "#7C3AED",
    fontFamily: "Inter_500Medium",
  },
  termsError: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    marginLeft: 30,
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
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInPrompt: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  signInLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontFamily: "Inter_600SemiBold",
  },
});
