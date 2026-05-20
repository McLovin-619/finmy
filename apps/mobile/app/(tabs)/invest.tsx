import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Defs, LinearGradient as SvgGradient, Path, Stop, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MOCK_PORTFOLIO,
  MOCK_PORTFOLIO_HISTORY,
  MOCK_SECTORS,
  type PortfolioDataPoint,
} from "@/lib/mock-data";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Range config ─────────────────────────────────────────────────────────────

type Range = "1M" | "3M" | "6M" | "1Y";
const RANGE_SLICE: Record<Range, number> = { "1M": 2, "3M": 4, "6M": 7, "1Y": 12 };

// ─── Area chart (same cubic-bezier technique as investments.tsx) ──────────────

function AreaChart({ data, color }: { data: PortfolioDataPoint[]; color: string }) {
  const width = SCREEN_WIDTH - 40;
  const height = 110;
  const padTop = 8;
  const padBottom = 8;

  const values = data.map((d) => d.valueSar);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => (i / (values.length - 1)) * width;
  const getY = (v: number) => padTop + (1 - (v - minVal) / range) * (height - padTop - padBottom);

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
        <SvgGradient id="ig" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill="url(#ig)" />
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

export default function InvestScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>("1Y");

  const chartData = MOCK_PORTFOLIO_HISTORY.slice(-RANGE_SLICE[range]);
  const rangeGain = chartData[chartData.length - 1].valueSar - chartData[0].valueSar;
  const rangeGainPct = ((rangeGain / chartData[0].valueSar) * 100).toFixed(1);
  const isPositive = rangeGain >= 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Full-bleed gradient header */}
      <LinearGradient
        colors={["#1A1308", "#231B0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.navRow}>
          <View>
            <Text style={styles.screenTitle}>Investments</Text>
            <Text style={styles.screenSub}>Auto-managed portfolio</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/investments" as any)}
          >
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Portfolio value */}
        <Text style={styles.portfolioLabel}>Portfolio Value</Text>
        <Text style={styles.portfolioValue}>
          SAR {MOCK_PORTFOLIO.totalValueSar.toLocaleString("en-SA")}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Invested</Text>
            <Text style={styles.statValue}>
              SAR {MOCK_PORTFOLIO.totalInvestedSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total gain</Text>
            <Text style={[styles.statValue, styles.gainText]}>
              +SAR {MOCK_PORTFOLIO.gainSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>All time</Text>
            <Text style={[styles.statValue, styles.gainText]}>+{MOCK_PORTFOLIO.gainPct}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Chart card */}
        <View style={styles.chartCard}>
          <View style={styles.chartTopRow}>
            <View>
              <Text style={styles.rangeGain}>
                {isPositive ? "+" : ""}SAR {Math.abs(rangeGain).toLocaleString("en-SA")}
              </Text>
              <Text style={[styles.rangeGainPct, !isPositive && styles.rangeGainPctNeg]}>
                {isPositive ? "▲" : "▼"} {Math.abs(Number(rangeGainPct))}% in {range}
              </Text>
            </View>
            <View style={styles.rangeRow}>
              {(["1M", "3M", "6M", "1Y"] as Range[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rangeChip, range === r && styles.rangeChipOn]}
                  onPress={() => setRange(r)}
                >
                  <Text style={[styles.rangeText, range === r && styles.rangeTextOn]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <AreaChart data={chartData} color="#C8911A" />

          <View style={styles.xLabels}>
            {chartData
              .filter(
                (_, i) =>
                  i === 0 || i === Math.floor(chartData.length / 2) || i === chartData.length - 1
              )
              .map((d) => (
                <Text key={d.label} style={styles.xLabel}>
                  {d.label}
                </Text>
              ))}
          </View>
        </View>

        {/* Auto-schedule quick view */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Auto-Schedule</Text>
          <TouchableOpacity onPress={() => router.push("/investments" as any)}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleIconWrap}>
              <Ionicons name="calendar-outline" size={18} color="#C8911A" />
            </View>
            <View style={styles.scheduleMid}>
              <Text style={styles.scheduleLabel}>Monthly deduction</Text>
              <Text style={styles.scheduleValue}>
                SAR {MOCK_PORTFOLIO.monthlyDeductionSar} · {MOCK_PORTFOLIO.nextDeductionDay}th of
                each month
              </Text>
            </View>
            <View style={[styles.activePill, MOCK_PORTFOLIO.paused && styles.pausedPill]}>
              <View style={[styles.activeDot, MOCK_PORTFOLIO.paused && styles.pausedDot]} />
              <Text style={[styles.activeText, MOCK_PORTFOLIO.paused && styles.pausedText]}>
                {MOCK_PORTFOLIO.paused ? "Paused" : "Active"}
              </Text>
            </View>
          </View>
        </View>

        {/* Sector allocation */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sector allocation</Text>
        </View>
        <View style={styles.sectorsCard}>
          {MOCK_SECTORS.map((sector, idx) => (
            <View key={sector.id}>
              <View style={styles.sectorRow}>
                <View style={[styles.sectorIcon, { backgroundColor: sector.color + "20" }]}>
                  <Ionicons name={sector.icon as any} size={16} color={sector.color} />
                </View>
                <View style={styles.sectorMid}>
                  <View style={styles.sectorTitleRow}>
                    <Text style={styles.sectorName}>{sector.name}</Text>
                    <Text style={styles.sectorReturn}>+{sector.returnPct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${sector.allocationPct}%` as any,
                          backgroundColor: sector.color,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.sectorRight}>
                  <Text style={styles.sectorPct}>{sector.allocationPct}%</Text>
                  <Text style={styles.sectorValue}>
                    SAR {sector.valueSar.toLocaleString("en-SA")}
                  </Text>
                </View>
              </View>
              {idx < MOCK_SECTORS.length - 1 && <View style={styles.sectorDivider} />}
            </View>
          ))}
        </View>

        {/* Manage schedule CTA */}
        <TouchableOpacity
          style={styles.ctaWrap}
          activeOpacity={0.85}
          onPress={() => router.push("/investments" as any)}
        >
          <LinearGradient
            colors={["#C8911A", "#D4A830"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Ionicons name="settings-outline" size={18} color="white" />
            <Text style={styles.ctaText}>Manage auto-invest schedule</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#1A1308" },
  scrollContent: { paddingBottom: 48 },

  gradientHeader: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  screenTitle: { fontSize: 22, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  screenSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  portfolioLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 36,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  statValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "white" },
  gainText: { color: "#A7F3D0" },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  body: {
    backgroundColor: "#0D0B07",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 20,
  },

  // Chart
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  chartTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  rangeGain: { fontSize: 18, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  rangeGainPct: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#10B981", marginTop: 2 },
  rangeGainPctNeg: { color: "#EF4444" },
  rangeRow: { flexDirection: "row", gap: 4 },
  rangeChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#1E1A10",
  },
  rangeChipOn: { backgroundColor: "#221D12" },
  rangeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#8C7C55" },
  rangeTextOn: { color: "#C8911A" },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 4,
  },
  xLabel: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular" },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  seeAll: { fontSize: 13, color: "#C8911A", fontFamily: "Inter_500Medium" },

  // Schedule card
  scheduleCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scheduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#221D12",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleMid: { flex: 1 },
  scheduleLabel: {
    fontSize: 12,
    color: "#6B5E3C",
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  scheduleValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0D1A11",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pausedPill: { backgroundColor: "#1A1508" },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  pausedDot: { backgroundColor: "#C8911A" },
  activeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10B981" },
  pausedText: { color: "#C8911A" },

  // Sectors
  sectorsCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1610",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 1,
  },
  sectorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, gap: 12 },
  sectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectorMid: { flex: 1 },
  sectorTitleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sectorName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#EDE0B0" },
  sectorReturn: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#10B981" },
  barTrack: { height: 4, backgroundColor: "#1E1A10", borderRadius: 2, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },
  sectorRight: { alignItems: "flex-end", minWidth: 68 },
  sectorPct: { fontSize: 14, fontFamily: "PlusJakartaSans_700Bold", color: "#EDE0B0" },
  sectorValue: { fontSize: 11, color: "#6B5E3C", fontFamily: "Inter_400Regular", marginTop: 1 },
  sectorDivider: { height: 1, backgroundColor: "#1E1A10" },

  // CTA
  ctaWrap: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ctaText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "white",
    marginLeft: 10,
  },
});
