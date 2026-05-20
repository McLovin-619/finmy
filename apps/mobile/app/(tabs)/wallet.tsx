import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MOCK_CARDS } from "@/lib/mock-data";
import { apiFetch } from "@/lib/api-client";
import { useWalletStream } from "@/lib/wallet-stream";

// ─── API types ────────────────────────────────────────────────────────────────

type WalletTx = {
  id: string;
  type: "transfer_in" | "transfer_out";
  amountSar: number;
  status: string;
  description: string | null;
  peerWalletId: string | null;
  occurredAt: string;
};

type WalletData = {
  wallet: { id: string; iban: string; balanceSar: number; currency: string };
  transactions: WalletTx[];
};

// ─── Data fetching ────────────────────────────────────────────────────────────

function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiFetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to load wallet");
      return res.json() as Promise<WalletData>;
    },
  });
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function fmtSar(sar: number) {
  return sar.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(raw: string) {
  const d = new Date(raw);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-SA", { day: "numeric", month: "short" });
}

function txDisplayInfo(tx: WalletTx) {
  const isCredit = tx.type === "transfer_in";
  const label = tx.description ?? (isCredit ? "Transfer received" : "Transfer sent");
  const words = label.trim().split(/\s+/);
  const abbr =
    words.length >= 2
      ? (words[0]![0]! + words[1]![0]!).toUpperCase()
      : label.slice(0, 2).toUpperCase();
  return {
    label,
    abbr,
    color: isCredit ? "#10B981" : "#7C3AED",
    category: isCredit ? "Transfer In" : "Transfer Out",
    isCredit,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const { data, isLoading, isError } = useWallet();
  useWalletStream(!!data);

  const balanceSar = data?.wallet.balanceSar ?? 0;
  const iban = data?.wallet.iban ?? "";
  const ibanSuffix = iban.slice(-4);
  const recentTxs = (data?.transactions ?? []).slice(0, 5);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Full-bleed gradient header */}
      <LinearGradient
        colors={["#7C3AED", "#EC4899"]}
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
            {balanceHidden ? "••••••" : isLoading ? "—" : fmtSar(balanceSar)}
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
          {isLoading ? (
            <View style={styles.accountRow}>
              <ActivityIndicator size="small" color="#7C3AED" />
            </View>
          ) : isError ? (
            <View style={styles.accountRow}>
              <Text style={styles.errorText}>Could not load account</Text>
            </View>
          ) : (
            <View style={styles.accountRow}>
              <View style={[styles.accountIcon, { backgroundColor: "#7C3AED18" }]}>
                <Ionicons name="wallet-outline" size={18} color="#7C3AED" />
              </View>
              <View style={styles.accountMid}>
                <Text style={styles.accountLabel}>Main Account</Text>
                <Text style={styles.accountNumber}>
                  {ibanSuffix ? `•••• ${ibanSuffix}` : "—"}
                </Text>
              </View>
              <Text style={styles.accountBalance}>
                {balanceHidden ? "••••" : `SAR ${fmtSar(balanceSar)}`}
              </Text>
            </View>
          )}
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
              <Ionicons name="add" size={22} color="#7C3AED" />
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
          {isLoading ? (
            <View style={styles.txLoadingRow}>
              <ActivityIndicator size="small" color="#7C3AED" />
            </View>
          ) : isError ? (
            <View style={styles.txLoadingRow}>
              <Text style={styles.errorText}>Could not load transactions</Text>
            </View>
          ) : recentTxs.length === 0 ? (
            <View style={styles.txLoadingRow}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            recentTxs.map((tx, idx) => {
              const info = txDisplayInfo(tx);
              return (
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
                    <View style={[styles.txAvatar, { backgroundColor: info.color + "20" }]}>
                      <Text style={[styles.txAbbr, { color: info.color }]}>{info.abbr}</Text>
                    </View>
                    <View style={styles.txMid}>
                      <Text style={styles.txMerchant} numberOfLines={1}>
                        {info.label}
                      </Text>
                      <Text style={styles.txCategory}>{info.category}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          info.isCredit ? styles.txCredit : styles.txDebit,
                        ]}
                      >
                        {info.isCredit ? "+" : "−"} SAR {fmtSar(tx.amountSar)}
                      </Text>
                      <Text style={styles.txDate}>{formatDate(tx.occurredAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  {idx < recentTxs.length - 1 && <View style={styles.txDivider} />}
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#7C3AED" },
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
    backgroundColor: "#FAFAFA",
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
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  seeAll: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_500Medium" },
  divider: { height: 1, backgroundColor: "#F9FAFB" },

  // Accounts
  accountsCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
    color: "#1A1426",
    marginBottom: 2,
  },
  accountNumber: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  accountBalance: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
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
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "white",
  },
  addCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#7C3AED" },

  // Transactions
  txCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  txLoadingRow: {
    paddingVertical: 20,
    alignItems: "center",
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
    color: "#1A1426",
    marginBottom: 2,
  },
  txCategory: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  txCredit: { color: "#10B981" },
  txDebit: { color: "#1A1426" },
  txDate: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  txDivider: { height: 1, backgroundColor: "#F9FAFB" },
  errorText: { fontSize: 13, color: "#EF4444", fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
});
