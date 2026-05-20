import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_CARDS, MOCK_OWN_ACCOUNTS, type OwnAccount } from "@/lib/mock-data";

// ─── Inline recent transactions (to avoid a separate mock export for now) ─────

const RECENT_TXS = [
  {
    id: "t1",
    merchant: "Carrefour",
    abbr: "Ca",
    color: "#3B82F6",
    category: "Groceries",
    halala: 12_500,
    type: "debit" as const,
    date: "Today",
  },
  {
    id: "t2",
    merchant: "Salary",
    abbr: "Sa",
    color: "#10B981",
    category: "Income",
    halala: 850_000,
    type: "credit" as const,
    date: "Today",
  },
  {
    id: "t3",
    merchant: "Tamara",
    abbr: "Tm",
    color: "#6366F1",
    category: "Shopping",
    halala: 34_000,
    type: "debit" as const,
    date: "Yesterday",
  },
  {
    id: "t4",
    merchant: "Starbucks",
    abbr: "St",
    color: "#78350F",
    category: "Dining",
    halala: 3_200,
    type: "debit" as const,
    date: "Yesterday",
  },
  {
    id: "t5",
    merchant: "Transfer from Khalid",
    abbr: "Kh",
    color: "#7C3AED",
    category: "Transfer",
    halala: 50_000,
    type: "credit" as const,
    date: "15 May",
  },
];

function fmtHalala(h: number) {
  return (h / 100).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Account type config ──────────────────────────────────────────────────────

const ACCOUNT_ICON: Record<OwnAccount["type"], React.ComponentProps<typeof Ionicons>["name"]> = {
  main: "wallet-outline",
  savings: "save-outline",
  investment: "trending-up-outline",
};

const ACCOUNT_COLOR: Record<OwnAccount["type"], string> = {
  main: "#C8911A",
  savings: "#10B981",
  investment: "#D4A830",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [balanceHidden, setBalanceHidden] = useState(false);

  const totalSar = MOCK_OWN_ACCOUNTS.reduce((sum, a) => {
    const val = parseFloat(a.balance.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Full-bleed gradient header */}
      <LinearGradient
        colors={["#1A1308", "#231B0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.navRow}>
          <Text style={styles.screenTitle}>Wallet</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/transactions" as any)}
          >
            <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Total balance */}
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>
            <Text style={styles.balanceCurrency}>SAR </Text>
            {balanceHidden
              ? "••••••"
              : totalSar.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
          </Text>
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setBalanceHidden((v) => !v)}>
            <Ionicons
              name={balanceHidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          {[
            { icon: "arrow-up-outline" as const, label: "Send", route: "/send" },
            { icon: "arrow-down-outline" as const, label: "Request", route: "/request" },
            { icon: "add-outline" as const, label: "Top Up", route: "/top-up" },
            { icon: "swap-horizontal-outline" as const, label: "History", route: "/transactions" },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.action}
              onPress={() => router.push(a.route as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={18} color="white" />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Accounts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
        </View>
        <View style={styles.accountsCard}>
          {MOCK_OWN_ACCOUNTS.map((acc, idx) => (
            <View key={acc.id}>
              <View style={styles.accountRow}>
                <View
                  style={[styles.accountIcon, { backgroundColor: ACCOUNT_COLOR[acc.type] + "18" }]}
                >
                  <Ionicons
                    name={ACCOUNT_ICON[acc.type]}
                    size={18}
                    color={ACCOUNT_COLOR[acc.type]}
                  />
                </View>
                <View style={styles.accountMid}>
                  <Text style={styles.accountLabel}>{acc.label}</Text>
                  <Text style={styles.accountNumber}>{acc.number}</Text>
                </View>
                <Text style={styles.accountBalance}>{balanceHidden ? "••••" : acc.balance}</Text>
              </View>
              {idx < MOCK_OWN_ACCOUNTS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Cards strip */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cards</Text>
          <TouchableOpacity onPress={() => router.push("/cards" as any)}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsStrip}
        >
          {MOCK_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.cardChip}
              onPress={() => router.push("/cards" as any)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={card.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardChipGrad}
              >
                {card.status === "frozen" && (
                  <View style={styles.frozenOverlay}>
                    <Ionicons name="snow-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.frozenLabel}>Frozen</Text>
                  </View>
                )}
                <Text style={styles.cardChipNetwork}>{card.label.toUpperCase()}</Text>
                <Text style={styles.cardChipNumber}>•••• {card.lastFour}</Text>
                <View style={styles.cardChipBottom}>
                  <Text style={styles.cardChipFormat}>{card.format}</Text>
                  <Text style={styles.cardChipExpiry}>{card.expiry}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Issue new card */}
          <TouchableOpacity style={styles.addCardChip} onPress={() => router.push("/cards" as any)}>
            <View style={styles.addCardIcon}>
              <Ionicons name="add" size={22} color="#C8911A" />
            </View>
            <Text style={styles.addCardText}>New card</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity onPress={() => router.push("/transactions" as any)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.txCard}>
          {RECENT_TXS.map((tx, idx) => (
            <View key={tx.id}>
              <TouchableOpacity
                style={styles.txRow}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/transaction/[id]",
                    params: { id: tx.id },
                  } as any)
                }
              >
                <View style={[styles.txAvatar, { backgroundColor: tx.color + "20" }]}>
                  <Text style={[styles.txAbbr, { color: tx.color }]}>{tx.abbr}</Text>
                </View>
                <View style={styles.txMid}>
                  <Text style={styles.txMerchant}>{tx.merchant}</Text>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      tx.type === "credit" ? styles.txCredit : styles.txDebit,
                    ]}
                  >
                    {tx.type === "credit" ? "+" : "−"} SAR {fmtHalala(tx.halala)}
                  </Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </TouchableOpacity>
              {idx < RECENT_TXS.length - 1 && <View style={styles.txDivider} />}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#1A1308" },
  scrollContent: { paddingBottom: 40 },

  // Header
  gradientHeader: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  screenTitle: { fontSize: 22, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  balanceAmount: { fontSize: 38, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  balanceCurrency: { fontSize: 22 },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  action: { alignItems: "center", gap: 8, flex: 1 },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_400Regular",
  },

  body: {
    backgroundColor: "#0D0B07",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  seeAll: { fontSize: 13, color: "#C8911A", fontFamily: "Inter_500Medium" },
  divider: { height: 1, backgroundColor: "#1E1A10" },

  // Accounts
  accountsCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountMid: { flex: 1 },
  accountLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 2,
  },
  accountNumber: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  accountBalance: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
  },

  // Cards strip
  cardsStrip: { paddingHorizontal: 20, gap: 12, paddingBottom: 4, marginBottom: 24 },
  cardChip: { borderRadius: 16, overflow: "hidden" },
  cardChipGrad: {
    width: 160,
    height: 100,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
  },
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 1,
  },
  frozenLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
  },
  cardChipNetwork: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
  },
  cardChipNumber: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 2,
  },
  cardChipBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardChipFormat: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textTransform: "capitalize",
  },
  cardChipExpiry: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  addCardChip: {
    width: 160,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1A1610",
  },
  addCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#C8911A" },

  // Transactions
  txCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 1,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  txAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  txAbbr: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  txMid: { flex: 1 },
  txMerchant: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 2,
  },
  txCategory: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  txCredit: { color: "#10B981" },
  txDebit: { color: "#EDE0B0" },
  txDate: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  txDivider: { height: 1, backgroundColor: "#1E1A10" },
});
