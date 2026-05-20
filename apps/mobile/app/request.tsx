import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { MOCK_CONTACTS, type Contact } from "@/lib/mock-data";

type Step = "contact" | "amount" | "success";

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("contact");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = MOCK_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase())
  );

  async function confirm() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setStep("success");
  }

  if (step === "success") {
    return (
      <View style={[styles.root, styles.successRoot]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="white" />
        </View>
        <Text style={styles.successTitle}>Request Sent</Text>
        <Text style={styles.successAmount}>SAR {parseFloat(amount || "0").toFixed(2)}</Text>
        <Text style={styles.successTo}>from {selected?.name}</Text>
        {note ? <Text style={styles.successNote}>"{note}"</Text> : null}
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => (step === "amount" ? setStep("contact") : router.back())}>
          <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "contact" ? "Request Money" : "Enter Amount"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {step === "contact" && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or handle"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>

          <Text style={styles.listLabel}>Recent</Text>
          {filtered.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactRow}
              onPress={() => {
                setSelected(contact);
                setStep("amount");
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: contact.color }]}>
                <Text style={styles.avatarText}>{contact.initials}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactHandle}>{contact.handle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {step === "amount" && selected && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Selected contact */}
          <View style={styles.selectedContact}>
            <View style={[styles.avatarLarge, { backgroundColor: selected.color }]}>
              <Text style={styles.avatarTextLarge}>{selected.initials}</Text>
            </View>
            <Text style={styles.selectedName}>{selected.name}</Text>
            <Text style={styles.selectedHandle}>{selected.handle}</Text>
          </View>

          {/* Amount input */}
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

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {["50", "100", "200", "500"].map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => setAmount(q)}>
                <Text style={styles.quickChipText}>SAR {q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <View style={styles.noteWrap}>
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color="#9CA3AF"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.noteInput}
              placeholder="What's it for? (optional)"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
            />
          </View>

          <TouchableOpacity
            style={[styles.cta, (!amount || parseFloat(amount) <= 0) && styles.ctaDisabled]}
            onPress={confirm}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>
              {loading ? "Sending request…" : `Request SAR ${parseFloat(amount || "0").toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#1A1610",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  content: { padding: 20, paddingBottom: 40 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#EDE0B0" },
  listLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B5E3C", marginBottom: 10 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 2 },
  contactHandle: { fontSize: 13, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  selectedContact: { alignItems: "center", marginBottom: 32 },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarTextLarge: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 22 },
  selectedName: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 4,
  },
  selectedHandle: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    marginRight: 8,
    marginTop: 6,
  },
  amountInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    minWidth: 120,
    textAlign: "center",
  },
  quickAmounts: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#221D12",
    borderRadius: 20,
  },
  quickChipText: { fontSize: 13, color: "#C8911A", fontFamily: "Inter_500Medium" },
  noteWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  noteInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#EDE0B0" },
  cta: {
    backgroundColor: "#D4A830",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
  // Success
  successRoot: { alignItems: "center", justifyContent: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#D4A830",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 40,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#D4A830",
    marginBottom: 4,
  },
  successTo: { fontSize: 16, color: "#8C7C55", fontFamily: "Inter_400Regular", marginBottom: 8 },
  successNote: {
    fontSize: 14,
    color: "#6B5E3C",
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginBottom: 40,
  },
  successDone: {
    backgroundColor: "#D4A830",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginTop: 8,
  },
  successDoneText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
