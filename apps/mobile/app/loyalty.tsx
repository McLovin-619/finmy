import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MOCK_LOYALTY,
  MOCK_POINTS_ACTIVITY,
  MOCK_TIERS,
  type Tier,
  type TierName,
} from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTier(name: TierName): Tier {
  return MOCK_TIERS.find((t) => t.name === name)!;
}

function getNextTier(name: TierName): Tier | null {
  const idx = MOCK_TIERS.findIndex((t) => t.name === name);
  return idx < MOCK_TIERS.length - 1 ? MOCK_TIERS[idx + 1] : null;
}

/** Progress fraction (0–1) between current tier threshold and next tier threshold */
function tierProgress(points: number, current: Tier, next: Tier | null): number {
  if (!next) return 1;
  const range = next.pointsRequired - current.pointsRequired;
  return Math.min(1, (points - current.pointsRequired) / range);
}

// ─── Benefit definitions shown on the screen ──────────────────────────────────

type BenefitDef = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  getValue: (t: Tier) => string;
  color: string;
};

const BENEFITS: BenefitDef[] = [
  {
    icon: "wallet-outline",
    label: "Cashback",
    getValue: (t) => `${t.cashbackPct}%`,
    color: "#10B981",
  },
  {
    icon: "flash-outline",
    label: "Points multiplier",
    getValue: (t) => `${t.pointsMultiplier}×`,
    color: "#F59E0B",
  },
  {
    icon: "arrow-up-outline",
    label: "Withdrawal limit",
    getValue: (t) => `SAR ${(t.withdrawalLimitSar / 1000).toFixed(0)}k`,
    color: "#3B82F6",
  },
  {
    icon: "pricetag-outline",
    label: "Fee discount",
    getValue: (t) => (t.feeDiscountPct > 0 ? `${t.feeDiscountPct}%` : "None"),
    color: "#8B5CF6",
  },
  {
    icon: "trending-up-outline",
    label: "Exclusive investments",
    getValue: (t) => (t.exclusiveInvestments ? "Unlocked" : "Locked"),
    color: "#C8911A",
  },
  {
    icon: "headset-outline",
    label: "Dedicated support",
    getValue: (t) => (t.dedicatedSupport ? "Unlocked" : "Locked"),
    color: "#D4A830",
  },
];

