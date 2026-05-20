import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_DEALS, type Deal, type DealBenefitType } from "@/lib/mock-data";

// ─── Benefit type config ──────────────────────────────────────────────────────

const BENEFIT_COLOR: Record<DealBenefitType, string> = {
  cashback: "#10B981",
  fee_discount: "#7C3AED",
  bonus_points: "#F59E0B",
};

const BENEFIT_BG: Record<DealBenefitType, string> = {
  cashback: "#ECFDF5",
  fee_discount: "#F4F1FA",
  bonus_points: "#FFFBEB",
};

const BENEFIT_ICON: Record<DealBenefitType, React.ComponentProps<typeof Ionicons>["name"]> = {
  cashback: "wallet-outline",
  fee_discount: "pricetag-outline",
  bonus_points: "star-outline",
};

type TabOption = "student" | "corporate";

// ─── Verification banner ──────────────────────────────────────────────────────

function VerifyBanner({
  type,
  onVerify,
}: {
  type: TabOption;
  onVerify: () => void;
}) {
  const [input, setInput] = useState("");

  const isStudent = type === "student";
  const placeholder = isStudent ? "university@student.edu.sa" : "yourname@company.com";
  const hint = isStudent
    ? "Use your official university email to verify student status."
    : "Use your company email to verify corporate eligibility.";

  function submit() {
    if (!input.includes("@") || !input.includes(".")) {
      Alert.alert("Invalid email", "Enter a valid email address to verify.");
      return;
    }
    Alert.alert(
      "Verification sent",
      `A confirmation link has been sent to ${input}. Once verified, all ${type} deals will be unlocked.`,
      [{ text: "OK", onPress: onVerify }]
    );
  }

  return (
    <View style={vStyles.root}>
      <LinearGradient
        colors={isStudent ? ["#7C3AED", "#8B5CF6"] : ["#EC4899", "#F472B6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={vStyles.grad}
      >
        <View style={vStyles.iconWrap}>
          <Ionicons
            name={isStudent ? "school-outline" : "business-outline"}
            size={26}
            color="white"
          />
        </View>
        <Text style={vStyles.title}>
          {isStudent ? "Student verification" : "Corporate verification"}
        </Text>
        <Text style={vStyles.subtitle}>{hint}</Text>

        <View style={vStyles.inputRow}>
          <TextInput
            style={vStyles.input}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={input}
            onChangeText={setInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={vStyles.submitBtn} onPress={submit}>
            <Text style={vStyles.submitText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const vStyles = StyleSheet.create({
  root: { marginHorizontal: 20, marginBottom: 24 },
  grad: { borderRadius: 20, padding: 20 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 19,
    marginBottom: 16,
  },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "white",
  },
  submitBtn: {
    height: 46,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  submitText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },
});

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const color = BENEFIT_COLOR[deal.benefitType];
  const bg = BENEFIT_BG[deal.benefitType];
  const icon = BENEFIT_ICON[deal.benefitType];

  return (
    <TouchableOpacity
      style={[styles.dealCard, deal.highlighted && styles.dealCardHighlighted]}
      activeOpacity={0.88}
      onPress={() =>
        Alert.alert(deal.title, `${deal.description}\n\nValid until: ${deal.validUntil}`)
      }
    >
      {deal.highlighted && (
        <LinearGradient
          colors={["#7C3AED", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.highlightedBadge}
        >
          <Ionicons name="sparkles" size={10} color="white" />
          <Text style={styles.highlightedBadgeText}>Featured deal</Text>
        </LinearGradient>
      )}

      <View style={styles.dealRow}>
        <View style={[styles.dealAvatar, { backgroundColor: deal.color }]}>
          <Text style={styles.dealInitials}>{deal.initials}</Text>
        </View>
        <View style={styles.dealMid}>
          <Text style={styles.dealBrand}>{deal.brand}</Text>
          <Text style={styles.dealTitle}>{deal.title}</Text>
          <Text style={styles.dealDesc} numberOfLines={2}>
            {deal.description}
          </Text>
        </View>
        <View style={[styles.dealBenefitBadge, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={12} color={color} />
          <Text style={[styles.dealBenefitText, { color }]}>{deal.benefitValue}</Text>
        </View>
      </View>

      <View style={styles.dealFooter}>
        <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
        <Text style={styles.dealValid}>Valid until {deal.validUntil}</Text>
        <TouchableOpacity
          style={styles.dealActivateBtn}
          onPress={() =>
            Alert.alert("Activate deal", "Verify your eligibility above to activate this deal.")
          }
        >
          <Text style={styles.dealActivateText}>Activate</Text>
          <Ionicons name="chevron-forward" size={11} color="#7C3AED" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DealsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabOption>("student");
  const [verified, setVerified] = useState(false);

  const eligibleDeals = MOCK_DEALS.filter(
    (d) => d.eligibility === activeTab || d.eligibility === "both"
  );

  function handleTabSwitch(tab: TabOption) {
    setActiveTab(tab);
    setVerified(false);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student & Corporate Deals</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero blurb */}
      <View style={styles.heroBanner}>
        <Ionicons name="gift-outline" size={20} color="#7C3AED" />
        <Text style={styles.heroText}>
          Exclusive cashback, fee discounts, and bonus points for verified students and employees of
          partner companies.
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(["student", "corporate"] as TabOption[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => handleTabSwitch(t)}
          >
            <Ionicons
              name={t === "student" ? "school-outline" : "business-outline"}
              size={15}
              color={activeTab === t ? "white" : "#6B7280"}
            />
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "student" ? "Student" : "Corporate"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Verification or verified state */}
      {!verified ? (
        <VerifyBanner type={activeTab} onVerify={() => setVerified(true)} />
      ) : (
        <View style={styles.verifiedBanner}>
          <View style={styles.verifiedIconWrap}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
          <Text style={styles.verifiedText}>
            {activeTab === "student" ? "Student" : "Corporate"} status verified. All deals below are
            active on your account.
          </Text>
        </View>
      )}

      {/* Deals count */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available deals</Text>
        <Text style={styles.sectionSub}>{eligibleDeals.length} deals</Text>
      </View>

      {/* Highlighted first, then rest */}
      {[
        ...eligibleDeals.filter((d) => d.highlighted),
        ...eligibleDeals.filter((d) => !d.highlighted),
      ].map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}

      {/* Footer note */}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
        <Text style={styles.footerNoteText}>
          Deals are subject to verification and may change. Cashback is credited within 48 hours of
          a qualifying transaction.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { paddingBottom: 48 },

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
  headerTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
  },

  heroBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#F4F1FA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#374151",
    lineHeight: 20,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: "#7C3AED" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  tabTextActive: { color: "white" },

  // Verified state
  verifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 14,
  },
  verifiedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#065F46",
    lineHeight: 19,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  // Deal card
  dealCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dealCardHighlighted: {
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  highlightedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  highlightedBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  dealRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  dealAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dealInitials: { fontSize: 14, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  dealMid: { flex: 1 },
  dealBrand: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#9CA3AF", marginBottom: 2 },
  dealTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 3 },
  dealDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7280", lineHeight: 17 },
  dealBenefitBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    gap: 3,
    minWidth: 56,
    flexShrink: 0,
  },
  dealBenefitText: { fontSize: 13, fontFamily: "PlusJakartaSans_700Bold" },
  dealFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
  },
  dealValid: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
  },
  dealActivateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#F4F1FA",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dealActivateText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    lineHeight: 17,
  },
});
