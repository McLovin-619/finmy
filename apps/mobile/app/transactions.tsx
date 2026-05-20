import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiTransaction = {
  id: string;
  type: string;
  amountHalalas: number;
  status: string;
  description: string | null;
  occurredAt: string;
  isCredit: boolean;
};

type TransactionsPage = {
  transactions: ApiTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ListItem =
  | { kind: "header"; label: string }
  | { kind: "tx"; tx: ApiTransaction; displayLabel: string; abbr: string; color: string; category: string };

// ─── Display metadata ─────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; abbr: string; color: string; category: string }> = {
  transfer_in:          { label: "Received",     abbr: "TR", color: "#10B981", category: "Transfer"   },
  transfer_out:         { label: "Sent",          abbr: "TR", color: "#C8911A", category: "Transfer"   },
  top_up:               { label: "Top Up",        abbr: "TU", color: "#10B981", category: "Top Up"     },
  withdrawal:           { label: "Withdrawal",    abbr: "WD", color: "#EF4444", category: "Withdrawal" },
  salary_payment:       { label: "Salary",        abbr: "SL", color: "#10B981", category: "Income"     },
  bonus:                { label: "Bonus",         abbr: "BN", color: "#10B981", category: "Income"     },
  allowance_payment:    { label: "Allowance",     abbr: "AL", color: "#F59E0B", category: "Transfer"   },
  investment_deduction: { label: "Investment",    abbr: "IN", color: "#6366F1", category: "Investment" },
  bill_payment:         { label: "Bill Payment",  abbr: "BP", color: "#EF4444", category: "Bills"      },
  card_payment:         { label: "Card Payment",  abbr: "CP", color: "#374151", category: "Card"       },
  deduction:            { label: "Deduction",     abbr: "DD", color: "#EF4444", category: "Other"      },
};

function getMeta(type: string) {
  return TYPE_META[type] ?? { label: type, abbr: type.slice(0, 2).toUpperCase(), color: "#9CA3AF", category: "Other" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const txMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = todayMs - txMs;
  if (diff === 0) return "Today";
  if (diff === 86_400_000) return "Yesterday";
  return d.toLocaleDateString("en-SA", { day: "numeric", month: "short" });
}

function fmt(halalas: number) {
  return (halalas / 100).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildListItems(txs: ApiTransaction[]): ListItem[] {
  const items: ListItem[] = [];
  let lastLabel = "";
  for (const tx of txs) {
    const label = getDateLabel(tx.occurredAt);
    if (label !== lastLabel) {
      items.push({ kind: "header", label });
      lastLabel = label;
    }
    const meta = getMeta(tx.type);
    items.push({ kind: "tx", tx, displayLabel: tx.description ?? meta.label, ...meta });
  }
  return items;
}

// ─── Filter config ────────────────────────────────────────────────────────────

const FILTERS = ["All", "Income", "Expense"] as const;
type Filter = (typeof FILTERS)[number];

function toApiFilter(f: Filter): "all" | "income" | "expense" {
  return f.toLowerCase() as "all" | "income" | "expense";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("All");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["transactions", filter],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ filter: toApiFilter(filter) });
      if (pageParam) params.set("cursor", pageParam);
      const res = await apiFetch(`/api/wallet/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      return res.json() as Promise<TransactionsPage>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allTxs = data?.pages.flatMap((p) => p.transactions) ?? [];
  const filtered = allTxs.filter((t) => {
    const meta = getMeta(t.type);
    const label = t.description ?? meta.label;
    return (
      label.toLowerCase().includes(search.toLowerCase()) ||
      meta.category.toLowerCase().includes(search.toLowerCase())
    );
  });
  const listItems = buildListItems(filtered);

  function renderItem({ item }: { item: ListItem }) {
    if (item.kind === "header") {
      return <Text style={styles.groupLabel}>{item.label}</Text>;
    }
    const { tx, displayLabel, abbr, color, category } = item;
    return (
      <TouchableOpacity
        style={styles.txRow}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: tx.id } } as any)}
      >
        <View style={[styles.txAvatar, { backgroundColor: color + "20" }]}>
          <Text style={[styles.txAbbr, { color }]}>{abbr}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txMerchant} numberOfLines={1}>{displayLabel}</Text>
          <Text style={styles.txCategory}>{category}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, tx.isCredit ? styles.txCredit : styles.txDebit]}>
            {tx.isCredit ? "+" : "−"} SAR {fmt(tx.amountHalalas)}
          </Text>
          <Text style={styles.txDate}>
            {new Date(tx.occurredAt).toLocaleTimeString("en-SA", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
          <Ionicons name="chevron-back" size={22} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerIconButton} />
      </View>

      {/* Search */}
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

      {/* Filters */}
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

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load transactions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) =>
            item.kind === "header" ? `header-${item.label}` : item.tx.id
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor="#7C3AED"
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "white" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F1FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1A1426" },
  filtersRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#374151" },
  chipTextActive: { color: "white" },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
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
  txMerchant: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 3 },
  txCategory: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  txCredit: { color: "#10B981" },
  txDebit: { color: "#1A1426" },
  txDate: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, color: "#EF4444", fontFamily: "Inter_400Regular" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#7C3AED",
    borderRadius: 20,
  },
  retryText: { fontSize: 14, color: "white", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  footer: { paddingVertical: 20, alignItems: "center" },
});
