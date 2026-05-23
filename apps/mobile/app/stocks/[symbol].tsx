import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Defs, LinearGradient as SvgGradient, Path, Stop, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatHalalasSar } from "@finmy/lib";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = "1M" | "3M" | "6M" | "1Y";

type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  priceHalalas: number;
  changeHalalas: number;
  changePct: number;
  previousCloseHalalas: number;
  marketState: string;
};

type HistoryPoint = { date: string; closeHalalas: number };

type DetailResp = {
  quote: Quote;
  history: HistoryPoint[];
  range: Range;
};

type Holding = {
  symbol: string;
  sharesMicro: number;
  avgCostHalalas: number;
  priceHalalas: number;
  valueHalalas: number;
  costHalalas: number;
  unrealizedPlHalalas: number;
  unrealizedPlPct: number;
};

type WalletResp = { wallet: { balanceSar: number } };

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Chart ────────────────────────────────────────────────────────────────────

function PriceChart({ data, color }: { data: HistoryPoint[]; color: string }) {
  const width = SCREEN_WIDTH - 40;
  const height = 140;
  const padTop = 8;
  const padBottom = 8;

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#9CA3AF", fontFamily: "Inter_400Regular", fontSize: 12 }}>
          Not enough data to chart
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.closeHalalas);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => (i / (values.length - 1)) * width;
  const getY = (v: number) =>
    padTop + (1 - (v - minVal) / range) * (height - padTop - padBottom);

  const pts = values.map((v, i) => ({ x: getX(i), y: getY(v) }));

  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (curr.x - prev.x) / 3;
    linePath += ` C ${prev.x + cpx} ${prev.y}, ${curr.x - cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  return (
    <Svg width={width} height={height} style={{ alignSelf: "center" }}>
      <Defs>
        <SvgGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sg)" />
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StockDetailScreen() {
  const insets = useSafeAreaInsets();
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = decodeURIComponent(rawSymbol ?? "");
  const [range, setRange] = useState<Range>("1M");
  const [orderModal, setOrderModal] = useState<"buy" | "sell" | null>(null);
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["stocks", "detail", symbol, range],
    queryFn: async () => {
      const res = await apiFetch(`/api/stocks/${encodeURIComponent(symbol)}?range=${range}`);
      if (!res.ok) throw new Error("detail failed");
      return res.json() as Promise<DetailResp>;
    },
    refetchInterval: 30_000,
    enabled: !!symbol,
  });

  const holdings = useQuery({
    queryKey: ["stocks", "holdings"],
    queryFn: async () => {
      const res = await apiFetch("/api/stocks/holdings");
      if (!res.ok) throw new Error("holdings failed");
      return res.json() as Promise<{ holdings: Holding[] }>;
    },
  });

  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiFetch("/api/wallet");
      if (!res.ok) throw new Error("wallet failed");
      return res.json() as Promise<WalletResp>;
    },
  });

  const myHolding = holdings.data?.holdings.find((h) => h.symbol === symbol);
  const quote = detail.data?.quote;
  const up = (quote?.changePct ?? 0) >= 0;
  const color = up ? "#10B981" : "#EF4444";

  const closeModal = () => setOrderModal(null);

  const onOrderSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["stocks"] });
    closeModal();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1A1426" />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerSymbol}>{symbol.replace(".SR", "")}</Text>
            <Text style={styles.headerName}>{quote?.name ?? symbol}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Price block */}
        {detail.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : detail.error || !quote ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={28} color="#9CA3AF" />
            <Text style={styles.muted}>Price unavailable, try again later</Text>
          </View>
        ) : (
          <>
            <View style={styles.priceBlock}>
              <Text style={styles.priceMain}>SAR {formatHalalasSar(quote.priceHalalas)}</Text>
              <View style={[styles.changePill, { backgroundColor: up ? "#ECFDF5" : "#FEF2F2" }]}>
                <Ionicons
                  name={up ? "trending-up" : "trending-down"}
                  size={12}
                  color={color}
                />
                <Text style={[styles.changeText, { color }]}>
                  {up ? "+" : "−"}SAR {formatHalalasSar(Math.abs(quote.changeHalalas))} (
                  {up ? "+" : ""}
                  {quote.changePct.toFixed(2)}%)
                </Text>
              </View>
              <Text style={styles.marketSub}>
                {quote.exchange} · {quote.sector} ·{" "}
                {quote.marketState === "REGULAR" ? "Market open" : "Market closed"}
              </Text>
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <PriceChart data={detail.data?.history ?? []} color={color} />
              <View style={styles.rangeRow}>
                {(["1M", "3M", "6M", "1Y"] as Range[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rangeChip, range === r && styles.rangeChipOn]}
                    onPress={() => setRange(r)}
                  >
                    <Text
                      style={[styles.rangeText, range === r && styles.rangeTextOn]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Your position */}
        {myHolding && (
          <View style={styles.positionCard}>
            <Text style={styles.positionLabel}>Your position</Text>
            <View style={styles.positionRow}>
              <View>
                <Text style={styles.positionShares}>
                  {(myHolding.sharesMicro / 1_000_000).toFixed(4)} sh
                </Text>
                <Text style={styles.positionAvg}>
                  Avg cost SAR {formatHalalasSar(myHolding.avgCostHalalas)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.positionValue}>SAR {formatHalalasSar(myHolding.valueHalalas)}</Text>
                <Text
                  style={[
                    styles.positionPl,
                    { color: myHolding.unrealizedPlHalalas >= 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {myHolding.unrealizedPlHalalas >= 0 ? "+" : "−"}SAR{" "}
                  {formatHalalasSar(Math.abs(myHolding.unrealizedPlHalalas))} (
                  {myHolding.unrealizedPlPct >= 0 ? "+" : ""}
                  {myHolding.unrealizedPlPct.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Wallet balance hint */}
        <View style={styles.walletHint}>
          <Ionicons name="wallet-outline" size={14} color="#7C3AED" />
          <Text style={styles.walletHintText}>
            Wallet balance: SAR{" "}
            {wallet.data
              ? wallet.data.wallet.balanceSar.toLocaleString("en-SA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.cta, styles.ctaSell, !myHolding && styles.ctaDisabled]}
          disabled={!myHolding}
          onPress={() => setOrderModal("sell")}
        >
          <Text style={[styles.ctaText, !myHolding && styles.ctaTextDisabled]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cta, styles.ctaBuy]}
          onPress={() => setOrderModal("buy")}
        >
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBuyGrad}
          >
            <Text style={styles.ctaTextBuy}>Buy</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Re-mount per open via key={orderModal} so amount input starts fresh. */}
      {quote && orderModal && (
        <OrderModal
          key={orderModal}
          side={orderModal}
          symbol={symbol}
          quote={quote}
          holding={myHolding}
          walletBalanceSar={wallet.data?.wallet.balanceSar ?? 0}
          onClose={closeModal}
          onSuccess={onOrderSuccess}
        />
      )}
    </View>
  );
}

// ─── Order modal ──────────────────────────────────────────────────────────────

function OrderModal({
  side,
  symbol,
  quote,
  holding,
  walletBalanceSar,
  onClose,
  onSuccess,
}: {
  side: "buy" | "sell";
  symbol: string;
  quote: Quote;
  holding: Holding | undefined;
  walletBalanceSar: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");

  const amountSar = parseFloat(amount) || 0;
  const sharesPreview = amountSar > 0 ? (amountSar * 100) / quote.priceHalalas : 0;

  const maxSar =
    side === "buy"
      ? walletBalanceSar
      : holding
        ? holding.valueHalalas / 100
        : 0;

  const insufficient = amountSar > maxSar;
  const canSubmit = amountSar > 0 && !insufficient;

  const order = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/stocks/orders", {
        method: "POST",
        body: JSON.stringify({ symbol, side, amountSar }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body?.error ?? "Order failed");
      return body;
    },
    onSuccess: () => {
      setAmount("");
      onSuccess();
    },
    onError: (err: Error) => {
      Alert.alert("Order failed", err.message);
    },
  });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={modalStyles.backdrop}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>
            {side === "buy" ? "Buy" : "Sell"} {symbol.replace(".SR", "")}
          </Text>
          <Text style={modalStyles.sub}>
            Live price · SAR {formatHalalasSar(quote.priceHalalas)}
          </Text>

          <View style={modalStyles.amountWrap}>
            <Text style={modalStyles.currencyPrefix}>SAR</Text>
            <TextInput
              style={modalStyles.amountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#D1D5DB"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <View style={modalStyles.previewRow}>
            <Text style={modalStyles.previewLabel}>
              ≈ {sharesPreview.toFixed(4)} sh
            </Text>
            <TouchableOpacity onPress={() => setAmount(maxSar.toFixed(2))}>
              <Text style={modalStyles.maxBtn}>
                Max · SAR{" "}
                {maxSar.toLocaleString("en-SA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {insufficient && (
            <Text style={modalStyles.errorText}>
              {side === "buy" ? "Insufficient wallet balance" : "More than your holding"}
            </Text>
          )}

          <TouchableOpacity
            style={[modalStyles.submit, !canSubmit && modalStyles.submitDisabled]}
            disabled={!canSubmit || order.isPending}
            onPress={() => order.mutate()}
          >
            <LinearGradient
              colors={
                canSubmit && !order.isPending
                  ? ["#7C3AED", "#EC4899"]
                  : ["#E5E7EB", "#D1D5DB"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={modalStyles.submitGrad}
            >
              {order.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={modalStyles.submitText}>
                  Confirm {side === "buy" ? "buy" : "sell"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={modalStyles.disclaimer}>
            Mock trading — uses your wallet balance and live market prices for a real-feel
            experience.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  headerMid: { alignItems: "center" },
  headerSymbol: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  headerName: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF" },

  center: { paddingVertical: 60, alignItems: "center", gap: 10 },
  muted: { fontSize: 13, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  priceBlock: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  priceMain: { fontSize: 36, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 8,
  },
  changeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  marketSub: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginTop: 8 },

  chartCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingTop: 8,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  rangeChipOn: { backgroundColor: "#F4F1FA" },
  rangeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280" },
  rangeTextOn: { color: "#7C3AED" },

  positionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
  },
  positionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
    marginBottom: 10,
  },
  positionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  positionShares: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  positionAvg: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF", marginTop: 2 },
  positionValue: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  positionPl: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },

  walletHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginHorizontal: 20,
  },
  walletHintText: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_500Medium" },

  ctaWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cta: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaSell: { backgroundColor: "#F3F4F6", paddingVertical: 14, alignItems: "center" },
  ctaBuy: {},
  ctaBuyGrad: { paddingVertical: 14, alignItems: "center" },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  ctaTextDisabled: { color: "#9CA3AF" },
  ctaTextBuy: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "white" },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9CA3AF", marginBottom: 6 },

  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
  },
  currencyPrefix: { fontSize: 18, color: "#9CA3AF", fontFamily: "Inter_500Medium" },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    padding: 0,
  },

  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  previewLabel: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_500Medium" },
  maxBtn: { fontSize: 12, color: "#7C3AED", fontFamily: "Inter_600SemiBold" },

  errorText: { fontSize: 12, color: "#EF4444", fontFamily: "Inter_500Medium", marginTop: 4 },

  submit: { marginTop: 14, borderRadius: 14, overflow: "hidden" },
  submitDisabled: {},
  submitGrad: { paddingVertical: 16, alignItems: "center" },
  submitText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "white" },

  disclaimer: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
});
