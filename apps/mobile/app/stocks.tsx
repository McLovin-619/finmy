import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

// ─── API types ────────────────────────────────────────────────────────────────

type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  priceHalalas: number;
  changeHalalas: number;
  changePct: number;
  previousCloseHalalas: number;
  marketState: string;
};

type Holding = {
  symbol: string;
  name: string;
  exchange: string;
  sharesMicro: number;
  avgCostHalalas: number;
  priceHalalas: number;
  valueHalalas: number;
  costHalalas: number;
  unrealizedPlHalalas: number;
  unrealizedPlPct: number;
  dayChangePct: number;
};

type HoldingsResp = {
  holdings: Holding[];
  totalValueHalalas: number;
  totalCostHalalas: number;
  totalUnrealizedPlHalalas: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSar(halalas: number, decimals = 2): string {
  return (halalas / 100).toLocaleString("en-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type Tab = "market" | "holdings";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StocksScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("market");

  const watchlist = useQuery({
    queryKey: ["stocks", "watchlist"],
    queryFn: async () => {
      const res = await apiFetch("/api/stocks/watchlist");
      if (!res.ok) throw new Error("watchlist failed");
      return res.json() as Promise<{ quotes: Quote[] }>;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const holdings = useQuery({
    queryKey: ["stocks", "holdings"],
    queryFn: async () => {
      const res = await apiFetch("/api/stocks/holdings");
      if (!res.ok) throw new Error("holdings failed");
      return res.json() as Promise<HoldingsResp>;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const totalPL = holdings.data?.totalUnrealizedPlHalalas ?? 0;
  const totalValue = holdings.data?.totalValueHalalas ?? 0;
  const totalCost = holdings.data?.totalCostHalalas ?? 0;
  const totalPlPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const sortedQuotes = useMemo(() => {
    if (!watchlist.data?.quotes) return [];
    return [...watchlist.data.quotes].sort((a, b) => {
      // Tadawul stocks first (familiar to Saudi users), then NASDAQ
      if (a.exchange !== b.exchange) {
        return a.exchange === "Tadawul" ? -1 : 1;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }, [watchlist.data]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stocks</Text>
        <TouchableOpacity onPress={() => watchlist.refetch()}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Portfolio summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Portfolio value</Text>
        <Text style={styles.summaryValue}>SAR {fmtSar(totalValue)}</Text>
        <View style={styles.summaryPlRow}>
          <Ionicons
            name={totalPL >= 0 ? "trending-up" : "trending-down"}
            size={14}
            color={totalPL >= 0 ? "#10B981" : "#EF4444"}
          />
          <Text style={[styles.summaryPl, { color: totalPL >= 0 ? "#10B981" : "#EF4444" }]}>
            {totalPL >= 0 ? "+" : "−"}SAR {fmtSar(Math.abs(totalPL))} ({totalPlPct >= 0 ? "+" : ""}
            {totalPlPct.toFixed(2)}%)
          </Text>
          <Text style={styles.summaryPlLabel}>all time</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "market" && styles.tabActive]}
          onPress={() => setTab("market")}
        >
          <Text style={[styles.tabText, tab === "market" && styles.tabTextActive]}>Market</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "holdings" && styles.tabActive]}
          onPress={() => setTab("holdings")}
        >
          <Text style={[styles.tabText, tab === "holdings" && styles.tabTextActive]}>
            Your stocks
            {holdings.data?.holdings.length ? ` (${holdings.data.holdings.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "market" ? (
          watchlist.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#7C3AED" />
              <Text style={styles.muted}>Loading live prices…</Text>
            </View>
          ) : watchlist.error ? (
            <View style={styles.center}>
              <Ionicons name="cloud-offline-outline" size={28} color="#9CA3AF" />
              <Text style={styles.muted}>Market data unavailable</Text>
            </View>
          ) : (
            <>
              <SectionHeader title="Tadawul" subtitle="Saudi Stock Exchange" />
              {sortedQuotes.filter((q) => q.exchange === "Tadawul").map((q) => (
                <QuoteRow key={q.symbol} quote={q} />
              ))}
              <SectionHeader title="NASDAQ" subtitle="US markets · converted to SAR" />
              {sortedQuotes.filter((q) => q.exchange === "NASDAQ").map((q) => (
                <QuoteRow key={q.symbol} quote={q} />
              ))}
            </>
          )
        ) : holdings.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : !holdings.data?.holdings.length ? (
          <View style={styles.center}>
            <Ionicons name="briefcase-outline" size={32} color="#D1D5DB" />
            <Text style={styles.muted}>You don't own any stocks yet</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => setTab("market")}>
              <Text style={styles.exploreBtnText}>Explore market</Text>
            </TouchableOpacity>
          </View>
        ) : (
          holdings.data.holdings.map((h) => <HoldingRow key={h.symbol} holding={h} />)
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

function QuoteRow({ quote }: { quote: Quote }) {
  const up = quote.changePct >= 0;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/stocks/${encodeURIComponent(quote.symbol)}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.rowMid}>
        <Text style={styles.rowSymbol}>{quote.symbol.replace(".SR", "")}</Text>
        <Text style={styles.rowName} numberOfLines={1}>
          {quote.name} · {quote.sector}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>SAR {fmtSar(quote.priceHalalas)}</Text>
        <View style={[styles.rowPill, { backgroundColor: up ? "#ECFDF5" : "#FEF2F2" }]}>
          <Text style={[styles.rowPillText, { color: up ? "#10B981" : "#EF4444" }]}>
            {up ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  const up = holding.unrealizedPlHalalas >= 0;
  const shares = holding.sharesMicro / 1_000_000;
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/stocks/${encodeURIComponent(holding.symbol)}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.rowMid}>
        <Text style={styles.rowSymbol}>{holding.symbol.replace(".SR", "")}</Text>
        <Text style={styles.rowName} numberOfLines={1}>
          {shares.toFixed(4)} sh · avg SAR {fmtSar(holding.avgCostHalalas)}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>SAR {fmtSar(holding.valueHalalas)}</Text>
        <Text style={[styles.rowPl, { color: up ? "#10B981" : "#EF4444" }]}>
          {up ? "+" : "−"}SAR {fmtSar(Math.abs(holding.unrealizedPlHalalas))} (
          {up ? "+" : ""}
          {holding.unrealizedPlPct.toFixed(2)}%)
        </Text>
      </View>
    </TouchableOpacity>
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

  summaryCard: {
    margin: 20,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  summaryValue: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginTop: 4,
  },
  summaryPlRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  summaryPl: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  summaryPlLabel: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: { backgroundColor: "#F4F1FA" },
  tabText: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_500Medium" },
  tabTextActive: { color: "#7C3AED", fontFamily: "Inter_600SemiBold" },

  list: { flex: 1 },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionTitle: { fontSize: 14, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  sectionSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  rowMid: { flex: 1 },
  rowSymbol: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  rowName: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowPrice: { fontSize: 14, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  rowPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  rowPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  rowPl: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 3 },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 10 },
  muted: { fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F4F1FA",
  },
  exploreBtnText: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_600SemiBold" },
});
