import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MOCK_ALLOWANCES,
  type Allowance,
  type AllowanceFrequency,
  type AllowanceRelation,
  type AllowanceStatus,
} from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const RELATION_OPTIONS: AllowanceRelation[] = ["Son", "Daughter", "Staff", "Other"];

const RELATION_ICONS: Record<AllowanceRelation, keyof typeof Ionicons.glyphMap> = {
  Son: "man-outline",
  Daughter: "woman-outline",
  Staff: "briefcase-outline",
  Other: "person-outline",
};

const RELATION_COLORS: Record<AllowanceRelation, string> = {
  Son: "#C8911A",
  Daughter: "#D4A830",
  Staff: "#10B981",
  Other: "#6B7280",
};

const FREQ_LABELS: Record<AllowanceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_DAYS = ["1st", "5th", "10th", "15th", "25th", "28th"];

function toMonthly(amount: number, freq: AllowanceFrequency) {
  if (freq === "daily") return amount * 30;
  if (freq === "weekly") return amount * 4.33;
  return amount;
}

type AddStep = "who" | "schedule" | "success";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AllowancesScreen() {
  const insets = useSafeAreaInsets();
  const [allowances, setAllowances] = useState(MOCK_ALLOWANCES);
  const [adding, setAdding] = useState(false);

  const active = allowances.filter((a) => a.status === "active");
  const monthlyTotal = active.reduce((s, a) => s + toMonthly(a.amountSar, a.frequency), 0);

  function toggleStatus(id: string) {
    setAllowances((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: (a.status === "active" ? "paused" : "active") as AllowanceStatus }
          : a
      )
    );
  }

  function deleteAllowance(id: string) {
    setAllowances((prev) => prev.filter((a) => a.id !== id));
  }

  function onLongPress(allowance: Allowance) {
    const isPaused = allowance.status === "paused";
    const options = [isPaused ? "Resume" : "Pause", "Delete", "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: allowance.name, options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => {
          if (i === 0) toggleStatus(allowance.id);
          if (i === 1) confirmDelete(allowance);
        }
      );
    } else {
      Alert.alert(allowance.name, undefined, [
        { text: isPaused ? "Resume" : "Pause", onPress: () => toggleStatus(allowance.id) },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(allowance) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  function confirmDelete(a: Allowance) {
    Alert.alert(
      "Delete Allowance",
      `Stop sending ${FREQ_LABELS[a.frequency].toLowerCase()} allowance to ${a.name}?`,
      [
        { text: "Keep It", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAllowance(a.id) },
      ]
    );
  }

  function onAdd(newAllowance: Allowance) {
    setAllowances((prev) => [...prev, newAllowance]);
    setAdding(false);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allowances</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Ionicons name="add" size={18} color="#C8911A" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Monthly outflow</Text>
            <Text style={styles.summaryAmount}>
              SAR <Text style={styles.summaryAmountBig}>{monthlyTotal.toFixed(0)}</Text>
            </Text>
            <Text style={styles.summarySub}>across {active.length} active allowances</Text>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.avatarStack}>
              {active.slice(0, 4).map((a, i) => (
                <View
                  key={a.id}
                  style={[styles.stackAvatar, { backgroundColor: a.color, right: i * 14 }]}
                >
                  <Text style={styles.stackAvatarText}>{a.initials[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.autoLabel}>Auto-distributed</Text>
          </View>
        </View>

        {/* List */}
        {allowances.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No allowances set up</Text>
            <Text style={styles.emptyText}>Add family members or staff to automate transfers.</Text>
          </View>
        ) : (
          allowances.map((a) => (
            <AllowanceCard
              key={a.id}
              allowance={a}
              onToggle={() => toggleStatus(a.id)}
              onLongPress={() => onLongPress(a)}
            />
          ))
        )}

        {/* Add CTA */}
        <TouchableOpacity style={styles.addDashedBtn} onPress={() => setAdding(true)}>
          <Ionicons name="add" size={18} color="#C8911A" />
          <Text style={styles.addDashedBtnText}>Add allowance</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add modal */}
      <Modal visible={adding} animationType="slide" presentationStyle="pageSheet">
        <AddAllowanceFlow
          onClose={() => setAdding(false)}
          onSuccess={onAdd}
          existingCount={allowances.length}
        />
      </Modal>
    </View>
  );
}

// ─── Allowance card ───────────────────────────────────────────────────────────

function AllowanceCard({
  allowance: a,
  onToggle,
  onLongPress,
}: {
  allowance: Allowance;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const isPaused = a.status === "paused";
  const monthlyEq = toMonthly(a.amountSar, a.frequency);

  return (
    <TouchableOpacity
      style={[styles.card, isPaused && styles.cardPaused]}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: isPaused ? "#E5E7EB" : a.color }]}>
        <Text style={[styles.avatarText, isPaused && styles.avatarTextPaused]}>{a.initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardMid}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardName, isPaused && styles.cardNamePaused]}>{a.name}</Text>
          <View
            style={[styles.relationBadge, { backgroundColor: RELATION_COLORS[a.relation] + "18" }]}
          >
            <Ionicons
              name={RELATION_ICONS[a.relation]}
              size={10}
              color={RELATION_COLORS[a.relation]}
            />
            <Text style={[styles.relationText, { color: RELATION_COLORS[a.relation] }]}>
              {a.relation}
            </Text>
          </View>
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons name="refresh-outline" size={11} color="#9CA3AF" />
          <Text style={styles.cardMeta}>
            {FREQ_LABELS[a.frequency]} · {a.dayLabel}
          </Text>
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons name="person-outline" size={11} color="#9CA3AF" />
          <Text style={styles.cardMeta}>{a.handle}</Text>
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.totalSentText}>
            SAR {a.totalSentSar.toLocaleString("en-SA")} sent total
          </Text>
          {a.frequency !== "monthly" && (
            <Text style={styles.monthlyEqText}>≈ SAR {Math.round(monthlyEq)}/mo</Text>
          )}
        </View>
      </View>

      {/* Right: amount + toggle */}
      <View style={styles.cardRight}>
        <Text style={[styles.cardAmount, isPaused && styles.cardAmountPaused]}>
          SAR {a.amountSar.toLocaleString("en-SA")}
        </Text>
        <Text style={styles.cardFreqLabel}>
          /{a.frequency === "daily" ? "day" : a.frequency === "weekly" ? "wk" : "mo"}
        </Text>
        <Switch
          value={!isPaused}
          onValueChange={onToggle}
          trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
          thumbColor={isPaused ? "#9CA3AF" : "#C8911A"}
          style={styles.toggle}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Add flow ─────────────────────────────────────────────────────────────────

