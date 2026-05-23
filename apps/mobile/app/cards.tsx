import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiCard = {
  id: string;
  last4: string;
  network: "mada" | "visa" | "mastercard";
  cardType: "virtual" | "physical";
  label: string | null;
  spendLimitSar: number | null;
  status: "active" | "frozen" | "cancelled";
  expiresAt: string;
  createdAt: string;
};

type IssueableNetwork = "mada" | "visa" | "mastercard";

type CardSettings = {
  onlinePayments: boolean;
  contactless: boolean;
  internationalTx: boolean;
};

type IssueStep = "type" | "format" | "limit";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const NETWORK_DEFS: Record<
  IssueableNetwork,
  { displayName: string; benefit: string; colors: [string, string] }
> = {
  mada: {
    displayName: "mada",
    benefit: "Saudi debit — accepted at all Mada-enabled merchants in KSA",
    colors: ["#7C3AED", "#5B21B6"],
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expiryLabel(expiresAt: string): string {
  const d = new Date(expiresAt);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}

function defaultSettings(card: ApiCard): CardSettings {
  return {
    onlinePayments: true,
    contactless: card.cardType === "physical",
    internationalTx: card.network !== "mada",
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const cardsLenRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [issuing, setIssuing] = useState(false);
  const [cardSettings, setCardSettings] = useState<Record<string, CardSettings>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const res = await apiFetch("/api/cards");
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json() as Promise<ApiCard[]>;
    },
  });
  const cards = useMemo(() => data ?? [], [data]);

  const card = cards[activeIndex] ?? cards[0];
  const settings = card ? (cardSettings[card.id] ?? defaultSettings(card)) : null;

  useEffect(() => {
    cardsLenRef.current = cards.length;
    setCardSettings((prev) => {
      const next: typeof prev = {};
      for (const c of cards) {
        next[c.id] = prev[c.id] ?? defaultSettings(c);
      }
      return next;
    });
  }, [cards]);

  const freezeMutation = useMutation({
    mutationFn: (cardId: string) =>
      apiFetch(`/api/cards/${cardId}/freeze`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
    onError: () => Alert.alert("Error", "Could not freeze card. Please try again."),
  });

  const unfreezeMutation = useMutation({
    mutationFn: (cardId: string) =>
      apiFetch(`/api/cards/${cardId}/unfreeze`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
    onError: () => Alert.alert("Error", "Could not unfreeze card. Please try again."),
  });

  const issueMutation = useMutation({
    mutationFn: (input: {
      network: IssueableNetwork;
      cardType: "virtual" | "physical";
      spendLimitSar: number;
    }) =>
      apiFetch("/api/cards/issue", {
        method: "POST",
        body: JSON.stringify(input),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<ApiCard>;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setIssuing(false);
      setTimeout(() => {
        setActiveIndex(cardsLenRef.current);
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    },
    onError: () => Alert.alert("Error", "Could not issue card. Please try again."),
  });

  function toggleFreeze() {
    if (!card) return;
    if (card.status === "frozen") unfreezeMutation.mutate(card.id);
    else freezeMutation.mutate(card.id);
  }

  function toggleSetting(key: keyof CardSettings) {
    if (!card) return;
    setCardSettings((prev) => {
      const current = prev[card.id] ?? defaultSettings(card);
      return { ...prev, [card.id]: { ...current, [key]: !current[key] } };
    });
  }

  const holderName =
    authState.status === "authenticated" ? (authState.user.name ?? "Card Holder") : "Card Holder";

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1A1426" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cards</Text>
          <TouchableOpacity style={styles.newCardBtn} onPress={() => setIssuing(true)}>
            <Ionicons name="add" size={18} color="#7C3AED" />
            <Text style={styles.newCardBtnText}>New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptyText}>Issue your first virtual or physical card to get started.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setIssuing(true)}>
            <Text style={styles.emptyBtnText}>Issue a Card</Text>
          </TouchableOpacity>
        </View>
        <Modal visible={issuing} animationType="slide" presentationStyle="pageSheet">
          <IssueCardFlow
            onClose={() => setIssuing(false)}
            onIssue={(input) => issueMutation.mutate(input)}
            issuing={issueMutation.isPending}
          />
        </Modal>
      </View>
    );
  }

  const spendLimit = card.spendLimitSar ?? 10_000;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity style={styles.newCardBtn} onPress={() => setIssuing(true)}>
          <Ionicons name="add" size={18} color="#7C3AED" />
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
            <CardVisual key={c.id} card={c} holderName={holderName} />
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
            <Text style={styles.spendLimit}>limit SAR {spendLimit.toLocaleString("en-SA")}</Text>
          </View>
          <View style={styles.spendBarTrack}>
            <View style={[styles.spendBarFill, { width: "0%", backgroundColor: NETWORK_DEFS[card.network]?.colors[0] ?? "#7C3AED" }]} />
          </View>
          <View style={styles.spendBottomRow}>
            <Text style={styles.spentAmount}>SAR 0</Text>
            <Text style={styles.spendPct}>0% used</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon={card.status === "frozen" ? "lock-open-outline" : "lock-closed-outline"}
            label={card.status === "frozen" ? "Unfreeze" : "Freeze"}
            color={card.status === "frozen" ? "#10B981" : "#7C3AED"}
            onPress={toggleFreeze}
          />
          <QuickAction
            icon="bar-chart-outline"
            label="Limits"
            color="#7C3AED"
            onPress={() =>
              Alert.alert(
                "Spend Limits",
                "Spend limit management will be available in the next release.",
              )
            }
          />
          <QuickAction
            icon="eye-outline"
            label="Show Number"
            color="#7C3AED"
            onPress={() =>
              Alert.alert("Card Number", `•••• •••• •••• ${card.last4}\n\nExpiry: ${expiryLabel(card.expiresAt)}\nCVV: •••`)
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
        {settings && (
          <View style={styles.settingsCard}>
            <SettingRow
              icon="globe-outline"
              label="Online Payments"
              sub="Allow card use on websites and apps"
              value={settings.onlinePayments}
              onToggle={() => toggleSetting("onlinePayments")}
              disabled={card.status === "frozen"}
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="wifi-outline"
              label="Contactless"
              sub="Tap-to-pay at physical terminals"
              value={settings.contactless}
              onToggle={() => toggleSetting("contactless")}
              disabled={card.status === "frozen"}
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="earth-outline"
              label="International Transactions"
              sub="Use card outside Saudi Arabia"
              value={settings.internationalTx}
              onToggle={() => toggleSetting("internationalTx")}
              disabled={card.status === "frozen"}
            />
          </View>
        )}

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
          onIssue={(input) => issueMutation.mutate(input)}
          issuing={issueMutation.isPending}
        />
      </Modal>
    </View>
  );
}

// ─── Card visual ──────────────────────────────────────────────────────────────

function CardVisual({ card, holderName }: { card: ApiCard; holderName: string }) {
  const frozen = card.status === "frozen";
  const def = NETWORK_DEFS[card.network];
  const gradientColors = def?.colors ?? (["#7C3AED", "#5B21B6"] as [string, string]);

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardFormatBadge}>
            <Text style={styles.cardFormatText}>
              {card.cardType === "virtual" ? "Virtual" : "Physical"}
            </Text>
          </View>
          <NetworkLogo network={card.network} />
        </View>

        {/* Card number */}
        <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>

        {/* Bottom row */}
        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
            <Text style={styles.cardFieldValue}>{holderName}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.cardFieldLabel}>EXPIRES</Text>
            <Text style={styles.cardFieldValue}>{expiryLabel(card.expiresAt)}</Text>
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

