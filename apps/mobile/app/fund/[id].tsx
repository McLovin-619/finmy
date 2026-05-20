import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FundRecord = {
  name: string;
  growth: string;
  allTimeLabel: string;
  risk: string;
  category: string;
  invested: number;
  value: number;
  since: string;
  allocation: { label: string; pct: number; color: string }[];
};

const MOCK: Record<string, FundRecord> = {
  "1": {
    name: "Global Tech ETF",
    growth: "+18.2%",
    allTimeLabel: "+18.2% all time",
    risk: "High Risk",
    category: "Stocks",
    invested: 4500000,
    value: 5319000,
    since: "Jan 2025",
    allocation: [
      { label: "Technology", pct: 55, color: "#C8911A" },
      { label: "Healthcare", pct: 20, color: "#D4A830" },
      { label: "Financials", pct: 15, color: "#E8C86A" },
      { label: "Other", pct: 10, color: "#D1D5DB" },
    ],
  },
};

function fmt(halala: number) {
  return (halala / 100).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FundDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fund = MOCK[id] ?? MOCK["1"];
  const [autoInvest, setAutoInvest] = React.useState(true);

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
        <Text style={styles.fundName}>{fund.name}</Text>
        <View style={styles.riskBadge}>
          <Text style={styles.riskText}>{fund.risk}</Text>
        </View>
        <Text style={styles.valueLabel}>Current Value</Text>
        <Text style={styles.valueAmount}>SAR {fmt(fund.value)}</Text>
        <View style={styles.growthBadge}>
          <Ionicons name="trending-up" size={13} color="white" />
          <Text style={styles.growthText}> {fund.allTimeLabel}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Performance chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Performance</Text>
            <TouchableOpacity style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>This Week</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Chart coming soon</Text>
          </View>
        </View>

        {/* Investment info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Investment</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>INVESTED</Text>
              <Text style={styles.infoValue}>SAR {fmt(fund.invested)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>RETURN</Text>
              <Text style={[styles.infoValue, styles.returnGreen]}>{fund.growth}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SINCE</Text>
              <Text style={styles.infoValue}>{fund.since}</Text>
            </View>
          </View>
        </View>

        {/* Auto-invest toggle */}
        <View style={styles.card}>
          <View style={styles.autoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.autoTitle}>Auto-Invest</Text>
              <Text style={styles.autoSubtitle}>Automatically invest monthly</Text>
            </View>
            <Switch
              value={autoInvest}
              onValueChange={setAutoInvest}
              trackColor={{ false: "#E5E7EB", true: "#C8911A" }}
              thumbColor="white"
            />
          </View>
          {autoInvest && (
            <View style={styles.autoAmount}>
              <Text style={styles.autoAmountLabel}>Monthly amount</Text>
              <Text style={styles.autoAmountValue}>SAR 500.00</Text>
            </View>
          )}
        </View>

        {/* Allocation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sector Allocation</Text>
          {fund.allocation.map((a) => (
            <View key={a.label} style={styles.allocRow}>
              <View style={[styles.allocDot, { backgroundColor: a.color }]} />
              <Text style={styles.allocLabel}>{a.label}</Text>
              <View style={styles.allocBarBg}>
                <View
                  style={[
                    styles.allocBarFill,
                    { width: `${a.pct}%` as any, backgroundColor: a.color },
                  ]}
                />
              </View>
              <Text style={styles.allocPct}>{a.pct}%</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaWrap} activeOpacity={0.85}>
          <LinearGradient
            colors={["#C8911A", "#D4A830"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Adjust Investment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  hero: { paddingHorizontal: 24, paddingBottom: 36 },
  backButton: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  fundName: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 8,
  },
  riskBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  riskText: { fontSize: 12, color: "white", fontFamily: "Inter_500Medium" },
  valueLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  valueAmount: {
    fontSize: 36,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 12,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  growthText: { fontSize: 13, color: "white", fontFamily: "Inter_500Medium" },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 16,
  },
  weekBadge: {
    backgroundColor: "#221D12",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weekBadgeText: { fontSize: 12, color: "#C8911A", fontFamily: "Inter_500Medium" },
  chartPlaceholder: {
    height: 100,
    backgroundColor: "#1E1A10",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chartPlaceholderText: { color: "#D1D5DB", fontSize: 13, fontFamily: "Inter_400Regular" },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoItem: { flex: 1, alignItems: "center" },
  infoLabel: {
    fontSize: 10,
    color: "#6B5E3C",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  returnGreen: { color: "#10B981" },
  infoDivider: { width: 1, height: 36, backgroundColor: "#1E1A10" },
  autoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  autoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 3 },
  autoSubtitle: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  autoAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  autoAmountLabel: { fontSize: 13, color: "#8C7C55", fontFamily: "Inter_400Regular" },
  autoAmountValue: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  allocRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  allocDot: { width: 10, height: 10, borderRadius: 5 },
  allocLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A89B6E", width: 90 },
  allocBarBg: { flex: 1, height: 6, backgroundColor: "#1E1A10", borderRadius: 3 },
  allocBarFill: { height: 6, borderRadius: 3 },
  allocPct: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#8C7C55",
    width: 34,
    textAlign: "right",
  },
  ctaWrap: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  ctaGradient: { alignItems: "center", paddingVertical: 16 },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
