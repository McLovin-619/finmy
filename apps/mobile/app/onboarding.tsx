import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMockAuth } from "@/lib/mock-auth";

const STEPS = ["Identity", "Documents", "Done"] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useMockAuth();
  const [step, setStep] = React.useState(0);
  const [idType, setIdType] = React.useState<"national" | "iqama">("national");
  const [idNumber, setIdNumber] = React.useState("");

  function advance() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      router.replace("/");
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Step indicator */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={14} color="white" />
              ) : (
                <Text style={[styles.dotText, i <= step && styles.dotTextActive]}>{i + 1}</Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.line, i < step ? styles.lineActive : styles.lineInactive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {step === 0 && (
          <StepIdentity
            idType={idType}
            setIdType={setIdType}
            idNumber={idNumber}
            setIdNumber={setIdNumber}
          />
        )}
        {step === 1 && <StepDocuments />}
        {step === 2 && <StepDone />}
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {step < 2 ? (
          <>
            <TouchableOpacity style={styles.ctaWrap} onPress={advance} activeOpacity={0.85}>
              <LinearGradient
                colors={["#C8911A", "#D4A830"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={advance}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.ctaWrap} onPress={advance} activeOpacity={0.85}>
            <LinearGradient
              colors={["#C8911A", "#D4A830"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Go to finmy</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StepIdentity({
  idType,
  setIdType,
  idNumber,
  setIdNumber,
}: {
  idType: "national" | "iqama";
  setIdType: (t: "national" | "iqama") => void;
  idNumber: string;
  setIdNumber: (s: string) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Ionicons name="shield-checkmark-outline" size={48} color="#C8911A" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Verify your identity</Text>
      <Text style={styles.stepSubtitle}>
        We verify your ID to comply with Saudi regulations. Your information is encrypted and
        secure.
      </Text>

      <Text style={styles.fieldLabel}>ID Type</Text>
      <View style={styles.idTypeRow}>
        {(["national", "iqama"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.idTypeChip, idType === t && styles.idTypeChipActive]}
            onPress={() => setIdType(t)}
          >
            <Text style={[styles.idTypeText, idType === t && styles.idTypeTextActive]}>
              {t === "national" ? "National ID" : "Iqama"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>
        {idType === "national" ? "National ID Number" : "Iqama Number"}
      </Text>
      <TextInput
        style={styles.idInput}
        placeholder={idType === "national" ? "1XXXXXXXXX" : "2XXXXXXXXX"}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        maxLength={10}
        value={idNumber}
        onChangeText={setIdNumber}
      />
    </View>
  );
}

function StepDocuments() {
  return (
    <View style={styles.stepWrap}>
      <Ionicons name="card-outline" size={48} color="#C8911A" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Upload your ID</Text>
      <Text style={styles.stepSubtitle}>
        Take a clear photo of both sides of your ID in a well-lit area.
      </Text>
      {(["Front side", "Back side"] as const).map((label) => (
        <TouchableOpacity key={label} style={styles.uploadBox} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
          <Text style={styles.uploadLabel}>{label}</Text>
          <Text style={styles.uploadHint}>Tap to take photo or upload</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StepDone() {
  return (
    <View style={[styles.stepWrap, styles.stepDone]}>
      <LinearGradient
        colors={["#C8911A", "#D4A830"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.doneCircle}
      >
        <Ionicons name="checkmark" size={48} color="white" />
      </LinearGradient>
      <Text style={styles.doneTitle}>You're all set</Text>
      <Text style={styles.doneSubtitle}>
        Your identity verification has been submitted. We'll review it within 24 hours. You can use
        finmy while we review.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 48,
    paddingVertical: 24,
  },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dotActive: { backgroundColor: "#C8911A" },
  dotInactive: { backgroundColor: "#E5E7EB" },
  dotText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#6B5E3C" },
  dotTextActive: { color: "white" },
  line: { flex: 1, height: 2, marginHorizontal: 4 },
  lineActive: { backgroundColor: "#C8911A" },
  lineInactive: { backgroundColor: "#E5E7EB" },
  stepWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  stepIcon: { marginBottom: 20 },
  stepTitle: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    lineHeight: 22,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#8C7C55",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  idTypeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  idTypeChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  idTypeChipActive: { borderColor: "#C8911A", backgroundColor: "#221D12" },
  idTypeText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#A89B6E" },
  idTypeTextActive: { color: "#C8911A" },
  idInput: {
    backgroundColor: "#1A1610",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#EDE0B0",
    letterSpacing: 2,
  },
  uploadBox: {
    backgroundColor: "#1A1610",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  uploadLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#A89B6E" },
  uploadHint: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  stepDone: { alignItems: "center", justifyContent: "center" },
  doneCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 12,
    textAlign: "center",
  },
  doneSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    lineHeight: 24,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#1A1610",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  ctaWrap: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  ctaGradient: { paddingVertical: 16, alignItems: "center" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
  skipButton: { alignItems: "center", paddingVertical: 10 },
  skipText: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
});
