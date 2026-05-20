import {
  MOCK_PORTFOLIO,
  MOCK_PORTFOLIO_HISTORY,
  MOCK_SECTORS,
  type PortfolioDataPoint,
} from "@/lib/mock-data";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Defs, Path, Stop, Svg, LinearGradient as SvgGradient } from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = "1M" | "3M" | "6M" | "1Y";

const RANGE_SLICE: Record<Range, number> = {
  "1M": 2,
  "3M": 4,
  "6M": 7,
  "1Y": 12,
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InvestmentsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>("1Y");
  const [portfolio, setPortfolio] = useState(MOCK_PORTFOLIO);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftAmount, setDraftAmount] = useState(String(MOCK_PORTFOLIO.monthlyDeductionSar));
  const [sectors, setSectors] = useState(MOCK_SECTORS);
  const [editingAllocation, setEditingAllocation] = useState(false);
  const [draftPcts, setDraftPcts] = useState<Record<string, string>>({});

  const chartData = MOCK_PORTFOLIO_HISTORY.slice(-RANGE_SLICE[range]);

  const rangeGain = chartData[chartData.length - 1].valueSar - chartData[0].valueSar;
  const rangeGainPct = ((rangeGain / chartData[0].valueSar) * 100).toFixed(1);
  const isPositive = rangeGain >= 0;

  function saveSchedule() {
    const amount = Number.parseFloat(draftAmount);
    if (!amount || amount < 50) {
      Alert.alert("Invalid amount", "Minimum monthly investment is SAR 50.");
      return;
    }
    setPortfolio((p) => ({ ...p, monthlyDeductionSar: amount }));
    setEditingSchedule(false);
  }

  function togglePause() {
    setPortfolio((p) => ({ ...p, paused: !p.paused }));
  }

  function startEditAllocation() {
    setDraftPcts(Object.fromEntries(sectors.map((s) => [s.id, String(s.allocationPct)])));
    setEditingAllocation(true);
  }

  function saveAllocation() {
    const parsed = Object.fromEntries(
      Object.entries(draftPcts).map(([id, v]) => [id, Number.parseFloat(v) || 0])
    );
    const total = Object.values(parsed).reduce((a, b) => a + b, 0);
    if (Math.round(total) !== 100) {
      Alert.alert(
        "Invalid allocation",
        `Percentages must total 100%. Current total: ${total.toFixed(1)}%.`
      );
      return;
    }
    setSectors((prev) => prev.map((s) => ({ ...s, allocationPct: parsed[s.id] })));
    setEditingAllocation(false);
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
        <Text style={styles.headerTitle}>Auto-Investments</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Settings", "Investment preference settings will be available soon.")
          }
        >
          <Ionicons name="settings-outline" size={22} color="#1A1426" />
        </TouchableOpacity>
      </View>

      {/* Portfolio summary card */}
      <LinearGradient
        colors={["#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioCard}
      >
        <View style={styles.portfolioTop}>
          <View>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              SAR {portfolio.totalValueSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.gainBadge}>
            <Ionicons name="trending-up" size={13} color="#10B981" />
            <Text style={styles.gainBadgeText}>+{portfolio.gainPct}%</Text>
          </View>
        </View>

        <View style={styles.portfolioStats}>
          <View style={styles.portfolioStat}>
            <Text style={styles.portfolioStatLabel}>Invested</Text>
            <Text style={styles.portfolioStatValue}>
              SAR {portfolio.totalInvestedSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.portfolioStatDivider} />
          <View style={styles.portfolioStat}>
            <Text style={styles.portfolioStatLabel}>Total Gain</Text>
            <Text style={styles.portfolioStatValue}>
              +SAR {portfolio.gainSar.toLocaleString("en-SA")}
            </Text>
          </View>
          <View style={styles.portfolioStatDivider} />
          <View style={styles.portfolioStat}>
            <Text style={styles.portfolioStatLabel}>Monthly</Text>
            <Text style={styles.portfolioStatValue}>SAR {portfolio.monthlyDeductionSar}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartRangeGain}>
              {isPositive ? "+" : ""}SAR {Math.abs(rangeGain).toLocaleString("en-SA")}
            </Text>
            <Text style={[styles.chartRangePct, !isPositive && styles.chartRangePctNeg]}>
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

        <AreaChart data={chartData} color="#7C3AED" />

        {/* X-axis labels */}
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

      {/* Auto-Schedule */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Auto-Schedule</Text>
        <View style={[styles.statusPill, portfolio.paused && styles.statusPillPaused]}>
          <View style={[styles.statusDot, portfolio.paused && styles.statusDotPaused]} />
          <Text style={[styles.statusText, portfolio.paused && styles.statusTextPaused]}>
            {portfolio.paused ? "Paused" : "Active"}
          </Text>
        </View>
      </View>

      <View style={styles.scheduleCard}>
        {editingSchedule ? (
          <View style={styles.editRow}>
            <View style={styles.editInputWrap}>
              <Text style={styles.editCurrency}>SAR</Text>
              <TextInput
                style={styles.editInput}
                value={draftAmount}
                onChangeText={setDraftAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.editSuffix}>/month</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveSchedule}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingSchedule(false)}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scheduleTopRow}>
            <View style={styles.scheduleAmountWrap}>
              <Text style={styles.scheduleAmountLabel}>Monthly deduction</Text>
              <Text style={styles.scheduleAmount}>
                SAR {portfolio.monthlyDeductionSar.toLocaleString("en-SA")}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditingSchedule(true)}>
              <Ionicons name="pencil-outline" size={14} color="#7C3AED" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.scheduleDivider} />

        <View style={styles.scheduleMetaRow}>
          <View style={styles.scheduleMeta}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.scheduleMetaLabel}>Next deduction</Text>
            <Text style={styles.scheduleMetaValue}>
              {portfolio.nextDeductionDay} of every month
            </Text>
          </View>
          <View style={styles.pauseRow}>
            <Text style={styles.pauseLabel}>{portfolio.paused ? "Resume" : "Pause"}</Text>
            <Switch
              value={!portfolio.paused}
              onValueChange={togglePause}
              trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
              thumbColor={portfolio.paused ? "#9CA3AF" : "#7C3AED"}
            />
          </View>
        </View>

        {portfolio.paused && (
          <View style={styles.pausedBanner}>
            <Ionicons name="pause-circle-outline" size={14} color="#F59E0B" />
            <Text style={styles.pausedBannerText}>
              Auto-deductions are paused. Your existing holdings continue to grow.
            </Text>
          </View>
        )}
      </View>

      {/* Sector Allocation */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sector Allocation</Text>
        {editingAllocation ? (
          <View style={styles.allocEditActions}>
            <TouchableOpacity
              style={styles.allocCancelBtn}
              onPress={() => setEditingAllocation(false)}
            >
              <Text style={styles.allocCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveAllocation}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={startEditAllocation}>
            <Ionicons name="pencil-outline" size={14} color="#7C3AED" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectorsCard}>
        {editingAllocation &&
          (() => {
            const total = Object.values(draftPcts).reduce(
              (a, v) => a + (Number.parseFloat(v) || 0),
              0
            );
            const ok = Math.round(total) === 100;
            return (
              <View style={[styles.allocTotalBanner, !ok && styles.allocTotalBannerBad]}>
                <Text style={[styles.allocTotalText, !ok && styles.allocTotalTextBad]}>
                  Total: {total.toFixed(1)}%{ok ? " — looks good" : " — must equal 100%"}
                </Text>
              </View>
            );
          })()}
        {sectors.map((sector, idx) => (
          <View key={sector.id}>
            <View style={styles.sectorRow}>
              <View style={[styles.sectorIcon, { backgroundColor: `${sector.color}20` }]}>
                <Ionicons name={sector.icon as any} size={18} color={sector.color} />
              </View>
              <View style={styles.sectorMid}>
                <View style={styles.sectorTitleRow}>
                  <Text style={styles.sectorName}>{sector.name}</Text>
                  <Text style={styles.sectorReturn}>+{sector.returnPct}%</Text>
                </View>
                {!editingAllocation && (
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${sector.allocationPct}%` as any, backgroundColor: sector.color },
                      ]}
                    />
                  </View>
                )}
              </View>
              {editingAllocation ? (
                <View style={styles.allocInputWrap}>
                  <TextInput
                    style={styles.allocInput}
                    value={draftPcts[sector.id] ?? String(sector.allocationPct)}
                    onChangeText={(v) => setDraftPcts((p) => ({ ...p, [sector.id]: v }))}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    selectTextOnFocus
                  />
                  <Text style={styles.allocInputPct}>%</Text>
                </View>
              ) : (
                <View style={styles.sectorRight}>
                  <Text style={styles.sectorPct}>{sector.allocationPct}%</Text>
                  <Text style={styles.sectorValue}>
                    SAR {sector.valueSar.toLocaleString("en-SA")}
                  </Text>
                </View>
              )}
            </View>
            {idx < sectors.length - 1 && <View style={styles.sectorDivider} />}
          </View>
        ))}
      </View>

      {/* How it works */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#7C3AED" />
        <Text style={styles.infoText}>
          On the {portfolio.nextDeductionDay}th of each month, SAR {portfolio.monthlyDeductionSar}{" "}
          is deducted from your Main Account and distributed across your selected sectors. You can
          adjust or pause at any time.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Area chart ───────────────────────────────────────────────────────────────

function AreaChart({ data, color }: { data: PortfolioDataPoint[]; color: string }) {
  const screenWidth = Dimensions.get("window").width;
  const width = screenWidth - 40;
  const height = 130;
  const padTop = 8;
  const padBottom = 8;

  const values = data.map((d) => d.valueSar);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => (i / (values.length - 1)) * width;
  const getY = (v: number) => padTop + (1 - (v - minVal) / range) * (height - padTop - padBottom);

  const pts = values.map((v, i) => ({ x: getX(i), y: getY(v) }));

  // Smooth cubic bezier line
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (curr.x - prev.x) / 3;
    linePath += ` C ${prev.x + cpx} ${prev.y}, ${curr.x - cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  return (
    <Svg width={width} height={height} style={styles.chart}>
      <Defs>
        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill="url(#areaGrad)" />
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

  // Portfolio card
  portfolioCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  portfolioTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  portfolioLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  portfolioValue: { fontSize: 32, fontFamily: "PlusJakartaSans_700Bold", color: "white" },
  gainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gainBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "white" },
  portfolioStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  portfolioStat: { flex: 1, alignItems: "center" },
  portfolioStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  portfolioStatValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "white" },
  portfolioStatDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Chart
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 0,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chartRangeGain: { fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  chartRangePct: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#10B981", marginTop: 2 },
  chartRangePctNeg: { color: "#EF4444" },
  rangeRow: { flexDirection: "row", gap: 4 },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  rangeChipOn: { backgroundColor: "#F4F1FA" },
  rangeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280" },
  rangeTextOn: { color: "#7C3AED" },
  chart: { alignSelf: "center" },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
  },
  xLabel: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },

  // Schedule
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillPaused: { backgroundColor: "#FEF3C7" },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  statusDotPaused: { backgroundColor: "#F59E0B" },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#10B981" },
  statusTextPaused: { color: "#D97706" },

  scheduleCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleAmountLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  scheduleAmount: { fontSize: 26, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  scheduleAmountWrap: {},
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F4F1FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F1FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  editCurrency: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginRight: 6 },
  editInput: { flex: 1, fontSize: 20, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  editSuffix: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  saveBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "white" },
  scheduleDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 14 },
  scheduleMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleMeta: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  scheduleMetaLabel: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  scheduleMetaValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  pauseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pauseLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280" },
  pausedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 12,
  },
  pausedBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#92400E",
    lineHeight: 18,
  },

  // Sectors
  sectorsCard: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  sectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectorMid: { flex: 1 },
  sectorTitleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sectorName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426" },
  sectorReturn: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#10B981" },
  barTrack: { height: 5, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  sectorRight: { alignItems: "flex-end", minWidth: 72 },
  sectorPct: { fontSize: 15, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  sectorValue: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginTop: 2 },
  sectorDivider: { height: 1, backgroundColor: "#F9FAFB" },

  // Allocation editing
  allocEditActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  allocCancelBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
  },
  allocCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  allocTotalBanner: {
    marginHorizontal: 0,
    marginBottom: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  allocTotalBannerBad: { backgroundColor: "#FEF2F2" },
  allocTotalText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#10B981" },
  allocTotalTextBad: { color: "#EF4444" },
  allocInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F1FA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
    justifyContent: "center",
  },
  allocInput: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1426",
    minWidth: 32,
    textAlign: "right",
  },
  allocInputPct: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9CA3AF", marginLeft: 2 },

  // Info
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: "#F4F1FA",
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    lineHeight: 20,
  },
});
