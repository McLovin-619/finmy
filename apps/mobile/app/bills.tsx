import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_BILLS, type Bill, type BillCategory, type BillStatus } from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<BillCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  bnpl: "BNPL",
  telecom: "Telecom",
  insurance: "Insurance",
  education: "Education",
  other: "Other",
};

const CATEGORY_ICONS: Record<BillCategory, keyof typeof Ionicons.glyphMap> = {
  rent: "home-outline",
  utilities: "flash-outline",
  bnpl: "card-outline",
  telecom: "wifi-outline",
  insurance: "shield-checkmark-outline",
  education: "school-outline",
  other: "receipt-outline",
};

type FilterStatus = "all" | BillStatus;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "due-soon", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "paid", label: "Paid" },
];

function dueDateLabel(days: number, status: BillStatus): string {
  if (status === "paid") return "Paid";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState(MOCK_BILLS);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const unpaid = bills.filter((b) => b.status !== "paid");
  const overdue = bills.filter((b) => b.status === "overdue");
  const dueSoon = bills.filter((b) => b.status === "due-soon");
  const autoPayCount = unpaid.filter((b) => b.autoPay).length;

  const overdueTotal = overdue.reduce((s, b) => s + b.amountSar, 0);
  const weekTotal = dueSoon.reduce((s, b) => s + b.amountSar, 0) + overdueTotal;

  const visible = filter === "all" ? bills : bills.filter((b) => b.status === filter);

  function payBill(bill: Bill) {
    Alert.alert("Pay now", `Pay SAR ${bill.amountSar.toLocaleString("en-SA")} to ${bill.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          setBills((prev) =>
            prev.map((b) => (b.id === bill.id ? { ...b, status: "paid" as BillStatus } : b))
          ),
      },
    ]);
  }

  function toggleAutoPay(id: string) {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, autoPay: !b.autoPay } : b)));
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Bill Center</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={overdue.length > 0 ? "#EF4444" : "#9CA3AF"}
          />
          <Text style={styles.summaryCardLabel}>Overdue</Text>
          <Text
            style={[styles.summaryCardAmount, overdue.length > 0 && styles.summaryCardAmountRed]}
          >
            {overdue.length > 0 ? `SAR ${overdueTotal.toLocaleString("en-SA")}` : "None"}
          </Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
          <Text style={styles.summaryCardLabel}>Due this week</Text>
          <Text style={styles.summaryCardAmount}>SAR {weekTotal.toLocaleString("en-SA")}</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Ionicons name="refresh-outline" size={18} color="#10B981" />
          <Text style={styles.summaryCardLabel}>Auto-pay on</Text>
          <Text style={styles.summaryCardAmount}>{autoPayCount} bills</Text>
        </View>
      </View>

      {/* Connected BNPL */}
      <BnplSection bills={bills} />

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              filter === f.value && styles.filterChipOn,
              f.value === "overdue" && filter === "overdue" && styles.filterChipOverdue,
            ]}
            onPress={() => setFilter(f.value)}
          >
            {f.value === "overdue" && overdue.length > 0 && <View style={styles.filterDot} />}
            <Text
              style={[
                styles.filterText,
                filter === f.value && styles.filterTextOn,
                f.value === "overdue" && filter === "overdue" && styles.filterTextOverdue,
              ]}
            >
              {f.label}
            </Text>
            {f.value === "overdue" && overdue.length > 0 && (
              <View style={[styles.filterBadge, filter === "overdue" && styles.filterBadgeOn]}>
                <Text
                  style={[styles.filterBadgeText, filter === "overdue" && styles.filterBadgeTextOn]}
                >
                  {overdue.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bills list */}
      <View style={styles.listWrap}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {filter === "overdue"
                ? "No overdue bills"
                : filter === "paid"
                  ? "No paid bills this month"
                  : "No bills in this category"}
            </Text>
          </View>
        ) : (
          visible.map((bill) => (
            <BillRow key={bill.id} bill={bill} onPay={payBill} onToggleAutoPay={toggleAutoPay} />
          ))
        )}
      </View>

      {/* Add bill */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          Alert.alert("Coming soon", "Manual bill entry will be available in the next release.")
        }
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={18} color="#7C3AED" />
        <Text style={styles.addButtonText}>Add bill</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Bill row ─────────────────────────────────────────────────────────────────

function BillRow({
  bill,
  onPay,
  onToggleAutoPay,
}: {
  bill: Bill;
  onPay: (b: Bill) => void;
  onToggleAutoPay: (id: string) => void;
}) {
  const isPaid = bill.status === "paid";
  const isOverdue = bill.status === "overdue";

  return (
    <View style={[styles.row, isOverdue && styles.rowOverdue, isPaid && styles.rowPaid]}>
      {/* Left: avatar */}
      <View style={[styles.avatar, { backgroundColor: isPaid ? "#E5E7EB" : bill.color }]}>
        <Text style={[styles.avatarText, isPaid && styles.avatarTextPaid]}>{bill.abbr}</Text>
      </View>

      {/* Middle: info */}
      <View style={styles.rowMid}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowName, isPaid && styles.rowNamePaid]}>{bill.name}</Text>
          <View style={styles.categoryBadge}>
            <Ionicons name={CATEGORY_ICONS[bill.category]} size={10} color="#9CA3AF" />
            <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[bill.category]}</Text>
          </View>
        </View>

        {bill.installment && (
          <View style={styles.installmentRow}>
            {Array.from({ length: bill.installment.total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.installmentDot,
                  i < bill.installment!.paid && styles.installmentDotFilled,
                ]}
              />
            ))}
            <Text style={styles.installmentLabel}>
              {bill.installment.paid}/{bill.installment.total} paid
            </Text>
          </View>
        )}

        <View style={styles.rowBottomRow}>
          <View
            style={[
              styles.dueBadge,
              isOverdue && styles.dueBadgeOverdue,
              isPaid && styles.dueBadgePaid,
            ]}
          >
            <Text
              style={[
                styles.dueText,
                isOverdue && styles.dueTextOverdue,
                isPaid && styles.dueTextPaid,
              ]}
            >
              {dueDateLabel(bill.daysUntilDue, bill.status)}
            </Text>
          </View>
          {!isPaid && (
            <View style={styles.autoPayRow}>
              <Text style={styles.autoPayLabel}>Auto-pay</Text>
              <Switch
                value={bill.autoPay}
                onValueChange={() => onToggleAutoPay(bill.id)}
                trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
                thumbColor={bill.autoPay ? "#7C3AED" : "#9CA3AF"}
                style={styles.autoPaySwitch}
              />
            </View>
          )}
        </View>
      </View>

      {/* Right: amount + action */}
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, isPaid && styles.rowAmountPaid]}>
          SAR {bill.amountSar.toLocaleString("en-SA")}
        </Text>
        {isPaid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark" size={12} color="#10B981" />
            <Text style={styles.paidBadgeText}>Paid</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.payBtn, isOverdue && styles.payBtnOverdue]}
            onPress={() => onPay(bill)}
            activeOpacity={0.7}
          >
            <Text style={[styles.payBtnText, isOverdue && styles.payBtnTextOverdue]}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── BNPL Section ─────────────────────────────────────────────────────────────

const BNPL_CONFIG: Record<
  string,
  { color: string; buttonLabel: string; alertTitle: string; alertBody: string }
> = {
  Tabby: {
    color: "#3B82F6",
    buttonLabel: "Manage in Tabby",
    alertTitle: "Opening Tabby",
    alertBody: "Redirecting to Tabby app…",
  },
  Tamara: {
    color: "#10B981",
    buttonLabel: "Open Tamara",
    alertTitle: "Opening Tamara",
    alertBody: "Redirecting to Tamara app…",
  },
};

function BnplSection({ bills }: { bills: Bill[] }) {
  const bnplBills = bills.filter((b) => b.category === "bnpl");

  if (bnplBills.length === 0) return null;

  return (
    <View style={styles.bnplWrap}>
      {/* Section header */}
      <View style={styles.bnplHeader}>
        <Text style={styles.bnplHeaderTitle}>Connected BNPL</Text>
        <Text style={styles.bnplHeaderSub}>Manage your buy-now-pay-later plans</Text>
      </View>

      {/* Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bnplScroll}
      >
        {bnplBills.map((bill) => {
          const cfg = BNPL_CONFIG[bill.name] ?? {
            color: "#7C3AED",
            buttonLabel: `Open ${bill.name}`,
            alertTitle: `Opening ${bill.name}`,
            alertBody: `Redirecting to ${bill.name} app…`,
          };

          const instalment = bill.installment;
          const perInstalment =
            instalment && instalment.total > 0
              ? Math.round(bill.amountSar / instalment.total)
              : null;

          const nextDueLabel =
            bill.status === "paid"
              ? "All paid"
              : bill.daysUntilDue === 0
                ? "Due today"
                : bill.daysUntilDue === 1
                  ? "Due tomorrow"
                  : bill.daysUntilDue < 0
                    ? `Overdue by ${Math.abs(bill.daysUntilDue)}d`
                    : `Due in ${bill.daysUntilDue} days`;

          return (
            <View key={bill.id} style={styles.bnplCard}>
              {/* Brand avatar + name */}
              <View style={styles.bnplCardTop}>
                <View style={[styles.bnplAvatar, { backgroundColor: cfg.color }]}>
                  <Text style={styles.bnplAvatarText}>{bill.abbr}</Text>
                </View>
                <View style={styles.bnplCardTopText}>
                  <Text style={styles.bnplBrandName}>{bill.name}</Text>
                  <Text style={styles.bnplOutstanding}>
                    SAR {bill.amountSar.toLocaleString("en-SA")} outstanding
                  </Text>
                </View>
              </View>

              {/* Installment dots */}
              {instalment && (
                <View style={styles.bnplDotRow}>
                  {Array.from({ length: instalment.total }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.installmentDot,
                        i < instalment.paid && styles.installmentDotFilled,
                      ]}
                    />
                  ))}
                  <Text style={styles.installmentLabel}>
                    {instalment.paid}/{instalment.total} paid
                  </Text>
                </View>
              )}

              {/* Next instalment amount + due label */}
              {perInstalment !== null && (
                <Text style={styles.bnplNextInstalment}>
                  SAR {perInstalment.toLocaleString("en-SA")} · {nextDueLabel}
                </Text>
              )}

              {/* Deep-link button */}
              <TouchableOpacity
                style={[styles.bnplDeepLinkBtn, { borderColor: cfg.color }]}
                onPress={() => Alert.alert(cfg.alertTitle, cfg.alertBody)}
                activeOpacity={0.75}
              >
                <Text style={[styles.bnplDeepLinkText, { color: cfg.color }]}>
                  {cfg.buttonLabel}
                </Text>
                <Ionicons name="open-outline" size={13} color={cfg.color} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
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
    paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },

  // Summary row
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  summaryCardAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  summaryCardAmountRed: { color: "#EF4444" },

  // Filters
  filtersRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  filterChipOn: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterChipOverdue: { backgroundColor: "#FEE2E2", borderColor: "#EF4444" },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7280" },
  filterTextOn: { color: "white" },
  filterTextOverdue: { color: "#EF4444" },
  filterBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeOn: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
  filterBadgeTextOn: { color: "white" },

  // List
  listWrap: { paddingHorizontal: 20, gap: 10 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  // Bill row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowOverdue: {
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFAFA",
  },
  rowPaid: { opacity: 0.6 },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  avatarTextPaid: { color: "#9CA3AF" },

  rowMid: { flex: 1 },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  rowNamePaid: { color: "#9CA3AF" },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  installmentRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  installmentDot: { width: 10, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB" },
  installmentDotFilled: { backgroundColor: "#7C3AED" },
  installmentLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    marginLeft: 2,
  },

  rowBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dueBadge: {
    backgroundColor: "#F4F1FA",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dueBadgeOverdue: { backgroundColor: "#FEE2E2" },
  dueBadgePaid: { backgroundColor: "#ECFDF5" },
  dueText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  dueTextOverdue: { color: "#EF4444" },
  dueTextPaid: { color: "#10B981" },

  autoPayRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  autoPayLabel: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  autoPaySwitch: { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] },

  rowRight: { alignItems: "flex-end", gap: 8, paddingTop: 2 },
  rowAmount: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  rowAmountPaid: { color: "#9CA3AF" },

  payBtn: {
    backgroundColor: "#F4F1FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  payBtnOverdue: { backgroundColor: "#EF4444" },
  payBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },
  payBtnTextOverdue: { color: "white" },

  paidBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  paidBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#10B981" },

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
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "white",
  },
  addButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },

  // BNPL section
  bnplWrap: { marginTop: 20 },
  bnplHeader: { paddingHorizontal: 20, marginBottom: 12, gap: 2 },
  bnplHeaderTitle: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  bnplHeaderSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  bnplScroll: { paddingHorizontal: 20, gap: 12 },
  bnplCard: {
    width: 260,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  bnplCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  bnplAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bnplAvatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bnplCardTopText: { gap: 2 },
  bnplBrandName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  bnplOutstanding: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7280" },

  bnplDotRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bnplNextInstalment: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#1A1426" },

  bnplDeepLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  bnplDeepLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