function NetworkLogo({ network }: { network: IssueableNetwork }) {
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
        <Ionicons name={icon} size={18} color={disabled ? "#D1D5DB" : "#7C3AED"} />
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
        thumbColor={value && !disabled ? "#7C3AED" : "#9CA3AF"}
      />
    </View>
  );
}

// ─── Issue card flow (modal) ──────────────────────────────────────────────────

function IssueCardFlow({
  onClose,
  onIssue,
  issuing,
}: {
  onClose: () => void;
  onIssue: (input: { network: IssueableNetwork; cardType: "virtual" | "physical"; spendLimitSar: number }) => void;
  issuing: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<IssueStep>("type");
  const [network, setNetwork] = useState<IssueableNetwork | null>(null);
  const [cardType, setCardType] = useState<"virtual" | "physical" | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const ISSUE_NETWORKS: IssueableNetwork[] = ["mada", "visa", "mastercard"];
  const QUICK_LIMITS = ["1,000", "5,000", "10,000", "20,000"];

  function goBack() {
    if (step === "format") { setStep("type"); return; }
    if (step === "limit") { setStep("format"); return; }
    onClose();
  }

  function onSelectNetwork(n: IssueableNetwork) {
    setNetwork(n);
    setStep("format");
  }

  function onSelectFormat(f: "virtual" | "physical") {
    setCardType(f);
    setStep("limit");
  }

  function confirm() {
    const limit = parseFloat(limitInput.replace(/,/g, ""));
    if (!limit || limit < 100) {
      Alert.alert("Invalid limit", "Minimum spend limit is SAR 100.");
      return;
    }
    onIssue({ network: network!, cardType: cardType!, spendLimitSar: limit });
  }

  const stepTitle: Record<IssueStep, string> = {
    type: "Choose Card Type",
    format: "Virtual or Physical",
    limit: "Set Spend Limit",
  };

  return (
    <View style={[issueStyles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={issueStyles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name={step === "type" ? "close" : "chevron-back"} size={24} color="#1A1426" />
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
            style={[issueStyles.formatCard, cardType === "virtual" && issueStyles.formatCardSelected]}
            onPress={() => onSelectFormat("virtual")}
            activeOpacity={0.75}
          >
            <View style={issueStyles.formatIconWrap}>
              <Ionicons name="phone-portrait-outline" size={26} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={issueStyles.formatName}>Virtual</Text>
              <Text style={issueStyles.formatSub}>
                Instant. Use immediately in Apple Pay, online, and apps.
              </Text>
            </View>
            {cardType === "virtual" && <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[issueStyles.formatCard, cardType === "physical" && issueStyles.formatCardSelected]}
            onPress={() => onSelectFormat("physical")}
            activeOpacity={0.75}
          >
            <View style={issueStyles.formatIconWrap}>
              <Ionicons name="card-outline" size={26} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={issueStyles.formatName}>Physical</Text>
              <Text style={issueStyles.formatSub}>
                Delivered in 3–5 business days. Contactless chip card.
              </Text>
            </View>
            {cardType === "physical" && (
              <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
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
                style={[issueStyles.quickLimitChip, limitInput === q && issueStyles.quickLimitChipOn]}
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
          {network && cardType && (
            <View style={issueStyles.summaryCard}>
              <SummaryRow label="Card type" value={NETWORK_DEFS[network].displayName} />
              <SummaryRow
                label="Format"
                value={cardType === "virtual" ? "Virtual (instant)" : "Physical (3–5 days)"}
              />
              {limitInput ? (
                <SummaryRow label="Spend limit" value={`SAR ${limitInput}/month`} />
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={[issueStyles.cta, (!limitInput || issuing) && issueStyles.ctaDisabled]}
            onPress={confirm}
            disabled={!limitInput || issuing}
            activeOpacity={0.85}
          >
            {issuing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={issueStyles.ctaText}>Issue Card</Text>
            )}
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
  newCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F4F1FA",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newCardBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "white" },

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
  dotActive: { width: 18, backgroundColor: "#7C3AED" },

  // Spend
  spendCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
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
  spendLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#374151" },
  spendLimit: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  spendBarTrack: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  spendBarFill: { height: 6, borderRadius: 3 },
  spendBottomRow: { flexDirection: "row", justifyContent: "space-between" },
  spentAmount: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  spendPct: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

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
  quickActionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#374151" },

  // Settings
  settingsCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
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
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  settingMid: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    marginBottom: 2,
  },
  settingLabelDisabled: { color: "#9CA3AF" },
  settingSub: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  settingDivider: { height: 1, backgroundColor: "#F9FAFB", marginLeft: 48 },

  // Frozen banner
  frozenBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
  },
  frozenBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 18,
  },
});

// ─── Styles: issue flow ───────────────────────────────────────────────────────

const issueStyles = StyleSheet.create({
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
  content: { padding: 20, paddingBottom: 48 },

  // Type step
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
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
    color: "#1A1426",
    marginBottom: 3,
  },
  typeCardBenefit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
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
    backgroundColor: "white",
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
  formatCardSelected: { borderColor: "#7C3AED", backgroundColor: "#F4F1FA" },
  formatIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  formatName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 4 },
  formatSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9CA3AF", lineHeight: 18 },

  // Limit step
  limitHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
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
    color: "#9CA3AF",
    marginRight: 8,
    marginTop: 8,
  },
  limitInput: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
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
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  quickLimitChipOn: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  quickLimitText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B7280" },
  quickLimitTextOn: { color: "white" },

  // Summary
  summaryCard: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 24 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9CA3AF" },
  summaryValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1A1426" },

  // CTA
  cta: { backgroundColor: "#7C3AED", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  ctaDisabled: { backgroundColor: "#E5E7EB" },
  ctaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "white" },
});
