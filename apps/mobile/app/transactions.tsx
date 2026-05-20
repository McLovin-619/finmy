import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Transaction = {
  id: string;
  merchant: string;
  abbr: string;
  color: string;
  category: string;
  halala: number;
  type: "credit" | "debit";
  date: string;
};

const GROUPS: { label: string; items: Transaction[] }[] = [
  {
    label: "Today",
    items: [
      {
        id: "t1",
        merchant: "Carrefour",
        abbr: "Ca",
        color: "#3B82F6",
        category: "Groceries",
        halala: 12500,
        type: "debit",
        date: "18 May",
      },
      {
        id: "t2",
        merchant: "Salary",
        abbr: "Sa",
        color: "#10B981",
        category: "Income",
        halala: 850000,
        type: "credit",
        date: "18 May",
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "t3",
        merchant: "Tamara",
        abbr: "Tm",
        color: "#6366F1",
        category: "Shopping",
        halala: 34000,
        type: "debit",
        date: "17 May",
      },
      {
        id: "t4",
        merchant: "Starbucks",
        abbr: "St",
        color: "#78350F",
        category: "Dining",
        halala: 3200,
        type: "debit",
        date: "17 May",
      },
    ],
  },
  {
    label: "15 May",
    items: [
      {
        id: "t5",
        merchant: "Netflix",
        abbr: "N",
        color: "#EF4444",
        category: "Subscription",
        halala: 6500,
        type: "debit",
        date: "15 May",
      },
      {
        id: "t6",
        merchant: "Transfer from Khalid",
        abbr: "Kh",
        color: "#C8911A",
        category: "Transfer",
        halala: 50000,
        type: "credit",
        date: "15 May",
      },
    ],
  },
];

const FILTERS = ["All", "Income", "Expense"] as const;
type Filter = (typeof FILTERS)[number];

function fmt(halala: number) {
  return (halala / 100).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("All");

  const filtered = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((t) => {
      const matchFilter =
        filter === "All" ||
        (filter === "Income" && t.type === "credit") ||
        (filter === "Expense" && t.type === "debit");
      const matchSearch =
        t.merchant.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.headerIconButton}>
          <Ionicons name="options-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filtered.map((group) => (
            <View key={group.label}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.txRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({ pathname: "/transaction/[id]", params: { id: t.id } } as any)
                  }
                >
                  <View style={[styles.txAvatar, { backgroundColor: t.color + "20" }]}>
                    <Text style={[styles.txAbbr, { color: t.color }]}>{t.abbr}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txMerchant}>{t.merchant}</Text>
                    <Text style={styles.txCategory}>{t.category}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        t.type === "credit" ? styles.txCredit : styles.txDebit,
                      ]}
                    >
                      {t.type === "credit" ? "+" : "−"} SAR {fmt(t.halala)}
                    </Text>
                    <Text style={styles.txDate}>{t.date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#1A1610",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#1A1610" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#221D12",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#EDE0B0" },
  filtersRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  chipActive: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A89B6E" },
  chipTextActive: { color: "white" },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#6B5E3C",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txAbbr: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  txInfo: { flex: 1 },
  txMerchant: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 3 },
  txCategory: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  txCredit: { color: "#10B981" },
  txDebit: { color: "#EDE0B0" },
  txDate: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
});
