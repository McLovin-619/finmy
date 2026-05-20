import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { MOCK_ALLOWANCES } from "@/lib/mock-data";

const SETTINGS_ITEMS = [
  { icon: "gift-outline" as const, label: "Student & Corporate Deals", route: "/deals" },
  { icon: "settings-outline" as const, label: "Account Settings", route: undefined },
  { icon: "shield-outline" as const, label: "Privacy & Data", route: undefined },
  { icon: "help-circle-outline" as const, label: "Help & Support", route: undefined },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Family & More</Text>
      </View>

      {/* Family allowances */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/allowances" as any)}
        activeOpacity={0.95}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="people-outline" size={18} color="#7C3AED" />
            <Text style={styles.cardTitle}> Allowances</Text>
          </View>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>Manage</Text>
            <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
          </View>
        </View>

        {MOCK_ALLOWANCES.slice(0, 3).map((member, index) => (
          <View key={member.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.memberRow}>
              <View
                style={[
                  styles.memberAvatar,
                  { backgroundColor: member.status === "paused" ? "#E5E7EB" : member.color },
                ]}
              >
                <Text style={styles.memberInitial}>{member.initials[0]}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={styles.memberFreqRow}>
                  <Ionicons name="refresh-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.memberFreq}>
                    {" "}
                    {member.frequency.charAt(0).toUpperCase() + member.frequency.slice(1)}
                    {member.status === "paused" ? " · Paused" : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.memberRight}>
                <Text
                  style={[
                    styles.memberAllowance,
                    member.status === "paused" && { color: "#9CA3AF" },
                  ]}
                >
                  SAR {member.amountSar.toLocaleString("en-SA")}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {MOCK_ALLOWANCES.length > 3 && (
          <Text style={styles.moreCount}>+{MOCK_ALLOWANCES.length - 3} more</Text>
        )}
      </TouchableOpacity>

      {/* Quick tiles */}
      <View style={styles.tilesRow}>
        <TouchableOpacity style={styles.tile}>
          <View style={[styles.tileIcon, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="send-outline" size={22} color="#10B981" />
          </View>
          <Text style={styles.tileName}>Send Money</Text>
          <Text style={styles.tileSubtitle}>Local & International</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => router.push("/loyalty" as any)}>
          <View style={[styles.tileIcon, { backgroundColor: "#F4F1FA" }]}>
            <Ionicons name="gift-outline" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.tileName}>Loyalty</Text>
          <Text style={styles.tileSubtitle}>SAR 142 cashback earned</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => router.push("/reports" as any)}>
          <View style={[styles.tileIcon, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="bar-chart-outline" size={22} color="#F97316" />
          </View>
          <Text style={styles.tileName}>Reports</Text>
          <Text style={styles.tileSubtitle}>AI spending insights</Text>
        </TouchableOpacity>
      </View>

      {/* Settings list */}
      <View style={styles.settingsCard}>
        {SETTINGS_ITEMS.map((item, index) => (
          <View key={item.label}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.settingsIconWrap}>
                <Ionicons name={item.icon} size={18} color="#7C3AED" />
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Wordmark footer */}
      <View style={styles.footer}>
        <Text style={styles.footerF}>f.</Text>
        <Text style={styles.footerWord}> finmy.</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 15, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  seeAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_500Medium" },
  moreCount: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: "#F9FAFB", marginVertical: 4 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { color: "white", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 3 },
  memberFreqRow: { flexDirection: "row", alignItems: "center" },
  memberFreq: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  memberRight: { alignItems: "flex-end", gap: 4 },
  memberAllowance: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },
  editButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editText: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_500Medium" },
  tilesRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 16 },
  tile: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tileName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1A1426", marginBottom: 3 },
  tileSubtitle: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  settingsCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#1A1426" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  footerF: { fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", color: "#7C3AED" },
  footerWord: { fontSize: 14, fontFamily: "PlusJakartaSans_600SemiBold", color: "#9CA3AF" },
  signOutButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  signOutText: { fontSize: 14, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
});
