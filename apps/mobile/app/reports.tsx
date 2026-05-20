import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_REPORTS, type MonthlyReport, type SpendCategory } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function spendDelta(report: MonthlyReport) {
  const delta = report.totalSpendSar - report.prevMonthSpendSar;
  const pct = ((delta / report.prevMonthSpendSar) * 100).toFixed(1);
  return { delta, pct, up: delta > 0 };
}

function fmtSar(n: number) {
  return `SAR ${n.toLocaleString("en-SA")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MonthChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.monthChip, active && styles.monthChipActive]}
      activeOpacity={0.75}
    >
      <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CategoryBar({ cat, maxAmt }: { cat: SpendCategory; maxAmt: number }) {
  const fillPct = Math.round((cat.amountSar / maxAmt) * 100);
  const isUp = cat.changePct > 0;
  const isFlat = cat.changePct === 0;
  return (
    <View style={styles.catRow}>
      <View style={[styles.catIconWrap, { backgroundColor: cat.color + "18" }]}>
        <Ionicons name={cat.icon as any} size={16} color={cat.color} />
      </View>
      <View style={styles.catMid}>
        <View style={styles.catTitleRow}>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catAmt}>{fmtSar(cat.amountSar)}</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${fillPct}%` as any, backgroundColor: cat.color }]}
          />
        </View>
        <View style={styles.catMeta}>
          <Text style={styles.catPct}>{cat.pct}% of spend</Text>
          {!isFlat && (
            <View style={[styles.changePill, { backgroundColor: isUp ? "#FEF2F2" : "#ECFDF5" }]}>
              <Ionicons
                name={isUp ? "arrow-up" : "arrow-down"}
                size={10}
                color={isUp ? "#EF4444" : "#10B981"}
              />
              <Text style={[styles.changePillText, { color: isUp ? "#EF4444" : "#10B981" }]}>
                {Math.abs(cat.changePct)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(MOCK_REPORTS[0].id);
  const monthScrollRef = useRef<ScrollView>(null);

  const report = MOCK_REPORTS.find((r) => r.id === selectedId)!;
  const { delta, pct, up } = spendDelta(report);
  const maxCatAmt = Math.max(...report.categories.map((c) => c.amountSar));
  const savingsRate = Math.round((report.savingsSar / report.incomeSar) * 100);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Reports</Text>
        <TouchableOpacity
          onPress={() => Alert.alert("Export", "PDF export will be available in the next release.")}
        >
          <Ionicons name="share-outline" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <ScrollView
        ref={monthScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthRow}
        style={styles.monthScroll}
      >
        {MOCK_REPORTS.map((r) => (
          <MonthChip
            key={r.id}
            label={r.monthLabel}
            active={r.id === selectedId}
            onPress={() => setSelectedId(r.id)}
          />
        ))}
      </ScrollView>

      {/* Summary hero card */}
      <LinearGradient
        colors={["#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Total spend · {report.monthLabel}</Text>
            <Text style={styles.heroAmount}>{fmtSar(report.totalSpendSar)}</Text>
          </View>
          <View
            style={[
              styles.deltaBadge,
              { backgroundColor: up ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)" },
            ]}
          >
            <Ionicons
              name={up ? "trending-up" : "trending-down"}
              size={13}
              color={up ? "#FCA5A5" : "#6EE7B7"}
            />
            <Text style={[styles.deltaBadgeText, { color: up ? "#FCA5A5" : "#6EE7B7" }]}>
              {up ? "+" : ""}
              {pct}%
            </Text>
          </View>
        </View>

        {/* Three stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Income</Text>
            <Text style={styles.heroStatValue}>{fmtSar(report.incomeSar)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Saved</Text>
            <Text style={styles.heroStatValue}>{fmtSar(report.savingsSar)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Rate</Text>
            <Text style={styles.heroStatValue}>{savingsRate}%</Text>
          </View>
        </View>

        {/* vs last month note */}
        <View style={styles.heroVsRow}>
          <Ionicons name="swap-horizontal-outline" size={12} color="rgba(255,255,255,0.6)" />
          <Text style={styles.heroVsText}>
            {up ? "+" : "-"}
            {fmtSar(Math.abs(delta))} vs previous month
          </Text>
        </View>
      </LinearGradient>

      {/* AI Summary */}
      <View style={styles.aiCard}>
        <View style={styles.aiCardHeader}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiIconGrad}
          >
            <Ionicons name="sparkles" size={14} color="white" />
          </LinearGradient>
          <Text style={styles.aiCardTitle}>AI Summary</Text>
          <View style={styles.aiPoweredPill}>
            <Text style={styles.aiPoweredText}>Powered by finmy AI</Text>
          </View>
        </View>
        <Text style={styles.aiSummaryText}>{report.aiSummary}</Text>
      </View>

      {/* Spending breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spending breakdown</Text>
        <Text style={styles.sectionSub}>{report.categories.length} categories</Text>
      </View>
      <View style={styles.card}>
        {report.categories.map((cat, idx) => (
          <View key={cat.id}>
            <CategoryBar cat={cat} maxAmt={maxCatAmt} />
            {idx < report.categories.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* AI Tips */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="sparkles-outline" size={16} color="#7C3AED" />
          <Text style={[styles.sectionTitle, { marginLeft: 5 }]}>AI tips to save more</Text>
        </View>
        <Text style={styles.sectionSub}>{report.aiTips.length} insights</Text>
      </View>

      {report.aiTips.map((tip) => (
        <TouchableOpacity
          key={tip.id}
          style={styles.tipCard}
          activeOpacity={0.9}
          onPress={() => Alert.alert(tip.title, tip.body)}
        >
          <View style={styles.tipLeft}>
            <View style={styles.tipIconWrap}>
              <Ionicons name={tip.icon as any} size={18} color="#7C3AED" />
            </View>
            <View style={styles.tipMid}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipBody} numberOfLines={2}>
                {tip.body}
              </Text>
            </View>
          </View>
          {tip.savingSar !== undefined && (
            <View style={styles.tipSavingBadge}>
              <Text style={styles.tipSavingLabel}>Save</Text>
              <Text style={styles.tipSavingAmt}>SAR {tip.savingSar}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Biggest category callout */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top categories</Text>
      </View>
      <View style={styles.topCatsRow}>
        {report.categories
          .sort((a, b) => b.amountSar - a.amountSar)
          .slice(0, 3)
          .map((cat, idx) => (
            <View key={cat.id} style={styles.topCatCard}>
              <View style={[styles.topCatIconWrap, { backgroundColor: cat.color + "18" }]}>
                <Ionicons name={cat.icon as any} size={20} color={cat.color} />
              </View>
              <Text style={styles.topCatAmt}>{fmtSar(cat.amountSar)}</Text>
              <Text style={styles.topCatName} numberOfLines={1}>
                {cat.name}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: cat.color + "22" }]}>
                <Text style={[styles.rankText, { color: cat.color }]}>#{idx + 1}</Text>
              </View>
            </View>
          ))}
      </View>

      {/* Savings rate visual */}
      <View style={styles.savingsCard}>
        <View style={styles.savingsHeader}>
          <Text style={styles.savingsTitle}>Savings rate</Text>
          <Text style={styles.savingsRate}>{savingsRate}%</Text>
        </View>
        <View style={styles.savingsTrack}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.savingsFill, { width: `${Math.min(savingsRate, 100)}%` as any }]}
          />
        </View>
        <View style={styles.savingsFooter}>
          <Text style={styles.savingsHint}>
            {savingsRate >= 30
              ? "Excellent. You are saving well above the recommended 20% target."
              : savingsRate >= 20
                ? "Good. You are meeting the 20% savings target."
                : "Below the recommended 20% target. Reducing discretionary spend could help."}
          </Text>
          <View style={styles.savingsGoalPin}>
            <Text style={styles.savingsGoalPinText}>20% goal</Text>
          </View>
        </View>
      </View>

      {/* YTD callout */}
      <View style={styles.ytdCard}>
        <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
        <Text style={styles.ytdText}>
          Year-to-date you have spent{" "}
          <Text style={styles.ytdBold}>
            {fmtSar(MOCK_REPORTS.reduce((s, r) => s + r.totalSpendSar, 0))}
          </Text>{" "}
          and saved{" "}
          <Text style={styles.ytdBold}>
            {fmtSar(MOCK_REPORTS.reduce((s, r) => s + r.savingsSar, 0))}
          </Text>
          .
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header
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

  // Month selector
  monthScroll: { marginVertical: 16 },
  monthRow: { paddingHorizontal: 20, gap: 8 },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  monthChipActive: { backgroundColor: "#7C3AED" },
  monthChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7280" },
  monthChipTextActive: { color: "white", fontFamily: "Inter_600SemiBold" },

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  heroAmount: { fontSize: 34, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  deltaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  deltaBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  heroStatValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "white" },
  heroStatDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },
  heroVsRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroVsText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)" },

  // AI summary card
  aiCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  aiIconGrad: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCardTitle: { fontSize: 15, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426", flex: 1 },
  aiPoweredPill: {
    backgroundColor: "#F4F1FA",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiPoweredText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  aiSummaryText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#374151", lineHeight: 22 },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  // Generic card
  card: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  divider: { height: 1, backgroundColor: "#F9FAFB" },

  // Category bars
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catMid: { flex: 1 },
  catTitleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#1A1426" },
  catAmt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  barTrack: {
    height: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  barFill: { height: 5, borderRadius: 3 },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  catPct: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  changePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  // AI tip cards
  tipCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tipLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 12 },
  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tipMid: { flex: 1 },
  tipTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 3 },
  tipBody: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7280", lineHeight: 17 },
  tipSavingBadge: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    minWidth: 64,
  },
  tipSavingLabel: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#10B981", marginBottom: 1 },
  tipSavingAmt: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#059669" },

  // Top 3 categories
  topCatsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  topCatCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: "relative",
  },
  topCatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  topCatAmt: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    marginBottom: 2,
    textAlign: "center",
  },
  topCatName: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
  rankBadge: { marginTop: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rankText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  // Savings rate card
  savingsCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  savingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  savingsTitle: { fontSize: 15, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  savingsRate: { fontSize: 24, fontFamily: "PlusJakartaSans_700Bold", color: "#7C3AED" },
  savingsTrack: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  savingsFill: { height: 8, borderRadius: 4 },
  savingsFooter: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  savingsHint: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 18,
  },
  savingsGoalPin: {
    backgroundColor: "#F4F1FA",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  savingsGoalPinText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },

  // YTD card
  ytdCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: "#F4F1FA",
    borderRadius: 14,
    padding: 14,
  },
  ytdText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 20,
  },
  ytdBold: { fontFamily: "Inter_600SemiBold", color: "#1A1426" },
});
