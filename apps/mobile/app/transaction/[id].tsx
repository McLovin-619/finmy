import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TxRecord = {
  merchant: string;
  abbr: string;
  color: string;
  category: string;
  halala: number;
  type: "credit" | "debit";
  date: string;
  account: string;
  reference: string;
};

const MOCK: Record<string, TxRecord> = {
  t1: {
    merchant: "Carrefour",
    abbr: "Ca",
    color: "#3B82F6",
    category: "Groceries",
    halala: 12500,
    type: "debit",
    date: "18 May 2026, 10:23 AM",
    account: "Groceries Card •••• 3456",
    reference: "TXN-8821-4KPX",
  },
  t2: {
    merchant: "Salary",
    abbr: "Sa",
    color: "#10B981",
    category: "Income",
    halala: 850000,
    type: "credit",
    date: "18 May 2026, 8:00 AM",
    account: "Main Card •••• 3456",
    reference: "TXN-8819-WQLM",
  },
  t3: {
    merchant: "Tamara",
    abbr: "Tm",
    color: "#6366F1",
    category: "Shopping",
    halala: 34000,
    type: "debit",
    date: "17 May 2026, 3:44 PM",
    account: "Main Card •••• 3456",
    reference: "TXN-8802-RLNZ",
  },
  t4: {
    merchant: "Starbucks",
    abbr: "St",
    color: "#78350F",
    category: "Dining",
    halala: 3200,
    type: "debit",
    date: "17 May 2026, 9:15 AM",
    account: "Groceries Card •••• 3456",
    reference: "TXN-8798-JDMX",
  },
  t5: {
    merchant: "Netflix",
    abbr: "N",
    color: "#EF4444",
    category: "Subscription",
    halala: 6500,
    type: "debit",
    date: "15 May 2026, 12:00 AM",
    account: "Online Card •••• 0801",
    reference: "TXN-8766-QKPZ",
  },
  t6: {
    merchant: "Transfer from Khalid",
    abbr: "Kh",
    color: "#C8911A",
    category: "Transfer",
    halala: 50000,
    type: "credit",
    date: "15 May 2026, 11:32 AM",
    account: "Main Card •••• 3456",
    reference: "TXN-8763-BVNH",
  },
};

function fmt(halala: number) {
  return (halala / 100).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = MOCK[id] ?? MOCK.t1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#C8911A", "#D4A830"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>

        <View style={[styles.merchantIcon, { backgroundColor: tx.color }]}>
          <Text style={styles.merchantAbbr}>{tx.abbr}</Text>
        </View>
        <Text style={styles.merchantName}>{tx.merchant}</Text>
        <Text style={styles.categoryText}>{tx.category}</Text>
        <Text
          style={[styles.amount, tx.type === "credit" ? styles.amountCredit : styles.amountDebit]}
        >
          {tx.type === "credit" ? "+" : "−"} SAR {fmt(tx.halala)}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          {[
            { label: "Date & Time", value: tx.date },
            { label: "Category", value: tx.category },
            { label: "Account", value: tx.account },
            { label: "Reference", value: tx.reference },
            { label: "Status", value: "Completed" },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={[styles.detailValue, label === "Status" && styles.statusGreen]}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt</Text>
          <TouchableOpacity style={styles.receiptBox} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
            <Text style={styles.receiptHint}>Tap to attach a receipt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="download-outline" size={18} color="#C8911A" />
            <Text style={styles.actionLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]}>
            <Ionicons name="flag-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  hero: { paddingBottom: 36, paddingHorizontal: 24, alignItems: "center" },
  backButton: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 24,
  },
  merchantIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  merchantAbbr: { fontSize: 22, fontFamily: "Inter_600SemiBold", color: "white" },
  merchantName: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  amount: { fontSize: 36, fontFamily: "PlusJakartaSans_700Bold" },
  amountCredit: { color: "#A7F3D0" },
  amountDebit: { color: "white" },
  body: { flex: 1, marginTop: -16 },
  card: {
    backgroundColor: "#1A1610",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  detailLabel: { fontSize: 13, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#EDE0B0",
    flex: 1,
    textAlign: "right",
  },
  statusGreen: { color: "#10B981" },
  receiptBox: {
    height: 100,
    backgroundColor: "#1E1A10",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  receiptHint: { fontSize: 13, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  actionsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#221D12",
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnDanger: { backgroundColor: "#FEF2F2" },
  actionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C8911A" },
  actionLabelDanger: { color: "#EF4444" },
});