const EARN_METHODS = [
  {
    icon: "card-outline" as const,
    label: "Card spend",
    desc: "1 pt per SAR 1 spent (multiplied by your tier rate)",
  },
  {
    icon: "trending-up-outline" as const,
    label: "Auto-Investment deposit",
    desc: "2 pts per SAR 1 deposited",
  },
  { icon: "add-circle-outline" as const, label: "Top Up", desc: "0.5 pts per SAR 1 topped up" },
  { icon: "receipt-outline" as const, label: "Bill payment", desc: "15 pts per bill paid on time" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTierName, setSelectedTierName] = useState<TierName>(MOCK_LOYALTY.currentTier);

  const currentTier = getTier(MOCK_LOYALTY.currentTier);
  const nextTier = getNextTier(MOCK_LOYALTY.currentTier);
  const progress = tierProgress(MOCK_LOYALTY.totalPoints, currentTier, nextTier);
  const ptsToNext = nextTier ? nextTier.pointsRequired - MOCK_LOYALTY.totalPoints : 0;

  const selectedTier = getTier(selectedTierName);
  const isCurrentTier = selectedTierName === MOCK_LOYALTY.currentTier;

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
        <Text style={styles.headerTitle}>Loyalty & Tiers</Text>
        <TouchableOpacity
          onPress={() => Alert.alert("Points History", "Full history coming soon.")}
        >
          <Ionicons name="time-outline" size={22} color="#C8911A" />
        </TouchableOpacity>
      </View>

      {/* Hero points card */}
      <LinearGradient
        colors={currentTier.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Tier badge */}
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Ionicons name={currentTier.icon as any} size={14} color="white" />
            <Text style={styles.heroBadgeText}>{currentTier.name}</Text>
          </View>
          <Text style={styles.heroMonthPts}>+{MOCK_LOYALTY.pointsThisMonth} pts this month</Text>
        </View>

        {/* Points */}
        <Text style={styles.heroPointsLabel}>Your points</Text>
        <Text style={styles.heroPoints}>
          {MOCK_LOYALTY.totalPoints.toLocaleString("en-SA")}
          <Text style={styles.heroPtsSuffix}> pts</Text>
        </Text>

        {/* Progress to next tier */}
        {nextTier ? (
          <View style={styles.heroProgressWrap}>
            <View style={styles.heroProgressLabels}>
              <Text style={styles.heroProgressCurrent}>{currentTier.name}</Text>
              <Text style={styles.heroProgressNext}>
                {ptsToNext.toLocaleString("en-SA")} pts to {nextTier.name}
              </Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${Math.round(progress * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.heroProgressPct}>
              {Math.round(progress * 100)}% of the way to {nextTier.name}
            </Text>
          </View>
        ) : (
          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-circle" size={14} color="white" />
            <Text style={styles.heroBadgeText}>Max tier reached</Text>
          </View>
        )}

        {/* Cashback earned */}
        <View style={styles.heroCashbackRow}>
          <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.heroCashbackText}>
            SAR {MOCK_LOYALTY.cashbackEarnedSar} cashback earned lifetime
          </Text>
        </View>
      </LinearGradient>

      {/* Tier progression track */}
      <View style={styles.tierTrackWrap}>
        <View style={styles.tierTrack}>
          {MOCK_TIERS.map((tier, idx) => {
            const tierIdx = MOCK_TIERS.findIndex((t) => t.name === MOCK_LOYALTY.currentTier);
            const isPast = idx < tierIdx;
            const isCurrent = idx === tierIdx;
            const isFuture = idx > tierIdx;
            const isSelected = tier.name === selectedTierName;
            const isLast = idx === MOCK_TIERS.length - 1;

            return (
              <React.Fragment key={tier.name}>
                <TouchableOpacity
                  style={styles.tierNode}
                  onPress={() => setSelectedTierName(tier.name)}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={isPast || isCurrent ? tier.colors : ["#E5E7EB", "#D1D5DB"]}
                    style={[styles.tierNodeCircle, isSelected && styles.tierNodeCircleSelected]}
                  >
                    <Ionicons
                      name={tier.icon as any}
                      size={16}
                      color={isPast || isCurrent ? "white" : "#9CA3AF"}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.tierNodeLabel,
                      isCurrent && styles.tierNodeLabelCurrent,
                      isFuture && styles.tierNodeLabelFuture,
                    ]}
                  >
                    {tier.name}
                  </Text>
                  {isCurrent && <View style={styles.tierNodeCurrentDot} />}
                </TouchableOpacity>
                {!isLast && (
                  <View style={[styles.tierConnector, isPast && styles.tierConnectorPast]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Selected tier info label */}
      <View style={styles.selectedTierLabel}>
        <LinearGradient
          colors={selectedTier.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.selectedTierPill}
        >
          <Ionicons name={selectedTier.icon as any} size={13} color="white" />
          <Text style={styles.selectedTierPillText}>{selectedTier.name} tier</Text>
        </LinearGradient>
        {!isCurrentTier && (
          <Text style={styles.selectedTierReq}>
            Requires {selectedTier.pointsRequired.toLocaleString("en-SA")} pts
          </Text>
        )}
      </View>

      {/* Benefits grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isCurrentTier ? "Your benefits" : `${selectedTierName} benefits`}
        </Text>
      </View>
      <View style={styles.benefitsGrid}>
        {BENEFITS.map((b) => {
          const value = b.getValue(selectedTier);
          const isUpgrade = !isCurrentTier;
          return (
            <View
              key={b.label}
              style={[styles.benefitCard, isUpgrade && styles.benefitCardUpgrade]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: b.color + "18" }]}>
                <Ionicons name={b.icon} size={20} color={isUpgrade ? "#9CA3AF" : b.color} />
              </View>
              <Text style={[styles.benefitValue, isUpgrade && styles.benefitValueUpgrade]}>
                {value}
              </Text>
              <Text style={styles.benefitLabel}>{b.label}</Text>
              {isUpgrade && (
                <View style={styles.benefitLockBadge}>
                  <Ionicons name="lock-closed" size={9} color="#9CA3AF" />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Comparison strip (only when a non-current tier is selected) */}
      {!isCurrentTier && (
        <View style={styles.comparisonBanner}>
          <View style={styles.comparisonSide}>
            <Text style={styles.comparisonTierLabel}>{currentTier.name} (you)</Text>
            <Text style={styles.comparisonValue}>{currentTier.cashbackPct}% cashback</Text>
            <Text style={styles.comparisonValue}>{currentTier.pointsMultiplier}× points</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
          <View style={styles.comparisonSide}>
            <Text style={[styles.comparisonTierLabel, { color: "#C8911A" }]}>
              {selectedTierName}
            </Text>
            <Text style={[styles.comparisonValue, { color: "#C8911A" }]}>
              {selectedTier.cashbackPct}% cashback
            </Text>
            <Text style={[styles.comparisonValue, { color: "#C8911A" }]}>
              {selectedTier.pointsMultiplier}× points
            </Text>
          </View>
        </View>
      )}

      {/* How to earn */}
      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>How to earn points</Text>
      <View style={styles.earnCard}>
        {EARN_METHODS.map((method, idx) => (
          <View key={method.label}>
            <View style={styles.earnRow}>
              <View style={styles.earnIconWrap}>
                <Ionicons name={method.icon} size={18} color="#C8911A" />
              </View>
              <View style={styles.earnMid}>
                <Text style={styles.earnLabel}>{method.label}</Text>
                <Text style={styles.earnDesc}>{method.desc}</Text>
              </View>
            </View>
            {idx < EARN_METHODS.length - 1 && <View style={styles.earnDivider} />}
          </View>
        ))}
        <View style={styles.multiplierNote}>
          <Ionicons name="information-circle-outline" size={14} color="#C8911A" />
          <Text style={styles.multiplierNoteText}>
            Your {currentTier.name} multiplier of {currentTier.pointsMultiplier}× applies to all
            card spend earnings.
          </Text>
        </View>
      </View>

      {/* Points activity */}
      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Recent activity</Text>
      <View style={styles.activityCard}>
        {MOCK_POINTS_ACTIVITY.map((item, idx) => {
          const isEarn = item.points > 0;
          return (
            <View key={item.id}>
              <View style={styles.activityRow}>
                <View
                  style={[styles.activityDot, { backgroundColor: isEarn ? "#10B981" : "#EF4444" }]}
                />
                <View style={styles.activityMid}>
                  <Text style={styles.activityDesc}>{item.description}</Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
                <Text style={[styles.activityPoints, { color: isEarn ? "#10B981" : "#EF4444" }]}>
                  {isEarn ? "+" : ""}
                  {item.points} pts
                </Text>
              </View>
              {idx < MOCK_POINTS_ACTIVITY.length - 1 && <View style={styles.activityDivider} />}
            </View>
          );
        })}
      </View>

      {/* Redeem CTA */}
      <TouchableOpacity
        style={styles.redeemBtn}
        onPress={() => router.push("/store" as any)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#C8911A", "#D4A830"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.redeemGradient}
        >
          <Ionicons name="gift-outline" size={20} color="white" />
          <Text style={styles.redeemText}>Redeem points in the Store</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
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

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  heroBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  heroBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "white" },
  heroMonthPts: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  heroPointsLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  heroPoints: {
    fontSize: 44,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 20,
  },
  heroPtsSuffix: { fontSize: 22, fontFamily: "Inter_400Regular" },
  heroProgressWrap: { marginBottom: 14 },
  heroProgressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  heroProgressCurrent: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  heroProgressNext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  heroProgressFill: { height: 6, backgroundColor: "#1A1610", borderRadius: 3 },
  heroProgressPct: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
  },
  heroCashbackRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  heroCashbackText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },

  // Tier track
  tierTrackWrap: { paddingHorizontal: 20, marginBottom: 8 },
  tierTrack: { flexDirection: "row", alignItems: "center" },
  tierNode: { alignItems: "center", gap: 6, position: "relative" },
  tierNodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tierNodeCircleSelected: {
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#C8911A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tierNodeLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#6B5E3C" },
  tierNodeLabelCurrent: { color: "#EDE0B0", fontFamily: "Inter_600SemiBold" },
  tierNodeLabelFuture: { color: "#D1D5DB" },
  tierNodeCurrentDot: {
    position: "absolute",
    bottom: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#C8911A",
  },
  tierConnector: { flex: 1, height: 2, backgroundColor: "#E5E7EB", marginBottom: 18 },
  tierConnectorPast: { backgroundColor: "#C8911A" },

  // Selected tier label
  selectedTierLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  selectedTierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  selectedTierPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "white" },
  selectedTierReq: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },

  // Section headers
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  sectionTitleSpaced: { marginHorizontal: 20, marginTop: 8, marginBottom: 12 },

  // Benefits grid
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  benefitCard: {
    width: "47%",
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: "relative",
  },
  benefitCardUpgrade: { backgroundColor: "#1E1A10" },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  benefitValue: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 3,
  },
  benefitValueUpgrade: { color: "#6B5E3C" },
  benefitLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B5E3C", lineHeight: 15 },
  benefitLockBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1E1A10",
    alignItems: "center",
    justifyContent: "center",
  },

  // Comparison banner
  comparisonBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    backgroundColor: "#221D12",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  comparisonSide: { gap: 3 },
  comparisonTierLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#8C7C55",
    marginBottom: 4,
  },
  comparisonValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A89B6E" },

  // How to earn
  earnCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  earnRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, gap: 12 },
  earnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  earnMid: { flex: 1 },
  earnLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 2 },
  earnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C", lineHeight: 17 },
  earnDivider: { height: 1, backgroundColor: "#1E1A10", marginLeft: 48 },
  multiplierNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 8,
    backgroundColor: "#221D12",
    borderRadius: 10,
    padding: 10,
  },
  multiplierNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    lineHeight: 17,
  },

  // Activity
  activityCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, gap: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  activityMid: { flex: 1 },
  activityDesc: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#EDE0B0", marginBottom: 2 },
  activityDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  activityPoints: { fontSize: 15, fontFamily: "PlusJakartaSans_700Bold" },
  activityDivider: { height: 1, backgroundColor: "#1E1A10", marginLeft: 20 },

  // Redeem CTA
  redeemBtn: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  redeemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  redeemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "white",
    marginLeft: 10,
  },
});
