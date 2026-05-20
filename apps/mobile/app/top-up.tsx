import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = "apple-pay" | "card" | "bank";
type Step = "method" | "details" | "amount" | "success";

const METHODS: {
  method: Method;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
}[] = [
  {
    method: "apple-pay",
    icon: "phone-portrait-outline",
    label: "Apple Pay",
    sub: "Instant top-up using Apple Pay",
  },
  {
    method: "card",
    icon: "card-outline",
    label: "Debit or Credit Card",
    sub: "Visa, Mastercard, Mada",
  },
  {
    method: "bank",
    icon: "business-outline",
    label: "Bank Transfer",
    sub: "Transfer from a linked bank account",
  },
];

const QUICK_AMOUNTS = ["100", "250", "500", "1000"];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TopUpScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<Method | null>(null);
  const [amount, setAmount] = useState("");
  const [newBalanceSar, setNewBalanceSar] = useState<number | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Bank account selection (mirrors wallet query)
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiFetch("/api/wallet");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ wallet: { id: string; iban: string; balanceSar: number } }>;
    },
  });
  const [bankAccountSelected, setBankAccountSelected] = useState(false);

  const [loading, setLoading] = useState(false);

  function goBack() {
    if (step === "details") {
      setStep("method");
      return;
    }
    if (step === "amount") {
      if (method === "apple-pay") {
        setStep("method");
        return;
      }
      setStep("details");
      return;
    }
    router.back();
  }

  function onMethodSelect(m: Method) {
    setMethod(m);
    if (m === "apple-pay") {
      setStep("amount");
      return;
    }
    setStep("details");
  }

  function onDetailsNext() {
    setStep("amount");
  }

  async function submit() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({ amountSar: parseFloat(amount) }),
      });
      const data = await res.json() as { newBalanceSar?: number; error?: string };
      if (!res.ok) {
        Alert.alert("Top-up failed", data.error ?? "Something went wrong");
        return;
      }
      setNewBalanceSar(data.newBalanceSar ?? null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setStep("success");
    } catch {
      Alert.alert("Top-up failed", "Could not connect. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const headerTitle: Record<Step, string> = {
    method: "Top Up",
    details: method === "card" ? "Card Details" : "Bank Account",
    amount: "Enter Amount",
    success: "",
  };

  function formatCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  const cardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3 &&
    cardName.trim().length > 0;

  const bankValid = bankAccountSelected;

  const amountValid = !!amount && parseFloat(amount) > 0;

  const methodLabel =
    method === "apple-pay"
      ? "Apple Pay"
      : method === "card"
        ? `•••• ${cardNumber.replace(/\s/g, "").slice(-4) || "Card"}`
        : "Main Account";

  if (step === "success") {
    return (
      <View style={[styles.root, styles.successRoot]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="white" />
        </View>
        <Text style={styles.successTitle}>Topped Up</Text>
        <Text style={styles.successAmount}>SAR {parseFloat(amount || "0").toFixed(2)}</Text>
        <Text style={styles.successVia}>via {methodLabel}</Text>
        {newBalanceSar !== null ? (
          <Text style={styles.successNewBalance}>
            New balance: SAR {newBalanceSar.toFixed(2)}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.successDone} onPress={() => router.back()}>
          <Text style={styles.successDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle[step]}</Text>
        <View style={{ width: 24 }} />
      </View>

      {step === "method" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.listLabel}>Choose top-up method</Text>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.method}
              style={styles.methodCard}
              onPress={() => onMethodSelect(m.method)}
              activeOpacity={0.7}
            >
              <View style={styles.methodIconWrap}>
                <Ionicons name={m.icon} size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.sub}</Text>
              </View>
              {m.method === "apple-pay" ? (
                <View style={styles.applePayBadge}>
                  <Ionicons name="logo-apple" size={13} color="white" />
                  <Text style={styles.applePayBadgeText}>Pay</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {step === "details" && method === "card" && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.cardPreview}>
            <Text style={styles.cardPreviewNumber}>{cardNumber || "•••• •••• •••• ••••"}</Text>
            <View style={styles.cardPreviewBottom}>
              <View>
                <Text style={styles.cardPreviewFieldLabel}>NAME</Text>
                <Text style={styles.cardPreviewField}>{cardName || "CARD HOLDER"}</Text>
              </View>
              <View>
                <Text style={styles.cardPreviewFieldLabel}>EXPIRES</Text>
                <Text style={styles.cardPreviewField}>{cardExpiry || "MM/YY"}</Text>
              </View>
            </View>
          </View>

          <FormField
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            keyboardType="number-pad"
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FormField
                label="Expiry"
                placeholder="MM/YY"
                value={cardExpiry}
                onChangeText={(v) => setCardExpiry(formatExpiry(v))}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="CVV"
                placeholder="123"
                value={cardCvv}
                onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
              />
            </View>
          </View>
          <FormField
            label="Name on Card"
            placeholder="As printed on card"
            value={cardName}
            onChangeText={setCardName}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.cta, !cardValid && styles.ctaDisabled]}
            onPress={onDetailsNext}
            disabled={!cardValid}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === "details" && method === "bank" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.listLabel}>Select source account</Text>
          {walletQuery.isLoading ? (
            <ActivityIndicator color="#7C3AED" style={{ marginVertical: 24 }} />
          ) : walletQuery.data ? (
            <TouchableOpacity
              style={[styles.accountCard, bankAccountSelected && styles.accountCardSelected]}
              onPress={() => setBankAccountSelected(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.accountIconWrap,
                  bankAccountSelected && styles.accountIconWrapSelected,
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={bankAccountSelected ? "white" : "#7C3AED"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountLabel}>Main Account</Text>
                <Text style={styles.accountNumber}>
                  •••• {walletQuery.data.wallet.iban.slice(-4)}
                </Text>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountBalance}>
                  SAR{" "}
                  {walletQuery.data.wallet.balanceSar.toLocaleString("en-SA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                {bankAccountSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#7C3AED"
                    style={{ marginTop: 4 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.cta, !bankValid && styles.ctaDisabled]}
            onPress={onDetailsNext}
            disabled={!bankValid}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === "amount" && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.methodChip}>
            <Ionicons
              name={
                method === "apple-pay"
                  ? "logo-apple"
                  : method === "card"
                    ? "card-outline"
                    : "business-outline"
              }
              size={16}
              color="#7C3AED"
            />
            <Text style={styles.methodChipText}>{methodLabel}</Text>
          </View>

          <View style={styles.amountWrap}>
            <Text style={styles.currencyPrefix}>SAR</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#D1D5DB"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => setAmount(q)}>
                <Text style={styles.quickChipText}>SAR {q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === "apple-pay" ? (
            <TouchableOpacity
              style={[styles.applePayCta, !amountValid && styles.ctaDisabled]}
              onPress={submit}
              disabled={!amountValid || loading}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-apple" size={20} color="white" />
              <Text style={styles.applePayCtaText}>{loading ? "Processing…" : "Pay"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.cta, !amountValid && styles.ctaDisabled]}
              onPress={submit}
              disabled={!amountValid || loading}
            >
              <Text style={styles.ctaText}>
                {loading ? "Processing…" : `Top Up SAR ${parseFloat(amount || "0").toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Shared form field ────────────────────────────────────────────────────────

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  content: { padding: 20, paddingBottom: 48 },

  listLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#9CA3AF", marginBottom: 10 },

  // Method selection
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 2 },
  methodSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  applePayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#1A1426",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  applePayBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "white" },

  // Card preview
  cardPreview: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPreviewNumber: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "white",
    letterSpacing: 2,
    marginBottom: 24,
  },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewFieldLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  cardPreviewField: { fontSize: 13, color: "white", fontFamily: "Inter_600SemiBold" },

  row: { flexDirection: "row" },

  // Bank account cards
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  accountCardSelected: { borderColor: "#7C3AED", backgroundColor: "#F4F1FA" },
  accountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  accountIconWrapSelected: { backgroundColor: "#7C3AED" },
  accountLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    marginBottom: 2,
  },
  accountNumber: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  accountRight: { alignItems: "flex-end" },
  accountBalance: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426" },

  // Amount step
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#F4F1FA",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 24,
  },
  methodChipText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    marginRight: 8,
    marginTop: 6,
  },
  amountInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    minWidth: 120,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 32 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F4F1FA",
    borderRadius: 20,
  },
  quickChipText: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_500Medium" },

  // Form fields
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1A1426",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // CTAs
  cta: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
  applePayCta: {
    backgroundColor: "#1A1426",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  applePayCtaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },

  // Success
  successRoot: { alignItems: "center", justifyContent: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 40,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#7C3AED",
    marginBottom: 4,
  },
  successVia: { fontSize: 16, color: "#6B7280", fontFamily: "Inter_400Regular", marginBottom: 16 },
  successNewBalance: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginBottom: 40 },
  successDone: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginTop: 16,
  },
  successDoneText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