function AddAllowanceFlow({
  onClose,
  onSuccess,
  existingCount,
}: {
  onClose: () => void;
  onSuccess: (a: Allowance) => void;
  existingCount: number;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<AddStep>("who");

  // Step 1
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<AllowanceRelation | null>(null);
  const [handle, setHandle] = useState("");

  // Step 2
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<AllowanceFrequency>("weekly");
  const [selectedDay, setSelectedDay] = useState("Sun");

  const step1Valid = name.trim().length > 0 && relation !== null && handle.trim().length > 0;
  const step2Valid = !!amount && parseFloat(amount) >= 10;

  const QUICK_AMOUNTS = ["50", "100", "200", "500", "1,000", "1,500"];

  function goBack() {
    if (step === "schedule") {
      setStep("who");
      return;
    }
    onClose();
  }

  function confirmSchedule() {
    const amountNum = parseFloat(amount.replace(/,/g, ""));
    let dayLabel = "";
    if (frequency === "daily") dayLabel = "Every day";
    else if (frequency === "weekly") dayLabel = `Every ${selectedDay}`;
    else dayLabel = `${selectedDay} of every month`;

    const color = RELATION_COLORS[relation!];
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

    const newAllowance: Allowance = {
      id: `al${existingCount + 1}`,
      name: name.trim(),
      relation: relation!,
      initials: initials || name[0].toUpperCase(),
      color,
      handle: handle.trim(),
      amountSar: amountNum,
      frequency,
      dayLabel,
      status: "active",
      totalSentSar: 0,
    };

    onSuccess(newAllowance);
  }

  const stepTitle: Record<AddStep, string> = {
    who: "Who is this for?",
    schedule: "Set Schedule",
    success: "",
  };

  return (
    <View style={[addStyles.root, { paddingTop: insets.top + 8 }]}>
      <View style={addStyles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name={step === "who" ? "close" : "chevron-back"} size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={addStyles.headerTitle}>{stepTitle[step]}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step 1: Who */}
      {step === "who" && (
        <ScrollView contentContainerStyle={addStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={addStyles.fieldLabel}>FULL NAME</Text>
          <TextInput
            style={addStyles.input}
            placeholder="e.g. Khalid"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={addStyles.fieldLabel}>RELATIONSHIP</Text>
          <View style={addStyles.chipsRow}>
            {RELATION_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[addStyles.chip, relation === r && addStyles.chipOn]}
                onPress={() => setRelation(r)}
              >
                <Ionicons
                  name={RELATION_ICONS[r]}
                  size={14}
                  color={relation === r ? "white" : "#6B7280"}
                />
                <Text style={[addStyles.chipText, relation === r && addStyles.chipTextOn]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={addStyles.fieldLabel}>FINMY HANDLE OR PHONE</Text>
          <TextInput
            style={addStyles.input}
            placeholder="@handle or +966 5X XXX XXXX"
            placeholderTextColor="#9CA3AF"
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            keyboardType="default"
          />

          <TouchableOpacity
            style={[addStyles.cta, !step1Valid && addStyles.ctaDisabled]}
            onPress={() => setStep("schedule")}
            disabled={!step1Valid}
          >
            <Text style={addStyles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 2: Schedule */}
      {step === "schedule" && (
        <ScrollView contentContainerStyle={addStyles.content} keyboardShouldPersistTaps="handled">
          {/* Recipient preview */}
          {relation && (
            <View style={addStyles.recipientPreview}>
              <View
                style={[addStyles.previewAvatar, { backgroundColor: RELATION_COLORS[relation] }]}
              >
                <Text style={addStyles.previewAvatarText}>
                  {name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || name[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={addStyles.previewName}>{name}</Text>
                <Text style={addStyles.previewHandle}>{handle}</Text>
              </View>
            </View>
          )}

          <Text style={addStyles.fieldLabel}>AMOUNT</Text>
          <View style={addStyles.amountRow}>
            <Text style={addStyles.amountCurrency}>SAR</Text>
            <TextInput
              style={addStyles.amountInput}
              placeholder="0"
              placeholderTextColor="#D1D5DB"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9,]/g, ""))}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
          <View style={addStyles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[addStyles.quickChip, amount === q && addStyles.quickChipOn]}
                onPress={() => setAmount(q)}
              >
                <Text style={[addStyles.quickChipText, amount === q && addStyles.quickChipTextOn]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={addStyles.fieldLabel}>FREQUENCY</Text>
          <View style={addStyles.chipsRow}>
            {(["daily", "weekly", "monthly"] as AllowanceFrequency[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[addStyles.chip, frequency === f && addStyles.chipOn]}
                onPress={() => {
                  setFrequency(f);
                  setSelectedDay(f === "monthly" ? "1st" : "Sun");
                }}
              >
                <Text style={[addStyles.chipText, frequency === f && addStyles.chipTextOn]}>
                  {FREQ_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === "weekly" && (
            <>
              <Text style={addStyles.fieldLabel}>SEND ON</Text>
              <View style={addStyles.chipsRow}>
                {WEEK_DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[addStyles.dayChip, selectedDay === d && addStyles.chipOn]}
                    onPress={() => setSelectedDay(d)}
                  >
                    <Text style={[addStyles.chipText, selectedDay === d && addStyles.chipTextOn]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {frequency === "monthly" && (
            <>
              <Text style={addStyles.fieldLabel}>SEND ON DAY</Text>
              <View style={addStyles.chipsRow}>
                {MONTH_DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[addStyles.chip, selectedDay === d && addStyles.chipOn]}
                    onPress={() => setSelectedDay(d)}
                  >
                    <Text style={[addStyles.chipText, selectedDay === d && addStyles.chipTextOn]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Summary */}
          {step2Valid && (
            <View style={addStyles.summaryCard}>
              <SummaryRow label="Recipient" value={`${name} (${relation})`} />
              <SummaryRow
                label="Amount"
                value={`SAR ${amount}/${frequency === "daily" ? "day" : frequency === "weekly" ? "week" : "month"}`}
              />
              <SummaryRow
                label="Schedule"
                value={
                  frequency === "daily"
                    ? "Every day"
                    : frequency === "weekly"
                      ? `Every ${selectedDay}`
                      : `${selectedDay} of every month`
                }
              />
              <SummaryRow
                label="Monthly equivalent"
                value={`≈ SAR ${Math.round(toMonthly(parseFloat(amount.replace(/,/g, "") || "0"), frequency))}`}
              />
            </View>
          )}

          <TouchableOpacity
            style={[addStyles.cta, !step2Valid && addStyles.ctaDisabled]}
            onPress={confirmSchedule}
            disabled={!step2Valid}
          >
            <Text style={addStyles.ctaText}>Set Up Allowance</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={addStyles.summaryRow}>
      <Text style={addStyles.summaryLabel}>{label}</Text>
      <Text style={addStyles.summaryValue}>{value}</Text>
    </View>
  );
}

// ─── Styles: main ─────────────────────────────────────────────────────────────

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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#221D12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#C8911A" },
  scrollContent: { padding: 20, paddingBottom: 48 },

  // Summary card
  summaryCard: {
    backgroundColor: "#1A1610",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  summarySub: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginTop: 4 },
  summaryRight: { alignItems: "flex-end", gap: 8 },
  avatarStack: { flexDirection: "row-reverse", height: 36, width: 80, position: "relative" },
  stackAvatar: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  stackAvatarText: { color: "white", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  autoLabel: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Empty state
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#A89B6E" },
  emptyText: {
    fontSize: 13,
    color: "#6B5E3C",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Allowance card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1A1610",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPaused: { opacity: 0.65 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  avatarTextPaused: { color: "#6B5E3C" },
  cardMid: { flex: 1 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  cardNamePaused: { color: "#6B5E3C" },
  relationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  relationText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  cardMeta: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  cardFooterRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  totalSentText: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  monthlyEqText: { fontSize: 11, color: "#C8911A", fontFamily: "Inter_500Medium" },
  cardRight: { alignItems: "flex-end", gap: 2, paddingTop: 2 },
  cardAmount: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  cardAmountPaused: { color: "#6B5E3C" },
  cardFreqLabel: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  toggle: { marginTop: 8, transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },

  // Add dashed
  addDashedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#2C2618",
    borderStyle: "dashed",
    backgroundColor: "#1A1610",
  },
  addDashedBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C8911A" },
});

// ─── Styles: add flow ─────────────────────────────────────────────────────────

const addStyles = StyleSheet.create({
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
  content: { padding: 20, paddingBottom: 48 },

  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#6B5E3C",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#1A1610",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#EDE0B0",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  chipOn: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  chipTextOn: { color: "white" },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },

  // Amount
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  amountCurrency: {
    fontSize: 26,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    marginRight: 8,
    marginTop: 8,
  },
  amountInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    minWidth: 100,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1610",
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  quickChipOn: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  quickChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  quickChipTextOn: { color: "white" },

  // Recipient preview
  recipientPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1A1610",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  previewName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  previewHandle: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Summary
  summaryCard: { backgroundColor: "#1A1610", borderRadius: 16, padding: 16, marginBottom: 24 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  summaryValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },

  cta: { backgroundColor: "#C8911A", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
