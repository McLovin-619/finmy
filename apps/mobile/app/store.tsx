import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MOCK_GIFT_CARDS,
  MOCK_LOYALTY,
  type GiftCard,
  type GiftCardCategory,
} from "@/lib/mock-data";

// ─── Category config ──────────────────────────────────────────────────────────

type FilterOption = "all" | GiftCardCategory;

const CATEGORY_LABELS: Record<FilterOption, string> = {
  all: "All",
  shopping: "Shopping",
  entertainment: "Entertainment",
  food: "Food",
  travel: "Travel",
  gaming: "Gaming",
};

const CATEGORY_ICONS: Record<FilterOption, React.ComponentProps<typeof Ionicons>["name"]> = {
  all: "grid-outline",
  shopping: "bag-outline",
  entertainment: "tv-outline",
  food: "restaurant-outline",
  travel: "airplane-outline",
  gaming: "game-controller-outline",
};

const FILTERS: FilterOption[] = ["all", "shopping", "food", "entertainment", "travel", "gaming"];

// ─── Redeem sheet ─────────────────────────────────────────────────────────────

function RedeemSheet({
  card,
  userPoints,
  onClose,
}: {
  card: GiftCard;
  userPoints: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = card.denominations[selectedIdx];
  const canAfford = userPoints >= selected.pointsCost;

  function confirm() {
    if (!canAfford) {
      Alert.alert(
        "Not enough points",
        `You need ${(selected.pointsCost - userPoints).toLocaleString("en-SA")} more points for this denomination.`
      );
      return;
    }
    Alert.alert(
      "Redeem confirmed",
      `Your SAR ${selected.sarValue} ${card.name} gift card will be delivered to your registered email within 5 minutes.`,
      [{ text: "Done", onPress: onClose }]
    );
  }

  return (
    <View style={sheet.root}>
      <View style={[sheet.handle]} />

      {/* Card preview */}
      <View style={[sheet.cardPreview, { backgroundColor: card.color }]}>
        <Text style={sheet.cardInitials}>{card.initials}</Text>
        <Text style={sheet.cardName}>{card.name}</Text>
      </View>

      <Text style={sheet.sheetTitle}>Choose denomination</Text>

      {/* Denomination picker */}
      <View style={sheet.denomRow}>
        {card.denominations.map((d, idx) => {
          const affordable = userPoints >= d.pointsCost;
          const isSelected = idx === selectedIdx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                sheet.denomChip,
                isSelected && sheet.denomChipActive,
                !affordable && sheet.denomChipDisabled,
              ]}
              onPress={() => setSelectedIdx(idx)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  sheet.denomSar,
                  isSelected && sheet.denomSarActive,
                  !affordable && sheet.denomSarDisabled,
                ]}
              >
                SAR {d.sarValue}
              </Text>
              <Text
                style={[
                  sheet.denomPts,
                  isSelected && sheet.denomPtsActive,
                  !affordable && sheet.denomPtsDisabled,
                ]}
              >
                {d.pointsCost.toLocaleString("en-SA")} pts
              </Text>
              {!affordable && (
                <Ionicons name="lock-closed" size={9} color="#6B5E3C" style={{ marginTop: 3 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary row */}
      <View style={sheet.summaryRow}>
        <View style={sheet.summaryItem}>
          <Text style={sheet.summaryLabel}>You pay</Text>
          <Text style={sheet.summaryValue}>{selected.pointsCost.toLocaleString("en-SA")} pts</Text>
        </View>
        <View style={sheet.summaryItem}>
          <Text style={sheet.summaryLabel}>Gift card value</Text>
          <Text style={sheet.summaryValue}>SAR {selected.sarValue}</Text>
        </View>
        <View style={sheet.summaryItem}>
          <Text style={sheet.summaryLabel}>Balance after</Text>
          <Text style={[sheet.summaryValue, !canAfford && sheet.summaryValueRed]}>
            {(userPoints - selected.pointsCost).toLocaleString("en-SA")} pts
          </Text>
        </View>
      </View>

      {!canAfford && (
        <View style={sheet.insufficientBanner}>
          <Ionicons name="information-circle-outline" size={14} color="#D97706" />
          <Text style={sheet.insufficientText}>
            You need {(selected.pointsCost - userPoints).toLocaleString("en-SA")} more points. Keep
            spending to earn more.
          </Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[sheet.ctaWrap, !canAfford && { opacity: 0.5 }]}
        onPress={confirm}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#C8911A", "#D4A830"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={sheet.ctaGrad}
        >
          <Text style={sheet.ctaText}>
            Redeem {selected.pointsCost.toLocaleString("en-SA")} pts
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[sheet.cancelBtn, { marginBottom: insets.bottom + 8 }]}
        onPress={onClose}
      >
        <Text style={sheet.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const sheet = StyleSheet.create({
  root: {
    backgroundColor: "#1A1610",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2C2618",
    alignSelf: "center",
    marginBottom: 20,
  },
  cardPreview: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  cardInitials: { fontSize: 22, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "white", marginTop: 2 },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    textAlign: "center",
    marginBottom: 20,
  },
  denomRow: { flexDirection: "row", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  denomChip: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#1E1A10",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
  denomChipActive: { backgroundColor: "#221D12", borderColor: "#C8911A" },
  denomChipDisabled: { opacity: 0.55 },
  denomSar: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    marginBottom: 4,
  },
  denomSarActive: { color: "#C8911A" },
  denomSarDisabled: { color: "#6B5E3C" },
  denomPts: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  denomPtsActive: { color: "#C8911A" },
  denomPtsDisabled: { color: "#6B5E3C" },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#1E1A10",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    justifyContent: "space-between",
  },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginBottom: 4 },
  summaryValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  summaryValueRed: { color: "#EF4444" },
  insufficientBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  insufficientText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#92400E",
    lineHeight: 18,
  },
  ctaWrap: { borderRadius: 16, overflow: "hidden", marginBottom: 10 },
  ctaGrad: { alignItems: "center", paddingVertical: 16 },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 15, color: "#6B5E3C", fontFamily: "Inter_500Medium" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);

  const visible =
    activeFilter === "all"
      ? MOCK_GIFT_CARDS
      : MOCK_GIFT_CARDS.filter((c) => c.category === activeFilter);

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Points Store</Text>
          <TouchableOpacity onPress={() => router.push("/loyalty" as any)}>
            <Ionicons name="gift-outline" size={22} color="#C8911A" />
          </TouchableOpacity>
        </View>

        {/* Points balance banner */}
        <LinearGradient
          colors={["#C8911A", "#D4A830"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pointsBanner}
        >
          <View style={styles.pointsBannerLeft}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.pointsBannerLabel}>Your balance</Text>
          </View>
          <Text style={styles.pointsBannerValue}>
            {MOCK_LOYALTY.totalPoints.toLocaleString("en-SA")}
            <Text style={styles.pointsBannerSuffix}> pts</Text>
          </Text>
        </LinearGradient>

        {/* How it works */}
        <View style={styles.howCard}>
          <Ionicons name="information-circle-outline" size={16} color="#C8911A" />
          <Text style={styles.howText}>
            1 pt = SAR 0.10 in gift card value. Redeem instantly — the code is emailed to you within
            5 minutes.
          </Text>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Ionicons
                name={CATEGORY_ICONS[f]}
                size={13}
                color={activeFilter === f ? "white" : "#8C7C55"}
              />
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {CATEGORY_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grid */}
        <Text style={styles.gridCount}>
          {visible.length} gift card{visible.length !== 1 ? "s" : ""}
        </Text>
        <View style={styles.grid}>
          {visible.map((card) => {
            const cheapest = card.denominations[0];
            const canAfford = MOCK_LOYALTY.totalPoints >= cheapest.pointsCost;
            return (
              <TouchableOpacity
                key={card.id}
                style={styles.gridCard}
                activeOpacity={0.85}
                onPress={() => setSelectedCard(card)}
              >
                <View style={[styles.gridCardTop, { backgroundColor: card.color + "18" }]}>
                  <View style={[styles.gridIcon, { backgroundColor: card.color }]}>
                    <Text style={styles.gridInitials}>{card.initials}</Text>
                  </View>
                  {!canAfford && (
                    <View style={styles.gridLockBadge}>
                      <Ionicons name="lock-closed" size={9} color="#6B5E3C" />
                    </View>
                  )}
                </View>
                <View style={styles.gridCardBottom}>
                  <Text style={styles.gridCardName}>{card.name}</Text>
                  <Text style={styles.gridCardFrom}>
                    from {cheapest.pointsCost.toLocaleString("en-SA")} pts
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Redeem modal */}
      <Modal
        visible={selectedCard !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedCard(null)}
        />
        {selectedCard && (
          <RedeemSheet
            card={selectedCard}
            userPoints={MOCK_LOYALTY.totalPoints}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0B07" },
  content: { paddingBottom: 48 },

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

  pointsBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pointsBannerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointsBannerLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
  },
  pointsBannerValue: {
    fontSize: 28,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  pointsBannerSuffix: { fontSize: 16, fontFamily: "Inter_400Regular" },

  howCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: "#221D12",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  howText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    lineHeight: 18,
  },

  filterScroll: { marginBottom: 8 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1E1A10",
  },
  filterChipActive: { backgroundColor: "#C8911A" },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  filterTextActive: { color: "white" },

  gridCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  gridCard: {
    width: "47%",
    backgroundColor: "#1A1610",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardTop: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gridInitials: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  gridLockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1E1A10",
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardBottom: { padding: 12 },
  gridCardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 3,
  },
  gridCardFrom: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B5E3C" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
