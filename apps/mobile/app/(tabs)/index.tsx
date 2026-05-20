import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMockAuth } from "@/lib/mock-auth";
import { MOCK_BILLS, MOCK_SUBSCRIPTIONS } from "@/lib/mock-data";

// ─── Subscriptions summary ────────────────────────────────────────────────────

function SubscriptionsSummary() {
  const active = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "active");
  const monthlyTotal = active.reduce(
    (sum, s) => sum + (s.cycle === "monthly" ? s.amountSar : s.amountSar / 12),
    0
  );
  const preview = active.slice(0, 3);

  return (
    <View style={subStyles.card}>
      <View style={subStyles.topRow}>
        <View>
          <Text style={subStyles.totalLabel}>Monthly total</Text>
          <Text style={subStyles.totalAmount}>SAR {monthlyTotal.toFixed(2)}</Text>
        </View>
        <View style={subStyles.countBadge}>
          <Text style={subStyles.countText}>{active.length} active</Text>
        </View>
      </View>
      <View style={subStyles.previewRow}>
        {preview.map((s) => (
          <View key={s.id} style={[subStyles.dot, { backgroundColor: s.color }]}>
            <Text style={subStyles.dotText}>{s.initials}</Text>
          </View>
        ))}
        {active.length > 3 && (
          <View style={[subStyles.dot, { backgroundColor: "#2C2618" }]}>
            <Text style={[subStyles.dotText, { color: "#8C7C55" }]}>+{active.length - 3}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const subStyles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  totalLabel: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginBottom: 2 },
  totalAmount: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  countBadge: {
    backgroundColor: "#221D12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontSize: 12, color: "#C8911A", fontFamily: "Inter_600SemiBold" },
  previewRow: { flexDirection: "row", gap: 8 },
  dot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dotText: { color: "white", fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: "arrow-up-outline" as const, label: "Send", route: "/send" },
  { icon: "arrow-down-outline" as const, label: "Request", route: "/request" },
  { icon: "add-outline" as const, label: "Top Up", route: "/top-up" },
  { icon: "card-outline" as const, label: "Cards", route: "/cards" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { state, signOut } = useMockAuth();
  const insets = useSafeAreaInsets();
  const user = state.status === "authenticated" ? state.user : null;
  const firstName = user?.fullName.split(" ")[0] ?? "there";

  return (
    /**
     * FIX 2 — Overscroll bleed:
     * ScrollView.style.backgroundColor is what iOS reveals during rubber-band
     * bounce — NOT the parent View's color. Setting it to the gradient's start
     * color (#7C3AED) means pulling past the top shows matching purple instead
     * of white. The body content sits inside its own #FAFAFA View so card gaps
     * stay the correct off-white throughout.
     */
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/**
       * FIX 1 — Dynamic Island / notch:
       * insets.top from useSafeAreaInsets() returns the exact top inset for
       * every iPhone variant — 20 (no notch), 44 (notch), 59 (Dynamic Island).
       * Adding 14pt of breathing room keeps all text safely below the island.
       * The gradient is full-bleed (no horizontal margin) so it covers the
       * status-bar area without leaving gaps at the edges.
       *
       * Balance label + amount are strictly LEFT-aligned so they land in the
       * "left ear" space that is always clear of the Dynamic Island pill.
       * The eye icon is pinned to the right, also away from the island.
       */}
      <LinearGradient
        colors={["#1A1308", "#221809", "#2B200C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 14 }]}
      >
        {/* Logo + greeting (left) | bell (right) */}
        <View style={styles.navRow}>
          <View>
            <View style={styles.logoRow}>
              <Text style={styles.logoF}>f.</Text>
              <Text style={styles.logoWord}>finmy</Text>
            </View>
            <Text style={styles.greeting}>Good morning, {firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Balance — left-aligned label + amount | eye pinned to the right */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              <Text style={styles.balanceCurrency}>SAR </Text>
              45,230
              <Text style={styles.balanceDecimals}>.00</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.eyeButton}>
            <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as any)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={18} color="white" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/**
       * Body — all content below the gradient lives on #FAFAFA.
       * Wrapping in a single View here (rather than setting backgroundColor on
       * every section) means the white surface is one declaration, and it
       * doesn't interfere with the ScrollView's own background color that
       * controls the bounce-overscroll appearance.
       */}
      <View style={styles.body}>
        {/* Auto-Investments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Auto-Investments</Text>
          <TouchableOpacity onPress={() => router.push("/investments" as any)}>
            <Text style={styles.sectionAction}>Manage &gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.investCard}>
          <View style={styles.investCardLeft}>
            <View style={styles.investIcon}>
              <Ionicons name="trending-up" size={16} color="#C8911A" />
            </View>
            <View>
              <Text style={styles.investLabel}>Current Growth</Text>
              <View style={styles.investGrowthRow}>
                <Text style={styles.investGrowth}>+12.4%</Text>
                <View style={styles.investBadge}>
                  <Text style={styles.investBadgeText}>+SAR 1,450</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.investCardRight}>
            <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
            <Text style={styles.nextAutoLabel}> Next Auto</Text>
            <Text style={styles.nextAutoDate}>25 Oct</Text>
          </View>
        </View>

        {/* Smart Bill Center */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Bill Center</Text>
          <TouchableOpacity onPress={() => router.push("/bills" as any)}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        </View>
        {MOCK_BILLS.filter((b) => b.status !== "paid")
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 2)
          .map((bill) => {
            const isOverdue = bill.status === "overdue";
            const dueSoon = bill.status === "due-soon";
            const dueLabel =
              bill.daysUntilDue < 0
                ? `Overdue ${Math.abs(bill.daysUntilDue)}d`
                : bill.daysUntilDue === 1
                  ? "Due tomorrow"
                  : bill.daysUntilDue === 0
                    ? "Due today"
                    : `Due in ${bill.daysUntilDue} days`;
            return (
              <View key={bill.id} style={styles.billRow}>
                <View style={[styles.billAvatar, { backgroundColor: bill.color }]}>
                  <Text style={styles.billAvatarText}>{bill.abbr}</Text>
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billAmount}>
                    SAR {bill.amountSar.toLocaleString("en-SA")}
                  </Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={[styles.billDue, (isOverdue || dueSoon) && styles.billDueUrgent]}>
                    {dueLabel}
                  </Text>
                  <TouchableOpacity
                    style={[styles.payButton, isOverdue && styles.payButtonOverdue]}
                    onPress={() => router.push("/bills" as any)}
                  >
                    <Text style={[styles.payButtonText, isOverdue && styles.payButtonTextOverdue]}>
                      Pay Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {/* Subscriptions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subscriptions</Text>
          <TouchableOpacity onPress={() => router.push("/subscriptions" as any)}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        </View>
        <SubscriptionsSummary />

        {/* Sign out (mock only) */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out (mock)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /**
   * scroll: backgroundColor is the color iOS reveals during rubber-band
   * overscroll. #7C3AED matches the gradient's top-left corner so the bounce
   * at the top is seamless purple rather than a white flash.
   */
  scroll: {
    flex: 1,
    backgroundColor: "#1A1308",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Full-bleed gradient header ──────────────────────────────────────────────
  // No bottom border-radius here — the body's borderTopRadius sits on top of
  // the gradient edge, so there is no corner "bite" for the purple background
  // to show through.
  gradientHeader: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  // borderTopRadius creates the "card emerging from gradient" look.
  // marginTop: -28 slides the card up to overlap the gradient's bottom edge,
  // closing any sub-pixel gap between the two views.
  body: {
    backgroundColor: "#0D0B07",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  // ── Nav row ────────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  logoF: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  logoWord: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "rgba(255,255,255,0.85)",
    marginLeft: 2,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Balance row ────────────────────────────────────────────────────────────
  // justifyContent: "space-between" + alignItems: "flex-start" keeps the
  // amount text anchored to the left "ear" — the safe zone on all iPhones
  // including the Dynamic Island models.
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 40,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  balanceCurrency: { fontSize: 22 },
  balanceDecimals: { fontSize: 22 },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22, // aligns visually with the amount baseline
  },

  // ── Quick actions ──────────────────────────────────────────────────────────
  quickActionsRow: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", gap: 8, flex: 1 },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_400Regular",
  },

  // ── Section headers ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  sectionAction: { fontSize: 13, color: "#C8911A", fontFamily: "Inter_500Medium" },

  // ── Investments card ───────────────────────────────────────────────────────
  investCard: {
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  investCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  investIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  investLabel: {
    fontSize: 12,
    color: "#6B5E3C",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  investGrowthRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  investGrowth: { fontSize: 18, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  investBadge: {
    backgroundColor: "#221D12",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  investBadgeText: { fontSize: 11, color: "#C8911A", fontFamily: "Inter_600SemiBold" },
  investCardRight: { alignItems: "flex-end" },
  nextAutoLabel: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  nextAutoDate: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },

  // ── Bill rows ──────────────────────────────────────────────────────────────
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  billAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  billAvatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  billInfo: { flex: 1 },
  billName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 2 },
  billAmount: { fontSize: 13, color: "#8C7C55", fontFamily: "Inter_400Regular" },
  billRight: { alignItems: "flex-end", gap: 6 },
  billDue: { fontSize: 11, color: "#8C7C55", fontFamily: "Inter_400Regular" },
  billDueUrgent: { color: "#D4A830" },
  payButton: {
    backgroundColor: "#221D12",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  payButtonText: { fontSize: 12, color: "#C8911A", fontFamily: "Inter_600SemiBold" },
  payButtonOverdue: { backgroundColor: "#EF4444" },
  payButtonTextOverdue: { color: "white" },

  // ── Sign out ───────────────────────────────────────────────────────────────
  signOutButton: {
    marginTop: 32,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2618",
    alignItems: "center",
  },
  signOutText: { fontSize: 14, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
});
