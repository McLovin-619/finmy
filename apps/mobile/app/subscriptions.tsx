import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_SUBSCRIPTIONS, type Subscription, type SubscriptionCategory } from "@/lib/mock-data";

// ─── Types / constants ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  entertainment: "Entertainment",
  productivity: "Productivity",
  health: "Health",
  shopping: "Shopping",
  food: "Food",
  finance: "Finance",
};

const CATEGORY_ICONS: Record<SubscriptionCategory, keyof typeof Ionicons.glyphMap> = {
  entertainment: "film-outline",
  productivity: "briefcase-outline",
  health: "fitness-outline",
  shopping: "bag-outline",
  food: "restaurant-outline",
  finance: "trending-up-outline",
};

type FilterCategory = "all" | SubscriptionCategory;

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "entertainment", label: "Entertainment" },
  { value: "productivity", label: "Productivity" },
  { value: "health", label: "Health" },
  { value: "shopping", label: "Shopping" },
  { value: "food", label: "Food" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS);

  const visible =
    filter === "all" ? subscriptions : subscriptions.filter((s) => s.category === filter);
  const active = subscriptions.filter((s) => s.status === "active");

  const monthlyTotal = active.reduce((sum, s) => {
    if (s.cycle === "monthly") return sum + s.amountSar;
    if (s.cycle === "yearly") return sum + s.amountSar / 12;
    return sum;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  function toggleStatus(id: string) {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s
      )
    );
  }

  function onManage(sub: Subscription) {
    const isPaused = sub.status === "paused";
    const options = isPaused
      ? ["Resume", "Cancel Subscription", "Cancel"]
      : ["Pause", "Cancel Subscription", "Cancel"];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: sub.name,
          options,
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (idx) => {
          if (idx === 0) toggleStatus(sub.id);
          if (idx === 1) confirmCancel(sub);
        }
      );
    } else {
      Alert.alert(sub.name, "Manage subscription", [
        { text: isPaused ? "Resume" : "Pause", onPress: () => toggleStatus(sub.id) },
        { text: "Cancel Subscription", style: "destructive", onPress: () => confirmCancel(sub) },
        { text: "Dismiss", style: "cancel" },
      ]);
    }
  }

  function confirmCancel(sub: Subscription) {
    Alert.alert(
      "Cancel Subscription",
      `Cancel ${sub.name} for SAR ${sub.amountSar}/${sub.cycle === "monthly" ? "mo" : "yr"}?`,
      [
        { text: "Keep It", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: () => setSubscriptions((prev) => prev.filter((s) => s.id !== sub.id)),
        },
      ]
    );
  }

  const nextDue = visible
    .filter((s) => s.status === "active")
    .sort((a, b) => a.nextBillingDay - b.nextBillingDay)[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Monthly spend</Text>
          <Text style={styles.summaryAmount}>
            SAR <Text style={styles.summaryAmountBig}>{monthlyTotal.toFixed(2)}</Text>
          </Text>
          <Text style={styles.summaryYearly}>SAR {yearlyTotal.toFixed(0)} per year</Text>
        </View>
        <View style={styles.summaryRight}>
          <View style={styles.summaryStatRow}>
            <View style={[styles.summaryDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.summaryStat}>{active.length} active</Text>
          </View>
          <View style={styles.summaryStatRow}>
            <View style={[styles.summaryDot, { backgroundColor: "#9CA3AF" }]} />
            <Text style={styles.summaryStat}>{subscriptions.length - active.length} paused</Text>
          </View>
          {nextDue ? (
            <View style={styles.nextDueWrap}>
              <Ionicons name="calendar-outline" size={12} color="#C8911A" />
              <Text style={styles.nextDueText}>
                Next: {nextDue.name} on {nextDue.nextBillingDay}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipOn]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextOn]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <View style={styles.listWrap}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>No subscriptions in this category</Text>
          </View>
        ) : (
          visible.map((sub) => <SubscriptionRow key={sub.id} sub={sub} onManage={onManage} />)
        )}
      </View>

      {/* Add subscription CTA */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          Alert.alert(
            "Coming soon",
            "Manual subscription entry will be available in the next release."
          )
        }
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={18} color="#C8911A" />
        <Text style={styles.addButtonText}>Add subscription</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

function SubscriptionRow({
  sub,
  onManage,
}: { sub: Subscription; onManage: (s: Subscription) => void }) {
  const isPaused = sub.status === "paused";
  const cycleLabel = sub.cycle === "monthly" ? "mo" : "yr";
  const today = new Date().getDate();
  const daysUntil =
    sub.nextBillingDay >= today ? sub.nextBillingDay - today : 30 - today + sub.nextBillingDay;
  const dueSoon = daysUntil <= 3 && !isPaused;

  return (
    <TouchableOpacity
      style={[styles.row, isPaused && styles.rowPaused]}
      onPress={() => onManage(sub)}
      activeOpacity={0.7}
    >
      <View style={[styles.rowAvatar, { backgroundColor: isPaused ? "#E5E7EB" : sub.color }]}>
        <Text style={[styles.rowAvatarText, isPaused && styles.rowAvatarTextPaused]}>
          {sub.initials}
        </Text>
      </View>
      <View style={styles.rowMid}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowName, isPaused && styles.rowNamePaused]}>{sub.name}</Text>
          {isPaused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedBadgeText}>Paused</Text>
            </View>
          )}
          {dueSoon && !isPaused && (
            <View style={styles.dueSoonBadge}>
              <Text style={styles.dueSoonBadgeText}>Due soon</Text>
            </View>
          )}
        </View>
        <View style={styles.rowMetaRow}>
          <Ionicons name={CATEGORY_ICONS[sub.category]} size={11} color="#9CA3AF" />
          <Text style={styles.rowMeta}>{CATEGORY_LABELS[sub.category]}</Text>
          {!isPaused && (
            <Text style={styles.rowMeta}>
              {" "}
              · Renews {sub.nextBillingDay} {monthName()}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, isPaused && styles.rowAmountPaused]}>
          SAR {sub.amountSar}
        </Text>
        <Text style={styles.rowCycle}>/{cycleLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

function monthName() {
  return new Date().toLocaleString("en-SA", { month: "short" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Summary card
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#C8911A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryLeft: {},
  summaryLabel: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginBottom: 4 },
  summaryAmount: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#8C7C55" },
  summaryAmountBig: { fontSize: 32, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  summaryYearly: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginTop: 4 },
  summaryRight: { alignItems: "flex-end", gap: 6 },
  summaryStatRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryStat: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A89B6E" },
  nextDueWrap: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  nextDueText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#C8911A" },

  // Filters
  filtersRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  filterChipOn: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  filterTextOn: { color: "white" },

  // List
  listWrap: { paddingHorizontal: 20, gap: 8 },

  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowPaused: { opacity: 0.7 },
  rowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowAvatarTextPaused: { color: "#6B5E3C" },
  rowMid: { flex: 1 },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  rowNamePaused: { color: "#6B5E3C" },
  pausedBadge: {
    backgroundColor: "#1E1A10",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pausedBadgeText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#6B5E3C" },
  dueSoonBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueSoonBadgeText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#D97706" },
  rowMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowMeta: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  rowRight: { alignItems: "flex-end" },
  rowAmount: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  rowAmountPaused: { color: "#6B5E3C" },
  rowCycle: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    borderStyle: "dashed",
    backgroundColor: "#1A1610",
  },
  addButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C8911A" },
});
