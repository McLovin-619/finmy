import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_CARDS, type CardFormat, type CardNetwork, type IssuedCard } from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const NETWORK_DEFS: Record<
  CardNetwork,
  { displayName: string; benefit: string; colors: [string, string] }
> = {
  mada: {
    displayName: "mada",
    benefit: "Saudi debit — accepted at all Mada-enabled merchants in KSA",
    colors: ["#C8911A", "#5B21B6"],
  },
  visa: {
    displayName: "VISA",
    benefit: "International credit with worldwide Visa acceptance",
    colors: ["#1A1426", "#374151"],
  },
  mastercard: {
    displayName: "Mastercard",
    benefit: "Credit card with cashback rewards on every purchase",
    colors: ["#EF4444", "#F97316"],
  },
  travel: {
    displayName: "Travel",
    benefit: "Zero FX fees, airport lounge access, travel insurance",
    colors: ["#0EA5E9", "#14B8A6"],
  },
};

type IssueStep = "type" | "format" | "limit" | "success";

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [cards, setCards] = useState(MOCK_CARDS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [issuing, setIssuing] = useState(false);

  const card = cards[activeIndex] ?? cards[0];

  function toggleFreeze() {
    setCards((prev) =>
      prev.map((c, i) =>
        i === activeIndex ? { ...c, status: c.status === "active" ? "frozen" : "active" } : c
      )
    );
  }

  function toggleSetting(key: "onlinePayments" | "contactless" | "internationalTx") {
    setCards((prev) => prev.map((c, i) => (i === activeIndex ? { ...c, [key]: !c[key] } : c)));
  }

  function onAddCard(newCard: IssuedCard) {
    setCards((prev) => [...prev, newCard]);
    setActiveIndex(cards.length); // jump to the new card
    setIssuing(false);
    // Scroll to end after state update
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity style={styles.newCardBtn} onPress={() => setIssuing(true)}>
          <Ionicons name="add" size={18} color="#C8911A" />
          <Text style={styles.newCardBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Card carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
            setActiveIndex(Math.min(idx, cards.length - 1));
          }}
        >
          {cards.map((c) => (
            <CardVisual key={c.id} card={c} />
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {cards.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Spend progress */}
        <View style={styles.spendCard}>
          <View style={styles.spendTopRow}>
            <Text style={styles.spendLabel}>Spent this month</Text>
            <Text style={styles.spendLimit}>
              limit SAR {card.spendLimitSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.spendBarTrack}>
            <View
              style={[
                styles.spendBarFill,
                {
                  width:
                    `${Math.min(100, (card.spentThisMonthSar / card.spendLimitSar) * 100)}%` as any,
                  backgroundColor: card.gradientColors[0],
                },
              ]}
            />
          </View>
          <View style={styles.spendBottomRow}>
            <Text style={styles.spentAmount}>
              SAR {card.spentThisMonthSar.toLocaleString("en-SA")}
            </Text>
            <Text style={styles.spendPct}>
              {Math.round((card.spentThisMonthSar / card.spendLimitSar) * 100)}% used
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon={card.status === "frozen" ? "lock-open-outline" : "lock-closed-outline"}
            label={card.status === "frozen" ? "Unfreeze" : "Freeze"}
            color={card.status === "frozen" ? "#10B981" : "#C8911A"}
            onPress={toggleFreeze}
          />
          <QuickAction
            icon="bar-chart-outline"
            label="Limits"
            color="#C8911A"
            onPress={() =>
              Alert.alert(
                "Spend Limits",
                "Spend limit management will be available in the next release."
              )
            }
          />
          <QuickAction
            icon="eye-outline"
            label="Show Number"
            color="#C8911A"
            onPress={() =>
              Alert.alert(
                "Card Number",
                `4111 2233 4455 ${card.lastFour}\n\nExpiry: ${card.expiry}\nCVV: •••`
              )
            }
          />
          <QuickAction
            icon="flag-outline"
            label="Report"
            color="#EF4444"
            onPress={() =>
              Alert.alert("Report Card", "Report this card as lost or stolen?", [
                { text: "Cancel", style: "cancel" },
                { text: "Report", style: "destructive" },
              ])
            }
          />
        </View>

        {/* Settings toggles */}
        <View style={styles.settingsCard}>
          <SettingRow
            icon="globe-outline"
            label="Online Payments"
            sub="Allow card use on websites and apps"
            value={card.onlinePayments}
            onToggle={() => toggleSetting("onlinePayments")}
            disabled={card.status === "frozen"}
          />
          <View style={styles.settingDivider} />
          <SettingRow
            icon="wifi-outline"
            label="Contactless"
            sub="Tap-to-pay at physical terminals"
            value={card.contactless}
            onToggle={() => toggleSetting("contactless")}
            disabled={card.status === "frozen"}
          />
          <View style={styles.settingDivider} />
          <SettingRow
            icon="earth-outline"
            label="International Transactions"
            sub="Use card outside Saudi Arabia"
            value={card.internationalTx}
            onToggle={() => toggleSetting("internationalTx")}
            disabled={card.status === "frozen"}
          />
        </View>

        {card.status === "frozen" && (
          <View style={styles.frozenBanner}>
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
            <Text style={styles.frozenBannerText}>
              This card is frozen. All transactions are blocked until you unfreeze it.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Issue new card modal */}
      <Modal visible={issuing} animationType="slide" presentationStyle="pageSheet">
        <IssueCardFlow
          onClose={() => setIssuing(false)}
          onSuccess={onAddCard}
          existingCount={cards.length}
        />
      </Modal>
    </View>
  );
}

// ─── Card visual ──────────────────────────────────────────────────────────────

function CardVisual({ card }: { card: IssuedCard }) {
  const frozen = card.status === "frozen";
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={card.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardFormatBadge}>
            <Text style={styles.cardFormatText}>
              {card.format === "virtual" ? "Virtual" : "Physical"}
            </Text>
          </View>
          <NetworkLogo network={card.network} />
        </View>

        {/* Card number */}
        <Text style={styles.cardNumber}>•••• •••• •••• {card.lastFour}</Text>

        {/* Bottom row */}
        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
            <Text style={styles.cardFieldValue}>Abdullah Al-Saud</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.cardFieldLabel}>EXPIRES</Text>
            <Text style={styles.cardFieldValue}>{card.expiry}</Text>
          </View>
        </View>

        {/* Frozen overlay */}
        {frozen && (
          <View style={styles.frozenOverlay}>
            <Ionicons name="lock-closed" size={32} color="white" />
            <Text style={styles.frozenOverlayText}>Frozen</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ─── Network logo ─────────────────────────────────────────────────────────────

function NetworkLogo({ network }: { network: CardNetwork }) {
  if (network === "mastercard") {
    return (
      <View style={styles.mcLogoWrap}>
        <View style={[styles.mcCircle, { backgroundColor: "#EF4444" }]} />
        <View style={[styles.mcCircle, { backgroundColor: "#F97316", marginLeft: -10 }]} />
      </View>
    );
  }
  return <Text style={styles.networkLabel}>{NETWORK_DEFS[network].displayName}</Text>;
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Setting toggle row ───────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  sub,
  value,
  onToggle,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={18} color={disabled ? "#D1D5DB" : "#C8911A"} />
      </View>
      <View style={styles.settingMid}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
        thumbColor={value && !disabled ? "#C8911A" : "#9CA3AF"}
      />
    </View>
  );
}

// ─── Issue card flow (modal) ──────────────────────────────────────────────────

function IssueCardFlow({
  onClose,
  onSuccess,
  existingCount,
}: {
  onClose: () => void;
  onSuccess: (card: IssuedCard) => void;
  existingCount: number;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<IssueStep>("type");
  const [network, setNetwork] = useState<CardNetwork | null>(null);
  const [format, setFormat] = useState<CardFormat | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const ISSUE_NETWORKS: CardNetwork[] = ["mada", "visa", "mastercard", "travel"];
  const QUICK_LIMITS = ["1,000", "5,000", "10,000", "20,000"];

  function goBack() {
    if (step === "format") {
      setStep("type");
      return;
    }
    if (step === "limit") {
      setStep("format");
      return;
    }
    onClose();
  }

  function onSelectNetwork(n: CardNetwork) {
    setNetwork(n);
    setStep("format");
  }

  function onSelectFormat(f: CardFormat) {
    setFormat(f);
    setStep("limit");
  }

  function confirm() {
    const limit = parseFloat(limitInput.replace(/,/g, ""));
    if (!limit || limit < 100) {
      Alert.alert("Invalid limit", "Minimum spend limit is SAR 100.");
      return;
    }
    const def = NETWORK_DEFS[network!];
    const newCard: IssuedCard = {
      id: `card${existingCount + 1}`,
      network: network!,
      format: format!,
      label: def.displayName,
      lastFour: String(Math.floor(1000 + Math.random() * 9000)),
      expiry: "05/29",
      status: "active",
      spendLimitSar: limit,
      spentThisMonthSar: 0,
      onlinePayments: true,
      contactless: format === "physical",
      internationalTx: network !== "mada",
      gradientColors: def.colors as [string, string],
    };
    onSuccess(newCard);
  }

  const stepTitle: Record<IssueStep, string> = {
    type: "Choose Card Type",
    format: "Virtual or Physical",
    limit: "Set Spend Limit",
    success: "",
  };

  return (
    <View style={[issueStyles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={issueStyles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name={step === "type" ? "close" : "chevron-back"} size={24} color="#EDE0B0" />
        </TouchableOpacity>
        <Text style={issueStyles.headerTitle}>{stepTitle[step]}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step: Type */}
      {step === "type" && (
        <ScrollView contentContainerStyle={issueStyles.content}>
          {ISSUE_NETWORKS.map((n) => {
            const def = NETWORK_DEFS[n];
            return (
              <TouchableOpacity
                key={n}
                style={issueStyles.typeCard}
                onPress={() => onSelectNetwork(n)}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={def.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={issueStyles.typeCardAccent}
                >
                  <NetworkLogo network={n} />
                </LinearGradient>
                <View style={issueStyles.typeCardBody}>
                  <Text style={issueStyles.typeCardName}>{def.displayName}</Text>
                  <Text style={issueStyles.typeCardBenefit}>{def.benefit}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Step: Format */}
      {step === "format" && (
        <ScrollView contentContainerStyle={issueStyles.content}>
          {network && (
            <View style={issueStyles.selectedNetworkRow}>
              <LinearGradient
                colors={NETWORK_DEFS[network].colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={issueStyles.selectedNetworkPill}
              >
                <Text style={issueStyles.selectedNetworkText}>
                  {NETWORK_DEFS[network].displayName}
                </Text>
              </LinearGradient>
            </View>
          )}

          <TouchableOpacity
            style={[issueStyles.formatCard, format === "virtual" && issueStyles.formatCardSelected]}
            onPress={() => onSelectFormat("virtual")}
            activeOpacity={0.75}
          >
            <View style={issueStyles.formatIconWrap}>
              <Ionicons name="phone-portrait-outline" size={26} color="#C8911A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={issueStyles.formatName}>Virtual</Text>
              <Text style={issueStyles.formatSub}>
                Instant. Use immediately in Apple Pay, online, and apps.
              </Text>
            </View>
            {format === "virtual" && <Ionicons name="checkmark-circle" size={22} color="#C8911A" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              issueStyles.formatCard,
              format === "physical" && issueStyles.formatCardSelected,
            ]}
            onPress={() => onSelectFormat("physical")}
            activeOpacity={0.75}
          >
            <View style={issueStyles.formatIconWrap}>
              <Ionicons name="card-outline" size={26} color="#C8911A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={issueStyles.formatName}>Physical</Text>
              <Text style={issueStyles.formatSub}>
                Delivered in 3–5 business days. Contactless chip card.
              </Text>
            </View>
            {format === "physical" && (
              <Ionicons name="checkmark-circle" size={22} color="#C8911A" />
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step: Limit */}
      {step === "limit" && (
        <ScrollView contentContainerStyle={issueStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={issueStyles.limitHint}>
            Set a monthly spend limit for this card. You can change it at any time.
          </Text>

          <View style={issueStyles.limitInputRow}>
            <Text style={issueStyles.limitCurrency}>SAR</Text>
            <TextInput
              style={issueStyles.limitInput}
              value={limitInput}
              onChangeText={(v) => setLimitInput(v.replace(/[^0-9,]/g, ""))}
              placeholder="0"
              placeholderTextColor="#D1D5DB"
              keyboardType="number-pad"
              autoFocus
            />
          </View>

          <View style={issueStyles.quickLimitsRow}>
            {QUICK_LIMITS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  issueStyles.quickLimitChip,
                  limitInput === q && issueStyles.quickLimitChipOn,
                ]}
                onPress={() => setLimitInput(q)}
              >
                <Text
                  style={[
                    issueStyles.quickLimitText,
                    limitInput === q && issueStyles.quickLimitTextOn,
                  ]}
                >
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary */}
          {network && format && (
            <View style={issueStyles.summaryCard}>
              <SummaryRow label="Card type" value={NETWORK_DEFS[network].displayName} />
              <SummaryRow
                label="Format"
                value={format === "virtual" ? "Virtual (instant)" : "Physical (3–5 days)"}
              />
              {limitInput ? (
                <SummaryRow label="Spend limit" value={`SAR ${limitInput}/month`} />
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={[issueStyles.cta, !limitInput && issueStyles.ctaDisabled]}
            onPress={confirm}
            disabled={!limitInput}
            activeOpacity={0.85}
          >
            <Text style={issueStyles.ctaText}>Issue Card</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={issueStyles.summaryRow}>
      <Text style={issueStyles.summaryLabel}>{label}</Text>
      <Text style={issueStyles.summaryValue}>{value}</Text>
    </View>
  );
}

// ─── Styles: main screen ──────────────────────────────────────────────────────

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
  newCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#221D12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newCardBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#C8911A" },

  // Carousel
  carouselContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, gap: CARD_GAP },
  cardWrapper: {
    width: CARD_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  cardGradient: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardFormatBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardFormatText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "white" },
  networkLabel: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    letterSpacing: 1,
  },
  mcLogoWrap: { flexDirection: "row", alignItems: "center" },
  mcCircle: { width: 26, height: 26, borderRadius: 13, opacity: 0.9 },
  cardNumber: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 2,
  },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardFieldLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardFieldValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "white" },

  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  frozenOverlayText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },

  // Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB" },
  dotActive: { width: 18, backgroundColor: "#C8911A" },

  // Spend
  spendCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  spendTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  spendLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A89B6E" },
  spendLimit: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  spendBarTrack: {
    height: 6,
    backgroundColor: "#1E1A10",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  spendBarFill: { height: 6, borderRadius: 3 },
  spendBottomRow: { flexDirection: "row", justifyContent: "space-between" },
  spentAmount: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  spendPct: { fontSize: 12, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Quick actions
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  quickAction: { alignItems: "center", gap: 6, flex: 1 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#A89B6E" },

  // Settings
  settingsCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  settingRowDisabled: { opacity: 0.45 },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  settingMid: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 2,
  },
  settingLabelDisabled: { color: "#6B5E3C" },
  settingSub: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },
  settingDivider: { height: 1, backgroundColor: "#1E1A10", marginLeft: 48 },

  // Frozen banner
  frozenBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: "#1E1A10",
    borderRadius: 12,
    padding: 12,
  },
  frozenBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    lineHeight: 18,
  },
});

// ─── Styles: issue flow ───────────────────────────────────────────────────────

const issueStyles = StyleSheet.create({
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

  // Type step
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1610",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeCardAccent: { width: 64, height: 72, alignItems: "center", justifyContent: "center" },
  typeCardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  typeCardName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#EDE0B0",
    marginBottom: 3,
  },
  typeCardBenefit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    lineHeight: 17,
  },

  // Format step
  selectedNetworkRow: { alignItems: "center", marginBottom: 20 },
  selectedNetworkPill: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  selectedNetworkText: { fontSize: 14, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  formatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  formatCardSelected: { borderColor: "#C8911A", backgroundColor: "#221D12" },
  formatIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  formatName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#EDE0B0", marginBottom: 4 },
  formatSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B5E3C", lineHeight: 18 },

  // Limit step
  limitHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#8C7C55",
    marginBottom: 24,
    lineHeight: 20,
  },
  limitInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  limitCurrency: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    color: "#6B5E3C",
    marginRight: 8,
    marginTop: 8,
  },
  limitInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#EDE0B0",
    minWidth: 100,
    textAlign: "center",
  },
  quickLimitsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  quickLimitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#2C2618",
  },
  quickLimitChipOn: { backgroundColor: "#C8911A", borderColor: "#C8911A" },
  quickLimitText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  quickLimitTextOn: { color: "white" },

  // Summary
  summaryCard: { backgroundColor: "#1A1610", borderRadius: 16, padding: 16, marginBottom: 24 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B5E3C" },
  summaryValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },

  // CTA
  cta: { backgroundColor: "#C8911A", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
